import { getWhatsapp } from "./settings";

const GRAPH_API = "https://graph.facebook.com/v21.0";

/**
 * Con el nuevo sistema de usernames de WhatsApp (2025-2026), algunos clientes
 * llegan identificados por un BSUID (Business-Scoped User ID), ej. "CO.1066421156100727",
 * en vez de por su numero. Para RESPONDERLES, la Cloud API exige el campo `recipient`
 * (el campo `to` es solo para numeros de telefono). Detectamos el formato del BSUID
 * (dos letras + punto + digitos) y armamos el destinatario en el campo correcto.
 */
function buildRecipient(dest: string): Record<string, string> {
  const esBsuid = /^[A-Za-z]{2}\.\d+$/.test(dest);
  return esBsuid ? { recipient: dest } : { to: dest };
}

/**
 * Envia un mensaje de texto via WhatsApp Cloud API.
 * El mensaje sale DESDE el numero del negocio (phoneNumberId), para que en
 * multi-tenant cada cliente reciba la respuesta desde el numero correcto.
 */
export interface SendResult {
  ok: boolean;
  error?: string;
}

/** Traduce el error crudo de Meta a un mensaje entendible. */
function friendlyError(detail: string): string {
  if (/expired/i.test(detail)) return "El token de WhatsApp venció. Genera uno nuevo y guárdalo en la conexión.";
  if (/re-?engagement|24|outside|window/i.test(detail)) return "Pasaron más de 24h desde el último mensaje del cliente; WhatsApp exige una plantilla aprobada.";
  const m = detail.match(/"message":"([^"]{0,120})/);
  return m ? m[1] : "WhatsApp rechazó el envío.";
}

export async function sendText(phoneNumberId: string, to: string, text: string): Promise<SendResult> {
  const url = `${GRAPH_API}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getWhatsapp().token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      ...buildRecipient(to),
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(`[whatsapp] Error enviando mensaje (${res.status}): ${detail}`);
    return { ok: false, error: friendlyError(detail) };
  }
  return { ok: true };
}

/** Envia una imagen (por URL publica) via WhatsApp Cloud API. */
export async function sendImage(phoneNumberId: string, to: string, imageUrl: string, caption?: string): Promise<void> {
  const url = `${GRAPH_API}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getWhatsapp().token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      ...buildRecipient(to),
      type: "image",
      image: caption ? { link: imageUrl, caption } : { link: imageUrl },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(`[whatsapp] Error enviando imagen (${res.status}): ${detail}`);
  }
}
