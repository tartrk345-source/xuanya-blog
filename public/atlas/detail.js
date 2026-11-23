/* 单种精油完整档案页 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const esc = (s) => String(s || "");
  const STATE_LABEL = { supported: "supported", disputed: "disputed", folklore: "folklore" };

  Promise.all([
    fetch("data/oil_details.json").then(r => r.json()),
    fetch("data/oil_reviews.json").then(r => r.ok ? r.json() : { reviews: [] }).catch(() => ({ reviews: [] })),
    fetch("data/evidence_translations.json").then(r => r.ok ? r.json() : {}).catch(() => ({})),
    fetch("data/ethics.json").then(r => r.json()).catch(() => ({ principles: [] })),
  ]).then(([details, reviews, trans, ethics]) => {
    const key = new URLSearchParams(location.search).get("oil") || "lavender";
    const oil = (details.oils || []).find(o => o.key === key) || details.oils[0];
    const review = (reviews.reviews || []).find(r => r.key === oil.key);
    document.title = oil.cn + " · 精油档案 · 玄牙";
    render(oil, review, trans, ethics);
  }).catch(e => {
    $("#detail-loading").textContent = "载入失败：" + e.message + "。请通过本地服务器访问。";
  });

  function render(o, review, trans, ethics) {
    $("#detail-loading").hidden = true;
    $("#detail-main").hidden = false;

    $("#d-name").textContent = o.cn;
    $("#d-latin").textContent = o.latin + "  ·  " + o.en;
    $("#d-family").textContent = o.family;
    $("#d-tagline").textContent = o.tagline;
    const badges = $("#d-badges");
    badges.appendChild(badge("证据成色：" + o.evidence_tone, "tone"));
    badges.appendChild(badge("文献 " + (o.evidence.counts.reviews + o.evidence.counts.rct) + " 篇", "tone plain"));
    if (o.evidence.counts.cochrane) badges.appendChild(badge("Cochrane " + o.evidence.counts.cochrane, "tone high"));

    // 02 速览
    const quick = $("#d-quick");
    [
      ["它是什么", o.quick.what, "q-def"],
      ["证据能支持什么", o.quick.evidence_use, "q-evi"],
      ["谁要小心", o.quick.who_avoid, "q-avoid"],
      ["常见误区", o.quick.myth, "q-myth"],
    ].forEach(([label, text, cls]) => {
      const c = el("div", "quick-card " + cls);
      c.appendChild(el("div", "quick-label", label));
      c.appendChild(el("p", "quick-text", text));
      quick.appendChild(c);
    });

    // 香气
    const scent = el("div", "quick-card q-scent");
    scent.appendChild(el("div", "quick-label", "香气印象"));
    const s = o.scent;
    scent.appendChild(el("p", "quick-text", s.notes));
    const noteList = el("div", "scent-notes");
    [["前调", s.top], ["中调", s.heart], ["基调", s.base]].forEach(([k, v]) => {
      const n = el("div", "scent-note");
      n.appendChild(el("span", "sn-k", k));
      n.appendChild(el("span", "sn-v", v));
      noteList.appendChild(n);
    });
    scent.appendChild(noteList);
    quick.appendChild(scent);

    // 03 故事
    $("#d-story-intro").textContent = o.story.intro;
    const story = $("#d-story");
    o.story.items.forEach(item => {
      const row = el("div", "story-item");
      const status = el("span", "story-status " + (STATE_LABEL[item.status] || "folklore"), item.statusLabel);
      const body = el("div");
      body.appendChild(el("div", "story-title", item.title));
      body.appendChild(el("p", "story-text", item.text));
      row.appendChild(status);
      row.appendChild(body);
      story.appendChild(row);
    });

    // 04 成分
    $("#d-chem-summary").textContent = o.chemistry.summary;
    const chem = $("#d-chem");
    o.chemistry.key.forEach(k => {
      const c = el("div", "chem-card");
      c.appendChild(el("div", "chem-name", k.name));
      c.appendChild(el("div", "chem-range", k.range));
      c.appendChild(el("p", "chem-plain", k.plain));
      if (k.pmid) {
        const a = el("a", "chem-link", "来源文献 PMID " + k.pmid + " ↗");
        a.href = "https://pubmed.ncbi.nlm.nih.gov/" + k.pmid + "/";
        a.target = "_blank"; a.rel = "noopener";
        c.appendChild(a);
      }
      chem.appendChild(c);
    });
    $("#d-chem-deep").textContent = o.chemistry.deep;
    $("#d-chemotype").textContent = "化学型提醒：" + o.chemistry.chemotype_note;

    // 05 综述
    const reviewBox = $("#d-review");
    if (review) {
      const sum = el("div", "review-lead", review.summary);
      reviewBox.appendChild(sum);
      [["研究版图", review.landscape], ["落地提示", review.practice], ["证据局限", review.caveat]].forEach(([l, t], i) => {
        const sec = el("div", "review-block" + (i === 2 ? " limit" : ""));
        sec.appendChild(el("div", "review-label", l));
        sec.appendChild(el("p", "review-text", t));
        reviewBox.appendChild(sec);
      });
    } else {
      reviewBox.appendChild(el("p", "detail-intro", o.evidence.summary + "（完整综述尚在撰写中）"));
    }

    // 06 文献
    const st = $("#d-evi-stats");
    [["系统评价", o.evidence.counts.reviews], ["Cochrane", o.evidence.counts.cochrane], ["RCT", o.evidence.counts.rct]].forEach(([l, n]) => {
      const c = el("div", "evi-stat");
      c.appendChild(el("div", "evi-n", String(n)));
      c.appendChild(el("div", "evi-l", l));
      st.appendChild(c);
    });
    const papers = $("#d-papers");
    o.evidence.key_papers.forEach(p => {
      const pmid = p.pmid;
      const t = trans[pmid] || {};
      const row = el("div", "paper-row");
      const title = el("a", "paper-title", t.title_zh ? t.title_zh : (p.title || "文献 PMID " + pmid));
      title.href = "https://pubmed.ncbi.nlm.nih.gov/" + pmid + "/";
      title.target = "_blank"; title.rel = "noopener";
      row.appendChild(title);
      if (t.title_zh) row.appendChild(el("div", "paper-en", p.title));
      const meta = el("div", "paper-meta");
      if (p.year) meta.appendChild(el("span", null, p.year));
      if (p.kind === "cochrane") meta.appendChild(el("span", "paper-cochrane", "Cochrane"));
      meta.appendChild(el("a", "paper-link", "PubMed 原文 ↗"));
      meta.lastChild.href = "https://pubmed.ncbi.nlm.nih.gov/" + pmid + "/";
      meta.lastChild.target = "_blank"; meta.lastChild.rel = "noopener";
      row.appendChild(meta);
      papers.appendChild(row);
    });

    // 07 实践
    const practice = $("#d-practice");
    [["香气与感受", o.practice.aroma], ["常见配伍", o.practice.blend], ["使用方式", o.practice.methods],
     ["保存", o.practice.storage], ["真假鉴别", o.practice.authenticity]].forEach(([l, t]) => {
      const c = el("div", "practice-card");
      c.appendChild(el("div", "practice-label", l));
      c.appendChild(el("p", "practice-text", t));
      practice.appendChild(c);
    });

    // 08 安全
    const safety = $("#d-safety");
    [["外用", o.safety.topical], ["氧化风险", o.safety.oxidation], ["禁忌人群", o.safety.avoid],
     ["宠物家庭", o.safety.pet]].forEach(([l, t]) => {
      const c = el("div", "safety-card");
      c.appendChild(el("div", "safety-label", l));
      c.appendChild(el("p", "safety-text", t));
      safety.appendChild(c);
    });
    const src = el("div", "safety-card sources");
    src.appendChild(el("div", "safety-label", "安全数据来源"));
    const ul = el("ul");
    o.safety.sources.forEach(s => ul.appendChild(el("li", null, s)));
    src.appendChild(ul);
    safety.appendChild(src);

    // 伦理
    const eg = $("#d-ethics");
    const icons = { medical: "✚", evidence: "▤", translation: "文", conflict: "◇", safety: "!", nature: "◈" };
    (ethics.principles || []).forEach(p => {
      const c = el("div", "ethics-card");
      c.appendChild(el("div", "ethics-icon", icons[p.id] || "i"));
      const body = el("div");
      body.appendChild(el("div", "ethics-title", p.title));
      body.appendChild(el("p", "ethics-text", p.text));
      c.appendChild(body);
      eg.appendChild(c);
    });
    $("#d-ethics-note").textContent = ethics.sources_note || "";
    $("#d-disclaimer").textContent = ethics.disclaimer_full || "";

    initNav();
  }

  function badge(text, cls) { return el("span", "detail-badge " + cls, text); }

  function initNav() {
    const links = Array.from(document.querySelectorAll(".detail-nav a"));
    let ticking = false;
    function update() {
      const probe = window.scrollY + window.innerHeight * 0.3;
      let current = links[0];
      links.forEach(a => {
        const t = document.querySelector(a.getAttribute("href"));
        if (t && t.offsetTop <= probe) current = a;
      });
      links.forEach(a => a.classList.toggle("active", a === current));
      ticking = false;
    }
    links.forEach(a => a.addEventListener("click", e => {
      e.preventDefault();
      const t = document.querySelector(a.getAttribute("href"));
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }
})();
