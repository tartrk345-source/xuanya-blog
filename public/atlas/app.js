/* 植物精油文献全景地图 · 数据渲染（零外部依赖） */
(function () {
  "use strict";

  const fmt = new Intl.NumberFormat("zh-CN");
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  // 首屏只需 atlas.json（36 KB）。evidence_translations.json（0.87 MB）在首屏并未被使用，
  // 原先的并行 fetch 属无效请求，已移除；该文件仍由 evidence.js 在证据池按需加载。
  fetch("data/atlas.json")
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(render)
    .catch((e) => {
      $("#eo-kpis").innerHTML =
        '<div class="eo-callout warn"><span class="eo-callout-icon">!</span><div>数据加载失败：' +
        e.message +
        "。请确认通过本地服务器访问（如 <code>python -m http.server</code>），而不是直接双击打开。</div></div>";
    });

  function render(d) {
    const h = d.headline;
    const m = d.meta;

    $("#eo-meta").innerHTML =
      "<span>数据更新 " + m.generated + "</span>" +
      "<span>数据源 " + m.sources.length + " 个</span>" +
      "<span>覆盖 " + (h.oil_catalog || d.plants.length) + " 种精油 · " + d.topics.length + " 个主题</span>" +
      (h.cn_total ? "<span>中文文献 " + fmt.format(h.cn_total) + " 条</span>" : "");
    $("#eo-foot-time").textContent = "数据更新于 " + m.generated;

    // KPI
    const kpis = [
      { n: fmt.format(h.pubmed_total), l: "PubMed 精油文献", s: "题名/摘要命中", hl: true },
      { n: fmt.format(h.openalex_total), l: "OpenAlex 题名检索", s: "更广学科覆盖" },
      { n: fmt.format(h.aromatherapy), l: "芳香疗法专项", s: "MeSH + 题名" },
      { n: fmt.format(h.sr_ma + h.rct), l: "高质量干预证据", s: "SR/Meta + RCT" },
      { n: fmt.format(h.cochrane), l: "Cochrane 系统评价", s: "最高证据等级" },
      { n: fmt.format(h.recent5y), l: "近五年新增", s: "2021–2026" },
    ];
    if (h.cn_total) {
      kpis.push({
        n: fmt.format(h.cn_total),
        l: "中文文献",
        s: "知网 " + fmt.format(h.cn_cnki) + " + 中文期刊 " + fmt.format(h.cn_pubmed),
        hl: true,
      });
    }
    kpis.forEach((k) => {
      const c = el("div", "eo-kpi" + (k.hl ? " hl" : ""));
      c.appendChild(el("div", "n", k.n));
      c.appendChild(el("div", "l", k.l));
      c.appendChild(el("div", "s", k.s));
      $("#eo-kpis").appendChild(c);
    });

    // 年份柱状图
    const bars = $("#eo-years-bars");
    const ys = d.years_pubmed;
    const max = Math.max(...ys.map((x) => x.count));
    ys.forEach((y) => {
      const b = el("div", "eo-bar");
      const tip = el("div", "eo-bar-tip", y.year + " 年 · " + fmt.format(y.count) + " 篇");
      const fill = el("div", "eo-bar-fill");
      fill.style.height = Math.max(2, (y.count / max) * 100) + "%";
      b.appendChild(tip);
      b.appendChild(fill);
      b.appendChild(el("div", "eo-bar-lb", String(y.year)));
      bars.appendChild(b);
    });
    const first = ys[0], last = ys[ys.length - 1];
    $("#eo-years-caption").textContent =
      first.year + " 年 " + fmt.format(first.count) + " 篇 → " + last.year + " 年 " +
      fmt.format(last.count) + " 篇，二十余年间增长约 " + (last.count / first.count).toFixed(1) + " 倍。";

    // 精油网格
    const grid = $("#eo-oil-grid");
    const maxOil = d.plants[0].count;
    function drawOils(filter) {
      grid.innerHTML = "";
      const list = filter === "starter" ? d.plants.filter((p) => p.starter)
        : filter === "top20" ? d.plants.slice(0, 20)
        : d.plants;
      list.forEach((p) => {
        const c = el("a", "eo-oil" + (p.starter ? " starter" : ""));
        c.href = "oils.html#" + p.key;
        c.title = "查看 " + p.cn + " 的综述卡片";
        c.appendChild(el("span", "eo-oil-rank", "#" + p.rank));
        c.appendChild(el("div", "eo-oil-cn", p.cn + (p.starter ? '<span class="eo-badge">首批</span>' : "")));
        c.appendChild(el("div", "eo-oil-latin", p.latin));
        const track = el("div", "eo-oil-bar");
        const fill = el("i");
        fill.style.width = (p.count / maxOil) * 100 + "%";
        track.appendChild(fill);
        c.appendChild(track);
        c.appendChild(el("div", "eo-oil-n", fmt.format(p.count) + " 篇"));
        grid.appendChild(c);
      });
      $("#eo-oil-hint").textContent = "当前显示 " + list.length + " 种";
    }
    drawOils("top20");
    document.querySelectorAll("[data-oil-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-oil-filter]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        drawOils(btn.dataset.oilFilter);
      });
    });

    // 主题
    const topics = $("#eo-topics");
    const maxT = d.topics[0].count;
    d.topics.forEach((t) => {
      const row = el("div", "eo-topic");
      row.appendChild(el("div", "eo-topic-name", t.cn));
      const track = el("div", "eo-topic-track");
      const fill = el("i");
      fill.style.width = (t.count / maxT) * 100 + "%";
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("div", "eo-topic-n", fmt.format(t.count)));
      topics.appendChild(row);
    });

    // 证据分级
    const ev = $("#eo-evidence");
    d.graded.forEach((g) => {
      const row = el("div", "eo-grade tone-" + g.tone);
      row.appendChild(el("div", "eo-grade-lv", g.level));
      const body = el("div");
      body.appendChild(el("div", "eo-grade-cn", g.cn));
      body.appendChild(el("div", "eo-grade-desc", g.desc));
      row.appendChild(body);
      row.appendChild(el("div", "eo-grade-n", fmt.format(g.count)));
      ev.appendChild(row);
    });

    // 国家 / 期刊
    function rankList(target, items, key) {
      const max = items[0].count;
      items.slice(0, 15).forEach((it, i) => {
        const row = el("div", "eo-rank-row");
        row.appendChild(el("div", "eo-rank-i", String(i + 1).padStart(2, "0")));
        row.appendChild(el("div", "eo-rank-name", it[key]));
        row.appendChild(el("div", "eo-rank-n", fmt.format(it.count)));
        const bar = el("div", "eo-rank-bar");
        const fill = el("i");
        fill.style.width = (it.count / max) * 100 + "%";
        bar.appendChild(fill);
        row.appendChild(bar);
        target.appendChild(row);
      });
    }
    rankList($("#eo-countries"), d.countries, "name");
    rankList($("#eo-journals"), d.journals, "name");

    // 高被引文献
    const pl = $("#eo-papers");
    d.top_papers.forEach((p) => {
      const row = el("div", "eo-paper");
      const cite = el("div", "eo-paper-cite", fmt.format(p.cites) + "<small>被引</small>");
      row.appendChild(cite);
      const body = el("div");
      const pTitle = p.title_zh || p.title;
      body.appendChild(el("div", "eo-paper-title", escapeHtml(pTitle)));
      if (pTitle !== p.title) body.appendChild(el("div", "ev-title-en", escapeHtml(p.title)));
      let meta = [p.year, p.journal].filter(Boolean).join(" · ");
      if (p.doi) meta += ' · <a href="https://doi.org/' + encodeURIComponent(p.doi) + '" target="_blank" rel="noopener">DOI ↗</a>';
      body.appendChild(el("div", "eo-paper-meta", meta));
      row.appendChild(body);
      pl.appendChild(row);
    });

    // 方法
    m.sources.forEach((s) => $("#eo-sources").appendChild(el("li", null, s)));
    m.method.forEach((s) => $("#eo-methods").appendChild(el("li", null, s)));
    $("#eo-note").textContent = m.note;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  /* ---------- 滚动章节导航 ---------- */
  function initSectionNav() {
    const topNav = document.querySelector(".eo-nav");
    const floatNav = $("#eo-floatnav");
    const bottomNav = $("#eo-bottomnav");
    if (!topNav || !floatNav || !bottomNav) return;

    const links = Array.from(topNav.querySelectorAll("a[href^='#']"))
      .map((a) => ({ id: a.getAttribute("href").slice(1), label: a.textContent.trim() }))
      .filter((x) => document.getElementById(x.id));

    const floatItems = {};
    const bottomItems = {};
    links.forEach((x) => {
      const f = el("a", "eo-fnav-item", escapeHtml(x.label));
      f.href = "#" + x.id;
      f.dataset.target = x.id;
      floatNav.appendChild(f);
      floatItems[x.id] = f;

      const b = el("a", "eo-bnav-item", escapeHtml(x.label));
      b.href = "#" + x.id;
      b.dataset.target = x.id;
      bottomNav.appendChild(b);
      bottomItems[x.id] = b;

      [f, b].forEach((node) => {
        node.addEventListener("click", (e) => {
          e.preventDefault();
          const target = document.getElementById(x.id);
          if (!target) return;
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          setActive(x.id);
          // 移动端底部条把当前项滚进可视区
          if (node.classList.contains("eo-bnav-item")) {
            setTimeout(() => {
              b.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }, 120);
          }
        });
      });
    });

    function setActive(id) {
      Object.keys(floatItems).forEach((k) => {
        floatItems[k].classList.toggle("active", k === id);
        bottomItems[k].classList.toggle("active", k === id);
      });
    }

    const hero = document.querySelector(".eo-hero");
    const heroH = hero ? hero.offsetHeight : 0;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const show = window.scrollY > heroH * 0.6;
        floatNav.classList.toggle("visible", show);
        bottomNav.classList.toggle("visible", show);

        // 视口上 1/3 处所在的章节即为当前章节
        const probe = window.scrollY + window.innerHeight * 0.32;
        let current = links[0] ? links[0].id : null;
        links.forEach((x) => {
          const node = document.getElementById(x.id);
          if (node && node.offsetTop <= probe) current = x.id;
        });
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 60) {
          current = links[links.length - 1].id;
        }
        if (current) setActive(current);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  initSectionNav();
})();
