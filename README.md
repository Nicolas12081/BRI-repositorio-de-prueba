# Chatbot de WhatsApp con Claude (project1)

Chatbot **generativo** para WhatsApp que responde como una persona real usando **Claude API**
y la **WhatsApp Cloud API** oficial de Meta. Puede:

- Responder preguntas del negocio (horario, direccion, medios de pago)
- Mostrar el menu / catalogo con precios reales
- Tomar pedidos a domicilio (los guarda en la base de datos)
- Agendar reservas
- Conversar de forma natural sobre lo que le pregunten

Es una app **independiente** (no depende de Vesta).

## Requisitos

- Node.js 18 o superior
- Una API key de Anthropic (Claude)
- Una app de WhatsApp en Meta (cuenta de Meta Business + numero dedicado)

## 1. Instalar

```bash
cd "chat bot project1"
npm install
```

## 2. Configurar

Copia `.env.example` a `.env` y llena los valores:

```bash
cp .env.example .env
```

- `ANTHROPIC_API_KEY`: tu key de https://console.anthropic.com
- `ANTHROPIC_MODEL`: por defecto `claude-opus-4-8` (maxima calidad). Para bajar costo:
  `claude-sonnet-4-6` (buen balance) o `claude-haiku-4-5` (mas barato/rapido).
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`: los da Meta en la config de tu app.
- `WHATSAPP_VERIFY_TOKEN`: un texto secreto que TU inventas (lo pondras igual en Meta).

## 3. Personalizar el negocio

Edita los archivos en `data/`:

- `data/business.json`: nombre, tipo (`restaurante` o `tienda`), horario, direccion,
  medios de pago, costo de domicilio y la **personalidad** del bot.
- `data/menu.json`: tu menu / catalogo con nombres, precios y descripciones.

## Probar YA sin WhatsApp (recomendado primero)

Puedes conversar con el bot desde la terminal usando solo tu `ANTHROPIC_API_KEY`
(no necesitas Meta ni WhatsApp todavia):

```bash
npm run chat
```

Escribe como si fueras un cliente ("que tienen de comer?", "quiero una bandeja paisa
a domicilio", "quiero reservar mesa para 4 el sabado"). Escribe `salir` para terminar.
Los pedidos y reservas que haga quedan guardados y se ven en el panel.

## Elegir el "cerebro" (proveedor de IA)

El modelo que responde es intercambiable con la variable `LLM_PROVIDER` en `.env`:

| Proveedor | Costo | Como conseguir la key |
|-----------|-------|-----------------------|
| `groq` | Gratis | https://console.groq.com/keys (empieza por `gsk_`) |
| `gemini` | Nivel gratis | https://aistudio.google.com/apikey |
| `anthropic` | Pago por uso, mejor calidad | https://console.anthropic.com |
| `mock` | Sin costo, sin IA (reglas) | no requiere key |

La logica del bot (herramientas, precios, pedidos) es la misma con cualquiera; solo
cambia la calidad/costo del modelo. El codigo vive en `src/llm/` (un archivo por proveedor).

## Probar YA sin gastar (Groq gratis o mock)

Con `LLM_PROVIDER=groq` y tu `GROQ_API_KEY`, prueba una conversacion completa:

```bash
npx tsx smoke-test.ts
```

O sin ninguna key, con respuestas simuladas por palabras clave (solo valida la plomeria):

```bash
LLM_PROVIDER=mock npx tsx smoke-test.ts
```

## Probar en el navegador (chat en vivo, sin WhatsApp)

La forma mas rapida de probar el bot como cliente, en tiempo real, sin Meta:

```bash
npm run dev
```

Abre `http://localhost:3000/chat`. Es un chat estilo WhatsApp donde puedes elegir el
negocio (arriba a la derecha) y conversar. Sirve tambien como demo para clientes.
El servidor arranca aunque no tengas credenciales de WhatsApp (solo se desactiva ese envio).

## 4. Correr en desarrollo

```bash
npm run dev
```

El servidor queda en `http://localhost:3000`. El webhook es `/webhook`.
El panel para ver pedidos y reservas queda en `http://localhost:3000/admin`.

Para que Meta pueda alcanzarlo necesitas una URL publica. En desarrollo usa **ngrok**:

```bash
ngrok http 3000
```

Copia la URL `https://....ngrok.io`.

## 5. Conectar el webhook en Meta

1. En tu app de Meta > WhatsApp > Configuration.
2. Callback URL: `https://TU-URL-NGROK/webhook`
3. Verify token: el mismo valor de `WHATSAPP_VERIFY_TOKEN`.
4. Suscribete al campo `messages`.

Meta hara un GET de verificacion; si el token coincide veras "Verificado correctamente" en consola.

## 6. Probar

Escribe al numero de WhatsApp del negocio. El bot respondera generativamente.

## Produccion

```bash
npm run build
npm start
```

Despliega en un servidor con URL publica estable (Railway, Render, Fly.io, un VPS, etc.)
y usa esa URL como Callback URL en Meta (sin ngrok).

## Multi-negocio (multi-tenant)

El bot atiende a varios negocios a la vez. Cada uno vive en su carpeta:

```
data/tenants/<id-del-negocio>/
  business.json   Datos y personalidad del negocio (incluye whatsapp_phone_number_id)
  menu.json       Su menu / catalogo
```

- Cuando llega un mensaje, Meta incluye el `phone_number_id` del numero que lo
  recibio; el bot usa eso para cargar el negocio correcto y responder como el.
- La memoria, los pedidos y las reservas quedan separados por negocio.
- Panel: `/admin` lista los negocios; `/admin/<id>` muestra los pedidos/reservas de uno.

Para agregar un negocio: crea `data/tenants/<id>/` con sus dos JSON y reinicia.
Para probar uno por terminal: `npx tsx smoke-test.ts <id>` o `npx tsx src/chat-cli.ts <id>`.

### Fotos de productos

Cada item de `menu.json` puede tener un campo `imagen`. El bot la envia cuando el
cliente pide ver una foto. Dos formas:

- **URL publica**: `"imagen": "https://misitio.com/foto.jpg"` (funciona en web y WhatsApp).
- **Archivo local**: guarda la foto en `data/tenants/<id>/img/` y pon solo el nombre:
  `"imagen": "bandeja.jpg"`. Se sirve en `/media/<id>/bandeja.jpg`. Para que WhatsApp
  la alcance, define `PUBLIC_BASE_URL` en `.env` (ej: la URL del tunel).

## Estructura

```
src/
  index.ts     Servidor Express + webhook (rutea por negocio) + panel /admin
  chat-cli.ts  Modo de prueba por terminal (npx tsx src/chat-cli.ts <id>)
  whatsapp.ts  Envio de mensajes por Cloud API (desde el numero del negocio)
  claude.ts    Bucle del agente (memoria por negocio + cliente), agnostico al proveedor
  tools.ts     Herramientas: menu, pedido, reserva, info (con contexto de negocio)
  prompt.ts    Construccion del system prompt por negocio (personalidad)
  tenants.ts   Carga de negocios y ruteo por phone_number_id
  db.ts        Almacenamiento JSON: conversaciones, pedidos, reservas (por tenant)
  data.ts      Tipos y utilidades (formatMoney, findMenuItem)
  env.ts       Variables de entorno (incluye LLM_PROVIDER)
  llm/         Proveedores de IA intercambiables (groq, gemini, anthropic, mock)
data/
  tenants/<id>/business.json  Config de cada negocio
  tenants/<id>/menu.json      Menu / catalogo de cada negocio
  bot.json                    Datos guardados: se crea solo (por tenant)
```

## Notas y siguientes pasos

- Multi-negocio ya funciona: los negocios se cargan de `data/tenants/` y se enrutan por
  el `phone_number_id` del webhook. Un siguiente paso es mover esa config a base de datos
  y un panel donde cada cliente edite su info y numero.
- Los pedidos, reservas y conversaciones quedan en `data/bot.json`, cada uno con su tenantId.
- El bot recuerda los ultimos ~20 mensajes de cada cliente (por negocio).
- Para conectar los numeros de varios clientes en Meta necesitas registrarte como
  Tech Provider / BSP (Business Solution Provider).
