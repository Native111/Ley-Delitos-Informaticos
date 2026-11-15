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
  const state = { query: "", filter: "all", view: "home", currentN: null, results: [], selIndex: -1 };

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
  };

  /* ---------- Piezas de UI ---------- */
  function penaChips(a, big) {
    if (!a.pena) return "";
    return '<span class="pena-chip prision">' + IC.prison + " Prisión: " + escapeHTML(a.pena.prision) + "</span>" +
      '<span class="pena-chip multa">' + IC.fine + " Multa: " + escapeHTML(a.pena.multa) + "</span>";
  }

  function cardHTML(a, tokens) {
    const kicker = a.capNombre ? "Título " + a.tituloId + " · Cap. " + a.capId : "Título " + a.tituloId;
    return '<button class="card reveal" data-art="' + a.n + '">' +
      '<div class="card-top"><span class="card-num">' + a.n + "</span>" +
      '<div class="card-titles"><span class="kicker">' + escapeHTML(kicker) + "</span>" +
      "<h4>" + highlight(a.titulo, tokens) + "</h4></div></div>" +
      '<p class="card-snippet">' + snippet(a, tokens) + "</p>" +
      '<div class="card-foot">' + (a.esDelito ? '<span class="tag-delito">Delito</span>' : "") + penaChips(a) +
      '<span class="card-arrow">' + IC.arrow + "</span></div></button>";
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

    let body = "";
    if (a.p) body += a.p.map((p) => "<p>" + highlight(p, tokens) + "</p>").join("");
    if (a.defs) {
      body += '<ul class="defs">' + a.defs.map((d) =>
        '<li><span class="dk">' + escapeHTML(d.k) + '</span><span class="dv"><b>' + highlight(d.t, tokens) + ".</b> " + highlight(d.v, tokens) + "</span></li>").join("") + "</ul>";
    }
    if (a.items) {
      body += '<ol class="num-items">' + a.items.map((it) => "<li>" + highlight(it, tokens) + "</li>").join("") + "</ol>";
    }

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
      "<h2>" + escapeHTML(a.titulo) + "</h2>" +
      (a.pena ? '<div class="article-penas">' + penaChips(a, true) + "</div>" : "") +
      "</div></div>" +
      '<div class="article-body">' + body + "</div>" +
      '<div class="article-actions">' +
      '<button class="btn primary" id="copyBtn">' + IC.copy + " Copiar artículo</button>" +
      '<button class="btn" id="printBtn">' + IC.print + " Imprimir</button>" +
      '<button class="btn" data-back="1">' + IC.back + " Volver</button>" +
      "</div></article>" + navHTML + relatedHTML + "</div>";

    $("#copyBtn").addEventListener("click", () => copyArticle(a));
    $("#printBtn").addEventListener("click", () => window.print());
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

    // Delegación: tarjetas, índice, relacionados, navegación, volver
    document.addEventListener("click", (e) => {
      const artEl = e.target.closest("[data-art]");
      if (artEl) { openArticle(+artEl.dataset.art); return; }
      const backEl = e.target.closest("[data-back]");
      if (backEl) {
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
    $("#brandLink").addEventListener("click", () => { state.view = "home"; state.query = ""; syncInputs(""); renderContent(); });

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
