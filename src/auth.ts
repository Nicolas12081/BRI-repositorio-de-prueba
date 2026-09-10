import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { kvGet, kvSet } from "./db";

/**
 * Autenticacion de Bri (multi-cliente). Dos roles:
 *  - admin: el dueno (tu). Ve todos los negocios y maneja WhatsApp. Su cuenta sale
 *    de las variables de entorno ADMIN_EMAIL / ADMIN_PASSWORD (nunca en el repo).
 *  - client: cada negocio. El admin le crea la cuenta; solo ve su propio tenant.
 *
 * VALVULA DE SEGURIDAD: si no hay ADMIN_PASSWORD en el entorno, el login queda
 * DESACTIVADO y el sitio funciona abierto como antes. Asi el despliegue no deja
 * a nadie por fuera; el login se "enciende" cuando el dueno pone la contrasena.
 *
 * Sin dependencias nuevas: hash con scrypt (crypto nativo), sesiones por cookie.
 */

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "vesta.pos.system@gmail.com").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SESSION_DAYS = 30;
const COOKIE = "bri_session";

export function authEnabled(): boolean {
  return ADMIN_PASSWORD.length > 0;
}

export interface User {
  id: string;
  email: string;
  salt: string;
  hash: string;
  tenantId: string; // negocio que puede ver (vacio = admin)
  createdAt: number;
}

export type Role = "admin" | "client";
export interface AuthInfo {
  userId: string;
  role: Role;
  tenantId: string; // vacio para admin
  email: string;
}

interface Session {
  userId: string;
  role: Role;
  tenantId: string;
  email: string;
  exp: number;
}

let users: User[] = [];
let sessions: Record<string, Session> = {};

// --- hashing -------------------------------------------------------------
function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")): { salt: string; hash: string } {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}
function verifyPassword(password: string, salt: string, hash: string): boolean {
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(test, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function constantEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// --- carga / persistencia ------------------------------------------------
export async function initAuth(): Promise<void> {
  const savedUsers = (await kvGet("users")) as User[] | null;
  if (Array.isArray(savedUsers)) users = savedUsers;
  const savedSessions = (await kvGet("sessions")) as Record<string, Session> | null;
  if (savedSessions && typeof savedSessions === "object") sessions = savedSessions;
  pruneSessions();
  console.log(
    `[auth] Login ${authEnabled() ? "ACTIVO" : "desactivado (sin ADMIN_PASSWORD)"}; ${users.length} cuenta(s) de cliente.`
  );
}

function pruneSessions(): void {
  const now = Date.now();
  let changed = false;
  for (const [tok, s] of Object.entries(sessions)) {
    if (s.exp < now) {
      delete sessions[tok];
      changed = true;
    }
  }
  if (changed) kvSet("sessions", sessions);
}

// --- usuarios ------------------------------------------------------------
export function findUserByEmail(email: string): User | undefined {
  const e = email.trim().toLowerCase();
  return users.find((u) => u.email === e);
}

export function listClients(): { email: string; tenantId: string; createdAt: number }[] {
  return users.map((u) => ({ email: u.email, tenantId: u.tenantId, createdAt: u.createdAt }));
}

/** Crea (o actualiza la contrasena de) una cuenta de cliente ligada a un negocio. */
export function upsertClient(email: string, password: string, tenantId: string): User {
  const e = email.trim().toLowerCase();
  const { salt, hash } = hashPassword(password);
  const existing = users.find((u) => u.email === e);
  if (existing) {
    existing.salt = salt;
    existing.hash = hash;
    existing.tenantId = tenantId;
  } else {
    users.push({ id: crypto.randomUUID(), email: e, salt, hash, tenantId, createdAt: Date.now() });
  }
  kvSet("users", users);
  return findUserByEmail(e)!;
}

export function deleteClient(email: string): boolean {
  const e = email.trim().toLowerCase();
  const before = users.length;
  users = users.filter((u) => u.email !== e);
  if (users.length !== before) {
    kvSet("users", users);
    return true;
  }
  return false;
}

// --- login / sesiones ----------------------------------------------------
/** Verifica credenciales. Devuelve la sesion a crear, o null si son invalidas. */
export function verifyLogin(email: string, password: string): AuthInfo | null {
  const e = email.trim().toLowerCase();
  // Admin: viene del entorno, es la fuente de verdad.
  if (authEnabled() && constantEquals(e, ADMIN_EMAIL) && constantEquals(password, ADMIN_PASSWORD)) {
    return { userId: "admin", role: "admin", tenantId: "", email: ADMIN_EMAIL };
  }
  const u = findUserByEmail(e);
  if (u && verifyPassword(password, u.salt, u.hash)) {
    return { userId: u.id, role: "client", tenantId: u.tenantId, email: u.email };
  }
  return null;
}

export function createSession(info: AuthInfo): string {
  const token = crypto.randomBytes(32).toString("hex");
  sessions[token] = { ...info, exp: Date.now() + SESSION_DAYS * 86400_000 };
  kvSet("sessions", sessions);
  return token;
}

export function destroySession(token: string): void {
  if (sessions[token]) {
    delete sessions[token];
    kvSet("sessions", sessions);
  }
}

function getCookie(req: Request, name: string): string | null {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export function setSessionCookie(res: Response, token: string): void {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_DAYS * 86400}; SameSite=Lax; Secure`
  );
}
export function clearSessionCookie(res: Response): void {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`);
}

export function sessionFromReq(req: Request): AuthInfo | null {
  const token = getCookie(req, COOKIE);
  if (!token) return null;
  const s = sessions[token];
  if (!s) return null;
  if (s.exp < Date.now()) {
    destroySession(token);
    return null;
  }
  return { userId: s.userId, role: s.role, tenantId: s.tenantId, email: s.email };
}

// --- rutas publicas / gate ----------------------------------------------
// Rutas que SIEMPRE quedan abiertas (WhatsApp, salud, privacidad, login, marca).
function isPublicPath(p: string): boolean {
  if (p === "/" || p === "/health" || p === "/login" || p === "/privacidad" || p === "/favicon.ico") return true;
  if (p === "/api/login" || p === "/api/logout" || p === "/api/me") return true;
  if (p.startsWith("/assets/")) return true;
  if (p.startsWith("/webhook")) return true; // verificacion GET + mensajes POST de Meta
  return false;
}

// Rutas que exigen rol admin (credenciales de WhatsApp, diagnostico, gestion de cuentas).
function isAdminPath(p: string): boolean {
  if (p.startsWith("/api/admin")) return true;
  if (p === "/api/whatsapp" || p.startsWith("/api/whatsapp/")) return true;
  if (p === "/api/webhook-debug" || p === "/api/wa-subscribe") return true;
  if (p === "/admin" || p.startsWith("/admin/")) return true;
  return false;
}

const req_ = Symbol("auth");
export function getAuth(req: Request): AuthInfo | undefined {
  return (req as any)[req_];
}

/**
 * Middleware unico: protege todo salvo las rutas publicas. Para clientes, ademas
 * FUERZA el tenantId a su propio negocio (no pueden leer datos de otro). Si el
 * login esta desactivado (sin ADMIN_PASSWORD), deja pasar todo (modo abierto).
 */
export function authGate(req: Request, res: Response, next: NextFunction): void {
  if (!authEnabled()) return next(); // valvula de seguridad: sitio abierto como antes
  const p = req.path;
  if (isPublicPath(p)) return next();

  const info = sessionFromReq(req);
  if (!info) {
    // Navegacion a una pagina -> al login; llamada de datos -> 401.
    if (req.method === "GET" && (req.accepts(["html", "json"]) === "html")) {
      res.redirect("/login");
    } else {
      res.status(401).json({ error: "Debes iniciar sesion." });
    }
    return;
  }

  if (isAdminPath(p) && info.role !== "admin") {
    res.status(403).json({ error: "Solo el administrador puede hacer esto." });
    return;
  }

  // Aislamiento: un cliente solo opera sobre SU negocio.
  if (info.role === "client" && info.tenantId) {
    if (req.query && typeof req.query === "object") (req.query as any).tenantId = info.tenantId;
    if (req.body && typeof req.body === "object") (req.body as any).tenantId = info.tenantId;
  }

  (req as any)[req_] = info;
  next();
}
