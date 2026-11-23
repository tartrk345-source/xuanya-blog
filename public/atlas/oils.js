/* 精油卡片页 —— 目录 + 详情两栏（master-detail） */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const fmt = new Intl.NumberFormat("zh-CN");
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }));
  const GRADE_CN = { high: "高", moderate: "中", low: "低", verylow: "极低" };

  let OILS = [];
  let REVIEW_MAP = {};
  let TIERS = {};
  let CURRENT = null;

  Promise.all([
    fetch("data/oils.json").then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }),
    fetch("data/oil_reviews.json").then((r) => r.ok ? r.json() : { reviews: [] }).catch(() => ({ reviews: [] })),
  ])
    .then(([d, rd]) => init(d, rd))
    .catch((e) => {
      $("#oil-pane-inner").innerHTML =
        '<div class="eo-callout warn"><span class="eo-callout-icon">!</span><div>数据加载失败：' +
        esc(e.message) + "。请确认通过本地服务器访问。</div></div>";
    });

  function init(d, rd) {
    OILS = d.oils || [];
    TIERS = d.meta.tiers || {};
    REVIEW_MAP = {};
    (rd.reviews || []).forEach((r) => { REVIEW_MAP[r.key] = r; });

    $("#oil-meta").innerHTML =
      "<span>更新 " + d.meta.generated + "</span>" +
      "<span>" + OILS.length + " 种精油</span>" +
      "<span>" + (rd.reviews || []).length + " 篇通读综述</span>";
    $("#oil-foot-time").textContent = "更新于 " + d.meta.generated;

    renderToc("");
    bindSearch();
    bindBack();

    // 深链优先，否则默认选第一种
    const want = new URLSearchParams(location.search).get("oil");
    const first = OILS.find((o) => o.key === want) || OILS[0];
    if (first) select(first.key, { silent: !!want, deepLink: !!want });
  }

  /* ---------- 目录 ---------- */

  function renderToc(q) {
    const box = $("#oil-toc-body");
    box.innerHTML = "";
    const kw = (q || "").trim().toLowerCase();
    const match = (o) => !kw ||
      (o.cn || "").toLowerCase().includes(kw) ||
      (o.latin || "").toLowerCase().includes(kw) ||
      (o.key || "").toLowerCase().includes(kw);

    let shown = 0;
    ["A", "B", "C", "D", "E"].forEach((t) => {
      const group = OILS.filter((o) => o.tier === t && match(o));
      if (!group.length) return;
      shown += group.length;
      const g = el("div", "oil-toc-group");
      const gh = el("div", "oil-toc-ghead");
      gh.appendChild(el("span", "tier-badge tier-" + t, t));
      gh.appendChild(el("span", "oil-toc-gname", TIERS[t] || t + " 级"));
      gh.appendChild(el("span", "oil-toc-gn", group.length + " 种"));
      g.appendChild(gh);
      group.forEach((o) => {
        const b = el("button", "oil-toc-item" + (o.key === CURRENT ? " active" : ""));
        b.type = "button";
        b.dataset.key = o.key;
        const idx = el("span", "oil-toc-idx", "#" + (o.evidence_rank || o.rank || ""));
        const mid = el("span", "oil-toc-mid");
        mid.appendChild(el("span", "oil-toc-name", esc(o.cn)));
        mid.appendChild(el("span", "oil-toc-latin", esc(o.latin || "")));
        b.appendChild(idx);
        b.appendChild(mid);
        const cnt = el("span", "oil-toc-cnt");
        if (o.cochrane_count) cnt.appendChild(el("i", "dot cochrane", "C" + o.cochrane_count));
        cnt.appendChild(el("i", "dot", "综" + (o.review_count || 0)));
        b.appendChild(cnt);
        b.addEventListener("click", () => select(o.key, { fromClick: true }));
        g.appendChild(b);
      });
      box.appendChild(g);
    });

    if (!shown) {
      box.appendChild(el("div", "oil-toc-empty", "没有匹配的精油"));
    }
    $("#oil-toc-stat").textContent = kw
      ? "匹配 " + shown + " / " + OILS.length + " 种"
      : OILS.length + " 种 · A–E 五级";
  }

  function bindSearch() {
    const inp = $("#oil-search");
    if (!inp) return;
    let t = null;
    inp.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => renderToc(inp.value), 120);
    });
  }

  function bindBack() {
    const b = $("#oil-pane-back");
    if (b) b.addEventListener("click", () => {
      document.body.classList.remove("oil-detail-open");
      const cur = document.querySelector(".oil-toc-item.active");
      if (cur) cur.focus();
    });
  }

  /* ---------- 详情 ---------- */

  function select(key, opt) {
    const o = OILS.find((x) => x.key === key);
    if (!o) return;
    CURRENT = key;

    document.querySelectorAll(".oil-toc-item").forEach((b) => {
      b.classList.toggle("active", b.dataset.key === key);
    });

    const pane = $("#oil-pane-inner");
    pane.innerHTML = "";
    pane.appendChild(card(o, REVIEW_MAP[key]));

    $("#oil-pane").scrollTop = 0;

    // 移动端：只有「点目录」或「深链指定」才全屏打开详情；
    // 首次进入应先看到目录，而不是直接跳进某一种精油。
    const isMobile = window.matchMedia("(max-width:900px)").matches;
    const wantOpen = (opt && opt.fromClick) || (opt && opt.deepLink);
    if (isMobile && wantOpen) {
      document.body.classList.add("oil-detail-open");
    } else if (!isMobile) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (!opt || !opt.silent) {
      const url = new URL(location.href);
      url.searchParams.set("oil", key);
      history.replaceState(null, "", url);
    }
  }

  function card(o, review) {
    const c = el("article", "oil-card review-card");
    c.id = "oil-" + o.key;

    const head = el("div", "oil-card-head");
    const titleRow = el("div", "oil-card-title-row");
    titleRow.appendChild(el("span", "oil-card-name", o.cn));
    const tier = el("span", "tier-badge tier-" + o.tier, o.tier);
    tier.title = o.tier_desc || "";
    titleRow.appendChild(tier);
    titleRow.appendChild(el("span", "oil-card-rank", "#" + (o.evidence_rank || o.rank)));
    head.appendChild(titleRow);
    head.appendChild(el("div", "oil-card-latin", o.latin));
    const stats = el("div", "oil-card-stats");
    if (o.cochrane_count) stats.appendChild(el("span", "oil-stat cochrane", "Cochrane " + o.cochrane_count));
    stats.appendChild(el("span", "oil-stat review", "综述 " + o.review_count));
    stats.appendChild(el("span", "oil-stat rct", "RCT " + o.rct_count));
    stats.appendChild(el("span", "oil-stat", "PubMed 总 " + fmt.format(o.pubmed_count)));
    head.appendChild(stats);
    head.appendChild(el("div", "oil-card-tierdesc", o.tier_desc || ""));
    c.appendChild(head);

    const body = el("div", "oil-card-body");

    if (review) {
      body.appendChild(el("div", "oil-summary", esc(review.summary)));

      const sec1 = el("div", "oil-section");
      sec1.appendChild(el("div", "oil-sec-label", "研究版图"));
      sec1.appendChild(el("p", "oil-prose", esc(review.landscape)));
      body.appendChild(sec1);

      const sec2 = el("div", "oil-section");
      sec2.appendChild(el("div", "oil-sec-label", "落地提示"));
      sec2.appendChild(el("p", "oil-prose", esc(review.practice)));
      body.appendChild(sec2);

      const sec3 = el("div", "oil-section caveat");
      sec3.appendChild(el("div", "oil-sec-label", "证据局限"));
      sec3.appendChild(el("p", "oil-prose", esc(review.caveat)));
      body.appendChild(sec3);

      if (review.featured_articles && review.featured_articles.length) {
        const sec4 = el("div", "oil-section");
        sec4.appendChild(el("div", "oil-sec-label", "关键文献 · 我挑的"));
        review.featured_articles.forEach((a) => sec4.appendChild(featuredItem(a)));
        body.appendChild(sec4);
      }
    } else {
      body.appendChild(el("div", "oil-summary", "通读综述撰写中，当前仅显示证据池的自动统计。"));
      if (o.reviews && o.reviews.length) {
        const sec = el("div", "oil-section");
        sec.appendChild(el("div", "oil-sec-label", "证据池中的综述"));
        o.reviews.slice(0, 5).forEach((r) => sec.appendChild(featuredItem(r)));
        body.appendChild(sec);
      }
    }
    c.appendChild(body);

    const foot = el("div", "oil-card-foot");
    foot.innerHTML = '<a href="oil-detail.html?oil=' + encodeURIComponent(o.key) + '"><strong>十关档案 →</strong></a> · ' +
      '<a href="evidence.html">证据池 →</a> · ' +
      '<a href="https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent(o.latin + ' AND essential oil') +
      '" target="_blank" rel="noopener">PubMed ↗</a>';
    c.appendChild(foot);
    return c;
  }

  function featuredItem(a) {
    const wrap = el("div", "oil-review");
    const title = el("a", "oil-review-title" + (a.title_zh ? " zh" : ""));
    title.textContent = a.title_zh || a.title;
    title.href = "https://pubmed.ncbi.nlm.nih.gov/" + encodeURIComponent(a.pmid) + "/";
    title.target = "_blank";
    title.rel = "noopener";
    wrap.appendChild(title);
    const meta = el("div", "oil-review-meta");
    if (a.journal) meta.appendChild(el("span", null, esc(a.journal)));
    if (a.year) meta.appendChild(el("span", null, a.year));
    if (a.kind) meta.appendChild(el("span", "oil-review-kind", a.kind));
    if (a.grade) meta.appendChild(el("span", "grade grade-" + a.grade, GRADE_CN[a.grade] || a.grade));
    wrap.appendChild(meta);
    return wrap;
  }
})();
