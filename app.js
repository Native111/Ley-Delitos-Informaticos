/* ============================================================
   Ley de Delitos Informáticos — Lógica de la interfaz
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Utilidades ---------- */
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function foldWithMap(str) {
    let out = ""; const map = [];
    for (let i = 0; i < str.length; i++) {
      const n = str[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      for (const c of n) { out += c; map.push(i); }
    }
    return { out, map };
  }
  function highlight(text, tokens) {
    const { out, map } = foldWithMap(text);
    const ranges = [];
    for (const t of tokens) {
      if (!t || t.length < 2) continue;
      let idx = 0;
      while ((idx = out.indexOf(t, idx)) !== -1) {
        ranges.push([map[idx], map[idx + t.length - 1] + 1]);
        idx += t.length;
      }
    }
    if (!ranges.length) return escapeHTML(text);
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push([r[0], r[1]]);
    }
    let res = "", pos = 0;
    for (const [s, e] of merged) {
      res += escapeHTML(text.slice(pos, s)) + "<mark>" + escapeHTML(text.slice(s, e)) + "</mark>";
      pos = e;
    }
    return res + escapeHTML(text.slice(pos));
  }

  /* ---------- Índice de búsqueda precomputado ---------- */
  const INDEX = ARTICULOS.map((a) => {
    const parts = [a.titulo, "articulo " + a.n, String(a.n)];
    if (a.kw) parts.push(a.kw.join(" "));
    if (a.p) parts.push(a.p.join(" "));
    if (a.defs) parts.push(a.defs.map((d) => d.t + " " + d.v).join(" "));
    if (a.items) parts.push(a.items.join(" "));
    const blob = norm(parts.join(" "));
    return { a, blob, title: norm(a.titulo), kw: norm((a.kw || []).join(" ")) };
  });

  function articleNumberFromQuery(raw) {
    const q = norm(raw).trim();
    const m = q.match(/^(?:(?:art(?:iculo|iculos|\.)?|art\.?|n(?:umero|º|°|o)?\.?|#)\s*)?(\d{1,3})\s*[º°.]?$/);
    if (m) { const n = parseInt(m[1], 10); if (n >= 1 && n <= ARTICULOS.length) return n; }
    return null;
  }

  function computeResults(query) {
    const q = norm(query).trim();
    if (!q) return [];
    const num = articleNumberFromQuery(query);
    if (num) return INDEX.filter((x) => x.a.n === num).map((x) => ({ a: x.a, score: 100 }));
    const tokens = q.split(/\s+/).filter(Boolean);
    const out = [];
    for (const x of INDEX) {
      let score = 0, ok = true;
      for (const t of tokens) {
        let s = 0;
        if (String(x.a.n) === t) s += 12;
        if (x.title.includes(t)) s += 8;
        if (x.kw.includes(t)) s += 5;
        if (x.blob.includes(t)) s += 2;
        if (s === 0) { ok = false; break; }
        score += s;
      }
      if (ok) {
        if (x.title.includes(q)) score += 6;
        out.push({ a: x.a, score });
      }
    }
    out.sort((p, q2) => q2.score - p.score || p.a.n - q2.a.n);
    return out;
  }

  function snippet(a, tokens) {
    const texts = a.p ? a.p.slice() : [];
    if (a.defs) texts.push(a.defs.map((d) => d.t + ": " + d.v).join(" "));
    if (a.items) texts.push(a.items.join(" "));
    let chosen = texts[0] || "";
    if (tokens && tokens.length) {
      for (const t of texts) { if (tokens.some((tk) => norm(t).includes(tk))) { chosen = t; break; } }
      const nt = norm(chosen);
      let first = -1;
      for (const tk of tokens) { const i = nt.indexOf(tk); if (i >= 0 && (first < 0 || i < first)) first = i; }
      if (first > 90) {
        const start = chosen.lastIndexOf(" ", first - 60);
        chosen = "…" + chosen.slice(start > 0 ? start + 1 : first - 60);
      }
    }
    if (chosen.length > 230) chosen = chosen.slice(0, 230).replace(/\s+\S*$/, "") + "…";
    return highlight(chosen, tokens || []);
  }

  /* ---------- Estado ---------- */
  const state = { query: "", filter: "all", view: "home", currentN: null, results: [], selIndex: -1, segments: [], segArticleN: null };

  /* ---------- Referencias DOM ---------- */
  const heroSearch = $("#heroSearch"), toolSearch = $("#toolSearch");
  const heroClear = $("#heroClear"), toolClear = $("#toolClear");
  const suggest = $("#suggest");
  const contentArea = $("#contentArea"), contextLine = $("#contextLine");
  const filtersEl = $("#filters"), indexScroll = $("#indexScroll");
  const sidebar = $("#sidebar"), drawerOverlay = $("#drawerOverlay");

  /* ---------- Iconos ---------- */
  const IC = {
    prison: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 21V5m16 16V5M4 9h16M4 15h16M9 5v16m6-16v16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    fine: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v10m2.5-8.5c0-1-1.1-1.7-2.5-1.7s-2.5.7-2.5 1.7 1 1.5 2.5 1.8 2.5.8 2.5 1.8-1.1 1.7-2.5 1.7-2.5-.7-2.5-1.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none"><path d="M19 12H5m6 6-6-6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 8V3h10v5M7 17H4a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-3" stroke="currentColor" stroke-width="1.7"/><rect x="7" y="14" width="10" height="7" stroke="currentColor" stroke-width="1.7"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none"><path d="M19 12H5m6 6-6-6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="none"><path d="M11 5 6 9H3v6h3l5 4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    stopSq: '<svg viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>',
  };

  /* ---------- Piezas de UI ---------- */
  function penaChips(a, big) {
    if (!a.pena) return "";
    return '<span class="pena-chip prision">' + IC.prison + " Prisión: " + escapeHTML(a.pena.prision) + "</span>" +
      '<span class="pena-chip multa">' + IC.fine + " Multa: " + escapeHTML(a.pena.multa) + "</span>";
  }

  function cardHTML(a, tokens) {
    const kicker = a.capNombre ? "Título " + a.tituloId + " · Cap. " + a.capId : "Título " + a.tituloId;
    const listen = TTS.supported ?
      '<button class="card-listen" data-listen="' + a.n + '" title="Escuchar artículo ' + a.n + '" aria-label="Escuchar artículo ' + a.n + ' en voz alta">' + IC.speaker + "</button>" : "";
    return '<div class="card reveal" role="button" tabindex="0" data-art="' + a.n + '" aria-label="Artículo ' + a.n + ': ' + escapeHTML(a.titulo) + '">' +
      '<div class="card-top"><span class="card-num">' + a.n + "</span>" +
      '<div class="card-titles"><span class="kicker">' + escapeHTML(kicker) + "</span>" +
      "<h4>" + highlight(a.titulo, tokens) + "</h4></div>" + listen + "</div>" +
      '<p class="card-snippet">' + snippet(a, tokens) + "</p>" +
      '<div class="card-foot">' + (a.esDelito ? '<span class="tag-delito">Delito</span>' : "") + penaChips(a) +
      '<span class="card-arrow">' + IC.arrow + "</span></div></div>";
  }

  /* ---------- Render: explorar (home) ---------- */
  function renderHome() {
    const tokens = [];
    let html = "";
    for (const t of TITULOS) {
      if (state.filter !== "all" && state.filter !== t.id) continue;
      const arts = ARTICULOS.filter((a) => a.tituloId === t.id);
      html += '<div class="group reveal"><div class="group-head"><span class="g-roman">Título ' + t.id + "</span><h3>" +
        escapeHTML(t.nombre) + '</h3><span class="g-range">Art. ' + t.desde + "–" + t.hasta + "</span></div>";
      if (t.capitulos) {
        for (const c of t.capitulos) {
          const ca = arts.filter((a) => a.capId === c.id);
          html += '<div class="cap-sub">Capítulo ' + c.id + " · " + escapeHTML(c.nombre) + "</div>";
          html += '<div class="cards">' + ca.map((a) => cardHTML(a, tokens)).join("") + "</div>";
        }
      } else {
        html += '<div class="cards">' + arts.map((a) => cardHTML(a, tokens)).join("") + "</div>";
      }
      html += "</div>";
    }
    contentArea.innerHTML = html || emptyHTML("No hay artículos en este filtro.");
    observeReveals();
  }

  /* ---------- Render: resultados ---------- */
  function renderResults() {
    const tokens = norm(state.query).trim().split(/\s+/).filter(Boolean);
    let list = state.results;
    if (state.filter !== "all") list = list.filter((r) => r.a.tituloId === state.filter);
    if (!list.length) {
      contentArea.innerHTML = emptyHTML("Sin resultados para «" + escapeHTML(state.query) + "». Prueba con un número de artículo (1–33) o palabras como «fraude», «privacidad» o «tarjetas».");
      return;
    }
    contentArea.innerHTML = '<div class="cards">' + list.map((r) => cardHTML(r.a, tokens)).join("") + "</div>";
    observeReveals();
  }

  function emptyHTML(msg) {
    return '<div class="empty">' + IC.search + "<h3>Nada por aquí</h3><p>" + msg + "</p></div>";
  }

  /* ---------- Render: detalle ---------- */
  function renderArticle(n) {
    const a = ARTICULOS.find((x) => x.n === n);
    if (!a) { renderHome(); return; }
    state.currentN = n;
    const tokens = norm(state.query).trim().split(/\s+/).filter(Boolean);

    const segs = [];
    segs.push("Artículo " + a.n + ". " + a.titulo + ".");
    let body = "";
    if (a.p) body += a.p.map((p) => { const s = segs.length; segs.push(p); return '<p data-seg="' + s + '">' + highlight(p, tokens) + "</p>"; }).join("");
    if (a.defs) {
      body += '<ul class="defs">' + a.defs.map((d) => { const s = segs.length; segs.push(d.k + ". " + d.t + ". " + d.v); return '<li data-seg="' + s + '"><span class="dk">' + escapeHTML(d.k) + '</span><span class="dv"><b>' + highlight(d.t, tokens) + ".</b> " + highlight(d.v, tokens) + "</span></li>"; }).join("") + "</ul>";
    }
    if (a.items) {
      body += '<ol class="num-items">' + a.items.map((it, idx) => { const s = segs.length; segs.push((idx + 1) + ". " + it); return '<li data-seg="' + s + '">' + highlight(it, tokens) + "</li>"; }).join("") + "</ol>";
    }
    let penaSeg = -1;
    if (a.pena) { penaSeg = segs.length; segs.push("Pena: prisión de " + a.pena.prision + ", y multa de " + a.pena.multa + "."); }
    state.segments = segs;
    state.segArticleN = n;

    const crumbs =
      '<button data-back="1">' + (state.query ? "Resultados" : "Explorar") + "</button><span class='sep'>›</span>" +
      "<span>Título " + a.tituloId + " · " + escapeHTML(a.tituloNombre) + "</span>" +
      (a.capId ? "<span class='sep'>›</span><span>Capítulo " + a.capId + "</span>" : "") +
      "<span class='sep'>›</span><span class='cur'>Artículo " + a.n + "º</span>";

    const prev = ARTICULOS.find((x) => x.n === n - 1);
    const next = ARTICULOS.find((x) => x.n === n + 1);
    const navHTML =
      '<div class="article-nav">' +
      (prev ? '<button class="nav-art" data-art="' + prev.n + '"><span class="dir">' + IC.left + " Anterior</span><b>Art. " + prev.n + " · " + escapeHTML(prev.titulo) + "</b></button>"
        : '<button class="nav-art disabled"><span class="dir">' + IC.left + " Anterior</span><b>Inicio de la ley</b></button>") +
      (next ? '<button class="nav-art next" data-art="' + next.n + '"><span class="dir">Siguiente ' + IC.arrow + "</span><b>Art. " + next.n + " · " + escapeHTML(next.titulo) + "</b></button>"
        : '<button class="nav-art next disabled"><span class="dir">Siguiente ' + IC.arrow + "</span><b>Fin de la ley</b></button>") +
      "</div>";

    const related = ARTICULOS.filter((x) => x.n !== n && (a.capId ? x.capId === a.capId && x.tituloId === a.tituloId : x.tituloId === a.tituloId)).slice(0, 8);
    const relatedHTML = related.length ?
      '<div class="related"><h4>Artículos relacionados</h4><div class="related-chips">' +
      related.map((r) => '<button class="chip" data-art="' + r.n + '">Art. ' + r.n + " · " + escapeHTML(r.titulo) + "</button>").join("") +
      "</div></div>" : "";

    contentArea.innerHTML =
      '<div class="article-view"><div class="breadcrumb">' + crumbs + "</div>" +
      '<article class="article-card"><span class="watermark-num">' + a.n + "</span>" +
      '<div class="article-head"><span class="article-badge">' + a.n + "</span>" +
      '<div class="article-headings"><span class="label">Artículo ' + a.n + "º" + (a.esDelito ? " · Delito" : "") + "</span>" +
      '<h2 data-seg="0">' + escapeHTML(a.titulo) + "</h2>" +
      (a.pena ? '<div class="article-penas"' + (penaSeg >= 0 ? ' data-seg="' + penaSeg + '"' : "") + ">" + penaChips(a, true) + "</div>" : "") +
      "</div></div>" +
      '<div class="article-body">' + body + "</div>" +
      '<div class="article-actions">' +
      (TTS.supported ? '<button class="btn listen" id="listenBtn">' + IC.speaker + " Escuchar artículo</button>" : "") +
      '<button class="btn primary" id="copyBtn">' + IC.copy + " Copiar artículo</button>" +
      '<button class="btn" id="printBtn">' + IC.print + " Imprimir</button>" +
      '<button class="btn" data-back="1">' + IC.back + " Volver</button>" +
      "</div></article>" + navHTML + relatedHTML + "</div>";

    const lb = $("#listenBtn");
    if (lb) lb.addEventListener("click", () => TTS.toggleFromButton(a.n));
    $("#copyBtn").addEventListener("click", () => copyArticle(a));
    $("#printBtn").addEventListener("click", () => window.print());
    TTS.updateUI();
    syncIndexActive(n);
  }

  function articlePlainText(a) {
    let s = "Artículo " + a.n + "º — " + a.titulo + "\n\n";
    if (a.p) s += a.p.join("\n\n") + "\n";
    if (a.defs) s += "\n" + a.defs.map((d) => d.k + ". " + d.t + ": " + d.v).join("\n\n") + "\n";
    if (a.items) s += "\n" + a.items.map((it, i) => (i + 1) + "º " + it).join("\n\n") + "\n";
    if (a.pena) s += "\nPena: prisión de " + a.pena.prision + " y multa de " + a.pena.multa + ".\n";
    s += "\n— Ley Especial contra los Delitos Informáticos (Venezuela, 2001).";
    return s;
  }

  function copyArticle(a) {
    const text = articlePlainText(a);
    const done = () => showToast("Artículo " + a.n + "º copiado al portapapeles");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { showToast("No se pudo copiar"); }
    document.body.removeChild(ta);
  }

  /* ---------- Contexto / título de sección ---------- */
  function updateContext() {
    if (state.view === "article") {
      const a = ARTICULOS.find((x) => x.n === state.currentN);
      contextLine.innerHTML = "<h2>Artículo " + a.n + "º</h2><span class='count'>" + escapeHTML(a.titulo) + "</span>";
    } else if (state.view === "results") {
      let list = state.results;
      if (state.filter !== "all") list = list.filter((r) => r.a.tituloId === state.filter);
      contextLine.innerHTML = "<h2>Resultados</h2><span class='count'><b>" + list.length + "</b> artículo(s) para «" + escapeHTML(state.query) + "»</span>";
    } else {
      contextLine.innerHTML = "<h2>Explorar la ley</h2><span class='count'><b>" + ARTICULOS.length + "</b> artículos · 4 títulos · 21 delitos tipificados</span>";
    }
  }

  function renderContent() {
    if (state.view === "article") renderArticle(state.currentN);
    else if (state.view === "results") renderResults();
    else renderHome();
    updateContext();
  }

  /* ---------- Búsqueda central ---------- */
  function syncInputs(q) {
    if (heroSearch.value !== q) heroSearch.value = q;
    if (toolSearch.value !== q) toolSearch.value = q;
    heroClear.classList.toggle("show", !!q);
    toolClear.classList.toggle("show", !!q);
  }

  function runSearch(q, opts) {
    TTS.stop();
    opts = opts || {};
    state.query = q;
    syncInputs(q);
    const num = articleNumberFromQuery(q);
    if (num && opts.openNumber) { openArticle(num); return; }
    state.results = computeResults(q);
    state.view = q.trim() ? "results" : "home";
    state.currentN = null;
    renderContent();
    if (opts.scroll) scrollToContent();
  }

  function openArticle(n) {
    TTS.stop();
    state.view = "article";
    state.currentN = n;
    closeSuggest();
    renderContent();
    try { history.replaceState(null, "", "#art-" + n); } catch (e) {}
    scrollToContent();
    closeDrawer();
  }

  function scrollToContent() {
    const y = $("#explorar").getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  /* ---------- Sugerencias ---------- */
  function renderSuggest(q) {
    const num = articleNumberFromQuery(q);
    let items;
    if (num) items = [{ a: ARTICULOS.find((x) => x.n === num) }];
    else items = computeResults(q).slice(0, 6);
    state.selIndex = -1;
    if (!q.trim()) { closeSuggest(); return; }
    if (!items.length) {
      suggest.innerHTML = '<div class="suggest-empty">Sin coincidencias. Prueba «fraude», «privacidad» o un número (1–33).</div>';
      suggest.classList.add("open"); return;
    }
    suggest.innerHTML = items.map((r, i) =>
      '<div class="suggest-item" data-art="' + r.a.n + '" data-i="' + i + '"><span class="suggest-num">' + r.a.n + "</span>" +
      '<span class="suggest-meta"><b>' + escapeHTML(r.a.titulo) + "</b><span>Artículo " + r.a.n + "º · Título " + r.a.tituloId + (r.a.capId ? " · Cap. " + r.a.capId : "") + "</span></span></div>").join("");
    suggest.classList.add("open");
  }
  function closeSuggest() { suggest.classList.remove("open"); state.selIndex = -1; }
  function moveSel(d) {
    const items = $$(".suggest-item", suggest);
    if (!items.length) return;
    state.selIndex = (state.selIndex + d + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle("sel", i === state.selIndex));
    items[state.selIndex].scrollIntoView({ block: "nearest" });
  }

  /* ---------- Índice lateral ---------- */
  function buildIndex() {
    let html = "";
    for (const t of TITULOS) {
      const open = t.id === "II" ? " open" : "";
      html += '<div class="idx-titulo' + open + '" data-titulo="' + t.id + '">' +
        '<button class="idx-titulo-btn"><span class="roman">' + t.id + '</span><span class="tt">' + escapeHTML(t.nombre) +
        '</span><svg class="caret" viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<div class="idx-body">';
      if (t.capitulos) {
        for (const c of t.capitulos) {
          html += '<div class="idx-cap">Cap. ' + c.id + " · " + escapeHTML(c.nombre) + "</div>";
          html += ARTICULOS.filter((a) => a.capId === c.id && a.tituloId === t.id).map(idxArt).join("");
        }
      } else {
        html += ARTICULOS.filter((a) => a.tituloId === t.id).map(idxArt).join("");
      }
      html += "</div></div>";
    }
    indexScroll.innerHTML = html;
  }
  function idxArt(a) {
    return '<button class="idx-art" data-art="' + a.n + '"><span class="an">' + a.n + '</span><span class="at">' + escapeHTML(a.titulo) + "</span></button>";
  }
  function syncIndexActive(n) {
    $$(".idx-art", indexScroll).forEach((el) => el.classList.toggle("active", +el.dataset.art === n));
    const a = ARTICULOS.find((x) => x.n === n);
    if (a) {
      const grp = $('.idx-titulo[data-titulo="' + a.tituloId + '"]', indexScroll);
      if (grp) grp.classList.add("open");
    }
  }

  /* ---------- Filtros ---------- */
  function buildFilters() {
    const opts = [
      { id: "all", label: "Todos" },
      { id: "I", label: "Título I" },
      { id: "II", label: "Título II · Delitos" },
      { id: "III", label: "Título III" },
      { id: "IV", label: "Título IV" },
    ];
    filtersEl.innerHTML = opts.map((o) => '<button class="filter' + (o.id === state.filter ? " active" : "") + '" data-filter="' + o.id + '">' + o.label + "</button>").join("");
  }

  /* ---------- Hero: descripción, stats, chips ---------- */
  function buildHero() {
    $("#heroDesc").innerHTML = escapeHTML(LEY_META.descripcion) + "<cite>— Artículo 1º · Objeto de la ley</cite>";
    const stats = [
      { n: ARTICULOS.length, l: "Artículos", c: "s-yellow" },
      { n: TITULOS.length, l: "Títulos", c: "s-blue" },
      { n: 5, l: "Capítulos", c: "s-green" },
      { n: ARTICULOS.filter((a) => a.esDelito).length, l: "Delitos", c: "s-red" },
    ];
    $("#heroStats").innerHTML = stats.map((s) => '<div class="stat ' + s.c + '"><b>' + s.n + "</b><span>" + s.l + "</span></div>").join("");
    const chips = [
      { label: "Art. 6 · Acceso indebido", q: "6" },
      { label: "Fraude", q: "fraude" },
      { label: "Privacidad", q: "privacidad" },
      { label: "Tarjetas", q: "tarjetas" },
      { label: "Menores", q: "niños" },
      { label: "Propiedad intelectual", q: "propiedad intelectual" },
    ];
    $("#quickChips").innerHTML = chips.map((c) => '<button class="chip" data-q="' + escapeHTML(c.q) + '">' + escapeHTML(c.label) + "</button>").join("");
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function showToast(msg) {
    $("#toastMsg").textContent = msg;
    const t = $("#toast");
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- Reveal on scroll ---------- */
  let revealObserver;
  function observeReveals() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach((el) => el.classList.add("visible")); return; }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); revealObserver.unobserve(e.target); } });
      }, { threshold: 0.08 });
    }
    $$(".reveal:not(.visible)").forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Drawer móvil ---------- */
  function openDrawer() { sidebar.classList.add("open"); drawerOverlay.classList.add("show"); }
  function closeDrawer() { sidebar.classList.remove("open"); drawerOverlay.classList.remove("show"); }

  /* ---------- Lluvia binaria (canvas) ---------- */
  function initRain() {
    const canvas = $("#rain");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const fontSize = 16;
    let W = 0, H = 0, cols = [], last = 0, running = true, raf = null;
    function resize() {
      const r = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = r.width; H = r.height;
      canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr);
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(1, Math.floor(W / fontSize));
      cols = Array.from({ length: n }, () => Math.random() * (H / fontSize));
    }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (!running || document.hidden) return;
      if (t - last < 75) return;
      last = t;
      ctx.clearRect(0, 0, W, H);
      ctx.font = fontSize + "px monospace";
      for (let i = 0; i < cols.length; i++) {
        const ch = Math.random() > 0.5 ? "1" : "0";
        const x = i * fontSize, y = cols[i] * fontSize;
        ctx.fillStyle = i % 8 === 0 ? "rgba(255,204,0,0.95)" : "rgba(111,155,255,0.95)";
        ctx.fillText(ch, x, y);
        if (y > H && Math.random() > 0.97) cols[i] = 0;
        cols[i] += 1;
      }
    }
    resize();
    raf = requestAnimationFrame(frame);
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 180); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => { running = es[0].isIntersecting; }, { threshold: 0 }).observe(canvas.parentElement);
    }
    document.addEventListener("visibilitychange", () => { if (!document.hidden) last = 0; });
  }

  /* ---------- Navbar activo ---------- */
  function initNavState() {
    const links = $$(".nav-links a[data-nav]");
    function update() {
      const heroH = $(".hero").offsetHeight;
      const inHero = window.scrollY < heroH - 120;
      links.forEach((l) => l.classList.toggle("active", l.dataset.nav === (inHero ? "top" : "explorar")));
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------- Lectura en voz alta (español) ---------- */
  const TTS = {
    systemSupported: ("speechSynthesis" in window) && ("SpeechSynthesisUtterance" in window),
    offlineReady: false, engine: "system",
    voices: [], voice: null, rate: 1, systemVoiceCount: 0, userPick: null, ready: false,
    articleN: null, i: 0, frac: 0, playing: false, paused: false,
    gen: 0, keepAlive: null, el: {}, helpReturnFocus: null,
    audioCtx: null, source: null, bufDuration: 0, startedAt: 0, tickTimer: null,

    get supported() { return this.offlineReady || this.systemSupported; },

    init() {
      this.el = {
        player: $("#ttsPlayer"), title: $("#ttsTitle"), sub: $("#ttsSub"),
        play: $("#ttsPlay"), stop: $("#ttsStop"), close: $("#ttsClose"),
        rate: $("#ttsRate"), voice: $("#ttsVoice"), bar: $("#ttsBar"),
        seg: $("#ttsSeg"), note: $("#ttsVoiceNote"), nav: $("#navAudio"),
        detect: $("#ttsDetect"), help: $("#ttsVoiceHelp"),
        helpDialog: $("#voiceHelp"), helpStatus: $("#voiceHelpStatus"),
      };
      this.initOffline();
      if (!this.supported) return;
      this.loadVoices();
      if (this.systemSupported) {
        try { speechSynthesis.onvoiceschanged = () => this.loadVoices(); } catch (e) {}
        [250, 900, 2000].forEach((t) => setTimeout(() => { if (!this.voices.length) this.loadVoices(); }, t));
      }
      this.el.play.addEventListener("click", () => this.togglePlay());
      this.el.stop.addEventListener("click", () => this.stop());
      this.el.close.addEventListener("click", () => this.stop());
      this.el.nav.addEventListener("click", () => this.stop());
      this.el.rate.addEventListener("change", (e) => this.setRate(parseFloat(e.target.value)));
      this.el.voice.addEventListener("change", (e) => this.setVoice(e.target.value));
      if (this.el.detect) this.el.detect.addEventListener("click", () => this.detectVoices());
      if (this.el.help) this.el.help.addEventListener("click", () => this.openHelp());
      const d = this.el.helpDialog;
      if (d) {
        $("#voiceHelpClose").addEventListener("click", () => this.closeHelp());
        $("#voiceHelpOk").addEventListener("click", () => this.closeHelp());
        $("#voiceHelpDetect").addEventListener("click", () => this.detectVoices());
        d.addEventListener("click", (e) => { if (e.target === d) this.closeHelp(); });
        d.addEventListener("close", () => this.restoreHelpFocus());
      }
      window.addEventListener("beforeunload", () => { try { speechSynthesis.cancel(); } catch (e) {} });
      this.ready = true;
    },

    initOffline() {
      const ms = window.meSpeak;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!ms || !window.__VOZ_CONFIG || !window.__VOZ_VOICE_ES_LA || !AC) { this.offlineReady = false; return; }
      try {
        if (!ms.isConfigLoaded()) ms.loadConfig(window.__VOZ_CONFIG);
        if (!ms.isVoiceLoaded("es-la")) ms.loadVoice(window.__VOZ_VOICE_ES_LA);
        ms.setDefaultVoice("es-la");
        this.offlineReady = !!(ms.isConfigLoaded() && ms.isVoiceLoaded("es-la"));
      } catch (e) { this.offlineReady = false; }
      if (this.offlineReady) {
        setTimeout(() => { try { ms.speak("hola", { rawdata: true, voice: "es-la" }); } catch (e) {} }, 0);
      }
    },
    ensureCtx() { const AC = window.AudioContext || window.webkitAudioContext; if (!this.audioCtx) this.audioCtx = new AC(); return this.audioCtx; },

    voiceKey(v) { return (v && v.name ? v.name : "") + "|" + (v && v.lang ? v.lang : ""); },
    voiceRank(v) {
      const lang = String(v.lang || "").toLowerCase().replace("_", "-");
      const neutral = ["es-419", "es-mx", "es-us", "es-co", "es-pe", "es-ve", "es-cl", "es-ec", "es-gt", "es-cu", "es-bo", "es-do", "es-hn", "es-ni", "es-pa", "es-pr", "es-py", "es-sv", "es-uy", "es-ar", "es-es"];
      const i = neutral.indexOf(lang);
      const natural = /natural|neural|online/i.test(v.name || "") ? 0 : 1;
      return (i < 0 ? neutral.length : i) * 2 + natural;
    },

    loadVoices(announce) {
      const sel = this.el.voice;
      if (!sel) return;
      const all = this.systemSupported ? (speechSynthesis.getVoices() || []) : [];
      const es = all.filter((v) => /^es/i.test(v.lang || ""))
        .sort((a, b) => this.voiceRank(a) - this.voiceRank(b) || String(a.name).localeCompare(String(b.name)));
      const prevEngine = this.engine;
      const prevKey = this.voice ? this.voiceKey(this.voice) : null;
      const hadBrowserEs = this.voices.length > 0;
      this.systemVoiceCount = all.length;
      this.voices = es;

      let opts = es.map((v, idx) => '<option value="s' + idx + '">' + escapeHTML(v.name || "Voz en español") + " · " + escapeHTML(v.lang) + "</option>");
      if (this.offlineReady) opts.push('<option value="offline">Español neutral · sin conexión</option>');
      if (!opts.length) opts = ['<option value="">Voz del navegador</option>'];
      sel.innerHTML = opts.join("");
      sel.disabled = !es.length && !this.offlineReady;

      let val = "";
      if (this.userPick === "offline" && this.offlineReady) val = "offline";
      else if (this.userPick) {
        const idx = es.findIndex((v) => this.voiceKey(v) === this.userPick);
        if (idx >= 0) val = "s" + idx;
      }
      if (!val) val = es.length ? "s0" : (this.offlineReady ? "offline" : "");
      sel.value = val;
      this.applyVoiceSelection(val);
      this.updateNote();
      this.updateHelpStatus();

      const nowKey = this.voice ? this.voiceKey(this.voice) : null;
      if ((prevEngine !== this.engine || prevKey !== nowKey) && this.playing && !this.paused) this.speakCurrent();
      if (announce) {
        showToast(es.length
          ? "Voz en español del navegador activada: " + (es[0].name || "voz en español")
          : "El navegador aún no tiene voz en español; se usa la voz neutral sin conexión.");
      } else if (es.length && !hadBrowserEs && this.ready) {
        showToast("Voz en español del navegador disponible: " + (es[0].name || "voz en español"));
      }
    },

    detectVoices() {
      const btn = this.el.detect;
      if (btn) { btn.classList.add("spin"); btn.disabled = true; }
      if (!this.systemSupported) {
        if (btn) { btn.classList.remove("spin"); btn.disabled = false; }
        showToast("Este navegador no admite voces del sistema.");
        return;
      }
      try { speechSynthesis.getVoices(); } catch (e) {}
      setTimeout(() => {
        if (btn) { btn.classList.remove("spin"); btn.disabled = false; }
        this.loadVoices(true);
      }, 420);
    },

    applyVoiceSelection(val) {
      if (val === "offline") { this.engine = "offline"; this.voice = null; }
      else if (val && val.charAt(0) === "s") { this.engine = "system"; this.voice = this.voices[+val.slice(1)] || null; }
      else { this.engine = "system"; this.voice = null; }
    },
    updateNote() {
      const n = this.el.note, help = this.el.help;
      if (!n) return;
      let showHelp = false;
      if (this.engine === "system" && this.voice) {
        n.textContent = "Voz en español del navegador activa.";
        n.classList.remove("warn");
      } else if (this.engine === "offline" && this.offlineReady) {
        if (this.voices.length) { n.textContent = "Voz neutral sin conexión (elegida manualmente)."; n.classList.remove("warn"); }
        else { n.textContent = "El navegador no tiene voz en español."; n.classList.add("warn"); showHelp = true; }
      } else {
        n.textContent = "Este navegador no ofrece voz en español.";
        n.classList.add("warn");
        showHelp = true;
      }
      if (help) help.hidden = !showHelp;
    },

    openHelp() {
      const d = this.el.helpDialog;
      if (!d) return;
      this.updateHelpStatus();
      this.helpReturnFocus = document.activeElement;
      if (typeof d.showModal === "function") { if (!d.open) d.showModal(); }
      else d.setAttribute("open", "");
    },
    closeHelp() {
      const d = this.el.helpDialog;
      if (!d) return;
      if (typeof d.close === "function" && d.open) { d.close(); this.restoreHelpFocus(); }
      else { d.removeAttribute("open"); this.restoreHelpFocus(); }
    },
    restoreHelpFocus() {
      const d = this.el.helpDialog, t = this.helpReturnFocus;
      this.helpReturnFocus = null;
      const a = document.activeElement;
      const stuck = !!(d && a && d.contains(a));
      if (!stuck && a && a !== document.body) return;
      if (stuck && a.blur) { try { a.blur(); } catch (e) {} }
      if (t && t !== document.body && document.contains(t) && !t.closest("[inert]") && t.getClientRects().length) {
        try { t.focus({ preventScroll: true }); return; } catch (e) {}
      }
      const lb = $("#listenBtn");
      if (lb && !lb.closest("[inert]")) { try { lb.focus({ preventScroll: true }); } catch (e) {} }
    },
    updateHelpStatus() {
      const s = this.el.helpStatus;
      if (!s) return;
      const es = this.voices;
      if (es.length) {
        s.dataset.state = "ok";
        s.innerHTML = "<b>Listo.</b> El navegador ofrece " + es.length + (es.length === 1 ? " voz en español" : " voces en español") +
          " y la lectura usa por defecto <b>" + escapeHTML(es[0].name || "voz en español") + "</b> (" + escapeHTML(es[0].lang) + ").";
      } else {
        s.dataset.state = "warn";
        s.innerHTML = "<b>Ahora mismo:</b> el navegador solo expone " + this.systemVoiceCount +
          (this.systemVoiceCount === 1 ? " voz" : " voces") + " y ninguna en español. Instala la voz en español de Windows con estos pasos:";
      }
    },

    _clear() {
      this.gen++;
      this.stopSource();
      if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
      if (this.systemSupported) { try { speechSynthesis.cancel(); } catch (e) {} }
      if (this.audioCtx && this.audioCtx.state === "suspended") { try { this.audioCtx.resume(); } catch (e) {} }
      if (this.keepAlive) { clearInterval(this.keepAlive); this.keepAlive = null; }
      $$("[data-seg].reading").forEach((el) => el.classList.remove("reading"));
    },
    stopSource() {
      if (this.source) { this.source.onended = null; try { this.source.stop(); } catch (e) {} this.source = null; }
      this.bufDuration = 0;
    },

    start(n) {
      if (!this.supported) { showToast("Tu navegador no admite la lectura en voz alta."); return; }
      const segs = state.segments;
      if (!segs || !segs.length || state.segArticleN !== n) { showToast("Abre un artículo para escucharlo."); return; }
      this._clear();
      this.loadVoices();
      this.articleN = n; this.i = 0; this.frac = 0; this.playing = true; this.paused = false;
      const a = ARTICULOS.find((x) => x.n === n);
      this.el.title.textContent = "Artículo " + n + " · " + (a ? a.titulo : "");
      this.el.player.classList.add("show");
      this.el.player.classList.remove("paused");
      this.el.player.setAttribute("aria-hidden", "false");
      try { this.el.player.inert = false; } catch (e) {}
      this.el.nav.hidden = false;
      if (this.engine === "system") this.startKeepAlive();
      this.startTicker();
      this.speakCurrent();
      this.updateUI();
    },

    speakCurrent() {
      const segs = state.segments;
      if (!this.playing || !segs || this.i >= segs.length) { this.finish(); return; }
      const text = segs[this.i];
      const g = ++this.gen;
      this.frac = 0;
      this.stopSource();
      if (this.systemSupported) { try { speechSynthesis.cancel(); } catch (e) {} }
      this.highlight();
      this.updateMeta();
      if (this.engine === "offline" && this.offlineReady) this.speakOffline(text, g);
      else this.speakSystem(text, g);
      this.updateProgress();
    },

    speakOffline(text, g) {
      let wav = null;
      try { wav = window.meSpeak.speak(text, { rawdata: true, voice: "es-la", speed: Math.round(175 * this.rate), pitch: 50, amplitude: 100 }); } catch (e) { wav = null; }
      if (!wav) { this.speakSystem(text, g); return; }
      const ctx = this.ensureCtx();
      const done = (buf) => { if (g !== this.gen || !this.playing) return; this.playBuffer(buf, g); };
      const fail = () => { if (g === this.gen && this.playing) this.speakSystem(text, g); };
      try { ctx.decodeAudioData(wav, done, fail); } catch (e) { fail(); }
    },

    playBuffer(buf, g) {
      const ctx = this.ensureCtx();
      if (ctx.state === "suspended" && !this.paused) { try { ctx.resume(); } catch (e) {} }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      this.source = src;
      this.bufDuration = buf.duration || 0;
      this.startedAt = ctx.currentTime;
      src.onended = () => { if (g !== this.gen) return; this.i++; this.frac = 0; if (this.i >= state.segments.length) this.finish(); else this.speakCurrent(); };
      try { src.start(0); } catch (e) {}
      if (this.paused) { try { ctx.suspend(); } catch (e) {} }
    },

    speakSystem(text, g) {
      if (!this.systemSupported) { this.finish(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.voice ? this.voice.lang : "es-ES";
      if (this.voice) u.voice = this.voice;
      u.rate = this.rate; u.pitch = 1; u.volume = 1;
      u.onboundary = (ev) => {
        if (g !== this.gen) return;
        if (typeof ev.charIndex === "number" && text.length) { this.frac = Math.min(1, ev.charIndex / text.length); this.updateProgress(); }
      };
      u.onend = () => { if (g !== this.gen) return; this.i++; this.frac = 0; if (this.i >= state.segments.length) this.finish(); else this.speakCurrent(); };
      u.onerror = (ev) => {
        if (g !== this.gen) return;
        if (ev && (ev.error === "canceled" || ev.error === "interrupted")) return;
        this.i++; this.frac = 0; if (this.i >= state.segments.length) this.finish(); else this.speakCurrent();
      };
      setTimeout(() => { if (g === this.gen && this.playing) { try { speechSynthesis.speak(u); } catch (e) {} } }, 50);
    },

    startTicker() {
      if (this.tickTimer) clearInterval(this.tickTimer);
      this.tickTimer = setInterval(() => {
        if (!this.playing) return;
        if (this.engine === "offline" && this.audioCtx && this.bufDuration && !this.paused) {
          this.frac = Math.min(1, Math.max(0, (this.audioCtx.currentTime - this.startedAt) / this.bufDuration));
        }
        this.updateProgress();
      }, 200);
    },

    startKeepAlive() {
      if (this.keepAlive) clearInterval(this.keepAlive);
      this.keepAlive = setInterval(() => {
        if (!this.playing || this.paused || this.engine !== "system") return;
        try { if (speechSynthesis.speaking && !speechSynthesis.paused) { speechSynthesis.pause(); speechSynthesis.resume(); } } catch (e) {}
      }, 10000);
    },

    pause() {
      if (!this.playing || this.paused) return;
      if (this.engine === "offline") { if (this.audioCtx) { try { this.audioCtx.suspend(); } catch (e) {} } }
      else { try { speechSynthesis.pause(); } catch (e) {} }
      this.paused = true; this.updateUI();
    },
    resume() {
      if (!this.playing || !this.paused) return;
      if (this.engine === "offline") { if (this.audioCtx) { try { this.audioCtx.resume(); } catch (e) {} } }
      else { try { speechSynthesis.resume(); } catch (e) {} }
      this.paused = false; this.updateUI();
    },
    togglePlay() { if (!this.playing) return; if (this.paused) this.resume(); else this.pause(); },

    setRate(r) { this.rate = r || 1; if (this.playing && !this.paused) this.speakCurrent(); },
    setVoice(val) {
      if (val === "offline") this.userPick = "offline";
      else if (val && val.charAt(0) === "s") this.userPick = this.voiceKey(this.voices[+val.slice(1)]);
      else this.userPick = null;
      this.applyVoiceSelection(val); this.updateNote(); this.updateUI();
      if (this.playing && !this.paused) this.speakCurrent();
    },

    finish() {
      this._clear();
      this.playing = false; this.paused = false; this.articleN = null;
      this.hidePlayer(); this.updateUI();
      showToast("Lectura finalizada");
    },
    stop() {
      if (!this.el.player) return;
      const active = this.playing || this.el.player.classList.contains("show");
      this._clear();
      this.playing = false; this.paused = false; this.articleN = null;
      if (active) { this.hidePlayer(); this.updateUI(); }
    },
    hidePlayer() {
      const p = this.el.player;
      if (p.contains(document.activeElement)) {
        const lb = $("#listenBtn");
        if (lb) lb.focus({ preventScroll: true });
        else if (document.activeElement.blur) document.activeElement.blur();
      }
      p.classList.remove("show", "paused");
      p.setAttribute("aria-hidden", "true");
      try { p.inert = true; } catch (e) {}
      this.el.nav.hidden = true;
      if (this.el.bar) this.el.bar.style.width = "0%";
    },

    toggleFromButton(n) { if (this.playing && this.articleN === n) this.stop(); else this.start(n); },

    highlight() {
      $$("[data-seg].reading").forEach((el) => el.classList.remove("reading"));
      const el = $('[data-seg="' + this.i + '"]');
      if (el) {
        el.classList.add("reading");
        const playerH = this.el.player.classList.contains("show") ? this.el.player.offsetHeight : 0;
        const bottomLimit = window.innerHeight - playerH - 16;
        const r = el.getBoundingClientRect();
        if (r.top < 90 || r.bottom > bottomLimit) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    updateProgress() {
      const total = (state.segments || []).length || 1;
      const pct = Math.max(0, Math.min(100, ((this.i + this.frac) / total) * 100));
      if (this.el.bar) this.el.bar.style.width = pct + "%";
    },
    updateMeta() {
      const total = (state.segments || []).length;
      if (this.el.seg) this.el.seg.textContent = "Fragmento " + (this.i + 1) + " de " + total;
    },
    updateUI() {
      if (!this.el.player) return;
      this.el.player.classList.toggle("paused", this.paused);
      this.el.play.setAttribute("aria-label", this.paused ? "Reanudar lectura" : "Pausar lectura");
      this.el.sub.textContent = this.engine === "offline"
        ? "Leyendo en español neutral · voz sin conexión"
        : (this.voice ? "Leyendo en español · voz del navegador" : "Leyendo en español");
      const btn = $("#listenBtn");
      if (btn) {
        const active = this.playing && this.articleN === state.currentN;
        btn.classList.toggle("reading", active);
        btn.innerHTML = active ? IC.stopSq + " Detener lectura" : IC.speaker + " Escuchar artículo";
      }
    },
  };

  /* ---------- Eventos ---------- */
  function debounce(fn, ms) { let t; return function () { clearTimeout(t); const a = arguments, c = this; t = setTimeout(() => fn.apply(c, a), ms); }; }

  function bindSearch(input, clearBtn, goBtn, withSuggest) {
    const onInput = debounce(() => {
      const q = input.value;
      runSearch(q);
      if (withSuggest) renderSuggest(q);
    }, 130);
    input.addEventListener("input", onInput);
    input.addEventListener("focus", () => { if (withSuggest && input.value.trim()) renderSuggest(input.value); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" && withSuggest) { e.preventDefault(); moveSel(1); }
      else if (e.key === "ArrowUp" && withSuggest) { e.preventDefault(); moveSel(-1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (withSuggest && state.selIndex >= 0) {
          const el = $$(".suggest-item", suggest)[state.selIndex];
          if (el) { openArticle(+el.dataset.art); return; }
        }
        const num = articleNumberFromQuery(input.value);
        if (num) openArticle(num);
        else { closeSuggest(); runSearch(input.value, { scroll: true }); }
      } else if (e.key === "Escape") { closeSuggest(); input.blur(); }
    });
    clearBtn.addEventListener("click", () => { input.value = ""; runSearch(""); closeSuggest(); input.focus(); });
    goBtn.addEventListener("click", () => {
      const num = articleNumberFromQuery(input.value);
      if (num) openArticle(num);
      else { closeSuggest(); runSearch(input.value, { scroll: true }); }
    });
  }

  function bindEvents() {
    bindSearch(heroSearch, heroClear, $("#heroGo"), true);
    bindSearch(toolSearch, toolClear, $("#toolGo"), false);

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-wrap")) closeSuggest();
    });

    suggest.addEventListener("click", (e) => {
      const it = e.target.closest(".suggest-item");
      if (it) openArticle(+it.dataset.art);
    });

    // Delegación: escuchar, tarjetas, índice, relacionados, navegación, volver
    document.addEventListener("click", (e) => {
      const listenEl = e.target.closest("[data-listen]");
      if (listenEl) { e.preventDefault(); const n = +listenEl.dataset.listen; openArticle(n); TTS.start(n); return; }
      const artEl = e.target.closest("[data-art]");
      if (artEl) { openArticle(+artEl.dataset.art); return; }
      const backEl = e.target.closest("[data-back]");
      if (backEl) {
        TTS.stop();
        if (state.query.trim()) runSearch(state.query, { scroll: true });
        else { state.view = "home"; renderContent(); scrollToContent(); }
        try { history.replaceState(null, "", "#explorar"); } catch (err) {}
        return;
      }
      const chipQ = e.target.closest(".chip[data-q]");
      if (chipQ) {
        const q = chipQ.dataset.q;
        const num = articleNumberFromQuery(q);
        if (num) openArticle(num);
        else runSearch(q, { scroll: true });
        return;
      }
      const filterEl = e.target.closest(".filter");
      if (filterEl) {
        state.filter = filterEl.dataset.filter;
        buildFilters();
        renderContent();
        return;
      }
      const titBtn = e.target.closest(".idx-titulo-btn");
      if (titBtn) { titBtn.parentElement.classList.toggle("open"); return; }
    });

    $("#quickChips").addEventListener("click", (e) => { /* manejado por delegación .chip[data-q] */ });

    $("#btnIndexMobile").addEventListener("click", openDrawer);
    drawerOverlay.addEventListener("click", closeDrawer);
    $("#navIndice").addEventListener("click", (e) => {
      if (window.matchMedia("(max-width: 900px)").matches) { e.preventDefault(); openDrawer(); }
    });
    $("#brandLink").addEventListener("click", () => { TTS.stop(); state.view = "home"; state.query = ""; syncInputs(""); renderContent(); });

    document.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("card") && e.target.dataset.art) {
        e.preventDefault(); openArticle(+e.target.dataset.art);
      }
    });

    window.addEventListener("hashchange", () => {
      const m = location.hash.match(/^#art-(\d+)$/);
      if (m) openArticle(+m[1]);
    });
  }

  /* ---------- Init ---------- */
  function init() {
    buildHero();
    buildFilters();
    buildIndex();
    TTS.init();
    renderContent();
    bindEvents();
    initRain();
    initNavState();
    observeReveals();
    const m = location.hash.match(/^#art-(\d+)$/);
    if (m) { const n = +m[1]; if (n >= 1 && n <= ARTICULOS.length) { state.view = "article"; state.currentN = n; renderContent(); } }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
