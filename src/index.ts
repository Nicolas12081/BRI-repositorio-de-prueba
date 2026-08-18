import path from "path";
import express, { Request, Response } from "express";
import { env, whatsappEnabled } from "./env";
import { handleMessage } from "./claude";
import { sendText, sendImage } from "./whatsapp";
import { getOrders, getReservations, getConversations, getMessages, getLead, getLeads, addMessage, isHandedOff, setHandoff } from "./db";
import { scoreConversation } from "./lead";
import { formatMoney } from "./data";
import { getTenant, resolveTenant, listTenants, saveTenantConfig } from "./tenants";
import type { Tenant } from "./tenants";
import { getProvider } from "./llm";
import type { Business, MenuItem } from "./data";
import { getWhatsapp, saveWhatsapp, whatsappConnected } from "./settings";
import { chatPage } from "./webchat";
import { consolePage } from "./console";

whatsappEnabled(); // solo informa en consola al arrancar

const app = express();
app.use(express.json());

// Logos e imagenes de marca de Bri.
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));

// Diseno oficial de Bri (el export del usuario) servido tal cual en /bri.
app.use("/bri", express.static(path.join(__dirname, "..", "bri-app")));

// Salud del servidor
app.get("/", (_req: Request, res: Response) => {
  res.type("html").send(
    `<p>Chatbot multi-negocio activo.</p><ul>` +
      `<li><a href="/bri/">Bri — diseño oficial (con IA real)</a></li>` +
      `<li><a href="/console">Consola conectada (WhatsApp + datos reales)</a></li>` +
      `<li><a href="/chat">Chat de prueba estilo WhatsApp</a></li>` +
      `<li><a href="/admin">Panel de pedidos y reservas</a></li></ul>`
  );
});

// Consola del negocio: bandeja de conversaciones + chat + datos del cliente.
app.get("/console", (_req: Request, res: Response) => {
  res.type("html").send(consolePage());
});

// Chat de prueba en el navegador (sin WhatsApp)
app.get("/chat", (_req: Request, res: Response) => {
  res.type("html").send(chatPage(listTenants()));
});

// API del chat de prueba: recibe un mensaje y devuelve la respuesta del bot.
app.post("/api/chat", async (req: Request, res: Response) => {
  const { tenantId, phone, text } = req.body ?? {};
  const tenant = getTenant(String(tenantId ?? ""));
  if (!tenant) {
    res.status(400).json({ error: "Negocio no encontrado." });
    return;
  }
  if (typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "Mensaje vacío." });
    return;
  }
  try {
    const reply = await handleMessage(tenant, String(phone || "web-anon"), text.trim());
    res.json({ reply: reply.text, images: reply.images });
  } catch (err) {
    console.error("[api/chat] Error:", err);
    res.status(500).json({ error: "El bot tuvo un problema. Intenta de nuevo." });
  }
});

// --- APIs de la consola ---

/** Negocios disponibles (para el selector de la consola). */
app.get("/api/tenants", (_req: Request, res: Response) => {
  res.json(
    listTenants().map((t) => ({
      id: t.id,
      nombre: t.business.nombre,
      tipo: t.business.tipo_negocio,
      productos: t.menu.length,
    }))
  );
});

/** Estado del sistema (para mostrar en configuracion). */
app.get("/api/info", (_req: Request, res: Response) => {
  res.json({ provider: getProvider().name, whatsapp: whatsappConnected() });
});

/**
 * Completado de IA generico para el diseno oficial de Bri (window.claude.complete).
 * Recibe {system, messages:[{role,content}], max_tokens} y devuelve el texto crudo.
 */
app.post("/api/complete", async (req: Request, res: Response) => {
  const system = String(req.body?.system ?? "");
  const rawMsgs: any[] = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const maxTokens = Math.min(Number(req.body?.max_tokens) || 500, 1024);
  const messages = rawMsgs.map((m) =>
    m?.role === "assistant"
      ? { role: "assistant" as const, text: String(m.content ?? ""), toolCalls: [] }
      : { role: "user" as const, text: String(m?.content ?? "") }
  );
  try {
    const r = await getProvider().complete({ system, tools: [], messages, maxTokens, temperature: 0.6 });
    res.json({ completion: r.text });
  } catch (err) {
    console.error("[api/complete] Error:", err);
    res.status(500).json({ error: "No se pudo completar." });
  }
});

/** Estado y configuracion de la conexion de WhatsApp (nunca devuelve el token). */
app.get("/api/whatsapp", (_req: Request, res: Response) => {
  const w = getWhatsapp();
  const base = (w.publicBaseUrl || "").replace(/\/$/, "");
  res.json({
    conectado: whatsappConnected(),
    hasToken: Boolean(w.token),
    verifyToken: w.verifyToken,
    publicBaseUrl: w.publicBaseUrl,
    webhookUrl: base ? `${base}/webhook` : "(define la URL publica primero)",
    agentes: listTenants().map((t) => ({
      id: t.id,
      nombre: t.business.nombre,
      phone_number_id: t.business.whatsapp_phone_number_id || "",
    })),
  });
});

/** Guarda credenciales de WhatsApp (token, verify token, URL publica). */
app.put("/api/whatsapp", (req: Request, res: Response) => {
  const patch: Record<string, string> = {};
  if (typeof req.body?.token === "string" && req.body.token.trim()) patch.token = req.body.token.trim();
  if (typeof req.body?.verifyToken === "string") patch.verifyToken = req.body.verifyToken.trim();
  if (typeof req.body?.publicBaseUrl === "string") patch.publicBaseUrl = req.body.publicBaseUrl.trim();
  saveWhatsapp(patch);
  res.json({ ok: true, conectado: whatsappConnected() });
});

/** Enlaza (o desenlaza) un numero de WhatsApp con un agente/negocio. */
app.put("/api/whatsapp/agente", (req: Request, res: Response) => {
  const tenant = getTenant(String(req.body?.tenantId ?? ""));
  if (!tenant) {
    res.status(400).json({ error: "Negocio no encontrado." });
    return;
  }
  const pnid = String(req.body?.phone_number_id ?? "").trim();
  const business: Business = { ...tenant.business, whatsapp_phone_number_id: pnid || undefined };
  try {
    saveTenantConfig(tenant.id, business, tenant.menu);
    res.json({ ok: true });
  } catch (err) {
    console.error("[api/whatsapp/agente] Error:", err);
    res.status(500).json({ error: "No se pudo enlazar el numero." });
  }
});

/** Configuracion completa de un negocio (datos + menu). */
app.get("/api/tenant", (req: Request, res: Response) => {
  const tenant = getTenant(String(req.query.tenantId ?? ""));
  if (!tenant) {
    res.status(400).json({ error: "Negocio no encontrado." });
    return;
  }
  res.json({ business: tenant.business, menu: tenant.menu });
});

/** Guarda la configuracion de un negocio y recarga su cerebro. */
app.put("/api/tenant", (req: Request, res: Response) => {
  const tenantId = String(req.body?.tenantId ?? "");
  const tenant = getTenant(tenantId);
  if (!tenant) {
    res.status(400).json({ error: "Negocio no encontrado." });
    return;
  }

  const b = req.body?.business ?? {};
  const nombre = String(b.nombre ?? "").trim();
  if (!nombre) {
    res.status(400).json({ error: "El nombre del negocio es obligatorio." });
    return;
  }

  const business: Business = {
    ...tenant.business,
    nombre,
    tipo_negocio: b.tipo_negocio === "tienda" ? "tienda" : "restaurante",
    moneda: String(b.moneda ?? tenant.business.moneda).trim() || "COP",
    horario: String(b.horario ?? "").trim(),
    direccion: String(b.direccion ?? "").trim(),
    telefono: String(b.telefono ?? "").trim(),
    metodos_pago: Array.isArray(b.metodos_pago)
      ? b.metodos_pago.map((m: unknown) => String(m).trim()).filter(Boolean)
      : String(b.metodos_pago ?? "").split(",").map((m) => m.trim()).filter(Boolean),
    costo_domicilio: Math.max(0, Number(b.costo_domicilio) || 0),
    personalidad: String(b.personalidad ?? "").trim(),
    formato_direccion: String(b.formato_direccion ?? "").trim() || undefined,
    zona_horaria: String(b.zona_horaria ?? "").trim() || tenant.business.zona_horaria || "America/Bogota",
    horarios: b.horarios && typeof b.horarios === "object"
      ? Object.fromEntries(
          ["lun", "mar", "mie", "jue", "vie", "sab", "dom"].map((d) => [d, String(b.horarios[d] ?? "").trim()])
        )
      : tenant.business.horarios,
    whatsapp_phone_number_id: String(b.whatsapp_phone_number_id ?? "").trim() || undefined,
  };

  const menu: MenuItem[] = (Array.isArray(req.body?.menu) ? req.body.menu : [])
    .map((m: any) => ({
      nombre: String(m.nombre ?? "").trim(),
      precio: Math.max(0, Number(m.precio) || 0),
      categoria: String(m.categoria ?? "").trim() || "General",
      descripcion: String(m.descripcion ?? "").trim() || undefined,
      imagen: String(m.imagen ?? "").trim() || undefined,
    }))
    .filter((m: MenuItem) => m.nombre);

  try {
    const updated = saveTenantConfig(tenantId, business, menu);
    res.json({ ok: true, business: updated.business, menu: updated.menu });
  } catch (err) {
    console.error("[api/tenant] Error guardando:", err);
    res.status(500).json({ error: "No se pudo guardar la configuracion." });
  }
});

/** Guarda el conocimiento del agente (contexto libre + preguntas frecuentes) del negocio. */
app.put("/api/agente", (req: Request, res: Response) => {
  const tenant = getTenant(String(req.body?.tenantId ?? ""));
  if (!tenant) {
    res.status(400).json({ error: "Negocio no encontrado." });
    return;
  }
  const business: Business = { ...tenant.business };
  if (typeof req.body?.contexto === "string") business.contexto = req.body.contexto;
  if (Array.isArray(req.body?.qa)) {
    business.qa = req.body.qa
      .map((x: any) => ({ q: String(x?.q ?? "").trim(), a: String(x?.a ?? "").trim() }))
      .filter((x: { q: string; a: string }) => x.q && x.a);
  }
  if (Array.isArray(req.body?.instrucciones)) {
    business.instrucciones = req.body.instrucciones
      .map((x: any) => ({ text: String(x?.text ?? "").trim(), on: x?.on !== false }))
      .filter((x: { text: string }) => x.text);
  }
  if (typeof req.body?.nombre_bot === "string") business.nombre_bot = req.body.nombre_bot.trim() || undefined;
  if (typeof req.body?.bienvenida === "string") business.bienvenida = req.body.bienvenida.trim() || undefined;
  if (typeof req.body?.tono === "string") business.tono = req.body.tono.trim() || undefined;
  if (req.body?.umbral_hot != null) business.umbral_hot = Math.max(1, Math.min(100, Number(req.body.umbral_hot) || 70));
  try {
    saveTenantConfig(tenant.id, business, tenant.menu); // conserva el menu, recarga el bot
    res.json({ ok: true });
  } catch (err) {
    console.error("[api/agente] Error:", err);
    res.status(500).json({ error: "No se pudo guardar." });
  }
});

/** Bandeja: conversaciones de un negocio + contadores. */
app.get("/api/conversations", (req: Request, res: Response) => {
  const tenant = getTenant(String(req.query.tenantId ?? ""));
  if (!tenant) {
    res.status(400).json({ error: "Negocio no encontrado." });
    return;
  }
  const conversaciones = getConversations(tenant.id).map((c) => {
    const lead = getLead(tenant.id, c.phone);
    return {
      ...c,
      score: lead?.score ?? null,
      // "stale" = la conversacion cambio desde que se califico (hay que recalificar).
      bucket: lead && lead.msgCount === c.count ? lead.bucket : lead?.bucket ?? null,
      stale: !lead || lead.msgCount !== c.count,
    };
  });
  const cuenta = (b: string) => conversaciones.filter((c) => c.bucket === b).length;
  res.json({
    conversaciones,
    totales: {
      conversaciones: conversaciones.length,
      pedidos: getOrders(tenant.id).length,
      reservas: getReservations(tenant.id).length,
      hot: cuenta("hot"),
      warm: cuenta("warm"),
      cold: cuenta("cold"),
      sinCalificar: conversaciones.filter((c) => c.bucket === null).length,
    },
  });
});

/** Califica una conversacion (usa cache salvo force=1). */
app.post("/api/score", async (req: Request, res: Response) => {
  const tenant = getTenant(String(req.body?.tenantId ?? ""));
  const phone = String(req.body?.phone ?? "");
  if (!tenant || !phone) {
    res.status(400).json({ error: "Falta negocio o cliente." });
    return;
  }
  try {
    const lead = await scoreConversation(tenant, phone, Boolean(req.body?.force));
    res.json({ lead: lead ?? null });
  } catch (err) {
    console.error("[api/score] Error:", err);
    res.status(500).json({ error: "No se pudo calificar." });
  }
});

/** Metricas reales del negocio para la vista de analitica. */
app.get("/api/metrics", (req: Request, res: Response) => {
  const tenant = getTenant(String(req.query.tenantId ?? ""));
  if (!tenant) {
    res.status(400).json({ error: "Negocio no encontrado." });
    return;
  }
  const convos = getConversations(tenant.id);
  const pedidos = getOrders(tenant.id);
  const reservas = getReservations(tenant.id);
  const leads = getLeads(tenant.id);

  const ingresos = pedidos.reduce((a, o) => a + o.total, 0);
  const ticket = pedidos.length ? Math.round(ingresos / pedidos.length) : 0;
  const convierten = new Set([...pedidos, ...reservas].map((x) => x.phone)).size;
  const conversion = convos.length ? Math.round((convierten / convos.length) * 100) : 0;

  // Productos mas pedidos (por unidades).
  const unidades = new Map<string, number>();
  for (const o of pedidos) {
    if (!Array.isArray(o.items)) continue;
    for (const i of o.items as { nombre: string; cantidad: number }[]) {
      unidades.set(i.nombre, (unidades.get(i.nombre) ?? 0) + Number(i.cantidad || 0));
    }
  }
  const topProductos = [...unidades.entries()]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 6);

  // Pedidos por dia (ultimos 7 dias).
  const dias: { dia: string; pedidos: number; ingresos: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const ini = d.getTime();
    const fin = ini + 86400000;
    const delDia = pedidos.filter((o) => o.created_at >= ini && o.created_at < fin);
    dias.push({
      dia: d.toLocaleDateString("es-CO", { weekday: "short" }),
      pedidos: delDia.length,
      ingresos: delDia.reduce((a, o) => a + o.total, 0),
    });
  }

  res.json({
    moneda: tenant.business.moneda,
    kpis: {
      conversaciones: convos.length,
      pedidos: pedidos.length,
      reservas: reservas.length,
      ingresos,
      ticket,
      conversion,
    },
    distribucion: {
      hot: leads.filter((l) => l.bucket === "hot").length,
      warm: leads.filter((l) => l.bucket === "warm").length,
      cold: leads.filter((l) => l.bucket === "cold").length,
      sinCalificar: Math.max(0, convos.length - leads.length),
    },
    topProductos,
    dias,
  });
});

/** Detalle de una conversacion: mensajes + pedidos y reservas de ese cliente. */
app.get("/api/conversation", (req: Request, res: Response) => {
  const tenant = getTenant(String(req.query.tenantId ?? ""));
  const phone = String(req.query.phone ?? "");
  if (!tenant || !phone) {
    res.status(400).json({ error: "Falta negocio o cliente." });
    return;
  }
  res.json({
    phone,
    moneda: tenant.business.moneda,
    messages: getMessages(tenant.id, phone),
    orders: getOrders(tenant.id).filter((o) => o.phone === phone),
    reservations: getReservations(tenant.id).filter((r) => r.phone === phone),
    lead: getLead(tenant.id, phone) ?? null,
    handoff: isHandedOff(tenant.id, phone),
  });
});

/** Un humano responde al cliente desde la consola: envia por WhatsApp y lo guarda. */
app.post("/api/reply", async (req: Request, res: Response) => {
  const tenant = getTenant(String(req.body?.tenantId ?? ""));
  const phone = String(req.body?.phone ?? "");
  const text = String(req.body?.text ?? "").trim();
  if (!tenant || !phone || !text) {
    res.status(400).json({ error: "Falta negocio, cliente o texto." });
    return;
  }
  const pnid = tenant.business.whatsapp_phone_number_id;
  if (!pnid || !whatsappConnected()) {
    res.status(400).json({ error: "WhatsApp no esta conectado para este negocio." });
    return;
  }
  try {
    const r = await sendText(pnid, phone, text);
    if (!r.ok) {
      res.status(502).json({ error: r.error || "WhatsApp rechazó el envío." });
      return;
    }
    addMessage(tenant.id, phone, "assistant", text); // se ve como mensaje del negocio
    res.json({ ok: true });
  } catch (err) {
    console.error("[api/reply] Error:", err);
    res.status(500).json({ error: "No se pudo enviar el mensaje." });
  }
});

/** Toma o devuelve el control humano de una conversacion (pausa/reanuda el bot). */
app.post("/api/handoff", (req: Request, res: Response) => {
  const tenant = getTenant(String(req.body?.tenantId ?? ""));
  const phone = String(req.body?.phone ?? "");
  if (!tenant || !phone) {
    res.status(400).json({ error: "Falta negocio o cliente." });
    return;
  }
  setHandoff(tenant.id, phone, Boolean(req.body?.on));
  res.json({ ok: true, handoff: isHandedOff(tenant.id, phone) });
});

// Sirve fotos locales de productos (data/tenants/<id>/img/<archivo>), de forma segura.
app.get("/media/:tenantId/:file", (req: Request, res: Response) => {
  const tenantId = req.params.tenantId.replace(/[^a-zA-Z0-9._-]/g, "");
  const file = req.params.file.replace(/[^a-zA-Z0-9._-]/g, "");
  const filePath = path.join(__dirname, "..", "data", "tenants", tenantId, "img", file);
  res.sendFile(filePath, (err) => {
    if (err) res.sendStatus(404);
  });
});

// Panel: lista de negocios
app.get("/admin", (_req: Request, res: Response) => {
  res.type("html").send(renderTenantList());
});

// Panel de un negocio: sus pedidos y reservas
app.get("/admin/:tenantId", (req: Request, res: Response) => {
  const tenant = getTenant(req.params.tenantId);
  if (!tenant) {
    res.status(404).type("html").send(`<p>Negocio no encontrado. <a href="/admin">Volver</a></p>`);
    return;
  }
  res.type("html").send(renderAdmin(tenant));
});

// APIs en JSON por negocio
app.get("/admin/:tenantId/pedidos", (req: Request, res: Response) => res.json(getOrders(req.params.tenantId)));
app.get("/admin/:tenantId/reservas", (req: Request, res: Response) => res.json(getReservations(req.params.tenantId)));

// Verificacion del webhook (Meta hace un GET al configurarlo)
app.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === getWhatsapp().verifyToken) {
    console.log("[webhook] Verificado correctamente.");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Recepcion de mensajes (Meta hace POST cuando llega un mensaje)
app.post("/webhook", (req: Request, res: Response) => {
  // Responder 200 de inmediato; procesar en segundo plano.
  res.sendStatus(200);
  processWebhook(req.body).catch((err) =>
    console.error("[webhook] Error procesando:", err)
  );
});

async function processWebhook(body: any): Promise<void> {
  const entries = body?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      // El phone_number_id identifica a QUE negocio llego el mensaje.
      const phoneNumberId = value?.metadata?.phone_number_id as string | undefined;
      const { tenant, usedFallback } = resolveTenant(phoneNumberId);
      if (usedFallback && tenant) {
        console.warn(`[webhook] phone_number_id ${phoneNumberId} sin match; usando negocio por defecto: ${tenant.id}`);
      }

      const messages = value?.messages ?? [];
      for (const message of messages) {
        const from = message.from as string; // numero del cliente

        if (!tenant) {
          console.warn(`[webhook] Mensaje para phone_number_id desconocido: ${phoneNumberId} y sin DEFAULT_TENANT_ID. Ignorado.`);
          continue;
        }

        if (message.type === "text") {
          const text = message.text?.body as string;
          // Si un humano tomo el control, el bot NO responde: solo guardamos el
          // mensaje entrante para que el asesor lo vea en la consola.
          if (isHandedOff(tenant.id, from)) {
            addMessage(tenant.id, from, "user", text);
            console.log(`[msg] (${tenant.id}) ${from} [handoff, humano atiende]: ${text}`);
            continue;
          }
          const reply = await handleMessage(tenant, from, text);
          if (reply.text) await sendText(phoneNumberId!, from, reply.text);
          for (const img of reply.images) {
            await sendImage(phoneNumberId!, from, absoluteUrl(img.url), img.caption);
          }
        } else {
          await sendText(
            phoneNumberId!,
            from,
            "Por ahora solo puedo leer mensajes de texto. Escribeme lo que necesitas por aca."
          );
        }
      }
    }
  }
}

/** Convierte una URL relativa (/media/...) en absoluta usando PUBLIC_BASE_URL.
 *  WhatsApp solo acepta URLs publicas; las fotos http(s) externas pasan tal cual. */
function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = (getWhatsapp().publicBaseUrl || "").replace(/\/$/, "");
  return base ? `${base}${url}` : url;
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

function fecha(ts: number): string {
  return new Date(ts).toLocaleString("es-CO");
}

const PAGE_STYLE = `<style>
  body { font-family: system-ui, sans-serif; margin: 24px; background: #f7f7f8; color: #1a1a1a; }
  h1 { font-size: 20px; } h2 { margin-top: 32px; font-size: 16px; }
  a { color: #2563eb; text-decoration: none; } a:hover { text-decoration: underline; }
  table { border-collapse: collapse; width: 100%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 14px; }
  th { background: #fafafa; } .empty { color: #888; font-style: italic; }
  ul { line-height: 1.8; }
</style>`;

function renderTenantList(): string {
  const items = listTenants()
    .map((t) => `<li><a href="/admin/${esc(t.id)}">${esc(t.business.nombre)}</a> <span style="color:#888">(${esc(t.business.tipo_negocio)}, ${t.menu.length} productos)</span></li>`)
    .join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Panel - Negocios</title>${PAGE_STYLE}</head><body>
<h1>Negocios</h1>
<p><a href="/chat">💬 Abrir chat de prueba</a></p>
${items ? `<ul>${items}</ul>` : `<p class="empty">No hay negocios configurados.</p>`}
</body></html>`;
}

function renderAdmin(tenant: Tenant): string {
  const moneda = tenant.business.moneda;
  const pedidos = getOrders(tenant.id);
  const reservas = getReservations(tenant.id);

  const filasPedidos = pedidos
    .map((p) => {
      const items = Array.isArray(p.items)
        ? (p.items as { cantidad: number; nombre: string }[])
            .map((i) => `${i.cantidad}x ${esc(i.nombre)}`)
            .join(", ")
        : "";
      return `<tr><td>${p.id}</td><td>${esc(p.cliente)}</td><td>${esc(p.direccion)}</td><td>${items}</td><td>${formatMoney(p.total, moneda)}</td><td>${fecha(p.created_at)}</td></tr>`;
    })
    .join("");

  const filasReservas = reservas
    .map(
      (r) =>
        `<tr><td>${r.id}</td><td>${esc(r.cliente)}</td><td>${esc(r.fecha)}</td><td>${esc(r.hora)}</td><td>${r.personas}</td><td>${esc(r.notas)}</td><td>${fecha(r.created_at)}</td></tr>`
    )
    .join("");

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Panel - ${esc(tenant.business.nombre)}</title>${PAGE_STYLE}</head><body>
<p><a href="/admin">&larr; Todos los negocios</a></p>
<h1>Panel de ${esc(tenant.business.nombre)}</h1>

<h2>Pedidos (${pedidos.length})</h2>
${pedidos.length ? `<table><tr><th>#</th><th>Cliente</th><th>Direccion</th><th>Items</th><th>Total</th><th>Fecha</th></tr>${filasPedidos}</table>` : `<p class="empty">Aun no hay pedidos.</p>`}

<h2>Reservas (${reservas.length})</h2>
${reservas.length ? `<table><tr><th>#</th><th>Cliente</th><th>Fecha</th><th>Hora</th><th>Personas</th><th>Notas</th><th>Registrada</th></tr>${filasReservas}</table>` : `<p class="empty">Aun no hay reservas.</p>`}
</body></html>`;
}

app.listen(env.port, () => {
  console.log(`Servidor escuchando en http://localhost:${env.port}`);
  console.log(`Chat:    http://localhost:${env.port}/chat`);
  console.log(`Panel:   http://localhost:${env.port}/admin`);
  console.log(`Webhook: http://localhost:${env.port}/webhook ${whatsappConnected() ? "(WhatsApp conectado)" : "(WhatsApp sin conectar)"}`);
});
