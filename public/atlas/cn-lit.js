/* 中文文献列表 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const ev = (html) => { const d = document.createElement("div"); d.innerHTML = html; return d; };

  const TOPIC = {
    clinical: "临床研究",
    antimicrobial: "抗菌 / 杀虫",
    chemistry: "成分与分析方法",
    pharmacology: "药理与机制",
    other: "其他",
  };
  const TOPIC_CLS = {
    clinical: "ct-clin", antimicrobial: "ct-micro", chemistry: "ct-chem",
    pharmacology: "ct-pharm", other: "ct-other",
  };
  const PAGE = 40;

  let DATA = [];
  let ST = { q: "", topic: "", platform: "", shown: PAGE };
  let SHARD = 100;              // 摘要分片大小，加载后从 meta 校正
  const ABS_CACHE = {};         // 分片缓存：p00 -> Promise<obj>

  fetch("data/cn_index.json")
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((d) => {
      SHARD = (d.meta && d.meta.split && d.meta.split.shard_size) || 100;
      // 记下每条在索引中的原始序号，用于按需取摘要分片
      DATA = (d.records || []).map((r, i) => Object.assign({ _i: i }, r));
      boot(d);
    })
    .catch((e) => {
      $("#cn-list").innerHTML = '<div class="cn-err">中文文献数据加载失败：' + e.message + "。请通过本地服务器访问。</div>";
    });

  // 按需加载某条记录的完整摘要（同片只请求一次）
  function loadAbs(i) {
    const s = Math.floor(i / SHARD);
    const key = "p" + String(s).padStart(2, "0");
    if (!ABS_CACHE[key]) {
      ABS_CACHE[key] = fetch("data/cn_abs/" + key + ".json")
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}));
    }
    return ABS_CACHE[key].then((m) => m[String(i)] || "");
  }

  function boot(d) {
    const m = d.meta || {};
    $("#cn-total").textContent = DATA.length;
    $("#cn-time").textContent = "抓取于 " + (m.generated || "—");
    document.title = "中文文献（" + DATA.length + " 篇） · 植物精油文献库";

    const cnt = (k) => DATA.filter((r) => r.topic === k).length;
    const plat = (r) => r.platform || "PubMed";
    const nCnki = DATA.filter((r) => plat(r) === "CNKI").length;
    const nPub = DATA.length - nCnki;
    const journals = new Set(DATA.map((r) => r.journal_abbr || r.journal)).size;
    [
      [DATA.length, "篇中文文献"],
      [nCnki, "篇来自知网"],
      [nPub, "篇来自 PubMed"],
      [cnt("clinical"), "篇临床研究"],
    ].forEach(([n, l]) => {
      const c = el("div", "cn-stat");
      c.appendChild(el("div", "cn-stat-n", String(n)));
      c.appendChild(el("div", "cn-stat-l", l));
      $("#cn-stats").appendChild(c);
    });

    // 主题筛选
    const wrap = $("#cn-topics");
    const mk = (k, label, n) => {
      const b = el("button", "cn-tbtn" + (ST.topic === k ? " active" : ""), label);
      if (n != null) b.appendChild(el("span", "cn-tbtn-n", String(n)));
      b.dataset.t = k;
      wrap.appendChild(b);
    };
    mk("", "全部", DATA.length);
    const nC = DATA.filter((r) => (r.platform || "PubMed") === "CNKI").length;
    const nP = DATA.length - nC;
    if (nC) {
      const b1 = el("button", "cn-tbtn", "知网 " + nC);
      b1.dataset.p = "CNKI";
      wrap.appendChild(b1);
    }
    if (nP) {
      const b2 = el("button", "cn-tbtn", "PubMed " + nP);
      b2.dataset.p = "PubMed";
      wrap.appendChild(b2);
    }
    Object.keys(TOPIC).forEach((k) => {
      const n = cnt(k);
      if (n) mk(k, TOPIC[k], n);
    });

    $("#cn-search").addEventListener("input", (e) => {
      ST.q = e.target.value.trim().toLowerCase();
      ST.shown = PAGE;
      render();
    });
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest(".cn-tbtn");
      if (!b) return;
      document.querySelectorAll(".cn-tbtn").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      if (b.dataset.p != null) {
        ST.platform = b.dataset.p;
        ST.topic = "";
      } else {
        ST.topic = b.dataset.t || "";
        ST.platform = "";
      }
      ST.shown = PAGE;
      render();
    });
    $("#cn-more").addEventListener("click", () => { ST.shown += PAGE; render(); });

    render();
  }

  function filtered() {
    let list = DATA.slice();
    if (ST.topic) list = list.filter((r) => r.topic === ST.topic);
    if (ST.platform) list = list.filter((r) => (r.platform || "PubMed") === ST.platform);
    if (ST.q) {
      const q = ST.q;
      list = list.filter((r) =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.title_zh || "").includes(q) ||
        (r.journal || "").toLowerCase().includes(q) ||
        (r.journal_abbr || "").toLowerCase().includes(q) ||
        (r.authors || "").toLowerCase().includes(q) ||
        (r.keywords || "").toLowerCase().includes(q) ||
        // 索引只保留摘要开头 40 字，全文摘要需展开后才加载，故搜索按开头匹配
        (r.abs_head || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
    return list;
  }

  function render() {
    const list = filtered();
    const body = $("#cn-list");
    body.innerHTML = "";
    $("#cn-count").textContent = "共 " + list.length + " 篇" + (list.length > ST.shown ? "，显示前 " + ST.shown : "");

    list.slice(0, ST.shown).forEach((r) => body.appendChild(card(r)));
    $("#cn-more").style.display = list.length > ST.shown ? "" : "none";
    if (!list.length) body.appendChild(el("div", "cn-empty", "没有匹配的文献。换个关键词试试。"));
  }

  function card(r) {
    const a = el("article", "cn-item");

    const head = el("div", "cn-item-head");
    const plat = r.platform || "PubMed";
    head.appendChild(el("span", "cn-plat " + (plat === "CNKI" ? "pl-cnki" : "pl-pub"), plat === "CNKI" ? "知网" : "PubMed"));
    head.appendChild(el("span", "cn-year", r.year || "—"));
    const jr = r.journal_abbr || r.journal || "";
    head.appendChild(el("span", "cn-journal", jr));
    if (r.topic) head.appendChild(el("span", "cn-tag " + (TOPIC_CLS[r.topic] || ""), TOPIC[r.topic] || r.topic));
    a.appendChild(head);

    const title = el(r.has_abs ? "button" : "div", "cn-title" + (r.has_abs ? " is-openable" : ""));
    title.appendChild(el("span", null, r.title || r.title_en || "（无题名）"));
    if (r.title_zh) title.appendChild(el("span", "cn-title-zh", r.title_zh));
    a.appendChild(title);

    if (r.has_abs) {
      const abs = el("div", "cn-abstract");
      abs.hidden = true;
      let loaded = false;
      let loading = false;
      title.addEventListener("click", async () => {
        // 首次展开才去拉分片，避免首屏下载全部摘要
        if (!loaded && !loading) {
          loading = true;
          abs.hidden = false;
          abs.textContent = "摘要加载中…";
          title.classList.add("expanded");
          const txt = await loadAbs(r._i);
          abs.textContent = txt ? txt + (txt.length >= 590 ? "…" : "") : "（该条暂无摘要）";
          loaded = true;
          loading = false;
          return;
        }
        if (loading) return;
        abs.hidden = !abs.hidden;
        title.classList.toggle("expanded", !abs.hidden);
      });
      a.appendChild(abs);
    }

    const foot = el("div", "cn-item-foot");
    const link = el("a", "cn-link", plat === "CNKI" ? "知网原文 ↗" : "PubMed 原文 ↗");
    link.href = plat === "CNKI"
      ? (r.url || "#")
      : "https://pubmed.ncbi.nlm.nih.gov/" + r.pmid + "/";
    link.target = "_blank"; link.rel = "noopener";
    foot.appendChild(link);
    if (r.authors) foot.appendChild(el("span", "cn-authors", r.authors.slice(0, 28)));
    if (r.doi) {
      const d = el("a", "cn-link ghost", "DOI ↗");
      d.href = "https://doi.org/" + r.doi;
      d.target = "_blank"; d.rel = "noopener";
      foot.appendChild(d);
    }
    if (r.pmid) foot.appendChild(el("span", "cn-pmid", "PMID " + r.pmid));
    a.appendChild(foot);

    return a;
  }
})();
