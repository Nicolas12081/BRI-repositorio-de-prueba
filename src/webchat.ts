import type { Tenant } from "./tenants";

/**
 * Pagina de chat en el navegador para probar el bot en tiempo real (sin WhatsApp).
 * Sirve tambien como demo del SaaS. Habla con el endpoint POST /api/chat.
 */
export function chatPage(tenants: Tenant[]): string {
  const options = tenants
    .map((t) => `<option value="${t.id}">${escapeHtml(t.business.nombre)}</option>`)
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chat de prueba</title>
<style>
  :root { --verde:#128c7e; --verde2:#075e54; --burbuja-yo:#d9fdd3; --fondo:#e5ddd5; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#d1d7db; }
  .app { max-width: 460px; margin: 0 auto; height: 100dvh; display:flex; flex-direction:column; background:var(--fondo); }
  header { background:var(--verde2); color:#fff; padding:10px 14px; display:flex; align-items:center; gap:10px; }
  header .avatar { width:38px; height:38px; border-radius:50%; background:var(--verde); display:flex; align-items:center; justify-content:center; font-size:18px; }
  header .info { flex:1; min-width:0; }
  header .info b { font-size:15px; display:block; }
  header .info span { font-size:12px; opacity:.85; }
  header select { background:rgba(255,255,255,.15); color:#fff; border:1px solid rgba(255,255,255,.3); border-radius:6px; padding:4px 6px; font-size:12px; }
  header select option { color:#000; }
  header button.reset { background:transparent; border:none; color:#fff; font-size:18px; cursor:pointer; opacity:.85; }
  .chat { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:8px; }
  .msg { max-width:80%; padding:7px 10px; border-radius:8px; font-size:14px; line-height:1.35; white-space:pre-wrap; word-wrap:break-word; box-shadow:0 1px .5px rgba(0,0,0,.13); }
  .msg.yo { align-self:flex-end; background:var(--burbuja-yo); border-top-right-radius:2px; }
  .msg.bot { align-self:flex-start; background:#fff; border-top-left-radius:2px; }
  .msg.img { padding:4px; }
  .msg.img img { display:block; max-width:100%; border-radius:6px; }
  .msg.img .cap { font-size:12px; color:#333; padding:4px 4px 2px; }
  .msg small { display:block; font-size:10px; color:#888; text-align:right; margin-top:2px; }
  .typing { align-self:flex-start; color:#667; font-size:13px; font-style:italic; padding:4px 10px; }
  form { display:flex; gap:8px; padding:10px; background:#f0f0f0; }
  input#text { flex:1; border:none; border-radius:20px; padding:10px 14px; font-size:14px; outline:none; }
  button#send { border:none; background:var(--verde); color:#fff; width:44px; height:44px; border-radius:50%; font-size:18px; cursor:pointer; }
  button#send:disabled { opacity:.5; cursor:default; }
</style>
</head>
<body>
<div class="app">
  <header>
    <div class="avatar">🤖</div>
    <div class="info">
      <b id="bizName">Bot</b>
      <span>en línea · prueba</span>
    </div>
    <select id="tenant" title="Elegir negocio">${options}</select>
    <button class="reset" id="reset" title="Reiniciar conversación">⟳</button>
  </header>
  <div class="chat" id="chat"></div>
  <form id="form">
    <input id="text" autocomplete="off" placeholder="Escribe un mensaje..." />
    <button id="send" type="submit">➤</button>
  </form>
</div>
<script>
  const chat = document.getElementById('chat');
  const form = document.getElementById('form');
  const input = document.getElementById('text');
  const sendBtn = document.getElementById('send');
  const tenantSel = document.getElementById('tenant');
  const bizName = document.getElementById('bizName');
  const resetBtn = document.getElementById('reset');

  let phone = 'web-' + Math.random().toString(36).slice(2, 10);

  function hora() {
    return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  function addMsg(text, who) {
    const div = document.createElement('div');
    div.className = 'msg ' + who;
    div.textContent = text;
    const t = document.createElement('small');
    t.textContent = hora();
    div.appendChild(t);
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }
  function addImage(url, caption) {
    const div = document.createElement('div');
    div.className = 'msg bot img';
    const img = document.createElement('img');
    img.src = url;
    img.alt = caption || '';
    img.loading = 'lazy';
    div.appendChild(img);
    if (caption) {
      const cap = document.createElement('div');
      cap.className = 'cap';
      cap.textContent = caption;
      div.appendChild(cap);
    }
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }
  function setBiz() {
    bizName.textContent = tenantSel.options[tenantSel.selectedIndex].text;
  }
  function reset() {
    chat.innerHTML = '';
    phone = 'web-' + Math.random().toString(36).slice(2, 10);
    addMsg('¡Hola! Escríbeme como si fueras un cliente. 😊', 'bot');
  }
  tenantSel.addEventListener('change', () => { setBiz(); reset(); });
  resetBtn.addEventListener('click', reset);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, 'yo');
    input.value = '';
    sendBtn.disabled = true;

    const typing = document.createElement('div');
    typing.className = 'typing';
    typing.textContent = 'escribiendo...';
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenantSel.value, phone, text }),
        signal: AbortSignal.timeout(60000)
      });
      const data = await res.json();
      typing.remove();
      if (data.reply) addMsg(data.reply, 'bot');
      (data.images || []).forEach((im) => addImage(im.url, im.caption));
      if (!data.reply && !(data.images || []).length) addMsg(data.error || 'Sin respuesta.', 'bot');
    } catch (err) {
      typing.remove();
      addMsg(
        err && err.name === 'TimeoutError'
          ? 'El modelo está tardando mucho (posible límite gratuito de Groq). Intenta de nuevo en unos segundos.'
          : 'Error de conexión. ¿El servidor sigue corriendo?',
        'bot'
      );
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  });

  setBiz();
  reset();
  input.focus();
</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}
