/**
 * Consola de Bri — reproduccion FIEL del diseno oficial ("tu chatbot, tu aliado"),
 * en HTML/CSS/JS real y conectada al backend (/api/*).
 *
 * Pantalla principal (Bandeja + Chat + Calificacion IA) reproducida con el markup
 * y estilos del diseno original. Vistas Panel de analisis, Agente IA y Conexion
 * funcionales. Contactos/Campanas/Ayuda/Buscar = "proximamente".
 */
export function consolePage(): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bri · Consola</title>
<link rel="icon" href="/assets/bri-mark-color.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@500;600;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:'Nunito Sans',system-ui,sans-serif;color:#0f172a;background:#f5f6f8}
  h1,h2,h3,.brand{font-family:'Comfortaa',sans-serif}
  ::-webkit-scrollbar{width:8px;height:8px}
  ::-webkit-scrollbar-thumb{background:#d5d9e2;border-radius:5px}
  a{color:#d94d00}
  @keyframes tdot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
  .inbox-row:hover{background:#eef0f5 !important}
  .nav-item:hover{background:#f4f5f8}
  .nav-item{display:flex;align-items:center;gap:11px;padding:9px 11px;border-radius:10px;font-size:13.5px;font-weight:600;color:#475569;cursor:pointer}
  .nav-item.on{background:#fdeee6;color:#d94d00;font-weight:700}
  input,button{font-family:inherit}
</style>
</head>
<body>
<div style="display:flex;height:100vh;width:100%;min-width:1120px;overflow:hidden">

  <!-- ============ NAV ============ -->
  <div style="width:218px;flex:none;background:#fbfbfd;border-right:1px solid #eceef3;display:flex;flex-direction:column;padding:14px 10px 12px;z-index:60">
    <div style="display:flex;flex-direction:column;gap:3px;padding:4px 10px 14px">
      <img src="/assets/bri-mark-color.png" alt="bri" style="height:34px;width:auto;align-self:flex-start">
      <span style="font-size:9.5px;font-weight:600;color:#8f83ad;letter-spacing:.02em">tu chatbot, tu aliado</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:2px">
      <div class="nav-item on" id="navChat">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-2.9-.4-4.1-1L3 20l1.1-4.3A8.5 8.5 0 1 1 21 11.5z"></path><path d="M8.5 10.5h7M8.5 13.5h4"></path></svg>
        <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Bandeja de entrada</span>
        <span id="navBadge" style="display:none;font-size:11px;font-weight:800;color:#fff;background:#fd5a07;min-width:20px;height:20px;border-radius:20px;align-items:center;justify-content:center;padding:0 5px">0</span>
      </div>
      <div class="nav-item" id="navPanel">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"></path></svg>
        <span style="flex:1">Panel de análisis</span>
      </div>
      <div class="nav-item" id="navAgente">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H13L13 2z"></path></svg>
        <span style="flex:1">Agente IA</span>
      </div>
      <div class="nav-item" id="navContacts">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"></path></svg>
        <span style="flex:1">Contactos</span>
      </div>
      <div class="nav-item" id="navCampanas">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
        <span style="flex:1">Campañas</span>
      </div>
    </div>
    <div style="height:1px;background:#eceef3;margin:12px 4px"></div>
    <div style="display:flex;flex-direction:column;gap:2px">
      <div class="nav-item" id="navAyuda">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
        <span style="flex:1">Obtener ayuda</span>
      </div>
      <div class="nav-item" id="navBuscar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path></svg>
        <span style="flex:1">Buscar</span>
      </div>
      <div class="nav-item" id="navAjustes">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path></svg>
        <span style="flex:1">Ajustes</span><span id="waDot" style="display:none;width:8px;height:8px;border-radius:50%;background:#22c55e"></span>
      </div>
    </div>
    <div style="margin-top:auto;display:flex;align-items:center;gap:10px;padding:10px 8px;border-top:1px solid #eceef3">
      <div style="position:relative;flex:none">
        <div style="width:36px;height:36px;border-radius:50%;background:#c7cdd9;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px">TU</div>
        <span style="position:absolute;left:-1px;top:-1px;width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid #fbfbfd"></span>
      </div>
      <div style="min-width:0;line-height:1.25">
        <div style="font-size:13px;font-weight:700;color:#1f2937">Tu negocio</div>
        <select id="tenant" style="border:none;background:transparent;font-size:11px;color:#94a3b8;font-family:inherit;padding:0;max-width:130px;cursor:pointer"></select>
      </div>
    </div>
  </div>

  <!-- ============ VISTA CHAT (bandeja + chat + calificacion) ============ -->
  <div id="viewChat" style="display:flex;flex:1;min-width:0">
    <!-- inbox -->
    <div style="width:clamp(250px,24vw,296px);flex:none;background:#f6f6f9;border-right:1px solid #eceef3;display:flex;flex-direction:column">
      <div style="padding:18px 18px 12px;display:flex;align-items:center;gap:10px">
        <span class="brand" style="font-size:15px;font-weight:700;color:#1f2937">Bandeja de entrada</span>
        <div style="margin-left:auto;display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;color:#15803d;background:#e8f8ee;border:1px solid #c6ecd4;padding:4px 10px;border-radius:20px"><span style="width:7px;height:7px;border-radius:50%;background:#22c55e"></span>activo</div>
      </div>
      <div style="padding:0 14px 12px;display:flex;gap:7px">
        <div style="flex:1;background:#fff;border:1px solid #e7e9f0;border-radius:11px;padding:9px 8px 8px;text-align:center"><div id="sHot" style="font-size:18px;font-weight:800;line-height:1">0</div><div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-top:5px"><span style="width:6px;height:6px;border-radius:50%;background:#16a34a"></span><span style="font-size:9.5px;font-weight:700;color:#8b93a5">CASI SEG.</span></div></div>
        <div style="flex:1;background:#fff;border:1px solid #e7e9f0;border-radius:11px;padding:9px 8px 8px;text-align:center"><div id="sWarm" style="font-size:18px;font-weight:800;line-height:1">0</div><div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-top:5px"><span style="width:6px;height:6px;border-radius:50%;background:#f59e0b"></span><span style="font-size:9.5px;font-weight:700;color:#8b93a5">TAL VEZ</span></div></div>
        <div style="flex:1;background:#fff;border:1px solid #e7e9f0;border-radius:11px;padding:9px 8px 8px;text-align:center"><div id="sCold" style="font-size:18px;font-weight:800;line-height:1">0</div><div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-top:5px"><span style="width:6px;height:6px;border-radius:50%;background:#94a3b8"></span><span style="font-size:9.5px;font-weight:700;color:#8b93a5">POCO PROB.</span></div></div>
      </div>
      <div style="flex:1;overflow-y:auto;padding:2px 10px 14px" id="list"></div>
      <div style="padding:0 14px 14px"><button id="scoreAll" style="width:100%;border:1px solid #e2e5ec;background:#fff;color:#d94d00;padding:9px;border-radius:10px;font-size:12.5px;font-weight:700;cursor:pointer">Calificar</button></div>
    </div>

    <!-- chat -->
    <div style="flex:1;display:flex;flex-direction:column;min-width:0;background:#fff">
      <div style="padding:14px 22px;border-bottom:1px solid #eef0f4;display:flex;align-items:center;gap:12px;overflow:hidden">
        <div id="hAv" style="width:40px;height:40px;flex:none;border-radius:11px;background:#eef0f4;color:#475569;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px">–</div>
        <div style="line-height:1.3;min-width:0;flex:1">
          <div class="brand" id="hName" style="font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Selecciona una conversación</div>
          <div style="display:flex;align-items:center;gap:7px;margin-top:3px"><span id="hSub" style="font-size:12px;color:#64748b">o escribe abajo para probar al bot</span><span id="hCh"></span></div>
        </div>
        <div id="hBadge"></div>
      </div>
      <div id="msgs" style="flex:1;overflow-y:auto;padding:22px 22px 8px;background:#f8f9fb;display:flex;flex-direction:column;gap:11px"></div>
      <div style="padding:12px 20px 18px;border-top:1px solid #eef0f4">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:19px;color:#94a3b8">📎</span>
          <input id="text" autocomplete="off" placeholder="Escribe como el cliente para probar el bot…" style="flex:1;border:1px solid #e2e5ec;background:#f8f9fb;border-radius:12px;padding:12px 15px;font-size:13.5px;outline:none;color:#0f172a">
          <div id="send" style="width:42px;height:42px;flex:none;border-radius:12px;background:#fd5a07;display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;cursor:pointer">➤</div>
        </div>
      </div>
    </div>

    <!-- calificacion -->
    <div style="width:clamp(264px,25vw,312px);flex:none;background:#fff;border-left:1px solid #eef0f4;display:flex;flex-direction:column;overflow-y:auto">
      <div style="padding:20px 20px 8px;font-size:13px;font-weight:700;color:#334155;letter-spacing:.3px;text-transform:uppercase">Calificación IA</div>
      <div id="pQual" style="flex:1"></div>
    </div>
  </div>

  <!-- otras vistas -->
  <div id="viewPanel" style="display:none;flex:1;min-width:0;background:#f5f6f8;overflow-y:auto"><div id="an" style="padding:24px 28px"></div></div>
  <div id="viewCfg" style="display:none;flex:1;min-width:0;background:#f5f6f8;overflow-y:auto"><div id="cfg" style="padding:24px 28px;max-width:900px"></div></div>
  <div id="viewWa" style="display:none;flex:1;min-width:0;background:#f5f6f8;overflow-y:auto"><div id="wa" style="padding:24px 28px;max-width:760px"></div></div>
  <div id="viewSoon" style="display:none;flex:1;min-width:0;background:#f5f6f8;display:none;align-items:center;justify-content:center">
    <div style="text-align:center;color:#64748b"><div style="font-size:44px">🚧</div><div class="brand" id="soonTitle" style="font-size:20px;font-weight:700;color:#1f2937;margin:10px 0 6px">Próximamente</div><div style="font-size:13px">Parte del plan de Bri, aún no disponible.</div></div>
  </div>
</div>

<script>
  const $ = (id) => document.getElementById(id);
  let tenantId = null, phone = null, moneda = "COP", openMsgCount = 0;
  const money = (n) => "$" + Number(n).toLocaleString("es-CO") + " " + moneda;
  const hora = (ts) => new Date(ts).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  const iniciales = (p) => String(p).replace(/[^a-zA-Z0-9]/g, "").slice(-2).toUpperCase() || "??";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const jget = async (u) => (await fetch(u)).json();

  // canal segun el telefono: web-... = chat web; si no, WhatsApp
  const esWeb = (p) => String(p).startsWith("web-");
  function chBadge(p) {
    return esWeb(p)
      ? '<span style="font-size:9.5px;font-weight:800;color:#1d4ed8;background:#e5edff;padding:2px 7px;border-radius:5px">WEB</span>'
      : '<span style="font-size:9.5px;font-weight:800;color:#15803d;background:#e8f8ee;padding:2px 7px;border-radius:5px">WHATSAPP</span>';
  }

  const META = {
    hot:  { label: "Casi seguro",   dot: "#16a34a", av: "background:#e8f8ee;color:#15803d" },
    warm: { label: "Tal vez",       dot: "#f59e0b", av: "background:#fef6e7;color:#b45309" },
    cold: { label: "Poco probable", dot: "#94a3b8", av: "background:#eef0f4;color:#64748b" },
    none: { label: "Sin calificar", dot: "#94a3b8", av: "background:#eef0f4;color:#64748b" }
  };

  async function loadTenants(keep) {
    const ts = await jget("/api/tenants");
    $("tenant").innerHTML = ts.map(t => '<option value="' + t.id + '">' + esc(t.nombre) + '</option>').join("");
    tenantId = keep || (ts[0] && ts[0].id);
    $("tenant").value = tenantId;
    await loadInbox();
  }

  let inbox = [];
  async function loadInbox() {
    if (!tenantId) return;
    const d = await jget("/api/conversations?tenantId=" + encodeURIComponent(tenantId));
    $("sHot").textContent = d.totales.hot; $("sWarm").textContent = d.totales.warm; $("sCold").textContent = d.totales.cold;
    const nb = d.totales.hot; $("navBadge").style.display = nb ? "flex" : "none"; $("navBadge").textContent = nb;
    inbox = d.conversaciones || [];
    let html = "";
    ["hot","warm","cold","none"].forEach(k => {
      const cs = inbox.filter(c => (c.bucket || "none") === k);
      if (!cs.length) return;
      const m = META[k];
      html += '<div style="margin-top:14px"><div style="display:flex;align-items:center;gap:8px;padding:4px 8px 9px">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:' + m.dot + '"></span>' +
        '<span style="font-size:10.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#6b7280">' + m.label + '</span>' +
        '<span style="flex:1;height:1px;background:#e7e9f0"></span>' +
        '<span style="font-size:10.5px;font-weight:700;color:#8b93a5;background:#fff;border:1px solid #e7e9f0;padding:1px 8px;border-radius:10px">' + cs.length + '</span></div>';
      html += cs.map(c => {
        const on = c.phone === phone;
        return '<div class="inbox-row" data-p="' + encodeURIComponent(c.phone) + '" style="display:flex;gap:11px;align-items:center;padding:10px 8px;border-radius:12px;cursor:pointer;' + (on ? 'background:#eef0f5;' : '') + '">' +
          '<div style="width:38px;height:38px;flex:none;border-radius:12px;' + m.av + ';display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px">' + iniciales(c.phone) + '</div>' +
          '<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px"><span style="font-size:13px;font-weight:700;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(c.phone) + '</span>' + chBadge(c.phone) + '</div>' +
          '<div style="font-size:11.5px;color:#8b93a5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">' + esc(c.lastMessage || "") + '</div></div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex:none"><span style="font-size:12.5px;font-weight:800;color:' + m.dot + '">' + (c.score !== null ? c.score : "—") + '</span><span style="font-size:10px;color:#a8aebc">' + hora(c.lastAt) + '</span></div></div>';
      }).join("");
      html += '</div>';
    });
    $("list").innerHTML = html || '<div style="color:#94a3b8;font-size:12.5px;padding:16px 8px;font-style:italic">Aún no hay conversaciones. Escribe abajo para probar.</div>';
    document.querySelectorAll(".inbox-row").forEach(r => r.addEventListener("click", () => openConv(decodeURIComponent(r.dataset.p))));
    const pend = inbox.filter(c => c.stale).length;
    $("scoreAll").textContent = pend ? "Calificar " + pend : "Todo calificado"; $("scoreAll").disabled = !pend;
  }

  async function score(p, force) {
    const r = await fetch("/api/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId, phone: p, force: !!force }), signal: AbortSignal.timeout(45000) });
    return (await r.json()).lead;
  }
  $("scoreAll").addEventListener("click", async () => {
    const pend = inbox.filter(c => c.stale); $("scoreAll").disabled = true;
    for (let i = 0; i < pend.length; i++) { $("scoreAll").textContent = "Calificando " + (i + 1) + "/" + pend.length; try { await score(pend[i].phone); } catch (e) {} await new Promise(r => setTimeout(r, 400)); }
    await loadInbox(); if (phone) openConv(phone);
  });

  function bubble(text, who, ts) {
    const cli = who === "cli";
    const row = document.createElement("div");
    row.style.cssText = "display:flex;flex-direction:column;max-width:76%;" + (cli ? "align-self:flex-start" : "align-self:flex-end");
    const b = document.createElement("div");
    b.style.cssText = "padding:10px 14px;font-size:13.5px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word;" +
      (cli ? "background:#fff;border:1px solid #eaecf1;color:#0f172a;border-radius:14px 14px 14px 4px" : "background:#fd5a07;color:#fff;border-radius:14px 14px 4px 14px");
    b.textContent = text;
    const t = document.createElement("div");
    t.style.cssText = "font-size:9.5px;color:#a8aebc;margin-top:3px;" + (cli ? "text-align:left" : "text-align:right");
    t.textContent = hora(ts || Date.now());
    row.appendChild(b); row.appendChild(t);
    $("msgs").appendChild(row); $("msgs").scrollTop = $("msgs").scrollHeight;
  }
  function imgBubble(url, caption) {
    const row = document.createElement("div");
    row.style.cssText = "align-self:flex-end;max-width:76%";
    const box = document.createElement("div");
    box.style.cssText = "background:#fff;border:1px solid #eaecf1;border-radius:14px;padding:5px";
    const i = document.createElement("img"); i.src = url; i.alt = caption || ""; i.loading = "lazy"; i.style.cssText = "display:block;max-width:220px;border-radius:10px";
    box.appendChild(i);
    if (caption) { const c = document.createElement("div"); c.style.cssText = "font-size:11.5px;color:#334155;padding:5px 3px 2px"; c.textContent = caption; box.appendChild(c); }
    row.appendChild(box); $("msgs").appendChild(row); $("msgs").scrollTop = $("msgs").scrollHeight;
  }

  async function openConv(p) {
    phone = p;
    const d = await jget("/api/conversation?tenantId=" + encodeURIComponent(tenantId) + "&phone=" + encodeURIComponent(p));
    moneda = d.moneda || "COP";
    const m = META[(d.lead && d.lead.bucket) || "none"];
    $("hAv").textContent = iniciales(p); $("hAv").style.cssText = "width:40px;height:40px;flex:none;border-radius:11px;" + m.av + ";display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px";
    $("hName").textContent = p; $("hSub").textContent = d.messages.length + " mensajes"; $("hCh").innerHTML = chBadge(p);
    $("hBadge").innerHTML = d.lead ? '<div style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:' + m.dot + ';background:#f8f9fb;border:1px solid #eef0f4;padding:5px 11px;border-radius:20px"><span style="width:7px;height:7px;border-radius:50%;background:' + m.dot + '"></span>' + m.label + ' · ' + d.lead.score + '</div>' : '';
    $("msgs").innerHTML = "";
    d.messages.forEach(mm => bubble(mm.content, mm.role === "user" ? "cli" : "bot", mm.created_at));
    openMsgCount = d.messages.length;
    renderQual(d);
    loadInbox();
  }

  async function refreshOpen() {
    if (!phone) return;
    const d = await jget("/api/conversation?tenantId=" + encodeURIComponent(tenantId) + "&phone=" + encodeURIComponent(phone));
    if (d.messages.length === openMsgCount) return;
    openConv(phone);
  }

  function renderQual(d) {
    const l = d.lead;
    if (!l) {
      $("pQual").innerHTML = '<div style="padding:0 20px"><div style="color:#94a3b8;font-size:12.5px;font-style:italic;margin-bottom:12px">Sin calificar todavía.</div>' +
        '<button id="bScore" style="width:100%;border:none;background:#fd5a07;color:#fff;padding:11px;border-radius:11px;font-size:13px;font-weight:700;cursor:pointer">Calificar con IA</button></div>';
      $("bScore").addEventListener("click", () => runScore(true)); return;
    }
    const m = META[l.bucket] || META.none;
    const ring = "width:120px;height:120px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:conic-gradient(" + m.dot + " " + l.score + "%, #eef0f4 0)";
    const sig = [["interes","Interés"],["precio","Precio"],["datos","Datos"],["urgencia","Urgencia"]];
    const rec = l.bucket === "hot" ? "Lead listo. Buen momento para cerrar o pasar al equipo." : l.bucket === "warm" ? "Hay interés; dale seguimiento para resolver dudas." : "Aún explora; nutre con info y una oferta clara.";
    $("pQual").innerHTML =
      '<div style="padding:6px 20px 18px;display:flex;flex-direction:column;align-items:center;gap:10px">' +
        '<div style="' + ring + '"><div style="width:104px;height:104px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center"><div style="font-size:30px;font-weight:700;line-height:1;color:' + m.dot + '">' + l.score + '</div><div style="font-size:10.5px;color:#94a3b8;margin-top:2px">/ 100</div></div></div>' +
        '<div style="display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:' + m.dot + ';background:#f8f9fb;border:1px solid #eef0f4;padding:6px 13px;border-radius:20px"><span style="width:8px;height:8px;border-radius:50%;background:' + m.dot + '"></span>' + m.label + '</div>' +
      '</div>' +
      '<div style="padding:0 20px 18px"><div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:10px">SEÑALES DE COMPRA</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
        sig.map(([k,lab]) => { const ok = l.signals && l.signals[k]; return '<div style="display:flex;align-items:center;gap:6px;font-size:11.5px;padding:8px 10px;border-radius:9px;' + (ok ? 'background:#ecfdf3;color:#15803d;font-weight:700' : 'background:#f8f9fb;color:#94a3b8') + '"><span>' + (ok ? "✓" : "○") + '</span>' + lab + '</div>'; }).join("") +
      '</div></div>' +
      '<div style="padding:0 20px 18px"><div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:10px">POR QUÉ ESTA CLASIFICACIÓN</div><div style="display:flex;flex-direction:column;gap:9px">' +
        (l.reasons || []).map(r => '<div style="display:flex;gap:9px;font-size:12.5px;line-height:1.45;color:#334155"><span style="color:' + m.dot + ';font-weight:700;flex:none">›</span><span>' + esc(r) + '</span></div>').join("") +
      '</div></div>' +
      renderClientOrders(d) +
      '<div style="padding:16px 20px 20px;border-top:1px solid #eef0f4;display:flex;flex-direction:column;gap:9px"><div style="font-size:11.5px;color:#94a3b8;line-height:1.4">' + rec + '</div>' +
        '<button id="bScore" style="width:100%;border:1px solid #e2e5ec;background:#fff;color:#d94d00;padding:10px;border-radius:10px;font-size:12.5px;font-weight:700;cursor:pointer">Recalificar</button></div>';
    $("bScore").addEventListener("click", () => runScore(true));
  }

  function renderClientOrders(d) {
    if (!d.orders.length && !d.reservations.length) return "";
    let h = '<div style="padding:0 20px 18px"><div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:10px">PEDIDOS Y RESERVAS</div>';
    h += d.orders.map(o => { const items = (o.items || []).map(i => i.cantidad + "x " + i.nombre).join(", ");
      return '<div style="border:1px solid #eef0f4;background:#f8f9fb;border-radius:11px;padding:10px 11px;margin-bottom:8px;font-size:12.5px"><b>Pedido #' + o.id + '</b><div style="color:#475569;margin-top:3px">' + esc(items) + '</div><div style="font-weight:800;color:#16a34a;margin-top:4px">' + money(o.total) + '</div></div>'; }).join("");
    h += d.reservations.map(r => '<div style="border:1px solid #eef0f4;background:#f8f9fb;border-radius:11px;padding:10px 11px;margin-bottom:8px;font-size:12.5px"><b>Reserva #' + r.id + '</b><div style="color:#475569;margin-top:3px">' + esc(r.fecha) + " · " + esc(r.hora) + " · " + r.personas + ' personas</div></div>').join("");
    return h + '</div>';
  }

  async function runScore(force) {
    const b = $("bScore"); if (b) { b.disabled = true; b.textContent = "Calificando..."; }
    try { await score(phone, force); const d = await jget("/api/conversation?tenantId=" + encodeURIComponent(tenantId) + "&phone=" + encodeURIComponent(phone)); renderQual(d); loadInbox(); }
    catch (e) { if (b) { b.disabled = false; b.textContent = "Reintentar"; } }
  }

  $("send").addEventListener("click", sendMsg);
  $("text").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); sendMsg(); } });
  async function sendMsg() {
    const text = $("text").value.trim(); if (!text) return;
    if (!phone) { phone = "web-" + Math.random().toString(36).slice(2, 8); $("hName").textContent = phone; $("hAv").textContent = iniciales(phone); $("hCh").innerHTML = chBadge(phone); }
    bubble(text, "cli"); $("text").value = "";
    const t = document.createElement("div"); t.style.cssText = "align-self:flex-start;display:flex;gap:5px;padding:11px 14px;background:#fff;border:1px solid #eaecf1;border-radius:14px 14px 14px 4px";
    t.innerHTML = '<span style="width:7px;height:7px;background:#94a3b8;border-radius:50%;animation:tdot 1.2s infinite"></span><span style="width:7px;height:7px;background:#94a3b8;border-radius:50%;animation:tdot 1.2s infinite .2s"></span><span style="width:7px;height:7px;background:#94a3b8;border-radius:50%;animation:tdot 1.2s infinite .4s"></span>';
    $("msgs").appendChild(t); $("msgs").scrollTop = $("msgs").scrollHeight;
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId, phone, text }), signal: AbortSignal.timeout(60000) });
      const d = await r.json(); t.remove();
      if (d.reply) bubble(d.reply, "bot");
      (d.images || []).forEach(im => imgBubble(im.url, im.caption));
      if (!d.reply && !(d.images || []).length) bubble(d.error || "Sin respuesta.", "bot");
      openMsgCount += 2; loadInbox();
      const det = await jget("/api/conversation?tenantId=" + encodeURIComponent(tenantId) + "&phone=" + encodeURIComponent(phone)); renderQual(det);
    } catch (err) { t.remove(); bubble(err && err.name === "TimeoutError" ? "El modelo tardó demasiado (límite gratuito)." : "Error de conexión.", "bot"); }
  }

  // ---- Panel de analisis ----
  async function loadMetrics() {
    const d = await jget("/api/metrics?tenantId=" + encodeURIComponent(tenantId));
    moneda = d.moneda || "COP"; const k = d.kpis, di = d.distribucion;
    const total = di.hot + di.warm + di.cold + di.sinCalificar || 1;
    const seg = (n, c) => 'flex:' + (n || 0.001) + ';background:' + c + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800';
    const maxDia = Math.max(1, ...d.dias.map(x => x.pedidos));
    const kpi = (t, v, sub, col) => '<div style="background:#fff;border:1px solid #e9ebf1;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,.05);padding:16px 18px"><div style="font-size:12px;color:#64748b;font-weight:600">' + t + '</div><div style="font-size:27px;font-weight:700;letter-spacing:-.6px;margin-top:8px;' + (col ? 'color:' + col : '') + '">' + v + '</div><div style="font-size:11.5px;color:#94a3b8;margin-top:3px">' + sub + '</div></div>';
    $("an").innerHTML =
      '<div style="display:flex;align-items:center;gap:14px;margin-bottom:18px"><span class="brand" style="font-size:22px;font-weight:700">Panel de análisis</span><span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#15803d;background:#ecfdf3;border:1px solid #bbf7d0;padding:3px 9px;border-radius:20px"><span style="width:6px;height:6px;border-radius:50%;background:#22c55e"></span>EN VIVO</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px">' +
        kpi("Chats", k.conversaciones, "conversaciones totales") + kpi("Conversión", k.conversion + "%", "pedidos / conversaciones", "#16a34a") +
        kpi("Pedidos", k.pedidos, "registrados por el bot") + kpi("Ingresos", money(k.ingresos), "ticket medio " + money(k.ticket)) +
      '</div>' +
      '<div style="background:#fff;border:1px solid #e9ebf1;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,.05);padding:20px 22px;margin-bottom:18px"><div style="font-size:14.5px;font-weight:700;margin-bottom:6px">Conversaciones por día</div><div style="display:flex;align-items:flex-end;gap:8px;height:170px;padding-top:14px">' +
        d.dias.map(x => '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px" title="' + x.pedidos + ' pedidos · ' + money(x.ingresos) + '"><div style="width:100%;background:#fd5a07;border-radius:6px 6px 0 0;min-height:2px;height:' + Math.round((x.pedidos / maxDia) * 100) + '%"></div><div style="font-size:10px;color:#64748b">' + x.dia + '</div></div>').join("") +
      '</div></div>' +
      '<div style="background:#fff;border:1px solid #e9ebf1;border-radius:16px;box-shadow:0 1px 3px rgba(15,23,42,.05);padding:18px 20px"><div style="font-size:14.5px;font-weight:700;margin-bottom:14px">Distribución de leads</div>' +
        '<div style="display:flex;height:36px;border-radius:9px;overflow:hidden"><div style="' + seg(di.hot, "#16a34a") + '">' + (di.hot || "") + '</div><div style="' + seg(di.warm, "#f59e0b") + '">' + (di.warm || "") + '</div><div style="' + seg(di.cold + di.sinCalificar, "#cbd5e1") + '">' + ((di.cold + di.sinCalificar) || "") + '</div></div>' +
        '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:12px"><span style="display:flex;align-items:center;gap:6px;font-size:12px;color:#475569"><span style="width:9px;height:9px;border-radius:3px;background:#16a34a"></span>Casi seguro</span><span style="display:flex;align-items:center;gap:6px;font-size:12px;color:#475569"><span style="width:9px;height:9px;border-radius:3px;background:#f59e0b"></span>Tal vez</span><span style="display:flex;align-items:center;gap:6px;font-size:12px;color:#475569"><span style="width:9px;height:9px;border-radius:3px;background:#cbd5e1"></span>Poco prob. / sin calificar</span></div>' +
        (d.topProductos.length ? '<div style="font-size:12px;font-weight:700;color:#64748b;margin:18px 0 10px">PRODUCTOS MÁS PEDIDOS</div>' + d.topProductos.map(p => { const mx = Math.max(1, ...d.topProductos.map(x => x.cantidad)); return '<div style="display:flex;align-items:center;gap:9px;margin-bottom:8px;font-size:13px"><div style="width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(p.nombre) + '</div><div style="flex:1;height:9px;background:#eef0f4;border-radius:5px;overflow:hidden"><div style="height:100%;background:#fd5a07;border-radius:5px;width:' + Math.round(p.cantidad / mx * 100) + '%"></div></div><div style="font-weight:800;width:28px;text-align:right">' + p.cantidad + '</div></div>'; }).join("") : "") +
      '</div>';
  }

  // ---- Agente IA (config) y Conexion: cargados igual que antes ----
  let cfgMenu = [];
  function menuRows() {
    return cfgMenu.map((m, i) => '<div style="display:grid;grid-template-columns:1.4fr .8fr 1fr 2fr 1.4fr 32px;gap:7px;align-items:center;margin-bottom:7px" data-i="' + i + '">' +
      ['nombre','precio','categoria','descripcion','imagen'].map(f => '<input data-f="' + f + '"' + (f === "precio" ? ' type="number" min="0"' : '') + ' value="' + esc(f === "precio" ? (m.precio || 0) : m[f]) + '" placeholder="' + f + '" style="border:1px solid #e2e5ec;border-radius:9px;padding:8px 10px;font-size:12.5px;outline:none;min-width:0">').join("") +
      '<button data-del="' + i + '" style="border:none;background:#fee2e2;color:#b91c1c;border-radius:9px;height:32px;cursor:pointer">✕</button></div>').join("");
  }
  function bindMenu() {
    document.querySelectorAll("[data-i] input").forEach(inp => inp.addEventListener("input", e => { const i = +e.target.closest("[data-i]").dataset.i; cfgMenu[i][e.target.dataset.f] = e.target.dataset.f === "precio" ? +e.target.value : e.target.value; }));
    document.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => { cfgMenu.splice(+b.dataset.del, 1); $("mBody").innerHTML = menuRows(); bindMenu(); }));
  }
  const box = (title, inner) => '<div style="background:#fff;border:1px solid #e9ebf1;border-radius:16px;padding:18px 20px;margin-bottom:16px"><h3 style="margin:0 0 14px;font-size:15px">' + title + '</h3>' + inner + '</div>';
  const fg = (label, id, val, type) => '<div style="margin-bottom:12px"><label style="display:block;font-size:12px;font-weight:700;color:#475569;margin-bottom:5px">' + label + '</label><input id="' + id + '"' + (type ? ' type="' + type + '"' : '') + ' value="' + esc(val) + '" style="width:100%;border:1px solid #e2e5ec;border-radius:10px;padding:9px 12px;font-size:13.5px;outline:none"></div>';
  async function loadCfg() {
    const [d, info] = await Promise.all([jget("/api/tenant?tenantId=" + encodeURIComponent(tenantId)), jget("/api/info")]);
    const b = d.business; cfgMenu = d.menu.map(m => ({ ...m }));
    $("cfg").innerHTML = '<h2 class="brand" style="font-size:22px;margin:0 0 6px">Agente IA</h2><p style="color:#64748b;font-size:13px;margin:0 0 18px">Lo que guardes cambia al instante cómo responde el bot.</p>' +
      box("Datos del negocio", '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' + fg("Nombre","fNombre",b.nombre) +
        '<div style="margin-bottom:12px"><label style="display:block;font-size:12px;font-weight:700;color:#475569;margin-bottom:5px">Tipo</label><select id="fTipo" style="width:100%;border:1px solid #e2e5ec;border-radius:10px;padding:9px 12px;font-size:13.5px"><option value="restaurante"' + (b.tipo_negocio === "restaurante" ? " selected" : "") + '>Restaurante</option><option value="tienda"' + (b.tipo_negocio === "tienda" ? " selected" : "") + '>Tienda</option></select></div>' +
        fg("Dirección","fDir",b.direccion) + fg("Teléfono","fTel",b.telefono) + fg("Moneda","fMoneda",b.moneda) + fg("Costo de domicilio","fDom",b.costo_domicilio || 0,"number") +
        fg("Medios de pago (coma)","fPagos",(b.metodos_pago || []).join(", ")) + fg("Horario (texto)","fHorario",b.horario) + '</div>' +
        '<div style="margin-bottom:12px"><label style="display:block;font-size:12px;font-weight:700;color:#475569;margin-bottom:5px">Personalidad</label><textarea id="fPers" style="width:100%;border:1px solid #e2e5ec;border-radius:10px;padding:9px 12px;font-size:13.5px;min-height:70px">' + esc(b.personalidad) + '</textarea></div>' +
        '<div><label style="display:block;font-size:12px;font-weight:700;color:#475569;margin-bottom:5px">Qué es una dirección completa</label><textarea id="fDirFmt" style="width:100%;border:1px solid #e2e5ec;border-radius:10px;padding:9px 12px;font-size:13.5px;min-height:55px">' + esc(b.formato_direccion) + '</textarea></div>') +
      box("Horario de atención", '<p style="font-size:12px;color:#64748b;margin:0 0 12px">Formato 11:00-22:00 (vacío = cerrado). El bot no toma pedidos cerrado.</p>' +
        [["lun","Lunes"],["mar","Martes"],["mie","Miércoles"],["jue","Jueves"],["vie","Viernes"],["sab","Sábado"],["dom","Domingo"]].map(dd => '<div style="display:grid;grid-template-columns:110px 1fr;align-items:center;gap:10px;margin-bottom:7px"><label style="font-size:12px;font-weight:700;color:#475569">' + dd[1] + '</label><input id="fh_' + dd[0] + '" value="' + esc((b.horarios || {})[dd[0]] || "") + '" placeholder="cerrado" style="border:1px solid #e2e5ec;border-radius:10px;padding:8px 12px;font-size:13px"></div>').join("") +
        '<div style="margin-top:10px">' + fg("Zona horaria","fTz",b.zona_horaria || "America/Bogota") + '</div>') +
      box("Catálogo (" + cfgMenu.length + ")", '<div style="display:grid;grid-template-columns:1.4fr .8fr 1fr 2fr 1.4fr 32px;gap:7px;font-size:10.5px;font-weight:800;text-transform:uppercase;color:#94a3b8;margin-bottom:6px"><div>Nombre</div><div>Precio</div><div>Categoría</div><div>Descripción</div><div>Foto</div><div></div></div><div id="mBody">' + menuRows() + '</div><button id="mAdd" style="border:1px solid #e2e5ec;background:#fff;color:#d94d00;padding:9px 15px;border-radius:10px;font-weight:700;cursor:pointer;margin-top:4px">+ Agregar producto</button>') +
      '<div style="display:flex;gap:12px;align-items:center;position:sticky;bottom:0;background:#f5f6f8;padding:14px 0"><button id="cSave" style="border:none;background:#fd5a07;color:#fff;padding:11px 22px;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer">Guardar cambios</button><span id="cMsg" style="font-size:12.5px;font-weight:700"></span></div>';
    bindMenu();
    $("mAdd").addEventListener("click", () => { cfgMenu.push({ nombre: "", precio: 0, categoria: "General", descripcion: "", imagen: "" }); $("mBody").innerHTML = menuRows(); bindMenu(); });
    $("cSave").addEventListener("click", saveCfg);
  }
  async function saveCfg() {
    const btn = $("cSave"), msg = $("cMsg"); btn.disabled = true; msg.textContent = "Guardando..."; msg.style.color = "#64748b";
    const business = { nombre: $("fNombre").value, tipo_negocio: $("fTipo").value, horario: $("fHorario").value, direccion: $("fDir").value, telefono: $("fTel").value, moneda: $("fMoneda").value, metodos_pago: $("fPagos").value.split(",").map(s => s.trim()).filter(Boolean), costo_domicilio: +$("fDom").value || 0, personalidad: $("fPers").value, formato_direccion: $("fDirFmt").value, zona_horaria: $("fTz").value, horarios: ["lun","mar","mie","jue","vie","sab","dom"].reduce((o, d) => { o[d] = $("fh_" + d).value; return o; }, {}) };
    try { const r = await fetch("/api/tenant", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId, business, menu: cfgMenu }) }); const d = await r.json(); if (d.error) throw new Error(d.error); msg.textContent = "✓ Guardado"; msg.style.color = "#16a34a"; await loadTenants(tenantId); }
    catch (e) { msg.textContent = "Error: " + e.message; msg.style.color = "#b91c1c"; } finally { btn.disabled = false; }
  }

  async function loadWa() {
    const w = await jget("/api/whatsapp");
    $("waDot").style.display = w.conectado ? "block" : "none";
    const estado = w.conectado ? '<span style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:#15803d;background:#ecfdf3;border:1px solid #bbf7d0;padding:6px 12px;border-radius:20px"><span style="width:8px;height:8px;border-radius:50%;background:#16a34a"></span>Conectado</span>' : '<span style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:#b45309;background:#fffbeb;border:1px solid #fde68a;padding:6px 12px;border-radius:20px"><span style="width:8px;height:8px;border-radius:50%;background:#f59e0b"></span>Sin conectar</span>';
    $("wa").innerHTML = '<h2 class="brand" style="font-size:22px;margin:0 0 6px">Conexión con WhatsApp</h2><div style="margin-bottom:16px">' + estado + '</div>' +
      box("1. Credenciales de Meta", '<div style="margin-bottom:12px"><label style="display:block;font-size:12px;font-weight:700;color:#475569;margin-bottom:5px">Token de acceso' + (w.hasToken ? ' <span style="color:#16a34a">(guardado)</span>' : '') + '</label><input id="waToken" type="password" placeholder="' + (w.hasToken ? '•••• (dejar vacío para no cambiar)' : 'EAAG...') + '" style="width:100%;border:1px solid #e2e5ec;border-radius:10px;padding:9px 12px"></div>' + fg("Verify token","waVerify",w.verifyToken)) +
      box("2. URL pública (túnel)", fg("URL pública","waUrl",w.publicBaseUrl) + '<div style="margin-bottom:12px"><label style="display:block;font-size:12px;font-weight:700;color:#475569;margin-bottom:5px">Callback URL para Meta</label><input readonly value="' + esc(w.webhookUrl) + '" style="width:100%;border:1px solid #e2e5ec;border-radius:10px;padding:9px 12px;background:#f8f9fb"></div><button id="waSave" style="border:none;background:#fd5a07;color:#fff;padding:11px 22px;border-radius:11px;font-weight:700;cursor:pointer">Guardar conexión</button>') +
      box("3. Qué agente responde por cada número", w.agentes.map(a => '<div style="display:grid;grid-template-columns:1fr 1.4fr auto;gap:10px;align-items:center;margin-bottom:8px"><label style="font-size:12px;font-weight:700;color:#475569">' + esc(a.nombre) + '</label><input id="wa_ag_' + a.id + '" value="' + esc(a.phone_number_id) + '" placeholder="Phone number ID" style="border:1px solid #e2e5ec;border-radius:10px;padding:9px 12px"><button data-ag="' + a.id + '" style="border:1px solid #e2e5ec;background:#fff;color:#d94d00;padding:9px 15px;border-radius:10px;font-weight:700;cursor:pointer">Enlazar</button></div>').join(""));
    $("waSave").addEventListener("click", async () => { const b = { verifyToken: $("waVerify").value, publicBaseUrl: $("waUrl").value }; if ($("waToken").value.trim()) b.token = $("waToken").value.trim(); await fetch("/api/whatsapp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); loadWa(); });
    document.querySelectorAll("[data-ag]").forEach(b => b.addEventListener("click", async () => { b.disabled = true; b.textContent = "..."; await fetch("/api/whatsapp/agente", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId: b.dataset.ag, phone_number_id: $("wa_ag_" + b.dataset.ag).value }) }); b.textContent = "✓"; setTimeout(() => { b.textContent = "Enlazar"; b.disabled = false; }, 1200); }));
  }

  // ---- navegacion ----
  const NAV = [["navChat","chat"],["navPanel","panel"],["navAgente","cfg"],["navContacts","soon"],["navCampanas","soon"],["navAyuda","soon"],["navBuscar","soon"],["navAjustes","wa"]];
  const SOON = { navContacts: "Contactos", navCampanas: "Campañas", navAyuda: "Obtener ayuda", navBuscar: "Buscar" };
  function view(v) {
    $("viewChat").style.display = v === "chat" ? "flex" : "none";
    $("viewPanel").style.display = v === "panel" ? "block" : "none";
    $("viewCfg").style.display = v === "cfg" ? "block" : "none";
    $("viewWa").style.display = v === "wa" ? "block" : "none";
    $("viewSoon").style.display = v === "soon" ? "flex" : "none";
    if (v === "panel") loadMetrics();
    if (v === "cfg") loadCfg();
    if (v === "wa") loadWa();
  }
  NAV.forEach(([id, v]) => $(id).addEventListener("click", () => {
    NAV.forEach(([x]) => $(x).classList.toggle("on", x === id));
    if (v === "soon") $("soonTitle").textContent = SOON[id] || "Próximamente";
    view(v);
  }));

  setInterval(() => { if ($("viewChat").style.display !== "none") { loadInbox(); refreshOpen(); } }, 5000);
  jget("/api/whatsapp").then(w => { $("waDot").style.display = w.conectado ? "block" : "none"; }).catch(() => {});
  loadTenants();
</script>
</body>
</html>`;
}
