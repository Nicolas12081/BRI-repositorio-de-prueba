import { tools, executeTool } from "./tools";
import { getHistory, addMessage, saveTrace } from "./db";
import { getProvider } from "./llm";
import type { ConversationItem, ToolResult } from "./llm/types";
import type { Tenant } from "./tenants";
import { findMenuItem, resolveImageUrl } from "./data";
import { contextoAhora } from "./prompt";

/** Una imagen que el bot decide enviar (foto de un producto). */
export interface BotImage {
  url: string;
  caption: string;
}

/** Respuesta del bot: texto y, opcionalmente, fotos de productos. */
export interface BotReply {
  text: string;
  images: BotImage[];
}

/**
 * Extrae los marcadores [IMG:Nombre] del texto, los quita del mensaje visible y
 * los convierte en fotos reales (buscando el producto en el menu del negocio).
 */
function extractImages(tenant: Tenant, text: string): BotReply {
  const images: BotImage[] = [];
  const seen = new Set<string>();
  const cleaned = text
    .replace(/\[IMG:\s*([^\]]+?)\s*\]/gi, (_m, nombre: string) => {
      const item = findMenuItem(tenant.menu, nombre.trim());
      if (item?.imagen) {
        const url = resolveImageUrl(tenant.id, item.imagen);
        if (!seen.has(url)) {
          seen.add(url);
          images.push({ url, caption: item.nombre });
        }
      }
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text: cleaned, images };
}

const provider = getProvider();

// Menos vueltas = menos llamadas = menos rate limit en planes gratuitos.
const MAX_TURNS = 4;

console.log(`[bot] Proveedor de IA activo: ${provider.name}`);

/**
 * Procesa un mensaje entrante de un cliente para UN negocio (tenant) y devuelve
 * la respuesta del bot. Es agnostico al proveedor: el bucle de herramientas
 * trabaja en formato neutral. La memoria es por (tenant + telefono del cliente).
 */
export async function handleMessage(tenant: Tenant, phone: string, userText: string): Promise<BotReply> {
  const t0 = Date.now();
  console.log(`[msg] (${tenant.id}) ${phone}: ${userText}`);
  // Historial acotado: suficiente memoria, sin inflar los tokens por llamada.
  const history = getHistory(tenant.id, phone, 12);

  const messages: ConversationItem[] = [
    ...history.map((h): ConversationItem =>
      h.role === "assistant"
        ? { role: "assistant", text: h.content, toolCalls: [] }
        : { role: "user", text: h.content }
    ),
    { role: "user", text: userText },
  ];

  let finalText = "";

  // El contexto de tiempo cambia entre mensajes, por eso se agrega aqui y no en
  // el prompt base (que se construye una sola vez al cargar el negocio).
  const system = `${tenant.systemPrompt}\n\n${contextoAhora(tenant.business)}`;

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const res = await provider.complete({
        system,
        tools,
        messages,
        maxTokens: 1024,
        // Media-alta: da calidez y variedad. Ojo: por encima de ~0.8 Llama empieza
        // a filtrar tokens de otros idiomas ("A nombre de 谁..."), asi que 0.7 es el punto dulce.
        temperature: 0.7,
      });

      messages.push({ role: "assistant", text: res.text, toolCalls: res.toolCalls });

      if (res.toolCalls.length > 0) {
        const results: ToolResult[] = [];
        for (const call of res.toolCalls) {
          const content = await executeTool(call.name, call.input, { tenant, phone });
          results.push({ id: call.id, content });
        }
        messages.push({ role: "tool", results });
        continue;
      }

      finalText = res.text;
      break;
    }
  } catch (err) {
    console.error(`[msg] (${tenant.id}) error:`, err instanceof Error ? err.message : err);
    finalText = "Disculpa, tuve un problema tecnico. Puedes intentarlo de nuevo en un momento?";
  }

  if (!finalText) {
    finalText = "Disculpa, tuve un problema procesando tu mensaje. Puedes intentarlo de nuevo?";
  }

  const reply = extractImages(tenant, finalText);
  const ms = Date.now() - t0;
  saveTrace(tenant.id, phone, { ms, provider: provider.name, at: Date.now() });
  const imgNote = reply.images.length ? ` [+${reply.images.length} foto(s)]` : "";
  console.log(`[bot] (${tenant.id}) -> ${phone} (${ms}ms)${imgNote}: ${reply.text.slice(0, 80)}`);

  // Persiste solo la conversacion visible (usuario + texto de la respuesta).
  addMessage(tenant.id, phone, "user", userText);
  addMessage(tenant.id, phone, "assistant", reply.text || finalText);

  return reply;
}
