import { getProvider } from "./llm";
import { getMessages, getOrders, getReservations, getLead, saveLead } from "./db";
import type { Lead, Bucket } from "./db";
import type { Tenant } from "./tenants";

/**
 * Calificacion de conversaciones ("que tan probable es que compre").
 *
 * Dos fuentes, por orden de confianza:
 *  1. DATO REAL: si el cliente ya hizo un pedido o reserva, es "casi seguro" (100).
 *     Gratis y exacto; no gastamos IA en adivinar lo que ya sabemos.
 *  2. IA: si aun no compra, el modelo estima la intencion de compra.
 *
 * Se calcula bajo demanda y se cachea: solo se recalifica si la conversacion
 * cambio desde la ultima vez (asi no saturamos el limite del proveedor).
 */

const HOT_MIN = 70;
const WARM_MIN = 40;

function bucketFor(score: number, hotMin: number = HOT_MIN): Bucket {
  if (score >= hotMin) return "hot";
  if (score >= WARM_MIN) return "warm";
  return "cold";
}

function clamp(n: unknown, fallback = 0): number {
  const v = Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : fallback;
}

/** Extrae el primer objeto JSON de una respuesta, tolerando texto o ```json. */
function parseJson(raw: string): Record<string, any> {
  if (!raw) return {};
  let t = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  try {
    return JSON.parse(t);
  } catch {
    return {};
  }
}

const SCORING_SYSTEM = `Eres un analista de ventas. Lees una conversacion entre un cliente y el bot de un negocio, y estimas que tan probable es que ese cliente termine comprando (haciendo un pedido o una reserva).

Devuelve SOLO un objeto JSON valido, sin texto extra, con esta forma exacta:
{"score":<0-100>,"reasons":["2-3 razones cortas en espanol"],"signals":{"interes":<bool>,"precio":<bool>,"datos":<bool>,"urgencia":<bool>}}

Significado de las senales:
- interes: pregunto por productos concretos del menu (no solo saludo).
- precio: pregunto precios, totales o costo de domicilio.
- datos: dio datos para comprar (nombre, direccion, fecha, hora o numero de personas).
- urgencia: quiere pedir ya, hoy, o para una fecha concreta cercana.

Guia de score: 70-100 = muy probable que compre (pidio datos, esta cerrando). 40-69 = interes real pero faltan senales. 0-39 = solo explora, saluda o pregunta cosas generales.`;

/** Convierte la conversacion en un texto compacto para analizar. */
function buildTranscript(tenant: Tenant, phone: string): { text: string; msgCount: number } {
  const msgs = getMessages(tenant.id, phone);
  const recent = msgs.slice(-14);
  const text = recent
    .map((m) => `${m.role === "user" ? "Cliente" : "Bot"}: ${m.content}`)
    .join("\n");
  return { text, msgCount: msgs.length };
}

/**
 * Marca una conversacion como convertida (hot 100) al instante, sin gastar IA.
 * Se llama cuando se registra un pedido o reserva: es un dato real, no una estimacion.
 */
export function markConverted(tenant: Tenant, phone: string): void {
  const msgs = getMessages(tenant.id, phone);
  const pedidos = getOrders(tenant.id).filter((o) => o.phone === phone).length;
  const reservas = getReservations(tenant.id).filter((r) => r.phone === phone).length;
  const que = [
    pedidos ? `${pedidos} pedido(s)` : "",
    reservas ? `${reservas} reserva(s)` : "",
  ].filter(Boolean).join(" y ") || "una compra";
  saveLead({
    tenantId: tenant.id,
    phone,
    score: 100,
    bucket: "hot",
    reasons: [`Ya cerro: ${que}.`, "Conversion confirmada en la base de datos."],
    signals: { interes: true, precio: true, datos: true, urgencia: true },
    msgCount: msgs.length,
    scoredAt: Date.now(),
  });
}

/**
 * Califica una conversacion. Usa cache salvo que la conversacion haya cambiado
 * o se pida forzar. Devuelve undefined si no hay mensajes.
 */
export async function scoreConversation(
  tenant: Tenant,
  phone: string,
  force = false
): Promise<Lead | undefined> {
  const { text, msgCount } = buildTranscript(tenant, phone);
  if (msgCount === 0) return undefined;

  const cached = getLead(tenant.id, phone);
  if (cached && !force && cached.msgCount === msgCount) return cached;

  // 1) Dato real: ya compro -> casi seguro, sin gastar IA.
  const pedidos = getOrders(tenant.id).filter((o) => o.phone === phone);
  const reservas = getReservations(tenant.id).filter((r) => r.phone === phone);
  if (pedidos.length > 0 || reservas.length > 0) {
    const que = [
      pedidos.length ? `${pedidos.length} pedido(s)` : "",
      reservas.length ? `${reservas.length} reserva(s)` : "",
    ].filter(Boolean).join(" y ");
    const lead: Lead = {
      tenantId: tenant.id,
      phone,
      score: 100,
      bucket: "hot",
      reasons: [`Ya cerro: ${que}.`, "Conversion confirmada en la base de datos."],
      signals: { interes: true, precio: true, datos: true, urgencia: true },
      msgCount,
      scoredAt: Date.now(),
    };
    saveLead(lead);
    return lead;
  }

  // 2) Aun no compra: que la IA estime la intencion.
  try {
    const res = await getProvider().complete({
      system: SCORING_SYSTEM,
      tools: [],
      messages: [{ role: "user", text: `Conversacion:\n${text}\n\nAnaliza y devuelve el JSON.` }],
      maxTokens: 400,
      // Baja: analizar debe ser consistente, no creativo.
      temperature: 0.2,
    });
    const data = parseJson(res.text);
    const score = clamp(data.score, cached?.score ?? 0);
    const hotMin = tenant.business.umbral_hot || HOT_MIN;
    const lead: Lead = {
      tenantId: tenant.id,
      phone,
      score,
      bucket: bucketFor(score, hotMin),
      reasons: Array.isArray(data.reasons) && data.reasons.length
        ? data.reasons.slice(0, 4).map((r: unknown) => String(r))
        : cached?.reasons ?? ["Sin razones detalladas."],
      signals: {
        interes: Boolean(data.signals?.interes),
        precio: Boolean(data.signals?.precio),
        datos: Boolean(data.signals?.datos),
        urgencia: Boolean(data.signals?.urgencia),
      },
      msgCount,
      scoredAt: Date.now(),
    };
    saveLead(lead);
    return lead;
  } catch (err) {
    console.error(`[lead] Error calificando ${phone}:`, err instanceof Error ? err.message : err);
    return cached;
  }
}
