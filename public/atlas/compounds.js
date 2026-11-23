/* 成分库：从成分反查精油与比例（按类别分组 + 侧栏目录） */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  // 支持数据里的 **加粗**
  const rich = (node, str) => {
    String(str || "").split(/\*\*(.+?)\*\*/g).forEach((seg, i) => {
      if (i % 2 === 1) node.appendChild(el("strong", null, seg));
      else if (seg) node.appendChild(document.createTextNode(seg));
    });
    return node;
  };

  // 大类：用于分组与目录（化学类别太碎，20 多个不适合做导航）
  const GROUPS = [
    { k: "萜烯", label: "萜烯", desc: "精油里最基础的碳骨架。分子小、挥发快，构成前调；抗菌与溶剂样作用为主，单独看药理活性偏弱。" },
    { k: "醇", label: "醇", desc: "多数温和，是花香与「放松感」的主体，也是精油里最常被研究的一类。但醇会氧化，氧化物才是真正的致敏原。" },
    { k: "酯", label: "酯", desc: "气味甜美圆润，动物研究里常见镇静作用。化学上不安分——容易水解成醇与酸，存放久了气味与致敏性都会变。" },
    { k: "醛酸", label: "醛与酸", desc: "气味强烈、抗菌力强，同时是最容易刺激与致敏的一类。柠檬醛、肉桂醛都在这里。" },
    { k: "酚", label: "酚", desc: "抗菌最强的一类，也是刺激最强的一类。「天然抗生素」的说法多半指它们，但黏膜灼感与肝毒性风险同样来自它们。" },
    { k: "酮", label: "酮", desc: "神经活性最明显的一类。樟脑与侧柏酮的安全边界（癫痫、孕期）就是由这一类的性质决定的。" },
    { k: "醚类", label: "氧化物与醚", desc: "1,8-桉叶素与各类醚。呼吸道风险高度集中在这一组——婴幼儿喉痉挛的经典诱因就在这里。" },
    { k: "其他", label: "其他", desc: "非挥发性成分与特殊结构。它们常是「提取物 ≠ 精油」的原因，也是最容易被误当作精油功效来源的一批。" },
  ];
  const GROUP_OF = {
    "单萜烯": "萜烯", "倍半萜烯": "萜烯", "倍半萜": "萜烯",
    "单萜醇": "醇", "倍半萜醇": "醇", "二萜醇": "醇",
    "酯": "酯", "含氮酯": "酯", "酚酸酯": "酯",
    "醛": "醛酸", "羧酸": "醛酸",
    "酚": "酚", "酚类烷基": "酚", "二萜酚酸": "酚",
    "酮": "酮", "倍半萜二酮": "酮",
    "氧化物": "醚类", "醚": "醚类", "单萜醇醚": "醚类", "苯丙素醚": "醚类", "酚醚": "醚类",
  };
  const OTHER = "其他";

  const EV_ORDER = [
    { k: "", l: "全部证据" },
    { k: "human", l: "有人体证据" },
    { k: "mixed", l: "人体证据有限" },
    { k: "animal", l: "动物为主" },
    { k: "vitro", l: "仅体外" },
  ];
  const EV_CLS = { human: "ev-human", mixed: "ev-mixed", animal: "ev-animal", vitro: "ev-vitro" };

  let DATA = [];
  let ST = { q: "", group: "", ev: "" };
  let NAV = [];        // 当前渲染出的分组，用于目录与高亮
  let observer = null;

  fetch("data/compounds.json")
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((d) => { DATA = d.compounds || []; boot(d); })
    .catch((e) => {
      $("#cp-list").innerHTML = '<div class="cp-err">成分数据加载失败：' + e.message + "。请通过本地服务器访问。</div>";
    });

  const groupOf = (c) => GROUP_OF[c.cls] || OTHER;

  function boot(d) {
    $("#cp-time").textContent = "更新于 " + (d.meta.generated || "—");
    const allergen = DATA.filter((c) => c.allergen).length;
    const links = DATA.reduce((s, c) => s + c.oil_count, 0);
    [
      [DATA.length, "种成分"],
      [(d.meta.oil_count || 0) + " / " + (d.meta.oil_total || d.meta.oil_count), "种精油有成分数据"],
      [links, "条成分—精油索引"],
      [allergen, "种须标注致敏原"],
    ].forEach(([n, l]) => {
      const c = el("div", "cp-stat");
      c.appendChild(el("div", "cp-stat-n", String(n)));
      c.appendChild(el("div", "cp-stat-l", l));
      $("#cp-stats").appendChild(c);
    });

    // 类别筛选
    const wrap = $("#cp-groups");
    const mk = (k, label, count) => {
      const b = el("button", "cp-gbtn" + (ST.group === k ? " active" : ""), label);
      if (count != null) b.appendChild(el("span", "cp-gbtn-n", String(count)));
      b.dataset.g = k;
      wrap.appendChild(b);
    };
    mk("", "全部", DATA.length);
    GROUPS.forEach((g) => {
      const n = DATA.filter((c) => groupOf(c) === g.k).length;
      if (n) mk(g.k, g.label, n);
    });

    // 证据筛选
    EV_ORDER.forEach((o) => {
      const b = el("button", "cp-evbtn" + (o.k === ST.ev ? " active" : ""), o.l);
      b.dataset.ev = o.k;
      $("#cp-evbar").appendChild(b);
    });

    bind();
    render();
    initScrollNav();
  }

  function bind() {
    $("#cp-search").addEventListener("input", (e) => {
      ST.q = e.target.value.trim().toLowerCase();
      render();
    });
    $("#cp-groups").addEventListener("click", (e) => {
      const b = e.target.closest(".cp-gbtn");
      if (!b) return;
      document.querySelectorAll(".cp-gbtn").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      ST.group = b.dataset.g;
      render();
      window.scrollTo({ top: $(".cp-main").offsetTop - 12, behavior: "smooth" });
    });
    $("#cp-evbar").addEventListener("click", (e) => {
      const b = e.target.closest(".cp-evbtn");
      if (!b) return;
      document.querySelectorAll(".cp-evbtn").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      ST.ev = b.dataset.ev;
      render();
    });
  }

  function filtered() {
    let list = DATA.slice();
    if (ST.group) list = list.filter((c) => groupOf(c) === ST.group);
    if (ST.ev) list = list.filter((c) => c.ev === ST.ev);
    if (ST.q) {
      const q = ST.q;
      list = list.filter((c) =>
        c.cn.toLowerCase().includes(q) ||
        (c.en || "").toLowerCase().includes(q) ||
        (c.cls || "").toLowerCase().includes(q) ||
        (c.effects || "").toLowerCase().includes(q) ||
        (c.oils || []).some((o) => o.cn.toLowerCase().includes(q))
      );
    }
    return list;
  }

  function render() {
    const list = filtered();
    const body = $("#cp-list");
    body.innerHTML = "";
    NAV = [];

    const present = GROUPS.filter((g) => list.some((c) => groupOf(c) === g.k));
    $("#cp-count").textContent = "共 " + list.length + " 种成分 · " + present.length + " 组";

    present.forEach((g, gi) => {
      const items = list
        .filter((c) => groupOf(c) === g.k)
        .sort((a, b) => (b.oil_count - a.oil_count) || a.cn.localeCompare(b.cn, "zh"));

      const sec = el("section", "cp-group");
      sec.id = "cp-grp-" + gi;
      sec.dataset.g = g.k;

      const head = el("div", "cp-group-head");
      const h = el("h2", "cp-group-title");
      h.appendChild(el("span", null, g.label));
      h.appendChild(el("span", "cp-group-n", String(items.length)));
      head.appendChild(h);
      head.appendChild(el("p", "cp-group-desc", g.desc));
      sec.appendChild(head);

      const grid = el("div", "cp-cards");
      items.forEach((c, i) => grid.appendChild(card(c, i)));
      sec.appendChild(grid);

      body.appendChild(sec);
      NAV.push({ id: sec.id, label: g.label, n: items.length });
    });

    if (!list.length) {
      body.appendChild(el("div", "cp-empty", "没有匹配的成分。换个词，或点「全部」重置筛选。"));
    }

    buildNav();
    observeGroups();
  }

  /* ---------- 目录 ---------- */
  function buildNav() {
    const toc = $("#cp-toc");
    const bnav = $("#cp-bnav");
    toc.innerHTML = "";
    bnav.innerHTML = "";

    NAV.forEach((item) => {
      const f = el("a", "cp-toc-item");
      f.href = "#" + item.id;
      f.dataset.target = item.id;
      f.appendChild(el("span", "cp-toc-label", item.label));
      f.appendChild(el("span", "cp-toc-n", String(item.n)));
      toc.appendChild(f);

      const b = el("a", "cp-bnav-item", item.label + " " + item.n);
      b.href = "#" + item.id;
      b.dataset.target = item.id;
      bnav.appendChild(b);

      [f, b].forEach((node) => {
        node.addEventListener("click", (e) => {
          e.preventDefault();
          const t = document.getElementById(item.id);
          if (!t) return;
          const top = t.getBoundingClientRect().top + window.scrollY - 14;
          window.scrollTo({ top, behavior: "smooth" });
          setActive(item.id);
        });
      });
    });

    // 回顶
    const top = el("button", "cp-toc-top", "↑");
    top.title = "回到顶部";
    top.setAttribute("aria-label", "回到顶部");
    top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    toc.appendChild(top);

    const btop = el("button", "cp-bnav-top", "↑ 顶部");
    btop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    bnav.appendChild(btop);
  }

  function setActive(id) {
    document.querySelectorAll(".cp-toc-item").forEach((a) => {
      a.classList.toggle("active", a.dataset.target === id);
    });
    document.querySelectorAll(".cp-bnav-item").forEach((a) => {
      const on = a.dataset.target === id;
      a.classList.toggle("active", on);
      if (on) a.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });
  }

  function observeGroups() {
    if (observer) observer.disconnect();
    const secs = Array.from(document.querySelectorAll(".cp-group"));
    if (!secs.length) return;
    // 以视口中上部为判定带：哪一组正经过这里，就高亮哪一组
    observer = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id);
    }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });
    secs.forEach((s) => observer.observe(s));
  }

  function initScrollNav() {
    const toc = $("#cp-toc");
    const bnav = $("#cp-bnav");
    const hero = $(".cp-hero");
    let shown = false;
    const onScroll = () => {
      const mark = (hero ? hero.offsetTop + hero.offsetHeight : 300) - 80;
      const next = window.scrollY > mark && NAV.length > 1;
      if (next === shown) return;
      shown = next;
      toc.classList.toggle("visible", next);
      bnav.classList.toggle("visible", next);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 卡片 ---------- */
  function card(c, idx) {
    const a = el("article", "cp-card");
    a.style.animationDelay = Math.min(idx, 8) * 0.03 + "s";

    const head = el("div", "cp-head");
    const left = el("div", "cp-head-left");
    const nameRow = el("div", "cp-name-row");
    nameRow.appendChild(el("h3", "cp-cn", c.cn));
    if (c.en) nameRow.appendChild(el("span", "cp-en", c.en));
    left.appendChild(nameRow);
    const meta = el("div", "cp-meta");
    meta.appendChild(el("span", "cp-cls", c.cls));
    if (c.vol_label) meta.appendChild(el("span", "cp-vol", c.vol_label));
    if (c.formula && c.formula !== "—") meta.appendChild(el("span", "cp-formula", c.formula));
    left.appendChild(meta);
    head.appendChild(left);

    const right = el("div", "cp-head-right");
    right.appendChild(el("div", "cp-oilnum", String(c.oil_count)));
    right.appendChild(el("div", "cp-oilnum-l", "种精油含它"));
    if (c.allergen) {
      const al = el("div", "cp-allergen", "须标注致敏原");
      al.title = "EU 1223/2009 附录 III / IFRA 要求标注的香料致敏原";
      right.appendChild(al);
    }
    head.appendChild(right);
    a.appendChild(head);

    const eff = el("p", "cp-effect");
    rich(eff, c.effects);
    a.appendChild(eff);

    const mech = el("div", "cp-row");
    mech.appendChild(el("span", "cp-row-k", "机制"));
    rich(mech.appendChild(el("span", "cp-row-v")), c.mech);
    a.appendChild(mech);

    const safe = el("div", "cp-row cp-row-safe" + (c.allergen ? " is-allergen" : ""));
    safe.appendChild(el("span", "cp-row-k", "安全"));
    rich(safe.appendChild(el("span", "cp-row-v")), c.safety);
    a.appendChild(safe);

    const evRow = el("div", "cp-ev");
    evRow.appendChild(el("span", "cp-ev-badge " + (EV_CLS[c.ev] || ""), c.ev_label || c.ev));
    if (c.note) {
      const n = el("span", "cp-note-inline");
      rich(n, c.note);
      evRow.appendChild(n);
    }
    a.appendChild(evRow);

    const oils = el("div", "cp-oils");
    const ot = el("div", "cp-oils-title");
    ot.appendChild(el("span", null, "含它的精油与比例"));
    ot.appendChild(el("span", "cp-oils-hint", String(c.oil_count) + " 种"));
    oils.appendChild(ot);

    const chips = el("div", "cp-chips");
    (c.oils || []).forEach((o) => {
      const link = el("a", "cp-chip");
      link.href = "oil-detail.html?oil=" + encodeURIComponent(o.key);
      link.appendChild(el("span", "cp-chip-name", o.cn));
      if (o.ratio) link.appendChild(el("i", "cp-chip-ratio", o.ratio));
      chips.appendChild(link);
    });
    oils.appendChild(chips);
    a.appendChild(oils);

    return a;
  }
})();
