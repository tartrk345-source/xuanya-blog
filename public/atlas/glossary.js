/* 术语小词典：自动高亮 + 点击解释 */
(function () {
  "use strict";
  const SELECTOR = "main, .scene, .eo-section, .hall-main, .detail-body";
  const SKIP = new Set(["A", "BUTTON", "SCRIPT", "STYLE", "CODE", "INPUT", "SELECT", "TEXTAREA", "H1", "H2", "H3", "TH", "SUMMARY", "LABEL"]);
  const used = new Set();
  let TERMS = [];
  let panelReady = false;

  fetch("data/glossary.json")
    .then(r => r.ok ? r.json() : { terms: [] })
    .then(d => {
      TERMS = (d.terms || []).filter(t => t.term && t.term.length >= 2)
        .sort((a, b) => b.term.length - a.term.length);
      if (!TERMS.length) return;
      buildPanel();
      scan();
      // 页面数据异步渲染，监听 DOM 变化后补扫
      const obs = new MutationObserver(debounce(scan, 350));
      obs.observe(document.body, { childList: true, subtree: true });
    })
    .catch(() => {});

  function debounce(fn, ms) {
    let t = null;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function buildPanel() {
    if (panelReady) return;
    panelReady = true;
    const m = document.createElement("div");
    m.className = "gloss-modal";
    m.id = "gloss-modal";
    m.innerHTML = '<div class="gm-panel">' +
      '<button class="gm-close" aria-label="关闭">×</button>' +
      '<div class="gm-term" id="gm-term"></div>' +
      '<div class="gm-en" id="gm-en"></div>' +
      '<p class="gm-short" id="gm-short"></p>' +
      '<div class="gm-label">展开</div>' +
      '<p class="gm-detail" id="gm-detail"></p>' +
      '</div>';
    document.body.appendChild(m);
    m.addEventListener("click", e => {
      if (e.target === m || e.target.classList.contains("gm-close")) m.classList.remove("open");
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") m.classList.remove("open");
    });
  }

  function scan() {
    const roots = new Set();
    document.querySelectorAll(SELECTOR).forEach(el => roots.add(el));
    if (!roots.size) return;
    roots.forEach(root => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || node.nodeValue.trim().length < 2) return NodeFilter.FILTER_REJECT;
          const p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (SKIP.has(p.tagName)) return NodeFilter.FILTER_REJECT;
          if (p.classList && (p.classList.contains("gloss") || p.closest(".gloss-modal") || p.closest(".paper-modal"))) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => highlight(node));
    });
  }

  function highlight(textNode) {
    if (!textNode || !textNode.parentNode) return;
    const text = textNode.nodeValue;
    for (const t of TERMS) {
      if (used.has(t.id)) continue;
      // 规范名 + 别名，长词优先
      const pats = [t.term, ...(t.match || [])].filter(Boolean).sort((a, b) => b.length - a.length);
      let idx = -1, word = "";
      for (const p of pats) {
        const i = text.indexOf(p);
        if (i !== -1) { idx = i; word = p; break; }
      }
      if (idx === -1) continue;
      // 英文/数字后缀拦截，避免 GC-MS 命中 GC-MSX
      const after = text[idx + word.length] || "";
      if (after && /[A-Za-z0-9]/.test(after) && /[A-Za-z0-9]$/.test(word)) continue;

      const span = document.createElement("span");
      span.className = "gloss";
      span.dataset.t = t.id;
      span.textContent = word;
      span.title = t.term;
      span.addEventListener("click", () => open(t.id));

      const frag = document.createDocumentFragment();
      if (idx > 0) frag.appendChild(document.createTextNode(text.slice(0, idx)));
      frag.appendChild(span);
      const tail = text.slice(idx + word.length);
      if (tail) frag.appendChild(document.createTextNode(tail));
      try {
        textNode.parentNode.replaceChild(frag, textNode);
      } catch (e) { return; }
      used.add(t.id);
      return;
    }
  }

  function open(id) {
    const t = TERMS.find(x => x.id === id);
    if (!t) return;
    document.getElementById("gm-term").textContent = t.term;
    document.getElementById("gm-en").textContent = t.en || "";
    document.getElementById("gm-short").textContent = t.short || "";
    document.getElementById("gm-detail").textContent = t.detail || "";
    document.getElementById("gloss-modal").classList.add("open");
  }

  window.eoGlossary = { open: open };
})();
