import fs from "fs";
import path from "path";
import type { Business, MenuItem } from "./data";
import { buildSystemPrompt } from "./prompt";
import { kvGet, kvSet } from "./db";

/**
 * Un tenant = un negocio cliente del SaaS, con su propio contexto.
 * Cada uno vive en data/tenants/<id>/ con business.json y menu.json.
 */
export interface Tenant {
  id: string;
  business: Business;
  menu: MenuItem[];
  systemPrompt: string;
}

const tenantsDir = path.join(__dirname, "..", "data", "tenants");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
}

function loadTenant(id: string): Tenant {
  const dir = path.join(tenantsDir, id);
  const business = readJson<Business>(path.join(dir, "business.json"));
  const menu = readJson<MenuItem[]>(path.join(dir, "menu.json"));
  business.id = business.id || id; // el id de la carpeta manda
  return { id: business.id, business, menu, systemPrompt: buildSystemPrompt(business, menu) };
}

/** Carga todos los tenants desde disco (una sola vez, en memoria). */
function loadAllTenants(): Map<string, Tenant> {
  const map = new Map<string, Tenant>();
  if (!fs.existsSync(tenantsDir)) return map;
  for (const entry of fs.readdirSync(tenantsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      const tenant = loadTenant(entry.name);
      map.set(tenant.id, tenant);
    } catch (err) {
      console.error(`[tenants] No se pudo cargar "${entry.name}":`, err instanceof Error ? err.message : err);
    }
  }
  return map;
}

const tenants = loadAllTenants();

// Indice inverso: phone_number_id de WhatsApp -> tenant.
const byPhoneNumberId = new Map<string, Tenant>();

function rebuildIndex(): void {
  byPhoneNumberId.clear();
  for (const tenant of tenants.values()) {
    const pnid = tenant.business.whatsapp_phone_number_id;
    if (pnid) byPhoneNumberId.set(pnid, tenant);
  }
}
rebuildIndex();

// Negocios modificados desde la app (no solo desde el repo). Se respaldan en
// Postgres para que sus cambios (catalogo, phone_number_id, etc.) sobrevivan a
// reinicios en Render (disco efimero). Solo se guardan los que se editan en vivo;
// los negocios que solo viven en el repo no entran aqui (el repo manda para esos).
let dbOverrides: Record<string, { business: Business; menu: MenuItem[] }> = {};

/**
 * Restaura los negocios editados en vivo desde Postgres. Llamar al arrancar,
 * DESPUES de initDb(). Aplica esos cambios encima de lo cargado del repo.
 */
export async function initTenants(): Promise<void> {
  const saved = (await kvGet("tenants")) as Record<string, { business: Business; menu: MenuItem[] }> | null;
  if (!saved) return;
  dbOverrides = saved;
  for (const [id, cfg] of Object.entries(saved)) {
    const business: Business = { ...cfg.business, id };
    tenants.set(id, { id, business, menu: cfg.menu, systemPrompt: buildSystemPrompt(business, cfg.menu) });
  }
  rebuildIndex();
  console.log(`[tenants] ${Object.keys(saved).length} negocio(s) restaurado(s) desde Postgres.`);
}

/**
 * Guarda la configuracion de un negocio (disco + Postgres) y lo recarga en memoria.
 * Al recargar se reconstruye su system prompt, asi el bot usa el menu y la
 * personalidad nuevos de inmediato, sin reiniciar el servidor.
 */
export function saveTenantConfig(id: string, business: Business, menu: MenuItem[]): Tenant {
  const dir = path.join(tenantsDir, id);
  if (!fs.existsSync(dir)) throw new Error(`No existe el negocio "${id}".`);

  business.id = id;
  try {
    fs.writeFileSync(path.join(dir, "business.json"), JSON.stringify(business, null, 2), "utf-8");
    fs.writeFileSync(path.join(dir, "menu.json"), JSON.stringify(menu, null, 2), "utf-8");
  } catch {
    // Disco efimero/solo-lectura en Render: el respaldo real es Postgres (kvSet).
  }

  // Reconstruimos desde los objetos en mano (no desde disco, por si el write fallo).
  const tenant: Tenant = { id, business, menu, systemPrompt: buildSystemPrompt(business, menu) };
  tenants.set(id, tenant);
  rebuildIndex();

  dbOverrides[id] = { business, menu };
  kvSet("tenants", dbOverrides);
  console.log(`[tenants] "${id}" actualizado (${menu.length} productos); prompt reconstruido.`);
  return tenant;
}

console.log(`[tenants] Cargados ${tenants.size}: ${[...tenants.keys()].join(", ") || "(ninguno)"}`);

/** Busca un tenant por su id (nombre de carpeta). */
export function getTenant(id: string): Tenant | undefined {
  return tenants.get(id);
}

/** Enruta por el phone_number_id que envia Meta en el webhook. */
export function getTenantByPhoneNumberId(pnid: string): Tenant | undefined {
  return byPhoneNumberId.get(pnid);
}

/**
 * Resuelve a que negocio pertenece un mensaje. Primero por phone_number_id; si no
 * hay match, usa DEFAULT_TENANT_ID del .env, o el unico negocio si solo hay uno.
 * Esto facilita la primera prueba sin tener que configurar el ID real de una vez.
 */
export function resolveTenant(phoneNumberId?: string): { tenant?: Tenant; usedFallback: boolean } {
  if (phoneNumberId) {
    const match = byPhoneNumberId.get(phoneNumberId);
    if (match) return { tenant: match, usedFallback: false };
  }
  const defId = process.env.DEFAULT_TENANT_ID;
  if (defId && tenants.has(defId)) return { tenant: tenants.get(defId), usedFallback: true };
  if (tenants.size === 1) return { tenant: [...tenants.values()][0], usedFallback: true };
  return { tenant: undefined, usedFallback: false };
}

/** Lista todos los tenants (para el panel y utilidades). */
export function listTenants(): Tenant[] {
  return [...tenants.values()];
}
