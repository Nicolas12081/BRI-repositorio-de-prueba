import { handleMessage } from "./src/claude";
import { getOrders, getReservations } from "./src/db";
import { getTenant, listTenants } from "./src/tenants";

/**
 * Prueba automatica (no interactiva) del bot, para UN negocio.
 *
 *   npx tsx smoke-test.ts [tenantId]
 *
 * Simula un cliente escribiendo por WhatsApp y muestra las respuestas.
 * Usa el guion apropiado segun el tipo de negocio (restaurante vs tienda).
 */

const tenantId = process.argv[2] || "restaurante-ejemplo";
const tenant = getTenant(tenantId);

if (!tenant) {
  console.error(`No existe el negocio "${tenantId}". Disponibles: ${listTenants().map((t) => t.id).join(", ")}`);
  process.exit(1);
}

const PHONE = "smoke-" + Date.now(); // numero simulado, memoria propia por corrida

const guionRestaurante = [
  "Hola, buenas!",
  "Que tienen de comer?",
  "Quiero una bandeja paisa y una limonada de coco a domicilio. Soy Nicolas, calle 45 #10-20.",
  "Si, confirmo el pedido",
  "Tambien quiero reservar una mesa para 4 personas el sabado a las 8pm a nombre de Nicolas",
  "Si, confirma la reserva",
];

const guionTienda = [
  "Hola, buenas!",
  "Que venden?",
  "Quiero unos audifonos bluetooth pro y un mouse inalambrico silent a domicilio. Soy Ana, carrera 50 #10-20.",
  "Si, confirmo el pedido",
];

const guion = tenant.business.tipo_negocio === "tienda" ? guionTienda : guionRestaurante;

async function main() {
  console.log(`\n=== Smoke test: ${tenant!.business.nombre} (${tenant!.id}) ===\n`);
  for (const mensaje of guion) {
    console.log(`Cliente: ${mensaje}`);
    const t0 = Date.now();
    const reply = await handleMessage(tenant!, PHONE, mensaje);
    const fotos = reply.images.map((i) => `\n  [foto] ${i.caption}: ${i.url}`).join("");
    console.log(`Bot (${Date.now() - t0}ms): ${reply.text}${fotos}\n`);
  }

  console.log("=== Registrados para este negocio ===");
  console.log("Pedidos:", JSON.stringify(getOrders(tenant!.id), null, 2));
  console.log("Reservas:", JSON.stringify(getReservations(tenant!.id), null, 2));
}

main().catch((err) => {
  console.error("Fallo el smoke test:", err);
  process.exit(1);
});
