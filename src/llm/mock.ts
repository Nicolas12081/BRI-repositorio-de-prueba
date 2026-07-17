import type { LLMProvider, ConversationItem, AssistantTurn } from "./types";
import { listTenants } from "../tenants";

// El mock es solo para pruebas; junta los menus de todos los negocios para poder
// reconocer productos sin saber el tenant (el proveedor no lo recibe).
const menu = listTenants().flatMap((t) => t.menu);

/**
 * Proveedor FALSO para pruebas sin costo (LLM_PROVIDER=mock o MOCK_LLM=1).
 * Decide con reglas por palabras clave en vez de llamar a una IA real. No es
 * generativo: solo valida la plomeria (bucle de tools + guardado en DB) sin gasto.
 */

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function textTurn(text: string): AssistantTurn {
  return { text, toolCalls: [] };
}

function toolTurn(name: string, input: Record<string, unknown>): AssistantTurn {
  return { text: "", toolCalls: [{ id: "mock_" + Date.now(), name, input }] };
}

/** Extrae los items del menu mencionados en el texto, con su cantidad. */
function parseItems(text: string): { nombre: string; cantidad: number }[] {
  const t = norm(text);
  const items: { nombre: string; cantidad: number }[] = [];
  for (const m of menu) {
    const idx = t.indexOf(norm(m.nombre));
    if (idx === -1) continue;
    const before = t.slice(Math.max(0, idx - 6), idx);
    const numMatch = before.match(/(\d+)\s*$/);
    items.push({ nombre: m.nombre, cantidad: numMatch ? parseInt(numMatch[1], 10) : 1 });
  }
  return items;
}

function pick(regex: RegExp, text: string, group = 1): string | undefined {
  const m = text.match(regex);
  return m ? m[group].trim() : undefined;
}

function decide(userText: string): AssistantTurn {
  const t = norm(userText);

  if (/\bconfirm/.test(t)) {
    return textTurn("Perfecto, todo confirmado. Algo mas en lo que te pueda ayudar? 😊");
  }

  if (/reserv|mesa/.test(t)) {
    const personas = parseInt(pick(/(\d+)\s*person/, t) ?? pick(/para\s+(\d+)/, t) ?? "0", 10) || 0;
    const hora =
      pick(/(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?))/, t) ?? pick(/(\d{1,2}:\d{2})/, t) ?? "";
    const dia = pick(/(lunes|martes|miercoles|jueves|viernes|sabado|domingo|hoy|manana)/, t) ?? "";
    const cliente =
      pick(/a nombre de ([a-zñ ]+?)(?:$|,|\.| para| el| a las)/, t) ?? pick(/soy ([a-zñ]+)/, t) ?? "";
    if (personas > 0 && (hora || dia)) {
      return toolTurn("crear_reserva", {
        cliente,
        fecha: dia || "por confirmar",
        hora: hora || "por confirmar",
        personas,
      });
    }
    return textTurn("Claro, con gusto reservo. Para cuantas personas, que dia y a que hora? Y a nombre de quien?");
  }

  const items = parseItems(userText);
  if (items.length > 0 && /(quiero|domicilio|pedido|pedir|ordenar|llevar|mandame|me traes)/.test(t)) {
    const cliente = pick(/soy ([a-zñ]+)/, t) ?? pick(/a nombre de ([a-zñ ]+?)(?:$|,|\.)/, t) ?? "";
    const direccion =
      pick(/((?:calle|carrera|cra|kra|avenida|av|diagonal|dg|transversal|tv)[^.,]*)/, t) ?? "";
    return toolTurn("crear_pedido", { cliente, direccion, items });
  }

  if (/(menu|carta|comer|tienen|hay|precio|cuanto|platos?)/.test(t)) {
    return toolTurn("consultar_menu", {});
  }

  if (/(horario|hora abren|direccion|donde (estan|queda|es)|pago|pagar|domicilio cuesta|telefono)/.test(t)) {
    return toolTurn("info_negocio", {});
  }

  if (/(hola|buenas|buenos dias|buen dia|que tal|hey)/.test(t)) {
    return textTurn("Hola! 👋 Bienvenido. En que te puedo ayudar hoy? Puedo mostrarte el menu, tomar tu pedido o agendarte una reserva.");
  }

  return textTurn("Con gusto te ayudo. Quieres ver el menu, hacer un pedido a domicilio o reservar una mesa?");
}

export function createMockProvider(): LLMProvider {
  return {
    name: "mock",
    async complete({ messages }): Promise<AssistantTurn> {
      const last = messages[messages.length - 1];

      // Si el ultimo turno son resultados de herramientas, respondemos con ese
      // texto (executeTool ya devuelve algo legible para el cliente).
      if (last?.role === "tool") {
        return textTurn(last.results.map((r) => r.content).join("\n"));
      }

      const userText = last?.role === "user" ? last.text : "";
      return decide(userText);
    },
  };
}
