import { env } from "./env";

const GRAPH_API = "https://graph.facebook.com/v21.0";

/**
 * Envia un mensaje de texto via WhatsApp Cloud API.
 * El mensaje sale DESDE el numero del negocio (phoneNumberId), para que en
 * multi-tenant cada cliente reciba la respuesta desde el numero correcto.
 */
export async function sendText(phoneNumberId: string, to: string, text: string): Promise<void> {
  const url = `${GRAPH_API}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.whatsappToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(`[whatsapp] Error enviando mensaje (${res.status}): ${detail}`);
  }
}

/** Envia una imagen (por URL publica) via WhatsApp Cloud API. */
export async function sendImage(phoneNumberId: string, to: string, imageUrl: string, caption?: string): Promise<void> {
  const url = `${GRAPH_API}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.whatsappToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "image",
      image: caption ? { link: imageUrl, caption } : { link: imageUrl },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(`[whatsapp] Error enviando imagen (${res.status}): ${detail}`);
  }
}
