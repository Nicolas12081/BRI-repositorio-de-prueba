import fs from "fs";
import path from "path";
import { env } from "./env";

/**
 * Configuracion editable en caliente (no requiere reiniciar). Guarda la conexion
 * de WhatsApp para que se administre desde la consola de Bri en vez del .env.
 * Los valores del .env sirven como valores por defecto la primera vez.
 */

export interface WhatsappSettings {
  /** Token de acceso de la app de Meta. */
  token: string;
  /** Token que el usuario inventa; debe coincidir con el del webhook en Meta. */
  verifyToken: string;
  /** URL publica del servidor (tunel), para que Meta alcance fotos y el webhook. */
  publicBaseUrl: string;
}

interface Settings {
  whatsapp: WhatsappSettings;
}

const file = path.join(__dirname, "..", "data", "settings.json");

function defaults(): Settings {
  return {
    whatsapp: {
      token: env.whatsappToken || "",
      verifyToken: env.whatsappVerifyToken || "bri-verify-123",
      publicBaseUrl: env.publicBaseUrl || "",
    },
  };
}

function load(): Settings {
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as Partial<Settings>;
    const d = defaults();
    return { whatsapp: { ...d.whatsapp, ...(raw.whatsapp ?? {}) } };
  } catch {
    return defaults();
  }
}

let settings: Settings = load();

function persist(): void {
  fs.writeFileSync(file, JSON.stringify(settings, null, 2), "utf-8");
}

/** Config actual de WhatsApp (token, verify, url publica). */
export function getWhatsapp(): WhatsappSettings {
  return settings.whatsapp;
}

/** Actualiza (parcialmente) la config de WhatsApp y la guarda. */
export function saveWhatsapp(patch: Partial<WhatsappSettings>): WhatsappSettings {
  settings.whatsapp = { ...settings.whatsapp, ...patch };
  persist();
  return settings.whatsapp;
}

/** WhatsApp esta listo para enviar/recibir cuando hay token y verify token. */
export function whatsappConnected(): boolean {
  const w = settings.whatsapp;
  return Boolean(w.token && w.verifyToken);
}
