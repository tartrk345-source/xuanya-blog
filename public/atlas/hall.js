/* 探索模式 · 关卡选择大厅 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  let PROGRESS = {};
  try {
    const raw = localStorage.getItem("eo_archives_v1");
    PROGRESS = raw ? JSON.parse(raw) : {};
  } catch (e) { PROGRESS = {}; }

  $("#hall-time").textContent = new Date().toLocaleDateString("zh-CN");

  Promise.all([
    fetch("data/oil_gists.json").then(r => r.json()),
    fetch("data/oils.json").then(r => r.json()),
  ]).then(([gists, oils]) => {
    render(gists.gists || {}, oils.oils || []);
  }).catch(e => {
    $("#hall-grid").innerHTML = '<div class="hall-note">载入失败：' + e.message + '</div>';
  });

  function render(gists, oils) {
    const playable = oils.filter(o => gists[o.key]);
    const locked = oils.filter(o => !gists[o.key]);
    const cleared = playable.filter(o => PROGRESS[o.key]);
    const totalStars = Object.values(PROGRESS).reduce((s, v) => s + (v.stars || 0), 0);

    // 统计
    const st = $("#hall-stats");
    [
      { n: cleared.length + " / " + playable.length, l: "已通关（可玩）" },
      { n: "★ " + totalStars, l: "累计星级" },
      { n: playable.length + " / " + oils.length, l: "档案收录" },
    ].forEach(k => {
      const c = el("div", "hs-card");
      c.appendChild(el("div", "hs-n", k.n));
      c.appendChild(el("div", "hs-l", k.l));
      st.appendChild(c);
    });
    $("#hall-legend").textContent = "已通关 " + cleared.length + " 种 · 可玩 " + playable.length + " 种";

    const grid = $("#hall-grid");

    // 可玩：按通关状态排序（已通关优先）
    const ordered = playable.slice().sort((a, b) => {
      const sa = PROGRESS[a.key] ? PROGRESS[a.key].stars : -1;
      const sb = PROGRESS[b.key] ? PROGRESS[b.key].stars : -1;
      return sb - sa;
    });

    ordered.forEach((o, i) => grid.appendChild(makeCard(o, gists[o.key], i)));
    locked.forEach(o => grid.appendChild(makeLocked(o)));
  }

  function makeCard(o, g, idx) {
    const p = PROGRESS[o.key];
    const a = el("a", "hall-card" + (p ? " cleared" : ""));
    a.href = "oil-detail.html?oil=" + encodeURIComponent(o.key);
    a.style.animationDelay = (idx * 0.05) + "s";

    const top = el("div", "hc-top");
    top.appendChild(el("span", "hc-order", String(idx + 1).padStart(2, "0")));
    if (p) top.appendChild(el("span", "hc-cleared", "已通关"));
    a.appendChild(top);

    a.appendChild(el("div", "hc-name", o.cn));
    a.appendChild(el("div", "hc-latin", o.latin));
    a.appendChild(el("div", "hc-hook", g.hook || ""));

    const stars = el("div", "hc-stars");
    for (let i = 0; i < 5; i++) {
      stars.appendChild(el("span", "hc-star" + (p && i < p.stars ? " on" : ""), "★"));
    }
    a.appendChild(stars);

    const meta = el("div", "hc-meta");
    meta.appendChild(el("span", "hc-chip", "10 关"));
    if (p) meta.appendChild(el("span", "hc-chip score", "答对 " + p.right + "/" + p.total));
    meta.appendChild(el("span", "hc-go", "开始 →"));
    a.appendChild(meta);
    return a;
  }

  function makeLocked(o) {
    const d = el("div", "hall-card locked");
    const top = el("div", "hc-top");
    top.appendChild(el("span", "hc-order", "—"));
    top.appendChild(el("span", "hc-cleared lock", "待解锁"));
    d.appendChild(top);
    d.appendChild(el("div", "hc-name", o.cn));
    d.appendChild(el("div", "hc-latin", o.latin));
    d.appendChild(el("div", "hc-hook", "精简档案撰写中"));
    const stars = el("div", "hc-stars");
    for (let i = 0; i < 5; i++) stars.appendChild(el("span", "hc-star", "★"));
    d.appendChild(stars);
    const meta = el("div", "hc-meta");
    meta.appendChild(el("span", "hc-chip", "综述 " + o.review_count));
    const link = el("a", "hc-go", "先看卡片 →");
    link.href = "oils.html#" + o.key;
    meta.appendChild(link);
    d.appendChild(meta);
    return d;
  }
})();
