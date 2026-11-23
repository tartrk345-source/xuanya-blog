/* 证据池检索页面 */
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
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const GRADE_CN = { high: "高", moderate: "中", low: "低", verylow: "极低" };
  const KIND_CN = { sr: "系统评价 / Meta", rct: "随机对照试验", cochrane: "Cochrane 评价" };
  const GRADE_COLOR = { high: "#2f7d5b", moderate: "#4a7fae", low: "#b5822f", verylow: "#b05244" };
  let DATA = null;
  let FILTERS = { search: "", grade: "", kind: "", plant: "", topic: "", year: "", rob: "" };
  let SHOWN = 30;
  let SHARD = 100;
  const FULL_CACHE = {};   // 摘要分片缓存：p00 -> Promise<obj>

  fetch("data/ev_index.json")
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((d) => {
      SHARD = (d.meta && d.meta.split && d.meta.split.shard_size) || 100;
      // 记下每条在索引中的原始序号，便于按需取摘要分片
      d.records = (d.records || []).map((r, i) => Object.assign({ _i: i }, r));
      DATA = d;
      init();
    })
    .catch((e) => {
      $("#ev-list").innerHTML = '<div class="eo-callout warn"><span class="eo-callout-icon">!</span><div>证据池数据加载失败：' + esc(e.message) + "。请通过本地服务器访问。</div></div>";
    });

  // 按需加载某条的完整中英文摘要（同片只请求一次）
  function loadFull(r) {
    const key = "p" + String(Math.floor(r._i / SHARD)).padStart(2, "0");
    if (!FULL_CACHE[key]) {
      FULL_CACHE[key] = fetch("data/ev_full/" + key + ".json")
        .then((x) => (x.ok ? x.json() : {}))
        .catch(() => ({}));
    }
    return FULL_CACHE[key].then((m) => m[String(r.pmid)] || { a: "", z: "" });
  }

  function zhTitle(r) {
    return r.title_zh || null;
  }

  function init() {
    const m = DATA.meta, c = DATA.counts, p = DATA.prisma;
    $("#ev-meta").innerHTML =
      "<span>生成 " + m.generated + "</span><span>收录 " + fmt.format(c.total) + " 篇</span><span>来源 PubMed / MEDLINE</span>";
    $("#ev-foot-time").textContent = "生成于 " + m.generated;
    $("#ev-disclaimer").textContent = m.disclaimer;

    // PRISMA
    const prismaSteps = [
      { label: "识别（Identification）", sub: "三类检索式命中：SR/Meta " + fmt.format(p.identified_by.sr) + " · RCT " + fmt.format(p.identified_by.rct) + " · Cochrane " + fmt.format(p.identified_by.cochrane), n: p.identification },
      { label: "去重（Deduplication）", sub: "按 DOI / PMID / 标题近似去重", n: "-" + fmt.format(p.duplicates_removed) },
      { label: "去重后记录", sub: "进入结构化标注", n: p.after_dedup },
      { label: "纳入（Included）", sub: "证据池最终收录", n: p.included },
    ];
    const box = $("#ev-prisma");
    prismaSteps.forEach((s) => {
      const row = el("div", "ev-prisma-step");
      row.appendChild(el("div", "ev-prisma-box", s.label[0]));
      const body = el("div", "ev-prisma-body");
      body.appendChild(el("div", "ev-prisma-label", s.label));
      body.appendChild(el("div", "ev-prisma-sub", s.sub));
      row.appendChild(body);
      row.appendChild(el("div", "ev-prisma-n", String(s.n)));
      box.appendChild(row);
    });
    box.appendChild(el("div", "ev-prisma-note", p.note));

    // KPI
    const kpis = [
      { n: fmt.format(c.total), l: "证据池收录", s: "去重后" },
      { n: fmt.format(c.by_kind.cochrane), l: "Cochrane 评价", s: "最高证据等级" },
      { n: fmt.format(c.by_kind.sr), l: "系统评价 / Meta", s: "PRISMA 候选" },
      { n: fmt.format(c.by_kind.rct), l: "随机对照试验", s: "RoB 2 待评" },
      { n: fmt.format(c.with_plant), l: "标明具体精油", s: "其余摘要未写明" },
    ];
    kpis.forEach((k) => {
      const d2 = el("div", "eo-kpi");
      d2.appendChild(el("div", "n", k.n));
      d2.appendChild(el("div", "l", k.l));
      d2.appendChild(el("div", "s", k.s));
      $("#ev-kpis").appendChild(d2);
    });

    // 分布
    const gradeOrder = ["high", "moderate", "low", "verylow"];
    const gradeMax = Math.max(...gradeOrder.map((k) => c.by_grade[k]));
    gradeOrder.forEach((k) => {
      const row = el("div", "ev-dist-row");
      row.appendChild(el("div", null, GRADE_CN[k]));
      const track = el("div", "ev-dist-track");
      const bar = el("i");
      bar.style.width = (c.by_grade[k] / gradeMax * 100) + "%";
      bar.style.background = GRADE_COLOR[k];
      track.appendChild(bar);
      row.appendChild(track);
      row.appendChild(el("div", "ev-dist-n", String(c.by_grade[k])));
      $("#ev-grade-dist").appendChild(row);
    });
    const kindOrder = ["cochrane", "sr", "rct"];
    const kindMax = Math.max(...kindOrder.map((k) => c.by_kind[k]));
    kindOrder.forEach((k) => {
      const row = el("div", "ev-dist-row");
      row.appendChild(el("div", null, KIND_CN[k]));
      const track = el("div", "ev-dist-track");
      const bar = el("i");
      bar.style.width = (c.by_kind[k] / kindMax * 100) + "%";
      bar.style.background = "#2f7d5b";
      track.appendChild(bar);
      row.appendChild(track);
      row.appendChild(el("div", "ev-dist-n", String(c.by_kind[k])));
      $("#ev-kind-dist").appendChild(row);
    });

    buildFilters();
    bindEvents();
    renderList();
    initSectionNav();
  }

  function uniqueValues(key) {
    const s = new Set();
    DATA.records.forEach((r) => {
      const v = r[key];
      if (Array.isArray(v)) v.forEach((x) => s.add(x));
      else if (v) s.add(v);
    });
    return Array.from(s).sort();
  }

  function buildFilters() {
    const groups = [
      { key: "grade", label: "证据等级", options: [["high", "高"], ["moderate", "中"], ["low", "低"], ["verylow", "极低"]] },
      { key: "kind", label: "研究类型", options: [["cochrane", "Cochrane"], ["sr", "系统评价/Meta"], ["rct", "RCT"]] },
      { key: "plant", label: "精油", options: uniqueValues("plants").map((x) => {
        const rec = DATA.records.find((r) => r.plants.includes(x));
        const cn = rec && rec.plants_cn[rec.plants.indexOf(x)];
        return [x, cn || x];
      }) },
      { key: "topic", label: "研究主题", options: uniqueValues("topics").map((x) => {
        const rec = DATA.records.find((r) => r.topics.includes(x));
        const cn = rec && rec.topics_cn[rec.topics.indexOf(x)];
        return [x, cn || x];
      }) },
      { key: "year", label: "发表年份", options: uniqueValues("year").filter((x) => /^\d{4}$/.test(x)).reverse().slice(0, 15).map((x) => [x, x]) },
      { key: "rob", label: "RoB 红旗", options: [["flagged", "有未报告项"], ["clean", "摘要信号较全"]] },
    ];
    const wrap = $("#ev-filters");
    groups.forEach((g) => {
      const box = el("div", "ev-fgroup");
      box.appendChild(el("label", null, g.label));
      const sel = el("select");
      sel.dataset.filter = g.key;
      sel.appendChild(new Option("全部", ""));
      g.options.forEach(([v, l]) => sel.appendChild(new Option(l, v)));
      box.appendChild(sel);
      wrap.appendChild(box);
    });
  }

  function bindEvents() {
    $("#ev-search").addEventListener("input", (e) => {
      FILTERS.search = e.target.value.trim().toLowerCase();
      SHOWN = 30;
      renderList();
    });
    document.querySelectorAll("#ev-filters select").forEach((sel) => {
      sel.addEventListener("change", () => {
        FILTERS[sel.dataset.filter] = sel.value;
        SHOWN = 30;
        renderList();
      });
    });
    $("#ev-active").addEventListener("click", (e) => {
      if (e.target.dataset.clear) {
        const key = e.target.dataset.clear;
        FILTERS[key] = "";
        const sel = document.querySelector('#ev-filters select[data-filter="' + key + '"]');
        if (sel) sel.value = "";
        SHOWN = 30;
        renderList();
      } else if (e.target.id === "ev-clear-all") {
        clearAll();
      }
    });
    $("#ev-more").addEventListener("click", () => { SHOWN += 30; renderList(); });
  }

  function clearAll() {
    FILTERS = { search: "", grade: "", kind: "", plant: "", topic: "", year: "", rob: "" };
    $("#ev-search").value = "";
    document.querySelectorAll("#ev-filters select").forEach((s) => { s.value = ""; });
    SHOWN = 30;
    renderList();
  }

  function getFiltered() {
    return DATA.records.filter((r) => {
      if (FILTERS.search) {
        // 索引只保留摘要开头（英文 150 字符 / 中文 120 字），全文摘要展开时才加载
        const hay = (r.title + " " + (r.abs_head || "") + " " + r.authors.join(" ") + " " + r.journal +
          " " + (r.title_zh || "") + " " + (r.abs_zh_head || "")).toLowerCase();
        if (!hay.includes(FILTERS.search)) return false;
      }
      if (FILTERS.grade && r.grade.level !== FILTERS.grade) return false;
      if (FILTERS.kind && r.source_kind !== FILTERS.kind) return false;
      if (FILTERS.plant && !r.plants.includes(FILTERS.plant)) return false;
      if (FILTERS.topic && !r.topics.includes(FILTERS.topic)) return false;
      if (FILTERS.year && r.year !== FILTERS.year) return false;
      if (FILTERS.rob === "flagged" && !r.rob.missing.length) return false;
      if (FILTERS.rob === "clean" && r.rob.missing.length) return false;
      return true;
    });
  }

  function renderActiveTags() {
    const wrap = $("#ev-active");
    wrap.innerHTML = "";
    const labels = {
      search: "搜索", grade: "等级", kind: "类型", plant: "精油", topic: "主题", year: "年份", rob: "RoB",
    };
    Object.keys(FILTERS).forEach((k) => {
      if (!FILTERS[k]) return;
      const tag = el("span", "ev-atag", labels[k] + "：" + esc(FILTERS[k]) + ' <button data-clear="' + k + '" aria-label="移除">×</button>');
      wrap.appendChild(tag);
    });
    if (wrap.children.length) {
      const btn = el("button", "ev-clear-all", "清空全部");
      btn.id = "ev-clear-all";
      wrap.appendChild(btn);
    }
  }

  function renderList() {
    const filtered = getFiltered();
    renderActiveTags();
    $("#ev-count").textContent = fmt.format(filtered.length) + " 篇";
    $("#ev-empty").hidden = filtered.length > 0;
    $("#ev-more-wrap").style.display = filtered.length > SHOWN ? "block" : "none";

    const list = $("#ev-list");
    list.innerHTML = "";
    filtered.slice(0, SHOWN).forEach((r) => list.appendChild(renderCard(r)));
  }

  function renderCard(r) {
    const card = el("article", "ev-card");
    const top = el("div", "ev-card-top");
    top.appendChild(el("span", "ev-badge " + r.grade.level, "GRADE " + GRADE_CN[r.grade.level]));
    top.appendChild(el("span", "ev-badge kind", KIND_CN[r.source_kind] || r.source_kind));
    if (r.year) top.appendChild(el("span", "ev-badge year", r.year));
    card.appendChild(top);
    const titleZh = zhTitle(r);
    if (titleZh) {
      card.appendChild(el("h3", "ev-title", esc(titleZh)));
      card.appendChild(el("div", "ev-title-en", esc(r.title)));
    } else {
      card.appendChild(el("h3", "ev-title", esc(r.title)));
    }
    if (r.journal) card.appendChild(el("div", "ev-journal", esc(r.journal)));

    const tags = el("div", "ev-tags");
    r.plants_cn.slice(0, 5).forEach((p) => tags.appendChild(el("span", "ev-tag", p)));
    r.topics_cn.slice(0, 4).forEach((t) => tags.appendChild(el("span", "ev-tag topic", t)));
    if (r.rob.missing.length) {
      tags.appendChild(el("span", "ev-tag warn", "RoB 待查：" + r.rob.missing_cn.slice(0, 3).join("、")));
    }
    card.appendChild(tags);

    if (r.has_abs) {
      // 折叠态只显示摘要开头（索引里带的），展开时才去取完整摘要分片
      const abs = el("div", "ev-abstract", esc(r.abs_zh_head || r.abs_head) + "…");
      card.appendChild(abs);
      const note = el("div", "ev-abstract-note", "");
      note.style.display = "none";
      card.appendChild(note);
      const actions = el("div", "ev-actions");
      const toggle = el("button", null, "展开摘要");
      let loaded = false;
      toggle.addEventListener("click", async () => {
        if (!loaded) {
          toggle.textContent = "加载中…";
          toggle.disabled = true;
          const full = await loadFull(r);
          const txt = full.z || full.a || "";
          abs.textContent = txt ? txt + (txt.length >= 590 ? "…" : "") : "（该条暂无摘要）";
          if (full.z) {
            note.textContent = "以上为机器翻译摘要，原文见 PubMed 链接。";
            note.style.display = "";
          }
          loaded = true;
          toggle.disabled = false;
          abs.classList.add("open");
          toggle.textContent = "收起摘要";
          return;
        }
        const open = abs.classList.toggle("open");
        toggle.textContent = open ? "收起摘要" : "展开摘要";
      });
      actions.appendChild(toggle);
      if (r.doi) {
        actions.appendChild(el("a", null, "DOI ↗")).href = "https://doi.org/" + encodeURIComponent(r.doi);
        actions.lastChild.target = "_blank";
        actions.lastChild.rel = "noopener";
      }
      const pubmed = el("a", null, "PubMed ↗");
      pubmed.href = "https://pubmed.ncbi.nlm.nih.gov/" + encodeURIComponent(r.pmid) + "/";
      pubmed.target = "_blank";
      pubmed.rel = "noopener";
      actions.appendChild(pubmed);
      card.appendChild(actions);
    }
    return card;
  }

  /* ---------- 滚动章节导航（与主站一致） ---------- */
  function initSectionNav() {
    const topNav = document.querySelector(".eo-nav");
    const floatNav = $("#eo-floatnav");
    const bottomNav = $("#eo-bottomnav");
    if (!topNav || !floatNav || !bottomNav) return;
    const links = Array.from(topNav.querySelectorAll("a[href^='#']"))
      .map((a) => ({ id: a.getAttribute("href").slice(1), label: a.textContent.trim() }))
      .filter((x) => document.getElementById(x.id));
    const fi = {}, bi = {};
    links.forEach((x) => {
      const f = el("a", "eo-fnav-item", esc(x.label));
      f.href = "#" + x.id; fi[x.id] = f; floatNav.appendChild(f);
      const b = el("a", "eo-bnav-item", esc(x.label));
      b.href = "#" + x.id; bi[x.id] = b; bottomNav.appendChild(b);
      [f, b].forEach((node) => node.addEventListener("click", (ev) => {
        ev.preventDefault();
        const t = document.getElementById(x.id);
        if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
        setActive(x.id);
      }));
    });
    function setActive(id) {
      Object.keys(fi).forEach((k) => {
        fi[k].classList.toggle("active", k === id);
        bi[k].classList.toggle("active", k === id);
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
})();
