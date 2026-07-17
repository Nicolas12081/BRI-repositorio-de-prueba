import { formatMoney, findMenuItem, FORMATO_DIRECCION_DEFAULT } from "./data";
import { createOrder, createReservation, getOrders, getReservations } from "./db";
import type { ToolSpec } from "./llm/types";
import type { Tenant } from "./tenants";

// Ventana anti-duplicados: algunos modelos re-invocan la herramienta en turnos
// siguientes. Si llega un pedido/reserva identico del mismo cliente en este lapso,
// se trata como el mismo (idempotencia) para no registrarlo dos veces.
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

/** Contexto de ejecucion de una herramienta: que negocio y que cliente. */
export interface ToolContext {
  tenant: Tenant;
  phone: string;
}

/**
 * Definiciones de herramientas que el modelo puede invocar (formato neutral).
 * Solo ACCIONES: el menu y la info del negocio ya viven en el system prompt, asi
 * el modelo los responde directo (mas confiable, menos fugas de tool-calls).
 */
export const tools: ToolSpec[] = [
  {
    name: "crear_pedido",
    description:
      "Registra un pedido a domicilio. Usalo SOLO despues de haber confirmado con el cliente los productos, la direccion de entrega y el total.",
    parameters: {
      type: "object",
      properties: {
        cliente: { type: "string", description: "Nombre del cliente." },
        direccion: { type: "string", description: "Direccion de entrega." },
        items: {
          type: "array",
          description: "Lista de productos pedidos.",
          items: {
            type: "object",
            properties: {
              nombre: { type: "string", description: "Nombre del producto tal como aparece en el menu." },
              cantidad: { type: ["integer", "string"], description: "Cantidad pedida." },
              notas: { type: "string", description: "Opcional. Notas del item (ej: sin cebolla)." },
            },
            required: ["nombre", "cantidad"],
          },
        },
        comentario: { type: "string", description: "Opcional. Comentario general del pedido." },
      },
      required: ["cliente", "direccion", "items"],
    },
  },
  {
    name: "crear_reserva",
    description:
      "Agenda una reserva de mesa. Usalo solo despues de confirmar los datos con el cliente.",
    parameters: {
      type: "object",
      properties: {
        cliente: { type: "string", description: "Nombre de quien reserva." },
        fecha: { type: "string", description: "Fecha de la reserva (ej: 2026-07-10 o 'este sabado')." },
        hora: { type: "string", description: "Hora de la reserva (ej: 20:00)." },
        personas: { type: ["integer", "string"], description: "Numero de personas." },
        notas: { type: "string", description: "Opcional. Peticiones especiales." },
      },
      required: ["cliente", "fecha", "hora", "personas"],
    },
  },
];

interface PedidoItem {
  nombre: string;
  cantidad: number;
  notas?: string;
}

/**
 * Red de seguridad: detecta direcciones a medias que el domiciliario no podria
 * encontrar (ej: "calle 97", sin placa ni via que cruce).
 *
 * Heuristica deliberadamente permisiva: solo rechaza lo claramente insuficiente.
 * Una direccion util casi siempre trae dos numeros (via + placa: "Calle 97 #15-30")
 * o el simbolo de placa. Preferimos dejar pasar una dudosa antes que bloquear una
 * valida y dejar al bot en un bucle preguntando.
 */
function direccionIncompleta(direccion: string): boolean {
  const d = direccion.trim();
  if (d.length < 6) return true;
  if (/#|nro\.?|no\.\s*\d/i.test(d)) return false; // trae placa explicita
  const numeros = d.match(/\d+/g) ?? [];
  return numeros.length < 2; // "calle 97" -> 1 numero -> incompleta
}

/** Ejecuta la herramienta solicitada y devuelve un texto de resultado para el modelo. */
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<string> {
  switch (name) {
    case "crear_pedido":
      return crearPedido(ctx, input);
    case "crear_reserva":
      return crearReserva(ctx, input);
    default:
      return `Error: herramienta desconocida "${name}".`;
  }
}

function crearPedido(ctx: ToolContext, input: Record<string, unknown>): string {
  const { tenant, phone } = ctx;
  const { business, menu } = tenant;
  const moneda = business.moneda;

  const cliente = String(input.cliente ?? "");
  const direccion = String(input.direccion ?? "");
  const rawItems = (input.items as PedidoItem[]) ?? [];
  const comentario = input.comentario ? String(input.comentario) : undefined;

  if (rawItems.length === 0) {
    return "Error: el pedido no tiene productos.";
  }

  if (direccionIncompleta(direccion)) {
    return `NO registres el pedido todavia: la direccion "${direccion}" esta incompleta y el domiciliario no podria llegar. Formato esperado: ${business.formato_direccion || FORMATO_DIRECCION_DEFAULT}. Preguntale al cliente lo que falta (la placa, o con que via cruza) de forma natural, y vuelve a intentarlo cuando la tengas.`;
  }

  const detalle: { nombre: string; cantidad: number; precioUnit: number; subtotal: number; notas?: string }[] = [];
  const noEncontrados: string[] = [];

  for (const item of rawItems) {
    const menuItem = findMenuItem(menu, item.nombre);
    if (!menuItem) {
      noEncontrados.push(item.nombre);
      continue;
    }
    const cantidad = Number(item.cantidad) || 1;
    detalle.push({
      nombre: menuItem.nombre,
      cantidad,
      precioUnit: menuItem.precio,
      subtotal: menuItem.precio * cantidad,
      notas: item.notas,
    });
  }

  if (detalle.length === 0) {
    return `No encontre estos productos en el menu: ${noEncontrados.join(", ")}. Verifica los nombres con el cliente.`;
  }

  const subtotal = detalle.reduce((acc, d) => acc + d.subtotal, 0);
  const total = subtotal + business.costo_domicilio;

  // Idempotencia: si ya existe un pedido identico reciente de este cliente, no
  // lo dupliques; devuelve el confirmado.
  const firma = detalle.map((d) => `${d.cantidad}x${d.nombre}`).sort().join("|");
  const duplicado = getOrders(tenant.id).find(
    (o) =>
      o.phone === phone &&
      o.total === total &&
      Date.now() - o.created_at < DEDUP_WINDOW_MS &&
      Array.isArray(o.items) &&
      (o.items as { cantidad: number; nombre: string }[])
        .map((i) => `${i.cantidad}x${i.nombre}`)
        .sort()
        .join("|") === firma
  );
  if (duplicado) {
    return `Este pedido ya estaba registrado como #${duplicado.id} (total ${formatMoney(total, moneda)}). No lo registres de nuevo; solo confirma al cliente que ya quedo.`;
  }

  const orderId = createOrder({
    tenantId: tenant.id,
    phone,
    cliente,
    direccion,
    items: detalle,
    total,
    comentario,
  });

  const lineas = detalle.map(
    (d) => `- ${d.cantidad}x ${d.nombre} (${formatMoney(d.subtotal, moneda)})${d.notas ? ` [${d.notas}]` : ""}`
  );

  let out = `Pedido #${orderId} registrado con exito.\n`;
  out += `Cliente: ${cliente}\nDireccion: ${direccion}\n`;
  out += `${lineas.join("\n")}\n`;
  out += `Subtotal: ${formatMoney(subtotal, moneda)}\nDomicilio: ${formatMoney(business.costo_domicilio, moneda)}\nTotal: ${formatMoney(total, moneda)}`;
  if (noEncontrados.length > 0) {
    out += `\n(Aviso: no se pudieron agregar: ${noEncontrados.join(", ")})`;
  }
  return out;
}

function crearReserva(ctx: ToolContext, input: Record<string, unknown>): string {
  const { tenant, phone } = ctx;

  const cliente = String(input.cliente ?? "");
  const fecha = String(input.fecha ?? "");
  const hora = String(input.hora ?? "");
  const personas = Number(input.personas) || 0;
  const notas = input.notas ? String(input.notas) : undefined;

  if (!cliente || !fecha || !hora || personas <= 0) {
    return "Error: faltan datos para la reserva (se requiere cliente, fecha, hora y numero de personas).";
  }

  // Idempotencia: evita reservas duplicadas del mismo cliente en el mismo lapso.
  // No comparamos la hora exacta porque el modelo la escribe distinto ("8pm" vs "20:00").
  const duplicada = getReservations(tenant.id).find(
    (r) =>
      r.phone === phone &&
      r.fecha === fecha &&
      r.personas === personas &&
      Date.now() - r.created_at < DEDUP_WINDOW_MS
  );
  if (duplicada) {
    return `Esta reserva ya estaba registrada como #${duplicada.id}. No la registres de nuevo; solo confirma al cliente que ya quedo.`;
  }

  const reservaId = createReservation({ tenantId: tenant.id, phone, cliente, fecha, hora, personas, notas });

  return `Reserva #${reservaId} confirmada.\nA nombre de: ${cliente}\nFecha: ${fecha}\nHora: ${hora}\nPersonas: ${personas}${notas ? `\nNotas: ${notas}` : ""}`;
}
