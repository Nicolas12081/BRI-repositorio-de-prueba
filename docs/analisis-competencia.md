# Análisis de competencia y brechas del producto

> Fecha: 22 de julio de 2026
> Complementa a `WATI analisis.txt` (análisis manual de Wati) con: inventario real del código,
> mapa completo de competidores por categoría, brechas priorizadas y posicionamiento recomendado.

---

## Parte 0 — Punto de partida: qué tenemos HOY (verificado en el código)

Antes de comparar con nadie, hay que ser honestos sobre el estado real. Esto sale de leer el
código, no de lo que quisiéramos tener.

### Lo que YA funciona

| Capacidad | Dónde vive | Nota |
|---|---|---|
| Bot generativo real (no árbol de reglas) | `src/claude.ts`, `src/prompt.ts` | El prompt se construye desde la config del negocio |
| Multi-negocio (multi-tenant) | `src/tenants.ts` | Carpeta por negocio con `business.json` + `menu.json` |
| Enrutamiento por número de WhatsApp | `src/tenants.ts:89` | `phone_number_id` → negocio |
| API oficial de Meta, directa | `src/whatsapp.ts` | Sin intermediarios: no dependemos de un BSP |
| Proveedor de IA intercambiable | `src/llm/` | Groq / Gemini / Claude / mock |
| Herramientas de acción | `src/tools.ts` | `crear_pedido`, `crear_reserva` |
| Reglas duras anti-alucinación | `src/tools.ts:83,121,158` | Horario cerrado, dirección incompleta, idempotencia |
| Horarios por día + zona horaria | `src/data.ts:82` | Sabe si está abierto AHORA |
| Calificación de leads con IA (hot/warm/cold) | `src/lead.ts` | Con caché y atajo gratis si ya compró |
| Consola web (bandeja, chat, analítica, config) | `src/console.ts` | 3 vistas: `viewChat`, `viewPanel`, `viewCfg` |
| Métricas reales | `src/index.ts:199` | Ingresos, ticket, conversión, top productos, 7 días |
| Chat de prueba en navegador | `src/webchat.ts` | Demo sin WhatsApp |
| Envío de fotos de productos | `src/index.ts:284` | `/media/:tenantId/:file` |
| Edición de config en caliente | `src/tenants.ts:66` | Guardar → reconstruye el prompt sin reiniciar |

**Traducción:** tenemos un motor conversacional bueno y un producto demo-able. No tenemos todavía
una plataforma vendible. La diferencia entre esas dos cosas es la Parte 2.

---

## Parte 1 — Mapa de competidores

Los agrupo en 6 categorías porque compiten con nosotros de formas distintas. Confundirlas es el
error estratégico más caro: contra unos competimos y contra otros NO deberíamos competir.

### Categoría A — Plataformas WhatsApp para PyME (competencia frontal)

#### A.1 — Wati

*El que ya analizamos. Aquí van los datos duros que faltaban.*

| Aspecto | Dato |
|---|---|
| Precio | Growth $59/mes (anual) · Pro $119 · Business $279 |
| Usuarios | Growth: **3 usuarios, sin opción de agregar** · Pro: 5 (+$24/usuario) · Business: 5 (+$69) |
| Sesiones de chatbot | Growth: **1.000/mes** · triggers de automatización: 1.000 / 2.000 / 5.000 |
| Difusión | Growth: 15.000 mensajes/mes · Pro y Business: ilimitado |
| Mensajes | **Aparte**: tarifa de Meta + markup de Wati |
| Reputación | G2/Capterra 4.6–4.7 · **Trustpilot 3.6** |

**Fortalezas:** interfaz limpísima, tutoriales por módulo, difusiones masivas, CRM de contactos,
IA integrada (Astra), Inteligencia CX, anuncios click-to-WhatsApp, asignación de agentes, SMS.

**Debilidades confirmadas por reseñas (no solo por nosotros):**
- **Costo real vs. anunciado:** casos documentados donde la factura real es ~5× el precio de lista.
  Markups por mensaje, cobro por agente, integraciones como extra.
- **Facturación:** usuarios reportan que anuncia mensual pero fuerza anual en el checkout.
- **Soporte:** es la queja #1 en Trustpilot, G2 y Capterra. Growth = solo email 24×5, en inglés y
  portugués, **sin chat en vivo, sin español**.
- **Bot cuadrático:** confirmado. El builder no-code resuelve FAQ y estado de pedido; no conversa.
- **Analítica floja** y techos de automatización al escalar; lag del dashboard.
- Onboarding doloroso: exige número virgen + cuenta de Facebook.

> **Dónde le ganamos:** conversación real, precio predecible, soporte en español, cero construcción
> de bot, sin límite de "sesiones de chatbot".
> **Qué le copiamos:** la interfaz y los tutoriales embebidos. Es su mejor activo y es gratis copiarlo.

#### A.2 — Respond.io

El más fuerte técnicamente de la categoría. ~$79/mes.

- **12+ canales** (WhatsApp, IG, Messenger, TikTok, email, SMS, voz).
- **AI Agent con RAG** sobre base de conocimiento vectorial, arquitectura modular event-driven
  (pueden cambiar de modelo sin tumbar producción — igual que nuestro `getProvider()`).
- **Voice AI** en 30+ idiomas con transferencia en vivo a humano.
- El AI Agent ejecuta acciones: actualizar CRM, etiquetar lead, llamar APIs externas.

> **Realidad:** en capacidades de IA nos llevan ventaja. **No compitamos con ellos de frente.**
> Su debilidad es que son caros, complejos y genéricos: apuntan a mid-market con equipo técnico.
> Un restaurante de Bogotá no los va a implementar.

#### A.3 — Interakt / AiSensy / Zoko / Trengo

- **AiSensy** ~$18–20/mes. El más barato. Optimizado para India; soporte de zona horaria y moneda
  débil fuera de allí.
- **Interakt**: enfoque e-commerce, integración Shopify, carrito abandonado.
- Todos son "inbox + difusión + bot de reglas". Commodities.

> **Lección de precio:** el piso del mercado global está en ~$18–20/mes. Nuestro precio no puede
> ignorar eso, pero tampoco competir ahí (es una carrera al fondo sin IA real).

---

### Categoría B — LatAm y Colombia (nuestra competencia REAL)

Esta es la categoría que importa. Aquí es donde vamos a vender.

#### B.1 — Leadsales (México/Colombia/Perú)

- Desde **$84–97 USD/mes**. Cobra **plan fijo con usuarios incluidos**, no por usuario.
- +10.000 equipos de ventas. Fuerte en México y presente en Colombia.
- Es un **CRM tipo embudo Kanban** sobre WhatsApp, Facebook e Instagram.

> **Debilidad:** es un CRM, no un vendedor. Organiza conversaciones que **un humano** debe atender.
> **Ahí está nuestra grieta:** ellos ordenan el trabajo, nosotros lo hacemos.

#### B.2 — Callbell

- **$15–20 USD por agente/mes.** El más barato de LatAm.
- Multiagente sobre WhatsApp, Messenger, Instagram, Telegram.

> **Debilidad:** cobra por agente, así que escala mal para el negocio; y es solo bandeja, sin IA
> real. **Es el piso de precio en LatAm que debemos tener en cuenta.**

#### B.3 — Botmaker (Argentina, fuerte en Colombia)

**El competidor más peligroso de la región.** Precios públicos:

| Plan | Precio | Conversaciones | Excedente |
|---|---|---|---|
| Standard | $149/mes | 3.000 | $0,07 c/u |
| Scale | $249/mes | 5.000 | $0,06 c/u |
| Pro | $499/mes | 10.000 | $0,05 c/u |
| Enterprise | a medida | ilimitado | — |

- IA generativa real, +20 canales, agentes de IA para WhatsApp, Instagram, email y voz.
- Bots ilimitados en todos los planes.

> **Debilidad:** **$149/mes es un muro para la PyME colombiana.** Está diseñado para empresas
> medianas y grandes con account manager. Un restaurante o una tienda de barrio no entra ahí.
> **Nuestra oportunidad está DEBAJO de Botmaker**, no encima.

#### B.4 — Cliengo, Yalo, Keybe, Auronix, SyncManager

- **Cliengo** (Argentina): chatbot web + WhatsApp, muy orientado a captación de leads.
- **Yalo** (México): IA conversacional para mercados emergentes, **enterprise puro** (distribución,
  consumo masivo). No es nuestro rival: es el techo del mercado.
- **SyncManager**: proveedor oficial de Meta en LatAm (Colombia, México, Chile, Perú, Ecuador).
  Desde **$120 USD/mes** (bot con IA) o **$200/mes** con CRM. Precio directamente comparable.

#### B.5 — El mercado colombiano de precio

Dato importante para fijar tarifa: los chatbots de WhatsApp en Colombia se cotizan entre
**$300 y $5.000+ USD** según nivel de automatización — pero eso es en gran medida **desarrollo a
medida por agencia**, no SaaS. Ahí hay un hueco enorme entre "agencia cara y lenta" y "SaaS barato
pero tonto".

---

### Categoría C — Constructores no-code (compiten por el mismo presupuesto)

| Producto | Precio | Situación 2026 |
|---|---|---|
| **ManyChat** | Free · $14 Essential · $29 Pro · $69 Business | IA **solo desde Pro**, y limitada a respuestas de un paso dentro de un flujo. El plan free bajó de 1.000 contactos a **25**. |
| **Chatfuel** | Desde $39/mes | Se reestructuró en tiers "AI-led" (Fuely Super/Max). Cobra por contactos activos. |
| **Landbot** | Desde $46/mes | Starter: 500 chats, **solo 100 chats con IA**, 2 asientos. |

> **Patrón crítico:** los tres **racionan la IA** — la ponen en planes altos o la limitan por
> cantidad. Es su modelo de negocio, porque la IA les cuesta.
> **Nosotros no tenemos ese problema**: con Groq/Gemini el costo marginal es casi cero, así que
> **podemos dar IA ilimitada en el plan base**. Ese es un golpe comercial que ellos no pueden
> responder sin romper su propio pricing.

---

### Categoría D — AI-native de soporte (el futuro, no nuestro mercado hoy)

| Producto | Precio | Resolución |
|---|---|---|
| **Intercom Fin** | $0,99 **por resolución** ($49/mes base con 50 incluidas) | 76% promedio (líder en benchmarks) |
| **Decagon** | ~$95k–590k USD/año | por conversación |
| **Sierra** | ~$150k/año + $50k–200k implementación | por conversación |

**La lección que sí aplica a nosotros:** el mercado premium se movió a **precio por resultado**.
Fin cobra solo cuando resuelve. Es una idea poderosa y traducible: nosotros podríamos cobrar
**por pedido/reserva cerrada** o **por lead calificado como "hot"**, no por mensaje.

Ese modelo alinea nuestro precio con el ingreso del cliente y es **imposible de igualar para Wati**,
cuyo modelo depende de cobrar por mensaje enviado.

---

### Categoría E — Verticales de restaurante/comercio (nuestro nicho exacto)

- **Foodi**: POS + bot de WhatsApp + IA para restaurantes. Cobra **$350 COP por pedido** vs. el
  25–30% de comisión de Rappi/Didi. Modelo de precio por resultado, ya funcionando en el nicho.
- **Watsi**: agentes de IA para e-commerce LatAm por WhatsApp.
- **Mavibot, Whato, Aurorainbox**: bots de restaurante (pedidos, reservas, seguimiento).

Lo que ya ofrecen y nosotros no:
- **Audio**: el cliente manda nota de voz, la IA transcribe e interpreta. *(Esto es enorme en Colombia.)*
- Sugerencia de complementos (upsell) e interpretación de pedidos complejos.
- Reconocimiento de cliente frecuente y ofertas personalizadas.
- Detección de queja → escalamiento a humano.

> **Aviso serio:** esta categoría es la que más se nos parece y la que más rápido se mueve.
> El argumento "somos generativos" no nos diferencia contra ellos — contra ellos nos diferencia
> la **consola de negocio + calificación de leads + reglas duras**, que ellos no tienen.

---

### Categoría F — Infraestructura (lo que ya resolvimos bien)

- **Meta Cloud API directa** ← *aquí estamos*. Sin markup de intermediario.
- 360dialog, Twilio, Gupshup, Infobip: BSPs. Wati, Interakt y AiSensy se montan sobre ellos.

**Costos reales de Meta (desde el 1 de julio de 2025, por mensaje entregado, no por conversación):**

| Categoría | Costo aprox. |
|---|---|
| Marketing México | ~$0,0305 |
| Marketing Brasil | ~$0,0625 |
| Marketing EE. UU. | ~$0,025 |
| Autenticación | desde ~$0,0014 |
| **Servicio dentro de ventana de 24 h** | **GRATIS** |
| **Entrada por anuncio Click-to-WhatsApp** | **GRATIS por 72 h** |

> **Hallazgo clave para el modelo de negocio:** nuestro caso de uso principal — cliente escribe,
> bot responde — cae **dentro de la ventana de 24 h y por lo tanto NO cuesta nada en Meta**.
> Nuestro único costo variable real es el LLM, y con Groq/Gemini es casi cero.
> **Podemos ofrecer conversaciones ilimitadas donde Wati y Botmaker cobran por conversación.**
> Eso no es un truco de marketing: es una ventaja estructural de costos.

**Embedded Signup / Tech Provider Program** (lo que resuelve el dolor de onboarding de Wati):
- Se crea una Meta App, se aprueba, y el cliente conecta su WhatsApp **desde nuestra web en minutos**
  con "Iniciar sesión con Facebook", sin salir de nuestra aplicación.
- Permite dar de alta hasta **200 clientes por semana** por solución.
- **Esto es exactamente la queja #1 de onboarding de Wati.** Implementarlo es una ventaja directa.

---

## Parte 2 — Qué nos falta (brechas priorizadas)

### 🔴 P0 — Bloqueantes. Sin esto NO se puede vender a un cliente real.

**1. No hay autenticación ni usuarios.**
`/console` está abierta a quien tenga la URL, y `/api/conversation` acepta cualquier `tenantId`
([index.ts:266](../src/index.ts#L266)). Hoy, el dueño del restaurante A puede leer las
conversaciones del cliente B. Falta: login, sesiones, roles (dueño / agente), y aislamiento por
tenant en **todos** los endpoints. Esto además es una infracción a la **Ley 1581 de 2012** (habeas
data): la SIC sanciona esto y aplica aunque el proveedor no esté domiciliado en Colombia.

**2. La base de datos no aguanta producción.**
`data/bot.json` se carga entero en memoria y se reescribe completo en **cada mensaje**
([db.ts:90](../src/db.ts#L90)). Con dos negocios de demo funciona; con veinte clientes reales hay
corrupción por escrituras concurrentes y pérdida de pedidos. Migrar a SQLite o Postgres. La
interfaz de `db.ts` ya está bien aislada, así que el cambio es contenido.

**3. Un solo token de WhatsApp para todos.**
`env.whatsappToken` es global ([whatsapp.ts:21](../src/whatsapp.ts#L21)). Y dar de alta un cliente
exige crear carpetas a mano en `data/tenants/`. **No hay onboarding.** Se necesita: token por
tenant + Embedded Signup + alta autoservicio.

**4. No hay intervención humana (handoff).**
Este es el más grave estratégicamente, porque **contradice nuestra propia tesis**. En
`WATI analisis.txt` escribimos que la idea es que el bot *"ayude al cliente a semi cerrar una venta,
para luego informar rápidamente a un operador para que cierre"*. Pero en el código **no existe
ningún endpoint para que un humano envíe un mensaje**. La consola solo lee. El bot siempre responde
y no se puede pausar. Falta: enviar como humano, pausar el bot por conversación, asignar agente,
y alerta cuando un lead se pone "hot".

**5. Solo entendemos texto.**
El webhook rechaza todo lo que no sea texto ([index.ts:363](../src/index.ts#L363)). En Colombia
**la nota de voz es el mensaje por defecto**. Y no enviamos botones ni listas interactivas, que
Meta soporta (3 botones, listas de 10 ítems) y que suben muchísimo la conversión.

**6. Los webhooks de Meta se procesan sin deduplicar.**
Meta **reintenta** los webhooks. `processWebhook` no guarda el `message.id`
([index.ts:335](../src/index.ts#L335)), así que un reintento genera una segunda respuesta al cliente
y una segunda llamada al LLM. La deduplicación de `tools.ts` protege el pedido, pero no la
conversación. *Bug latente que va a aparecer en producción.*

**7. Sin límite de gasto ni rate limiting.**
`/api/chat` es público y sin límite: cualquiera puede quemarnos la cuota del LLM. Y no hay tope de
consumo de IA por tenant.

### 🟡 P1 — Competitivas. La competencia lo tiene y se nota en la venta.

8. **Difusiones y plantillas.** Es LA función estrella de Wati y no la tenemos. Requiere gestión de
   plantillas HSM, aprobación de Meta, opt-in y respeto de la ventana de 24 h.
9. **CRM de contactos.** Hoy un cliente es solo un `phone`. Sin nombre persistente, etiquetas,
   notas, ni segmentos. Sin esto no hay difusión útil ni fidelización.
10. **Multicanal**: Instagram y Messenger. Wati, Callbell y Leadsales los tienen todos.
11. **Integraciones**: webhooks salientes, Google Sheets, API pública, n8n/Zapier. Wati lo vende como
    argumento central.
12. **Notificar al negocio**: hoy un pedido nuevo solo aparece si alguien mira la pantalla. Falta
    sonido, push, correo o WhatsApp al dueño.
13. **Métricas de operación**: tiempo de respuesta, tasa de resolución sin humano, costo por
    conversación, embudo. Tenemos las de venta, faltan las de servicio.
14. **Resiliencia**: si el LLM o Meta fallan, el mensaje se pierde. Falta cola con reintentos.

### 🟢 P2 — Diferenciadoras. Aquí es donde se gana, no se empata.

15. **Cumplimiento Ley 1581** como producto: política de tratamiento, consentimiento registrado,
    exportar y borrar datos de un titular. **Ningún competidor global lo vende explícitamente para
    Colombia.** Es a la vez requisito legal y argumento de venta.
16. **Audio → texto** (nota de voz). El desbloqueo de UX más grande para el mercado colombiano.
17. **Exportación total de datos** — nuestro argumento anti-lock-in contra Wati.
18. **Aprendizaje del negocio**: reportar al dueño qué le preguntaron y el bot no supo responder,
    qué productos piden y no están en el menú. Convierte el bot en consultor.
19. **Precio por resultado** (por pedido cerrado o lead "hot"), estilo Fin/Foodi.

---

## Parte 3 — Ventajas que SÍ podemos poseer

Cinco de estas ya existen en el código. Es importante distinguir lo que tenemos de lo que soñamos.

| # | Ventaja | Estado | Por qué la competencia no la copia fácil |
|---|---|---|---|
| 1 | **Conversación generativa real** | ✅ Ya | Wati, ManyChat, Interakt, Landbot tienen árboles de reglas. Cambiarlos implica rehacer su producto. |
| 2 | **Cero construcción de bot** | ✅ Ya | Llenamos un formulario y el prompt se reconstruye solo ([tenants.ts:66](../src/tenants.ts#L66)). Wati y ManyChat **venden** el editor de flujos: quitarlo es matar su propuesta. |
| 3 | **IA ilimitada en el plan base** | ✅ Posible | ManyChat, Landbot y Chatfuel racionan la IA porque les cuesta. Con Groq/Gemini + ventana de 24 h gratis de Meta, nuestro costo marginal es ~0. **Ventaja estructural de costos.** |
| 4 | **Reglas duras anti-alucinación** | ✅ Ya | Horario cerrado, dirección incompleta, pedido duplicado ([tools.ts](../src/tools.ts)). Un bot genérico no sabe que en Colombia una dirección necesita placa. Esto es conocimiento de dominio, no tecnología. |
| 5 | **Calificación de leads con IA + dato real** | ✅ Ya | Wati lo tiene solo en planes altos (Inteligencia CX). Nosotros de base, y sin gastar IA cuando ya compró ([lead.ts:87](../src/lead.ts#L87)). |
| 6 | **Sin lock-in: datos y número portables** | ✅ Arquitectura | Wati vive de la fricción de salida. Nosotros usamos la Cloud API directa y datos locales por tenant. |
| 7 | **Español colombiano + soporte local** | 🔜 | La queja #1 de Wati es el soporte, en inglés y portugués, sin chat en vivo. |
| 8 | **Precio en COP, sin markup por mensaje** | 🔜 | Wati factura ~5× el precio de lista por markups. Nosotros no tenemos intermediario que marcar. |
| 9 | **Cumplimiento colombiano de datos** | 🔜 | Requisito legal que nadie está vendiendo como feature. |
| 10 | **Precio por resultado** | 🔜 | Wati no puede: su ingreso depende de cobrar por mensaje. |

---

## Parte 4 — Conclusión

### 1. Estamos compitiendo en la categoría equivocada

Si nos posicionamos como "plataforma de WhatsApp", perdemos. Wati, Respond.io y Botmaker tienen
cinco años y decenas de ingenieros de ventaja en difusiones, canales, integraciones y CRM. Esa
carrera ya está corrida.

La categoría correcta es más angosta y la tenemos casi ganada:

> **Un vendedor de IA que atiende, cotiza y semi-cierra ventas por WhatsApp para restaurantes y
> tiendas en Colombia — sin que el dueño tenga que construir nada.**

### 2. Nuestro hueco de mercado es real y está vacío

```
Callbell $15-20/agente ──── bandeja, sin IA
AiSensy  ~$18-20      ──── bot de reglas, hecho para India
        ⬇  ← AQUÍ. Nadie: IA real + vertical + Colombia + precio PyME
Wati     $59-119      ──── bot cuadrático, soporte en inglés, factura ~5× lo anunciado
SyncManager $120      ──── IA, pero genérico
Botmaker $149-499     ──── IA buena, pero fuera del alcance de la PyME
Yalo / Sierra         ──── enterprise, seis cifras
```

Entre **$20 y $59** no hay nadie que ofrezca conversación generativa real. Nuestra ventaja de
costos (ventana de 24 h gratis + LLM barato + sin BSP intermediario) nos permite vivir ahí con
margen. Ningún competidor puede bajar a ese precio sin romper su propio modelo.

### 3. Las tres cosas que decidirán si esto se vende

Todo lo demás es secundario frente a estas:

1. **El handoff a humano.** Es nuestra propia tesis de producto y no está construido. Un bot que no
   sabe entregarle la venta a una persona no es un vendedor: es un contestador.
2. **El onboarding en minutos (Embedded Signup).** Es la queja #1 de Wati y la barrera real de
   adopción. Quien resuelva esto en Colombia gana el mercado PyME.
3. **Seguridad y aislamiento por tenant.** No es opcional: sin login no hay primer cliente, y con
   la Ley 1581 encima, tampoco hay empresa.

### 4. Lo que copiamos sin pudor

De Wati: **la interfaz y los tutoriales embebidos**. Es su mejor activo, es lo que hace que un
usuario nuevo aprenda solo, y no cuesta nada replicarlo.

De Fin y Foodi: **el precio por resultado**. Cobrar por pedido cerrado o lead calificado nos alinea
con el ingreso del cliente y es la única jugada de precio que Wati estructuralmente no puede seguir.

### 5. Orden sugerido de trabajo

**Ahora (para tener un cliente):** P0 completo — login y aislamiento, base de datos real, handoff a
humano, deduplicación de webhooks.
**Después (para tener diez):** Embedded Signup, contactos y etiquetas, audio, notificaciones.
**Luego (para defender el terreno):** difusiones con plantillas, multicanal, cumplimiento Ley 1581
como feature, precio por resultado.

---

## Fuentes

- [Wati Pricing 2026 — Chatarmin](https://chatarmin.com/en/blog/wati-pricing) · [Flowcart](https://www.flowcart.ai/blog/wati-pricing) · [SetSmart](https://setsmart.io/blog/wati-pricing)
- [Wati Reviews 2026 — Flowcart](https://www.flowcart.ai/blog/wati-reviews) · [G2](https://www.g2.com/products/wati/reviews) · [Capterra](https://www.capterra.com/p/204314/WATI/reviews/)
- [Wati vs Respond.io](https://respond.io/blog/wati-vs-respondio) · [Cómo funcionan los AI Agents de Respond.io](https://respond.io/blog/how-respondio-ai-agents-work) · [Voice AI Agents](https://respond.io/blog/respond-io-voice-ai-agents)
- [Alternativas a AiSensy — d-dat](https://d-dat.com/en/comparisons/aisensy-alternatives) · [Mejores chatbots de WhatsApp 2026](https://respond.io/blog/best-whatsapp-chatbots)
- [Precios de Botmaker](https://botmaker.com/es/precios) · [Botmaker](https://botmaker.com/es/) · [Cliengo](https://www.cliengo.com/) · [Yalo](https://en.wikipedia.org/wiki/Yalo_(company))
- [Leadsales precios 2026 — Elige tu CRM](https://www.eligetucrm.com/blog/leadsales-precios-2026) · [Callbell — Elige tu CRM](https://www.eligetucrm.com/crm/callbell) · [Mejores CRM para WhatsApp](https://leadsales.io/blog/los-mejores-crm-para-whatsapp/)
- [Precios de chatbot WhatsApp en Colombia](https://www.consolidaciondigital.com/blog/inteligencia-artificial/cuanto-cuesta-chatbot-whatsapp-colombia) · [Ventiva](https://ventivaia.com/cuanto-cuesta-chatbot-whatsapp-colombia/) · [SyncManager](https://www.sync-manager.com/chatbot-whatsapp.php) · [Foodi](https://www.foodi.restaurant/)
- [ManyChat Pricing 2026 — Featurebase](https://www.featurebase.app/blog/manychat-pricing) · [SetSmart](https://setsmart.io/blog/manychat-pricing) · [Chatfuel vs ManyChat — Typebot](https://typebot.io/blog/chatfuel-vs-manychat)
- [Comparativa de precios de agentes de IA — Fin](https://fin.ai/learn/ai-customer-service-agent-pricing-comparison) · [Decagon vs Sierra vs Fin — Superkind](https://superkind.ai/blog/ai-customer-support-agents)
- [Precios de WhatsApp Business API 2026 — Chatarmin](https://chatarmin.com/en/blog/whats-app-api-pricing) · [Actualización de julio 2025 — YCloud](https://www.ycloud.com/blog/whatsapp-api-pricing-update) · [Blueticks](https://blueticks.co/blog/whatsapp-business-api-pricing-2026)
- [Tech Provider Program — Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/get-started-for-tech-providers) · [Twilio](https://www.twilio.com/docs/whatsapp/isv/tech-provider-program) · [360dialog](https://docs.360dialog.com/partner/get-started/tech-provider-program)
- [Límites de mensajería — Meta](https://developers.facebook.com/docs/whatsapp/messaging-limits/) · [Mensajes interactivos](https://developers.cm.com/messaging/docs/whatsapp-interactive-messages) · [WhatsApp Flows](https://chakrahq.com/article/whatsapp-flows-business-api-explained/)
- [Ley 1581 de 2012 — Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981) · [SIC ordena a WhatsApp cumplir la Ley 1581](https://www.sic.gov.co/boletin/juridico/habeas-data/whatsapp-llc-debe-cumplir-la-ley-1581-de-2012-por-realizar-actividades-de-tratamientos-datos-en-colombia)
