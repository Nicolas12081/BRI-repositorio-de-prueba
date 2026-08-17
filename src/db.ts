import fs from "fs";
import path from "path";

/**
 * Almacenamiento simple en archivos JSON (sin dependencias nativas).
 * Multi-tenant: cada mensaje, pedido y reserva lleva su tenantId. Suficiente para
 * una v1; se puede migrar a Postgres/SQLite sin cambiar la interfaz de este modulo.
 */

const dataDir = path.join(__dirname, "..", "data");
const dbFile = path.join(dataDir, "bot.json");

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

interface StoredMessage extends HistoryMessage {
  tenantId: string;
  phone: string;
  created_at: number;
}

export interface Order {
  id: number;
  tenantId: string;
  phone: string;
  cliente?: string;
  direccion?: string;
  items: unknown;
  total: number;
  comentario?: string;
  created_at: number;
}

export interface Reservation {
  id: number;
  tenantId: string;
  phone: string;
  cliente: string;
  fecha: string;
  hora: string;
  personas: number;
  notas?: string;
  created_at: number;
}

/** Como de probable es que esta conversacion termine en venta. */
export type Bucket = "hot" | "warm" | "cold";

/** Calificacion de una conversacion (lead). */
export interface Lead {
  tenantId: string;
  phone: string;
  score: number; // 0-100
  bucket: Bucket;
  reasons: string[];
  signals: { interes: boolean; precio: boolean; datos: boolean; urgencia: boolean };
  /** Cuantos mensajes tenia la conversacion al calificarla (para saber si esta al dia). */
  msgCount: number;
  scoredAt: number;
}

interface Store {
  messages: StoredMessage[];
  orders: Order[];
  reservations: Reservation[];
  leads: Lead[];
  /** Conversaciones donde un humano tomo el control (el bot no responde). Claves "tenantId|phone". */
  handoffs: string[];
  nextOrderId: number;
  nextReservationId: number;
}

function emptyStore(): Store {
  return { messages: [], orders: [], reservations: [], leads: [], handoffs: [], nextOrderId: 1, nextReservationId: 1 };
}

function load(): Store {
  try {
    const raw = fs.readFileSync(dbFile, "utf-8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    // Mezclamos con el vacio para tolerar archivos de versiones anteriores (sin leads).
    return { ...emptyStore(), ...parsed };
  } catch {
    return emptyStore();
  }
}

const store: Store = load();

function persist(): void {
  fs.writeFileSync(dbFile, JSON.stringify(store, null, 2), "utf-8");
}

export function addMessage(tenantId: string, phone: string, role: "user" | "assistant", content: string): void {
  store.messages.push({ tenantId, phone, role, content, created_at: Date.now() });
  persist();
}

/** Devuelve los ultimos mensajes de la conversacion (por tenant + cliente). */
export function getHistory(tenantId: string, phone: string, limit = 20): HistoryMessage[] {
  const forConvo = store.messages.filter((m) => m.tenantId === tenantId && m.phone === phone);
  return forConvo.slice(-limit).map((m) => ({ role: m.role, content: m.content }));
}

export function createOrder(order: {
  tenantId: string;
  phone: string;
  cliente?: string;
  direccion?: string;
  items: unknown;
  total: number;
  comentario?: string;
}): number {
  const id = store.nextOrderId++;
  store.orders.push({ id, ...order, created_at: Date.now() });
  persist();
  return id;
}

export function createReservation(reservation: {
  tenantId: string;
  phone: string;
  cliente: string;
  fecha: string;
  hora: string;
  personas: number;
  notas?: string;
}): number {
  const id = store.nextReservationId++;
  store.reservations.push({ id, ...reservation, created_at: Date.now() });
  persist();
  return id;
}

/** Resumen de una conversacion para la bandeja de la consola. */
export interface ConversationSummary {
  phone: string;
  lastMessage: string;
  lastAt: number;
  count: number;
}

/** Lista las conversaciones de un negocio, la mas reciente primero. */
export function getConversations(tenantId: string): ConversationSummary[] {
  const map = new Map<string, ConversationSummary>();
  for (const m of store.messages) {
    if (m.tenantId !== tenantId) continue;
    const found = map.get(m.phone);
    if (found) {
      found.lastMessage = m.content;
      found.lastAt = m.created_at;
      found.count++;
    } else {
      map.set(m.phone, { phone: m.phone, lastMessage: m.content, lastAt: m.created_at, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.lastAt - a.lastAt);
}

/** Mensajes completos de una conversacion (orden cronologico). */
export function getMessages(tenantId: string, phone: string): (HistoryMessage & { created_at: number })[] {
  return store.messages
    .filter((m) => m.tenantId === tenantId && m.phone === phone)
    .map((m) => ({ role: m.role, content: m.content, created_at: m.created_at }));
}

/** ¿Un humano tomo el control de esta conversacion? (el bot no debe responder). */
export function isHandedOff(tenantId: string, phone: string): boolean {
  return store.handoffs.includes(tenantId + "|" + phone);
}

/** Activa o desactiva el control humano de una conversacion. */
export function setHandoff(tenantId: string, phone: string, on: boolean): void {
  const key = tenantId + "|" + phone;
  const i = store.handoffs.indexOf(key);
  if (on && i < 0) store.handoffs.push(key);
  if (!on && i >= 0) store.handoffs.splice(i, 1);
  persist();
}

/** Calificacion guardada de una conversacion, si existe. */
export function getLead(tenantId: string, phone: string): Lead | undefined {
  return store.leads.find((l) => l.tenantId === tenantId && l.phone === phone);
}

/** Todas las calificaciones de un negocio. */
export function getLeads(tenantId: string): Lead[] {
  return store.leads.filter((l) => l.tenantId === tenantId);
}

/** Guarda (o reemplaza) la calificacion de una conversacion. */
export function saveLead(lead: Lead): void {
  const i = store.leads.findIndex((l) => l.tenantId === lead.tenantId && l.phone === lead.phone);
  if (i >= 0) store.leads[i] = lead;
  else store.leads.push(lead);
  persist();
}

/** Pedidos, mas recientes primero. Si se pasa tenantId, filtra por ese negocio. */
export function getOrders(tenantId?: string): Order[] {
  const list = tenantId ? store.orders.filter((o) => o.tenantId === tenantId) : store.orders;
  return [...list].reverse();
}

/** Reservas, mas recientes primero. Si se pasa tenantId, filtra por ese negocio. */
export function getReservations(tenantId?: string): Reservation[] {
  const list = tenantId ? store.reservations.filter((r) => r.tenantId === tenantId) : store.reservations;
  return [...list].reverse();
}
