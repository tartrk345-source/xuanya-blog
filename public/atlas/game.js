/* 精油档案 · 递进式关卡（大字版） */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const CHAPTERS = [
    { t: "开场" }, { t: "闻香" }, { t: "植物档案" }, { t: "辨真伪" }, { t: "拆成分" },
    { t: "读综述" }, { t: "看证据" }, { t: "怎么用" }, { t: "测安全" }, { t: "通关" },
  ];

  let CUR = 0, maxReached = 0;
  let OIL = null, GIST = null, ETHICS = {}, BRIEFS = {};
  let score = { right: 0, total: 0 };
  let SAFETY = null;

  Promise.all([
    fetch("data/oil_details.json").then(r => r.json()),
    fetch("data/oil_gists.json").then(r => r.json()),
    fetch("data/ethics.json").then(r => r.json()).catch(() => ({ principles: [] })),
    fetch("data/evidence_briefs.json").then(r => r.ok ? r.json() : {}).catch(() => ({})),
    fetch("data/safety.json").then(r => r.ok ? r.json() : null).catch(() => null),
  ]).then(([details, gists, ethics, briefs, safety]) => {
    const key = new URLSearchParams(location.search).get("oil") || "lavender";
    OIL = details.oils.find(o => o.key === key) || details.oils[0];
    GIST = gists.gists[OIL.key];
    ETHICS = ethics; BRIEFS = briefs || {}; SAFETY = safety;
    document.title = OIL.cn + " · 精油档案 · 玄牙";
    if (!GIST) {
      // 尚未撰写精简档案：用长版数据降级生成，保证页面可用
      showNotice();
      GIST = fallbackGist(OIL);
    }
    boot();
  }).catch(e => {
    $("#game-loading").textContent = "载入失败：" + e.message;
  });

  function showNotice() {
    const n = el("div", "game-notice", "该精油的精简档案正在撰写中，当前显示基础信息。");
    $("#game-shell").parentNode.insertBefore(n, $("#game-shell"));
  }

  function fallbackGist(o) {
    return {
      hook: o.en,
      oneline: o.tagline,
      keys: [o.family.split(" ")[0]],
      scent: { note: "香气描述待补充。", tri: ["—", "—", "—"], feel: "—" },
      botany: { form: "植物形态待补充。", habit: "生长习性待补充。", origin: "原产地待补充。", part: "—", harvest: "—", note: "" },
      story: [{ t: "故事", s: "该精油的故事与证据辨析正在撰写中。", a: "fact", tag: "待补" }],
      chem: [{ n: "成分", r: "—", p: "成分谱待补充。" }],
      review: [{ l: "证据画像", s: o.evidence.summary },
               { l: "研究版图", s: "证据池收录综述 " + o.evidence.counts.reviews + " 篇、RCT " + o.evidence.counts.rct + " 篇。" },
               { l: "证据局限", s: "完整解读待补充。" }],
      practice: [{ l: "实践", s: "使用建议待补充。" }],
      safety: {
        quiz: [{ q: "精油可以口服吗？", o: ["可以", "不可以"], a: 1, e: "除专业指导外，精油不可口服。" }],
        detail: [{ l: "通用", s: "需稀释使用，避免入眼与黏膜。" }],
        sources: ["通用安全性原则"]
      },
      papers: {},
    };
  }

  function boot() {
    $("#game-loading").hidden = true;
    $("#game-shell").hidden = false;
    $("#gp-oil").textContent = OIL.cn;
    buildDots(); renderAll(); goto(0); bind();
  }

  function buildDots() {
    const dots = $("#gp-dots"), foot = $("#foot-dots");
    CHAPTERS.forEach((c, i) => {
      const d = el("button", "gp-dot");
      d.title = c.t;
      d.addEventListener("click", () => { if (i <= maxReached) goto(i); });
      dots.appendChild(d);
      const f = el("button", "foot-dot");
      f.addEventListener("click", () => { if (i <= maxReached) goto(i); });
      foot.appendChild(f);
    });
  }

  function bind() {
    $("#start-btn").addEventListener("click", () => goto(1));
    $("#btn-next").addEventListener("click", () => { if (CUR < 9) goto(CUR + 1); });
    $("#btn-prev").addEventListener("click", () => { if (CUR > 0) goto(CUR - 1); });
    $("#scent-orb").addEventListener("click", revealScent);
    document.addEventListener("keydown", e => {
      if (e.key === "ArrowRight" && CUR < 8) goto(CUR + 1);
      if (e.key === "ArrowLeft" && CUR > 0) goto(CUR - 1);
      if (e.key === "Escape") closeModal();
    });
    $("#paper-modal").addEventListener("click", e => {
      if (e.target.id === "paper-modal" || e.target.classList.contains("pm-close") || e.target.hasAttribute("data-close")) closeModal();
    });
  }

  function goto(i) {
    CUR = i; maxReached = Math.max(maxReached, i);
    $$(".scene").forEach(s => {
      const on = Number(s.dataset.scene) === i;
      s.classList.toggle("active", on);
      // 双保险：非当前场景直接内联隐藏，不单靠 CSS 优先级
      if (on) s.style.removeProperty("display");
      else s.style.display = "none";
    });
    $("#gp-fill").style.width = (i / 9 * 100) + "%";
    $("#gp-count").textContent = (i + 1) + "/9";
    $("#gp-chapter").textContent = CHAPTERS[i].t;
    $$(".gp-dot").forEach((d, k) => {
      d.classList.toggle("done", k < i);
      d.classList.toggle("cur", k === i);
      d.classList.toggle("locked", k > maxReached);
    });
    $$(".foot-dot").forEach((d, k) => {
      d.classList.toggle("done", k < i);
      d.classList.toggle("cur", k === i);
    });
    $("#btn-prev").disabled = i === 0;
    const next = $("#btn-next");
    next.disabled = i === 9;
    next.textContent = i === 9 ? "已通关" : "下一关";
    // 到达通关页时用最新分数重算，避免显示初始的 0 分
    if (i === 9) renderFinal();
    window.scrollTo(0, 0);
  }

  function revealScent() {
    $("#scent-orb").classList.add("opened");
    $("#scent-reveal").classList.add("show");
  }

  function renderAll() {
    // 0
    $("#s0-name").textContent = OIL.cn;
    $("#s0-latin").innerHTML = "<em>" + OIL.latin + "</em>";
    $("#s0-hook").textContent = GIST.hook;
    $("#s0-oneline").textContent = GIST.oneline;
    const kb = $("#s0-keys");
    GIST.keys.forEach(k => kb.appendChild(el("span", "key-chip", k)));

    // 1
    $("#s1-hook").textContent = "先别急着看数据";
    $("#s1-note").textContent = GIST.scent.note;
    const tri = $("#s1-tri");
    GIST.scent.tri.forEach((v, i) => {
      const c = el("div", "tri-card");
      c.appendChild(el("div", "tri-k", ["前调", "中调", "基调"][i]));
      c.appendChild(el("div", "tri-v", v));
      tri.appendChild(c);
    });
    $("#s1-feel").textContent = GIST.scent.feel;

    // 2 植物档案
    renderBotany();

    // 3 story quiz
    const sq = $("#story-quiz");
    GIST.story.forEach((item, idx) => {
      const card = el("div", "sq-card");
      card.appendChild(el("div", "sq-idx", String(idx + 1)));
      const body = el("div", "sq-body");
      body.appendChild(el("div", "sq-topic", item.t));
      body.appendChild(el("p", "sq-claim", item.claim || item.s));
      const opts = el("div", "sq-opts");
      [["fact", "确有其事"], ["myth", "只是传说"]].forEach(([v, label]) => {
        const b = el("button", "sq-opt", label);
        b.addEventListener("click", () => answerStory(card, item, v, b));
        opts.appendChild(b);
      });
      body.appendChild(opts);
      body.appendChild(el("div", "sq-feedback"));
      card.appendChild(body);
      sq.appendChild(card);
    });

    // 3 chem
    const deck = $("#chem-deck");
    GIST.chem.forEach(k => {
      const c = el("button", "chem-flip");
      const inner = el("div", "cf-inner");
      const front = el("div", "cf-face cf-front");
      front.appendChild(el("div", "cf-range", k.r));
      front.appendChild(el("div", "cf-name", k.n));
      front.appendChild(el("span", "cf-hint", "点我看作用"));
      const back = el("div", "cf-face cf-back");
      back.appendChild(el("div", "cf-name-sm", k.n));
      back.appendChild(el("p", "cf-plain", k.p));
      inner.appendChild(front); inner.appendChild(back);
      c.appendChild(inner);
      c.addEventListener("click", () => c.classList.toggle("flipped"));
      deck.appendChild(c);
    });

    // 4 review
    const rf = $("#review-flow");
    GIST.review.forEach((b, i) => {
      const node = el("div", "rf-block" + (i === 2 ? " limit" : ""));
      node.style.animationDelay = (i * 0.12) + "s";
      node.appendChild(el("div", "rf-label", b.l));
      node.appendChild(el("p", "rf-text" + (i === 0 ? " lead" : ""), b.s));
      rf.appendChild(node);
    });

    // 5 evidence
    const eb = $("#evi-board");
    [["系统评价", OIL.evidence.counts.reviews], ["Cochrane", OIL.evidence.counts.cochrane],
     ["RCT", OIL.evidence.counts.rct]].forEach(([l, n]) => {
      const c = el("div", "evi-cell");
      c.appendChild(el("div", "ec-n", String(n)));
      c.appendChild(el("div", "ec-l", l));
      eb.appendChild(c);
    });
    const papers = $("#evi-papers");
    papers.innerHTML = "";
    if (!OIL.evidence.key_papers || !OIL.evidence.key_papers.length) {
      const empty = el("div", "evi-empty",
        "这次检索里，证据池没有收录到该精油的研究。0 篇不等于无效——更可能是关键词未覆盖到，属于检索局限。");
      papers.appendChild(empty);
    }
    (OIL.evidence.key_papers || []).forEach(p => {
      const card = el("button", "paper-card");
      card.appendChild(el("span", "pc-year", p.year || "—"));
      const mid = el("div", "pc-mid");
      const g = (GIST.papers && GIST.papers[p.pmid]) || null;
      mid.appendChild(el("div", "pc-title", g && g.label ? g.label : p.title));
      mid.appendChild(el("div", "pc-hint", "这篇和「" + OIL.cn + "」什么关系？"));
      card.appendChild(mid);
      if (p.kind === "cochrane") card.appendChild(el("span", "pc-badge", "C"));
      card.addEventListener("click", () => openPaper(p.pmid, g));
      papers.appendChild(card);
    });

    // 6 practice
    const pd = $("#practice-deck");
    GIST.practice.forEach(p => {
      const c = el("div", "prac-card");
      c.appendChild(el("div", "pc-label", p.l));
      c.appendChild(el("p", "pc-text", p.s));
      pd.appendChild(c);
    });

    // 7 safety
    renderSafety();

    // 8 final
    renderFinal();
  }

  function renderBotany() {
    const b = GIST.botany || {};
    const hero = $("#botany-hero");
    hero.innerHTML = "";
    const left = el("div", "bh-left");
    left.appendChild(el("div", "bh-cn", OIL.cn));
    left.appendChild(el("div", "bh-latin", OIL.latin));
    hero.appendChild(left);
    const right = el("div", "bh-right");
    right.appendChild(el("div", "bh-family", OIL.family || "—"));
    right.appendChild(el("div", "bh-part", b.part ? "萃取：" + b.part : ""));
    hero.appendChild(right);

    const grid = $("#botany-grid");
    grid.innerHTML = "";
    [
      ["植株形态", b.form],
      ["生长习性", b.habit],
      ["原产地", b.origin],
      ["采收时节", b.harvest],
    ].forEach(([l, v]) => {
      if (!v) return;
      const c = el("div", "botany-card");
      c.appendChild(el("div", "bc-label", l));
      c.appendChild(el("p", "bc-text", v));
      grid.appendChild(c);
    });
    $("#botany-note").textContent = b.note || "";
    $("#botany-note").style.display = b.note ? "block" : "none";
  }

  function answerStory(card, item, choice, btn) {
    if (card.classList.contains("answered")) return;
    card.classList.add("answered");
    const right = choice === item.a;
    card.classList.add(right ? "right" : "wrong");
    card.querySelectorAll(".sq-opt").forEach(b => { b.disabled = true; b.classList.add("disabled"); });
    btn.classList.add(right ? "chosen-right" : "chosen-wrong");
    score.total++; if (right) score.right++;
    const fb = card.querySelector(".sq-feedback");
    const tag = el("span", "fb-tag " + (item.a === "fact" ? "supported" : "disputed"), item.tag);
    fb.appendChild(tag);
    fb.appendChild(el("span", "fb-text", item.why || (right ? "判断正确。" : "实际是「" + item.tag + "」。")));
    fb.classList.add("show");
  }

  function renderSafety() {
    const wrap = $("#safety-quiz");
    GIST.safety.quiz.forEach((q, i) => {
      const card = el("div", "sz-card");
      card.appendChild(el("div", "sz-q", q.q));
      const opts = el("div", "sz-opts");
      q.o.forEach((label, j) => {
        const b = el("button", "sz-opt", label);
        b.addEventListener("click", () => {
          if (card.classList.contains("answered")) return;
          card.classList.add("answered");
          const right = j === q.a;
          card.classList.add(right ? "right" : "wrong");
          opts.querySelectorAll(".sz-opt").forEach(x => { x.disabled = true; x.classList.add("disabled"); });
          b.classList.add(right ? "chosen-right" : "chosen-wrong");
          score.total++; if (right) score.right++;
          const fb = el("div", "sz-fb");
          fb.appendChild(el("span", "fb-tag " + (right ? "supported" : "disputed"), right ? "对" : "不对"));
          fb.appendChild(el("span", "fb-text", q.e));
          card.appendChild(fb);
        });
        opts.appendChild(b);
      });
      card.appendChild(opts);
      wrap.appendChild(card);
    });

    const det = $("#safety-detail");
    // 熏香途径单独一条：涂抹与扩香风险谱不同，不能只看外用
    const srow = SAFETY && SAFETY.rows ? SAFETY.rows.find(x => x.key === OIL.key) : null;
    if (srow && srow.diffuse_note) {
      const lv = ((SAFETY.meta.legend || {}).diffuse || {})[srow.diffuse] || srow.diffuse;
      const c = el("div", "sz-detail-card sz-diffuse-card sz-lv-" + srow.diffuse);
      c.appendChild(el("div", "sd-label", "熏香（扩香）：" + lv));
      c.appendChild(el("p", "sd-text", srow.diffuse_note));
      const more = el("a", "sd-more", "完整熏香安全规则 →");
      more.href = "safety.html";
      c.appendChild(more);
      det.appendChild(c);
    }
    GIST.safety.detail.forEach(d => {
      const c = el("div", "sz-detail-card");
      c.appendChild(el("div", "sd-label", d.l));
      c.appendChild(el("p", "sd-text", d.s));
      det.appendChild(c);
    });
  }

  function renderFinal() {
    $("#fs-name").textContent = OIL.cn;
    $("#fs-latin").innerHTML = "<em>" + OIL.latin + "</em>";

    const n = score.total ? Math.max(1, Math.round(score.right / score.total * 5)) : 0;
    const stars = $("#fs-stars");
    stars.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      const s = el("span", "fs-star" + (i < n ? " on" : ""), "★");
      s.style.animationDelay = (i * 0.09) + "s";
      stars.appendChild(s);
    }
    $("#fs-score").textContent = score.total
      ? ("答对 " + score.right + " / " + score.total + (n >= 5 ? " · 全对" : ""))
      : "还没答题 —— 回第 4 关或第 9 关试试";

    if (score.total > 0) saveProgress(OIL.key, n, score.right, score.total);

    const st = $("#fs-stats");
    st.innerHTML = "";
    [["综述", OIL.evidence.counts.reviews], ["Cochrane", OIL.evidence.counts.cochrane], ["RCT", OIL.evidence.counts.rct]]
      .forEach(([k, v]) => {
        const c = el("div", "fs-stat");
        c.appendChild(el("span", "fss-n", String(v)));
        c.appendChild(el("span", "fss-k", k));
        st.appendChild(c);
      });

    const acts = $("#fs-actions");
    acts.innerHTML = "";
    const again = el("button", "gbtn ghost", "再走一遍");
    again.addEventListener("click", () => {
      score = { right: 0, total: 0 };
      $$(".sq-card, .sz-card").forEach(c => {
        c.classList.remove("answered", "right", "wrong");
        c.querySelectorAll("button").forEach(b => { b.disabled = false; b.classList.remove("disabled", "chosen-right", "chosen-wrong"); });
        const fb = c.querySelector(".sq-feedback, .sz-fb");
        if (fb) { fb.remove(); }
      });
      // 重新挂回反馈容器
      const sq = $("#story-quiz");
      Array.from(sq.children).forEach(c => {
        if (!c.querySelector(".sq-feedback")) c.querySelector(".sq-body").appendChild(el("div", "sq-feedback"));
      });
      goto(0);
    });
    if (!score.total) {
      const goQuiz = el("button", "gbtn ghost", "去第 4 关答题");
      goQuiz.addEventListener("click", () => goto(3));
      acts.appendChild(goQuiz);
    }
    const back = el("a", "gbtn primary", "返回大厅 →");
    back.href = "game.html";
    acts.appendChild(again); acts.appendChild(back);

    const eg = $("#final-ethics");
    eg.innerHTML = "";
    const icons = { medical: "✚", evidence: "▤", translation: "文", conflict: "◇", safety: "!", nature: "◈" };
    (ETHICS.principles || []).forEach(p => {
      const c = el("div", "ethics-card");
      c.appendChild(el("div", "ethics-icon", icons[p.id] || "i"));
      const body = el("div");
      body.appendChild(el("div", "ethics-title", p.title));
      body.appendChild(el("p", "ethics-text", p.text));
      c.appendChild(body);
      eg.appendChild(c);
    });
    $("#final-disclaimer").textContent = ETHICS.disclaimer_full || "";
  }

  function saveProgress(key, stars, right, total) {
    try {
      const raw = localStorage.getItem("eo_archives_v1");
      const db = raw ? JSON.parse(raw) : {};
      const prev = db[key];
      // 只保留最好成绩
      if (!prev || stars >= prev.stars) {
        db[key] = { stars: stars, right: right, total: total, at: new Date().toISOString().slice(0, 10) };
        localStorage.setItem("eo_archives_v1", JSON.stringify(db));
      }
    } catch (e) { /* 隐私模式忽略 */ }
  }

  /* 文献简介弹层 */
  function openPaper(pmid, paper) {
    const b = BRIEFS[pmid] || {};
    const m = $("#paper-modal");
    $("#pm-kind").textContent = b.k || "文献";
    $("#pm-year").textContent = b.y || "";
    $("#pm-title").textContent = (paper && paper.label) || b.t || ("PMID " + pmid);
    $("#pm-orig").textContent = b.t || "";
    $("#pm-journal").textContent = b.j || "";
    const rel = (paper && paper.relevance) || "";
    $("#pm-relevance").textContent = rel;
    $("#pm-relevance-box").style.display = rel ? "block" : "none";
    const tags = $("#pm-tags");
    tags.innerHTML = "";
    (b.p || []).forEach(p => tags.appendChild(el("span", "pm-tag", p)));
    (b.tp || []).forEach(p => tags.appendChild(el("span", "pm-tag topic", p)));
    $("#pm-abstract").textContent = b.a || "本页未存储该文献摘要。";
    $("#pm-abstract-note").textContent = b.az ? "" : "（摘要为英文原文，尚未翻译）";
    const link = $("#pm-link");
    link.href = "https://pubmed.ncbi.nlm.nih.gov/" + pmid + "/";
    m.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    $("#paper-modal").classList.remove("open");
    document.body.style.overflow = "";
  }
  window.closeModal = closeModal;
})();
