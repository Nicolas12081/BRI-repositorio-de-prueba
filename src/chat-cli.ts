import readline from "readline";
import { handleMessage } from "./claude";
import { getTenant, listTenants } from "./tenants";

/**
 * Modo de prueba por terminal: conversa con el bot de un negocio sin WhatsApp.
 *
 *   npx tsx src/chat-cli.ts [tenantId]
 *
 * Si no pasas tenantId, usa el primero disponible.
 */

const tenantId = process.argv[2];
const tenant = tenantId ? getTenant(tenantId) : listTenants()[0];

if (!tenant) {
  console.error(
    tenantId
      ? `No existe el negocio "${tenantId}". Disponibles: ${listTenants().map((t) => t.id).join(", ")}`
      : "No hay negocios configurados en data/tenants/."
  );
  process.exit(1);
}

const TEST_PHONE = "cli-test"; // numero simulado para la memoria de la conversacion

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log(`\n=== Prueba del bot de ${tenant.business.nombre} (${tenant.id}) ===`);
console.log("Escribe un mensaje como si fueras un cliente. Escribe 'salir' para terminar.\n");

function ask(): void {
  rl.question("Tu: ", async (text) => {
    const input = text.trim();
    if (input.toLowerCase() === "salir" || input.toLowerCase() === "exit") {
      rl.close();
      return;
    }
    if (!input) {
      ask();
      return;
    }
    try {
      const reply = await handleMessage(tenant!, TEST_PHONE, input);
      const fotos = reply.images.map((i) => `\n  [foto] ${i.caption}: ${i.url}`).join("");
      console.log(`\nBot: ${reply.text}${fotos}\n`);
    } catch (err) {
      console.error("\n[error]", err instanceof Error ? err.message : err, "\n");
    }
    ask();
  });
}

ask();

rl.on("close", () => {
  console.log("\nHasta luego!");
  process.exit(0);
});
