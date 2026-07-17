/**
 * Consola del negocio: bandeja de conversaciones + chat + panel del cliente.
 *
 * Reconstruccion REAL (HTML/CSS/JS normal) del prototipo de diseno "SalesBot",
 * conectada a nuestras APIs (/api/tenants, /api/conversations, /api/conversation,
 * /api/chat). Etapa 1: bandeja + chat + datos del cliente.
 * Etapa 2 (pendiente): calificacion de leads y analitica.
 */
export function consolePage(): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Consola · Chatbot</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:'Inter',system-ui,sans-serif;color:#0f172a;background:#f5f6f8}
  ::-webkit-scrollbar{width:8px;height:8px}
  ::-webkit-scrollbar-thumb{background:#d5d9e2;border-radius:5px}
  .app{display:flex;height:100vh;width:100%;overflow:hidden}

  /* nav rail */
  .rail{width:58px;flex:none;background:#0b1120;display:flex;flex-direction:column;align-items:center;padding:16px 0;gap:8px}
  .rail button{width:38px;height:38px;border:none;border-radius:10px;background:transparent;color:#64748b;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center}
  .rail button:hover{background:rgba(255,255,255,.08);color:#cbd5e1}
  .rail button.on{background:#6366f1;color:#fff}

  /* sidebar */
  .side{width:296px;flex:none;background:#0f172a;display:flex;flex-direction:column;min-height:0}
  .side .top{padding:18px 18px 12px;display:flex;align-items:center;gap:10px}
  .logo{width:32px;height:32px;border-radius:9px;background:#6366f1;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:15px}
  .brand{font-weight:700;font-size:15.5px;color:#fff;letter-spacing:-.2px}
  .pill{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:11px;color:#cbd5e1;background:rgba(255,255,255,.08);padding:4px 9px;border-radius:20px}
  .dot{width:7px;height:7px;border-radius:50%;background:#22c55e}
  .side select{margin:0 14px 10px;background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:8px 10px;font-size:13px;font-family:inherit}
  .side select option{color:#000}
  .stats{padding:0 14px 10px;display:flex;gap:6px}
  .stat{flex:1;background:rgba(255,255,255,.06);border-radius:9px;padding:8px 10px;text-align:center}
  .stat b{display:block;font-size:16px;font-weight:700;color:#fff}
  .stat span{font-size:10px}
  .list{flex:1;overflow-y:auto;padding:4px 10px 14px;min-height:0}
  .list h4{display:flex;align-items:center;gap:7px;padding:10px 8px 6px;margin:0;font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:#cbd5e1}
  .list h4 span{margin-left:auto;color:#64748b;font-weight:500}
  .row{display:flex;gap:10px;align-items:center;padding:9px 8px;border-radius:9px;cursor:pointer}
  .row:hover{background:rgba(255,255,255,.06)}
  .row.on{background:rgba(99,102,241,.22)}
  .av{width:34px;height:34px;flex:none;border-radius:50%;background:#334155;color:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
  .row .who{flex:1;min-width:0}
  .row .who b{display:block;font-size:13px;color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .row .who small{display:block;font-size:11.5px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .row .t{font-size:10px;color:#64748b;flex:none}
  .empty{color:#64748b;font-size:12.5px;padding:14px 8px;font-style:italic}
  .gdot{width:8px;height:8px;border-radius:50%;flex:none}
  .sc{font-size:10px;font-weight:800;padding:1px 5px;border-radius:4px;flex:none}

  /* calificacion */
  .badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:6px}
  .bar{height:8px;background:#eef0f4;border-radius:5px;overflow:hidden;margin:8px 0 4px}
  .bar i{display:block;height:100%;border-radius:5px}
  .sig{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
  .sig div{flex:1 1 45%;font-size:11px;padding:6px 8px;border-radius:8px;border:1px solid #eef0f4;display:flex;align-items:center;gap:5px}
  .sig .ok{background:#ecfdf3;border-color:#bbf7d0;color:#15803d;font-weight:600}
  .sig .no{background:#f8f9fb;color:#94a3b8}
  .why{margin:6px 0 0;padding-left:16px;font-size:12px;color:#475569;line-height:1.6}
  .btn{width:100%;border:1px solid #e2e5ec;background:#fff;color:#4f46e5;padding:8px;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:8px}
  .btn:hover{background:#f5f6ff}
  .btn:disabled{opacity:.5;cursor:default}

  /* analitica */
  .an{flex:1;overflow-y:auto;padding:22px;min-height:0}
  .an h2{margin:0 0 16px;font-size:19px}
  .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px}
  .kpi{background:#fff;border:1px solid #e6e8ee;border-radius:12px;padding:13px 15px}
  .kpi b{display:block;font-size:21px;font-weight:700;margin-bottom:2px}
  .kpi span{font-size:11.5px;color:#64748b}
  .box{background:#fff;border:1px solid #e6e8ee;border-radius:12px;padding:15px;margin-bottom:14px}
  .box h3{margin:0 0 12px;font-size:13px}
  .chart{display:flex;align-items:flex-end;gap:8px;height:130px}
  .chart .col{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px}
  .chart .bx{width:100%;background:#6366f1;border-radius:5px 5px 0 0;min-height:2px;transition:opacity .15s}
  .chart .bx:hover{opacity:.8}
  .chart small{font-size:10px;color:#64748b}
  .prod{display:flex;align-items:center;gap:9px;margin-bottom:7px;font-size:12.5px}
  .prod .nm{flex:none;width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .prod .pb{flex:1;height:9px;background:#eef0f4;border-radius:5px;overflow:hidden}
  .prod .pb i{display:block;height:100%;background:#6366f1;border-radius:5px}
  .prod .qt{flex:none;font-weight:700;width:26px;text-align:right}
  .dist{display:flex;gap:8px}
  .dist div{flex:1;text-align:center;border-radius:10px;padding:11px}
  .dist b{display:block;font-size:19px;font-weight:700}
  .dist span{font-size:10.5px}

  /* configuracion */
  .fg{margin-bottom:11px}
  .fg label{display:block;font-size:11.5px;font-weight:600;color:#475569;margin-bottom:4px}
  .fg input,.fg select,.fg textarea{width:100%;border:1px solid #e2e5ec;border-radius:9px;padding:8px 11px;font-size:13px;font-family:inherit;outline:none;background:#fff}
  .fg input:focus,.fg select:focus,.fg textarea:focus{border-color:#6366f1}
  .fg textarea{resize:vertical;min-height:70px;line-height:1.5}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:11px}
  .mrow{display:grid;grid-template-columns:1.4fr .8fr 1fr 2fr 1.4fr 32px;gap:7px;align-items:center;margin-bottom:7px}
  .mrow input{border:1px solid #e2e5ec;border-radius:8px;padding:7px 9px;font-size:12.5px;font-family:inherit;outline:none;min-width:0}
  .mrow input:focus{border-color:#6366f1}
  .mhead{display:grid;grid-template-columns:1.4fr .8fr 1fr 2fr 1.4fr 32px;gap:7px;font-size:10.5px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.3px;margin-bottom:6px}
  .del{border:none;background:#fee2e2;color:#b91c1c;border-radius:8px;height:30px;cursor:pointer;font-size:14px}
  .del:hover{background:#fecaca}
  .primary{border:none;background:#6366f1;color:#fff;padding:10px 20px;border-radius:10px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit}
  .primary:disabled{opacity:.5;cursor:default}
  .ghost{border:1px solid #e2e5ec;background:#fff;color:#4f46e5;padding:8px 14px;border-radius:9px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit}
  .bar2{display:flex;gap:10px;align-items:center;position:sticky;bottom:0;background:#f5f6f8;padding:12px 0;border-top:1px solid #e6e8ee;margin-top:6px}
  .ok{color:#16a34a;font-size:12.5px;font-weight:600}
  .warn{background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:10px;padding:10px 12px;font-size:12px;margin-bottom:14px}

  /* chat */
  .main{flex:1;display:flex;flex-direction:column;min-width:0;background:#f5f6f8}
  .head{background:#fff;border-bottom:1px solid #e6e8ee;padding:12px 18px;display:flex;align-items:center;gap:11px}
  .head .av{background:#e0e7ff;color:#4338ca}
  .head b{font-size:14.5px}
  .head small{display:block;color:#64748b;font-size:11.5px}
  .tag{margin-left:auto;font-size:11px;font-weight:600;color:#3730a3;background:#e0e7ff;padding:4px 9px;border-radius:6px}
  .msgs{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:10px;min-height:0}
  .b{max-width:74%;padding:9px 12px;border-radius:12px;font-size:13.5px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}
  .b.cli{align-self:flex-start;background:#fff;border:1px solid #e6e8ee;border-bottom-left-radius:3px}
  .b.bot{align-self:flex-end;background:#6366f1;color:#fff;border-bottom-right-radius:3px}
  .b .ts{display:block;font-size:9.5px;opacity:.65;margin-top:4px;text-align:right}
  .b.img{padding:5px;background:#fff;border:1px solid #e6e8ee;align-self:flex-end}
  .b.img img{display:block;max-width:230px;border-radius:8px}
  .b.img .cap{font-size:11.5px;color:#334155;padding:5px 3px 2px}
  .typing{align-self:flex-end;color:#64748b;font-size:12.5px;font-style:italic}
  .composer{background:#fff;border-top:1px solid #e6e8ee;padding:12px 16px;display:flex;gap:9px;align-items:center}
  .composer input{flex:1;border:1px solid #e2e5ec;border-radius:10px;padding:10px 13px;font-size:13.5px;font-family:inherit;outline:none}
  .composer input:focus{border-color:#6366f1}
  .composer button{border:none;background:#6366f1;color:#fff;padding:10px 16px;border-radius:10px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit}
  .composer button:disabled{opacity:.5;cursor:default}
  .hint{font-size:10.5px;color:#94a3b8;padding:0 16px 9px;background:#fff}

  /* panel derecho */
  .panel{width:300px;flex:none;background:#fff;border-left:1px solid #e6e8ee;overflow-y:auto;padding:16px}
  .panel h3{margin:0 0 4px;font-size:13px;font-weight:700}
  .panel h5{margin:18px 0 8px;font-size:10.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:#64748b}
  .card{border:1px solid #eef0f4;background:#f8f9fb;border-radius:10px;padding:10px 11px;margin-bottom:8px;font-size:12.5px}
  .card b{font-size:12.5px}
  .card .li{color:#475569;margin-top:3px}
  .tot{font-weight:700;color:#16a34a;margin-top:4px}
  .muted{color:#94a3b8;font-size:12px;font-style:italic}

  /* etapa 2 */
  .soon{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#64748b;text-align:center;padding:30px}
  .soon .ico{font-size:40px}
  .soon b{color:#0f172a;font-size:16px}
  .soon a{color:#4f46e5}
  @media(max-width:1100px){ .panel{display:none} }
  @media(max-width:760px){ .side{width:220px} }
</style>
</head>
<body>
<div class="app">
  <div class="rail">
    <button id="nChat" class="on" title="Conversaciones">💬</button>
    <button id="nPanel" title="Analitica">📊</button>
    <button id="nCfg" title="Configuracion">⚙️</button>
  </div>

  <div class="side">
    <div class="top">
      <div class="logo">S</div>
      <div class="brand">SalesBot</div>
      <div class="pill"><span class="dot"></span>activo</div>
    </div>
    <select id="tenant"></select>
    <div class="stats">
      <div class="stat"><b id="sHot">0</b><span style="color:#86efac">Casi seguros</span></div>
      <div class="stat"><b id="sWarm">0</b><span style="color:#fcd34d">Tal vez</span></div>
      <div class="stat"><b id="sCold">0</b><span style="color:#94a3b8">Poco prob.</span></div>
    </div>
    <div class="list" id="list"></div>
    <div style="padding:0 14px 14px">
      <button class="btn" id="scoreAll" style="background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#c7d2fe">Calificar sin calificar</button>
    </div>
  </div>

  <div class="main" id="viewChat">
    <div class="head">
      <div class="av" id="hAv">–</div>
      <div>
        <b id="hName">Selecciona una conversacion</b>
        <small id="hSub">o escribe abajo para iniciar una de prueba</small>
      </div>
      <div class="tag">modo prueba</div>
    </div>
    <div class="msgs" id="msgs"></div>
    <form class="composer" id="form">
      <input id="text" autocomplete="off" placeholder="Escribe como si fueras el cliente...">
      <button id="send" type="submit">Enviar</button>
    </form>
    <div class="hint">Escribes como <b>cliente</b> para probar al bot. Los clientes reales llegaran por WhatsApp o por el chat web.</div>
  </div>

  <div class="main" id="viewPanel" style="display:none">
    <div class="an" id="an"></div>
  </div>

  <div class="main" id="viewCfg" style="display:none">
    <div class="an" id="cfg"></div>
  </div>

  <div class="panel" id="panel">
    <h3>Calificacion</h3>
    <div class="muted" id="pInfo">Selecciona una conversacion.</div>
    <div id="pQual"></div>
    <div id="pBody"></div>
  </div>
</div>

<script>
  const $ = (id) => document.getElementById(id);
  let tenantId = null, phone = null, moneda = "COP";

  const money = (n) => "$" + Number(n).toLocaleString("es-CO") + " " + moneda;
  const hora = (ts) => new Date(ts).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  const fecha = (ts) => new Date(ts).toLocaleString("es-CO");
  const iniciales = (p) => String(p).replace(/[^a-zA-Z0-9]/g, "").slice(-2).toUpperCase() || "??";

  async function jget(url) { const r = await fetch(url); return r.json(); }

  async function loadTenants(keep) {
    const ts = await jget("/api/tenants");
    $("tenant").innerHTML = ts.map(t => '<option value="' + t.id + '">' + t.nombre + '</option>').join("");
    tenantId = keep || (ts[0] && ts[0].id);
    $("tenant").value = tenantId;
    await loadInbox();
  }

  const META = {
    hot:  { label: "Casi seguros",  color: "#16a34a", bg: "#ecfdf3", dot: "#16a34a" },
    warm: { label: "Tal vez",       color: "#b45309", bg: "#fffbeb", dot: "#f59e0b" },
    cold: { label: "Poco probable", color: "#475569", bg: "#f8f9fb", dot: "#94a3b8" },
    none: { label: "Sin calificar", color: "#64748b", bg: "#f8f9fb", dot: "#475569" }
  };
  let inbox = [];

  async function loadInbox() {
    if (!tenantId) return;
    const d = await jget("/api/conversations?tenantId=" + encodeURIComponent(tenantId));
    $("sHot").textContent = d.totales.hot;
    $("sWarm").textContent = d.totales.warm;
    $("sCold").textContent = d.totales.cold;
    inbox = d.conversaciones || [];

    let html = "";
    ["hot", "warm", "cold", "none"].forEach(k => {
      const cs = inbox.filter(c => (c.bucket || "none") === k);
      if (!cs.length) return;
      const m = META[k];
      html += '<h4><span class="gdot" style="background:' + m.dot + '"></span>' + m.label + ' <span>' + cs.length + '</span></h4>';
      html += cs.map(c =>
        '<div class="row' + (c.phone === phone ? ' on' : '') + '" data-p="' + encodeURIComponent(c.phone) + '">' +
          '<div class="av">' + iniciales(c.phone) + '</div>' +
          '<div class="who"><b>' + c.phone + '</b><small>' + (c.lastMessage || "") + '</small></div>' +
          (c.score !== null ? '<div class="sc" style="color:' + m.color + ';background:' + m.bg + '">' + c.score + '</div>' : '') +
        '</div>').join("");
    });
    $("list").innerHTML = html || '<div class="empty">Aun no hay conversaciones. Escribe abajo para crear una de prueba.</div>';
    document.querySelectorAll(".row").forEach(r =>
      r.addEventListener("click", () => openConv(decodeURIComponent(r.dataset.p))));

    const pend = inbox.filter(c => c.stale).length;
    $("scoreAll").textContent = pend ? "Calificar " + pend + " conversacion(es)" : "Todo calificado";
    $("scoreAll").disabled = !pend;
  }

  /** Califica una conversacion en el servidor (usa cache salvo force). */
  async function score(p, force) {
    const r = await fetch("/api/score", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, phone: p, force: !!force }), signal: AbortSignal.timeout(45000)
    });
    const d = await r.json();
    return d.lead;
  }

  $("scoreAll").addEventListener("click", async () => {
    const pend = inbox.filter(c => c.stale);
    $("scoreAll").disabled = true;
    for (let i = 0; i < pend.length; i++) {
      $("scoreAll").textContent = "Calificando " + (i + 1) + "/" + pend.length + "...";
      try { await score(pend[i].phone); } catch (e) { /* seguimos con las demas */ }
      await new Promise(r => setTimeout(r, 400)); // respiro para el limite del proveedor
    }
    await loadInbox();
    if (phone) openConv(phone);
  });

  async function openConv(p) {
    phone = p;
    const d = await jget("/api/conversation?tenantId=" + encodeURIComponent(tenantId) + "&phone=" + encodeURIComponent(p));
    moneda = d.moneda || "COP";
    $("hAv").textContent = iniciales(p);
    $("hName").textContent = p;
    $("hSub").textContent = d.messages.length + " mensajes";
    $("msgs").innerHTML = "";
    d.messages.forEach(m => bubble(m.content, m.role === "user" ? "cli" : "bot", m.created_at));
    renderQual(d);
    renderPanel(d);
    loadInbox();
  }

  function bubble(text, who, ts) {
    const div = document.createElement("div");
    div.className = "b " + who;
    div.textContent = text;
    const s = document.createElement("span");
    s.className = "ts";
    s.textContent = hora(ts || Date.now());
    div.appendChild(s);
    $("msgs").appendChild(div);
    $("msgs").scrollTop = $("msgs").scrollHeight;
  }

  function imgBubble(url, caption) {
    const div = document.createElement("div");
    div.className = "b img";
    const i = document.createElement("img");
    i.src = url; i.alt = caption || ""; i.loading = "lazy";
    div.appendChild(i);
    if (caption) { const c = document.createElement("div"); c.className = "cap"; c.textContent = caption; div.appendChild(c); }
    $("msgs").appendChild(div);
    $("msgs").scrollTop = $("msgs").scrollHeight;
  }

  function renderQual(d) {
    const l = d.lead;
    if (!l) {
      $("pQual").innerHTML = '<div class="muted">Sin calificar todavia.</div>' +
        '<button class="btn" id="bScore">Calificar ahora</button>';
      $("bScore").addEventListener("click", () => runScore(true));
      return;
    }
    const m = META[l.bucket] || META.none;
    const sig = [["interes", "Interes"], ["precio", "Precio"], ["datos", "Datos"], ["urgencia", "Urgencia"]];
    $("pQual").innerHTML =
      '<span class="badge" style="color:' + m.color + ';background:' + m.bg + '">' +
        '<span class="gdot" style="background:' + m.dot + '"></span>' + m.label + ' · ' + l.score + '/100</span>' +
      '<div class="bar"><i style="width:' + l.score + '%;background:' + m.dot + '"></i></div>' +
      '<h5>Por que</h5>' +
      '<ul class="why">' + (l.reasons || []).map(r => '<li>' + r + '</li>').join("") + '</ul>' +
      '<h5>Senales de compra</h5>' +
      '<div class="sig">' + sig.map(([k, lab]) =>
        '<div class="' + (l.signals && l.signals[k] ? "ok" : "no") + '">' +
          (l.signals && l.signals[k] ? "✓" : "○") + " " + lab + '</div>').join("") + '</div>' +
      '<button class="btn" id="bScore">Recalificar</button>';
    $("bScore").addEventListener("click", () => runScore(true));
  }

  async function runScore(force) {
    const b = $("bScore");
    if (b) { b.disabled = true; b.textContent = "Calificando..."; }
    try {
      await score(phone, force);
      const d = await jget("/api/conversation?tenantId=" + encodeURIComponent(tenantId) + "&phone=" + encodeURIComponent(phone));
      renderQual(d);
      loadInbox();
    } catch (e) {
      if (b) { b.disabled = false; b.textContent = "Reintentar"; }
    }
  }

  function renderPanel(d) {
    $("pInfo").textContent = d.phone;
    let h = "";
    h += '<h5>Pedidos (' + d.orders.length + ')</h5>';
    h += d.orders.length ? d.orders.map(o => {
      const items = (o.items || []).map(i => i.cantidad + "x " + i.nombre).join(", ");
      return '<div class="card"><b>#' + o.id + '</b> · ' + (o.cliente || "") +
        '<div class="li">' + items + '</div>' +
        '<div class="li">' + (o.direccion || "") + '</div>' +
        '<div class="tot">' + money(o.total) + '</div></div>';
    }).join("") : '<div class="muted">Sin pedidos.</div>';
    h += '<h5>Reservas (' + d.reservations.length + ')</h5>';
    h += d.reservations.length ? d.reservations.map(r =>
      '<div class="card"><b>#' + r.id + '</b> · ' + r.cliente +
      '<div class="li">' + r.fecha + " · " + r.hora + " · " + r.personas + ' personas</div></div>').join("")
      : '<div class="muted">Sin reservas.</div>';
    $("pBody").innerHTML = h;
  }

  $("tenant").addEventListener("change", async (e) => {
    tenantId = e.target.value; phone = null;
    $("msgs").innerHTML = ""; $("pBody").innerHTML = "";
    $("hName").textContent = "Selecciona una conversacion";
    $("hSub").textContent = "o escribe abajo para iniciar una de prueba";
    $("hAv").textContent = "–"; $("pInfo").textContent = "Selecciona una conversacion.";
    await loadInbox();
  });

  $("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = $("text").value.trim();
    if (!text) return;
    if (!phone) { phone = "web-" + Math.random().toString(36).slice(2, 8); $("hName").textContent = phone; $("hAv").textContent = iniciales(phone); }
    bubble(text, "cli");
    $("text").value = "";
    $("send").disabled = true;
    const t = document.createElement("div");
    t.className = "typing"; t.textContent = "el bot esta escribiendo...";
    $("msgs").appendChild(t); $("msgs").scrollTop = $("msgs").scrollHeight;
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, phone, text }), signal: AbortSignal.timeout(60000)
      });
      const d = await r.json();
      t.remove();
      if (d.reply) bubble(d.reply, "bot");
      (d.images || []).forEach(im => imgBubble(im.url, im.caption));
      if (!d.reply && !(d.images || []).length) bubble(d.error || "Sin respuesta.", "bot");
      const det = await jget("/api/conversation?tenantId=" + encodeURIComponent(tenantId) + "&phone=" + encodeURIComponent(phone));
      renderPanel(det);
      loadInbox();
    } catch (err) {
      t.remove();
      bubble(err && err.name === "TimeoutError" ? "El modelo tardo demasiado (limite gratuito). Intenta de nuevo." : "Error de conexion.", "bot");
    } finally {
      $("send").disabled = false; $("text").focus();
    }
  });

  async function loadMetrics() {
    const d = await jget("/api/metrics?tenantId=" + encodeURIComponent(tenantId));
    moneda = d.moneda || "COP";
    const k = d.kpis, di = d.distribucion;
    const maxDia = Math.max(1, ...d.dias.map(x => x.pedidos));
    const maxProd = Math.max(1, ...d.topProductos.map(p => p.cantidad));

    $("an").innerHTML =
      '<h2>Analitica</h2>' +
      '<div class="kpis">' +
        '<div class="kpi"><b>' + k.conversaciones + '</b><span>Conversaciones</span></div>' +
        '<div class="kpi"><b>' + k.pedidos + '</b><span>Pedidos</span></div>' +
        '<div class="kpi"><b>' + k.reservas + '</b><span>Reservas</span></div>' +
        '<div class="kpi"><b style="color:#16a34a">' + money(k.ingresos) + '</b><span>Ingresos</span></div>' +
        '<div class="kpi"><b>' + money(k.ticket) + '</b><span>Ticket promedio</span></div>' +
        '<div class="kpi"><b style="color:#4f46e5">' + k.conversion + '%</b><span>Conversion</span></div>' +
      '</div>' +

      '<div class="box"><h3>Pedidos por dia (ultimos 7)</h3><div class="chart">' +
        d.dias.map(x =>
          '<div class="col" title="' + x.pedidos + ' pedidos · ' + money(x.ingresos) + '">' +
            '<div class="bx" style="height:' + Math.round((x.pedidos / maxDia) * 100) + '%"></div>' +
            '<small>' + x.dia + '</small></div>').join("") +
      '</div></div>' +

      '<div class="box"><h3>Como se clasifican los clientes</h3><div class="dist">' +
        '<div style="background:#ecfdf3"><b style="color:#16a34a">' + di.hot + '</b><span style="color:#15803d">Casi seguros</span></div>' +
        '<div style="background:#fffbeb"><b style="color:#b45309">' + di.warm + '</b><span style="color:#b45309">Tal vez</span></div>' +
        '<div style="background:#f8f9fb"><b style="color:#475569">' + di.cold + '</b><span style="color:#64748b">Poco prob.</span></div>' +
        '<div style="background:#f8f9fb"><b style="color:#94a3b8">' + di.sinCalificar + '</b><span style="color:#94a3b8">Sin calificar</span></div>' +
      '</div></div>' +

      '<div class="box"><h3>Productos mas pedidos</h3>' +
        (d.topProductos.length ? d.topProductos.map(p =>
          '<div class="prod"><div class="nm">' + p.nombre + '</div>' +
          '<div class="pb"><i style="width:' + Math.round((p.cantidad / maxProd) * 100) + '%"></i></div>' +
          '<div class="qt">' + p.cantidad + '</div></div>').join("")
          : '<div class="muted">Aun no hay pedidos.</div>') +
      '</div>';
  }

  // ---------- configuracion ----------
  let cfgMenu = [];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function menuRows() {
    return cfgMenu.map((m, i) =>
      '<div class="mrow" data-i="' + i + '">' +
        '<input data-f="nombre" value="' + esc(m.nombre) + '" placeholder="Nombre">' +
        '<input data-f="precio" type="number" min="0" value="' + (m.precio || 0) + '" placeholder="Precio">' +
        '<input data-f="categoria" value="' + esc(m.categoria) + '" placeholder="Categoria">' +
        '<input data-f="descripcion" value="' + esc(m.descripcion) + '" placeholder="Descripcion / ingredientes">' +
        '<input data-f="imagen" value="' + esc(m.imagen) + '" placeholder="URL o archivo.jpg">' +
        '<button class="del" data-del="' + i + '" title="Eliminar">✕</button>' +
      '</div>').join("");
  }

  function bindMenuRows() {
    document.querySelectorAll(".mrow input").forEach(inp => {
      inp.addEventListener("input", (e) => {
        const i = Number(e.target.closest(".mrow").dataset.i);
        const f = e.target.dataset.f;
        cfgMenu[i][f] = f === "precio" ? Number(e.target.value) : e.target.value;
      });
    });
    document.querySelectorAll("[data-del]").forEach(b => {
      b.addEventListener("click", () => {
        cfgMenu.splice(Number(b.dataset.del), 1);
        $("mBody").innerHTML = menuRows();
        bindMenuRows();
      });
    });
  }

  async function loadCfg() {
    const [d, info] = await Promise.all([
      jget("/api/tenant?tenantId=" + encodeURIComponent(tenantId)),
      jget("/api/info")
    ]);
    const b = d.business;
    cfgMenu = d.menu.map(m => ({ ...m }));

    $("cfg").innerHTML =
      '<h2>Configuracion</h2>' +
      '<div class="warn">Lo que guardes aqui cambia <b>de inmediato</b> como responde el bot de este negocio: su menu, precios, personalidad y datos.</div>' +

      '<div class="box"><h3>Datos del negocio</h3>' +
        '<div class="grid2">' +
          '<div class="fg"><label>Nombre</label><input id="fNombre" value="' + esc(b.nombre) + '"></div>' +
          '<div class="fg"><label>Tipo</label><select id="fTipo">' +
            '<option value="restaurante"' + (b.tipo_negocio === "restaurante" ? " selected" : "") + '>Restaurante</option>' +
            '<option value="tienda"' + (b.tipo_negocio === "tienda" ? " selected" : "") + '>Tienda</option>' +
          '</select></div>' +
          '<div class="fg"><label>Horario</label><input id="fHorario" value="' + esc(b.horario) + '"></div>' +
          '<div class="fg"><label>Direccion</label><input id="fDir" value="' + esc(b.direccion) + '"></div>' +
          '<div class="fg"><label>Telefono</label><input id="fTel" value="' + esc(b.telefono) + '"></div>' +
          '<div class="fg"><label>Moneda</label><input id="fMoneda" value="' + esc(b.moneda) + '"></div>' +
          '<div class="fg"><label>Medios de pago (separados por coma)</label><input id="fPagos" value="' + esc((b.metodos_pago || []).join(", ")) + '"></div>' +
          '<div class="fg"><label>Costo de domicilio</label><input id="fDom" type="number" min="0" value="' + (b.costo_domicilio || 0) + '"></div>' +
        '</div>' +
        '<div class="fg"><label>Personalidad del bot (como habla)</label><textarea id="fPers">' + esc(b.personalidad) + '</textarea></div>' +
        '<div class="fg"><label>Que es una direccion completa (para que el bot pida lo que falta)</label><textarea id="fDirFmt" placeholder="Ej: Via + numero + placa, como Calle 97 #15-30 apto 501">' + esc(b.formato_direccion) + '</textarea></div>' +
        '<div class="fg"><label>ID del numero de WhatsApp (Meta) — opcional</label><input id="fWa" value="' + esc(b.whatsapp_phone_number_id) + '" placeholder="Lo da Meta al conectar el numero"></div>' +
      '</div>' +

      '<div class="box"><h3>Menu / catalogo (' + cfgMenu.length + ' productos)</h3>' +
        '<div class="mhead"><div>Nombre</div><div>Precio</div><div>Categoria</div><div>Descripcion</div><div>Foto</div><div></div></div>' +
        '<div id="mBody">' + menuRows() + '</div>' +
        '<button class="ghost" id="mAdd">+ Agregar producto</button>' +
      '</div>' +

      '<div class="box"><h3>Sistema</h3>' +
        '<div style="font-size:12.5px;color:#475569;line-height:1.9">' +
          'Cerebro de IA activo: <b>' + esc(info.provider) + '</b><br>' +
          'WhatsApp: <b>' + (info.whatsapp ? "conectado" : "desactivado (falta el token de Meta)") + '</b>' +
        '</div>' +
        '<div style="font-size:11.5px;color:#94a3b8;margin-top:8px">Para cambiar el cerebro de IA edita <b>LLM_PROVIDER</b> en el archivo .env y reinicia.</div>' +
      '</div>' +

      '<div class="bar2"><button class="primary" id="cSave">Guardar cambios</button><span id="cMsg"></span></div>';

    bindMenuRows();
    $("mAdd").addEventListener("click", () => {
      cfgMenu.push({ nombre: "", precio: 0, categoria: "General", descripcion: "", imagen: "" });
      $("mBody").innerHTML = menuRows();
      bindMenuRows();
    });
    $("cSave").addEventListener("click", saveCfg);
  }

  async function saveCfg() {
    const btn = $("cSave"), msg = $("cMsg");
    btn.disabled = true; msg.textContent = "Guardando..."; msg.className = "";
    const business = {
      nombre: $("fNombre").value,
      tipo_negocio: $("fTipo").value,
      horario: $("fHorario").value,
      direccion: $("fDir").value,
      telefono: $("fTel").value,
      moneda: $("fMoneda").value,
      metodos_pago: $("fPagos").value.split(",").map(s => s.trim()).filter(Boolean),
      costo_domicilio: Number($("fDom").value) || 0,
      personalidad: $("fPers").value,
      formato_direccion: $("fDirFmt").value,
      whatsapp_phone_number_id: $("fWa").value
    };
    try {
      const r = await fetch("/api/tenant", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, business, menu: cfgMenu })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      msg.textContent = "✓ Guardado. El bot ya usa esta configuracion.";
      msg.className = "ok";
      await loadTenants(tenantId);
    } catch (e) {
      msg.textContent = "No se pudo guardar: " + e.message;
      msg.style.color = "#b91c1c";
    } finally {
      btn.disabled = false;
    }
  }

  function view(v) {
    $("viewChat").style.display = v === "chat" ? "flex" : "none";
    $("viewPanel").style.display = v === "panel" ? "flex" : "none";
    $("viewCfg").style.display = v === "cfg" ? "flex" : "none";
    $("panel").style.display = v === "chat" ? "" : "none";
    $("nChat").classList.toggle("on", v === "chat");
    $("nPanel").classList.toggle("on", v === "panel");
    $("nCfg").classList.toggle("on", v === "cfg");
    if (v === "panel") loadMetrics();
    if (v === "cfg") loadCfg();
  }
  $("nChat").addEventListener("click", () => view("chat"));
  $("nPanel").addEventListener("click", () => view("panel"));
  $("nCfg").addEventListener("click", () => view("cfg"));

  loadTenants();
</script>
</body>
</html>`;
}
