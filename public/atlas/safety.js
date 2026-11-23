/* 安全速查矩阵 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const LABEL = { avoid: "禁", caution: "慎", ok: "可", high: "高", mild: "轻", none: "—" };
  // 熏香维度语义不同：mild 表示「注意通风与时长」，不是「轻微风险」
  const DIFF_LABEL = { avoid: "禁", high: "高", caution: "慎", mild: "注", ok: "可", none: "—" };
  const DIM_SHORT = {
    pregnancy: "孕期", lactation: "哺乳", infant: "婴幼儿", child: "儿童",
    sensitive: "敏感肌", phototoxic: "光毒性", pet: "宠物", drug: "药物", diffuse: "熏香",
  };
  // 各维度下「需要留意」的取值（用于筛选计数）
  const RISK = {
    diffuse: ["avoid", "high", "caution", "mild"],
    _default: ["avoid", "high", "caution"],
  };
  const riskOf = (d) => RISK[d] || RISK._default;
  let DATA = null;
  let ACTIVE = null; // 当前筛选的维度

  fetch("data/safety.json")
    .then(r => r.json())
    .then(d => { DATA = d; render(); })
    .catch(e => {
      $("#sf-body").innerHTML = '<tr><td colspan="11">载入失败：' + e.message + "</td></tr>";
    });

  function render() {
    const m = DATA.meta;
    $("#sf-time").textContent = m.updated;
    $("#sf-disclaimer").textContent = m.disclaimer;

    // 标题里的总数随数据自动更新，避免文案与数据脱节
    const tot = $("#sf-total");
    if (tot) tot.textContent = DATA.rows.length;

    // 三条使用原则
    const P = [
      ["必须稀释", "面部 1–2%，身体 2–3%，儿童 0.5–1%。精油是浓缩化学品，不建议纯油大面积涂抹。"],
      ["不可口服", "非专业指导下，精油一律不口服。冬青、桉叶、薄荷的误服风险最高。"],
      ["先查禁忌", "孕期、婴幼儿、癫痫、肝肾疾病、宠物家庭，以及正在服药的人，用前先查本表。"],
    ];
    P.forEach(([t, s]) => {
      const c = el("div", "sf-p");
      c.appendChild(el("div", "sf-p-t", t));
      c.appendChild(el("div", "sf-p-s", s));
      $("#sf-principles").appendChild(c);
    });

    // 途径说明：本表前八列按外用评估，第九列单独评估熏香
    const path = el("div", "sf-path");
    path.innerHTML =
      '<span class="sf-path-tag">阅读前提</span>' +
      '<span class="sf-path-text">表格前 8 列按 <strong>外用（涂抹 / 按摩 / 沐浴）</strong> 评估；' +
      '第 9 列 <strong>熏香</strong> 单独评估 <strong>吸入 / 扩香</strong> 途径。两条途径的风险谱不同，' +
      '不能互相套用——例如佛手柑的光毒性只在皮肤接触＋日晒时成立，扩香时不存在；' +
      '而呼吸道刺激、婴幼儿喉痉挛则只出现在熏香。详见下方「熏香专章」。</span>';
    $(".sf-hero-inner").appendChild(path);
    // 筛选按钮
    const f = $("#sf-filters");
    const all = el("button", "sf-fbtn active", "全部 " + DATA.rows.length + " 种");
    all.dataset.dim = "";
    f.appendChild(all);
    m.dims.forEach(d => {
      const cnt = DATA.rows.filter(r => riskOf(d).includes(r[d])).length;
      const b = el("button", "sf-fbtn" + (d === "diffuse" ? " sf-fbtn-diff" : ""), DIM_SHORT[d] + "需注意 " + cnt);
      b.dataset.dim = d;
      f.appendChild(b);
    });

    // 表头
    const head = el("tr");
    head.appendChild(el("th", "sf-th-oil", "精油"));
    m.dims.forEach(d => {
      const th = el("th", d === "diffuse" ? "sf-th-diff" : null, m.dim_cn[d]);
      th.style.whiteSpace = "pre-line";
      if (d === "diffuse") th.title = "熏香 / 扩香 / 吸入途径";
      head.appendChild(th);
    });
    head.appendChild(el("th", null, "特殊"));
    $("#sf-head").appendChild(head);

    // 图例：外用与熏香分开，避免语义混淆
    const lg = $("#sf-legend");
    const row1 = el("div", "sf-lg-row");
    row1.appendChild(el("span", "sf-lg-title", "外用（前 8 列）"));
    [["avoid", "禁用"], ["high", "高风险"], ["caution", "慎用"], ["mild", "轻微"], ["ok", "可用"], ["none", "无此风险"]]
      .forEach(([k, t]) => {
        const i = el("span", "sf-lg-item");
        i.appendChild(el("span", "sf-cell v-" + k, LABEL[k]));
        i.appendChild(el("span", "sf-lg-t", t));
        row1.appendChild(i);
      });
    lg.appendChild(row1);

    const row2 = el("div", "sf-lg-row");
    row2.appendChild(el("span", "sf-lg-title", "熏香（第 9 列）"));
    [["avoid", "禁止扩香"], ["high", "不建议室内扩香"], ["caution", "慎用 / 敏感者避免"], ["mild", "注意通风与时长"], ["ok", "常规可用"]]
      .forEach(([k, t]) => {
        const i = el("span", "sf-lg-item");
        i.appendChild(el("span", "sf-cell v-" + k, DIFF_LABEL[k]));
        i.appendChild(el("span", "sf-lg-t", t));
        row2.appendChild(i);
      });
    lg.appendChild(row2);

    drawRows();
    renderDiffuse();

    $("#sf-filters").addEventListener("click", e => {
      const b = e.target.closest(".sf-fbtn");
      if (!b) return;
      document.querySelectorAll(".sf-fbtn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      ACTIVE = b.dataset.dim || null;
      drawRows();
    });
  }

  function drawRows() {
    const body = $("#sf-body");
    body.innerHTML = "";
    let rows = DATA.rows.slice();
    if (ACTIVE) {
      // 有风险者优先，且只显示需要注意的
      rows = rows.filter(r => riskOf(ACTIVE).includes(r[ACTIVE]));
    }
    $("#sf-count").textContent = "显示 " + rows.length + " / " + DATA.rows.length + " 种";

    rows.forEach(r => {
      const tr = el("tr", "sf-row");
      const nameCell = el("td", "sf-name-cell");
      const a = el("a", "sf-name", r.cn);
      a.href = "oil-detail.html?oil=" + encodeURIComponent(r.key);
      nameCell.appendChild(a);
      nameCell.appendChild(el("span", "sf-tier tier-" + r.tier, r.tier));
      tr.appendChild(nameCell);

      DATA.meta.dims.forEach(d => {
        const v = r[d];
        const isDiff = d === "diffuse";
        const td = el("td", isDiff ? "sf-td-diff" : null);
        const cell = el("span", "sf-cell" + (isDiff ? " sf-cell-diff" : "") + " v-" + v,
          (isDiff ? DIFF_LABEL : LABEL)[v] || "—");
        cell.title = isDiff ? "熏香：" + ((DATA.meta.legend.diffuse || {})[v] || v) : "";
        td.appendChild(cell);
        if (ACTIVE && ACTIVE === d) td.classList.add("sf-col-active");
        tr.appendChild(td);
      });

      const hasNote = r.note || r.diffuse_note;
      const noteCell = el("td", "sf-note-cell");
      if (hasNote) {
        const btn = el("button", "sf-note-btn", "注");
        btn.title = "展开特殊警示";
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const next = tr.nextElementSibling;
          if (next && next.classList.contains("sf-note-row")) { next.remove(); return; }
          const nr = el("tr", "sf-note-row");
          const nd = el("td");
          nd.colSpan = DATA.meta.dims.length + 2;
          if (r.note) {
            const p1 = el("div", "sf-note-p");
            p1.innerHTML = '<b class="sf-note-k">外用：</b>';
            p1.appendChild(document.createTextNode(r.note));
            nd.appendChild(p1);
          }
          if (r.diffuse_note) {
            const p2 = el("div", "sf-note-p sf-note-p-diff");
            p2.innerHTML = '<b class="sf-note-k diff">熏香：</b>';
            p2.appendChild(document.createTextNode(r.diffuse_note));
            nd.appendChild(p2);
          }
          nr.appendChild(nd);
          tr.after(nr);
        });
        noteCell.appendChild(btn);
      }
      tr.appendChild(noteCell);
      body.appendChild(tr);
    });

    if (!rows.length) {
      const tr = el("tr");
      const td = el("td", "sf-empty", "该维度下没有需要特别注意的精油。");
      td.colSpan = DATA.meta.dims.length + 2;
      tr.appendChild(td);
      body.appendChild(tr);
    }
  }

  /* 熏香专章：机制差异 + 通用规则 + 人群红线 */
  function renderDiffuse() {
    const m = DATA.meta;
    const wrap = $("#sf-diffuse");
    if (!wrap || !m.diffuse_rules) return;
    wrap.innerHTML = "";

    const head = el("div", "sfd-head");
    head.appendChild(el("span", "sfd-kicker", "INHALATION ROUTE"));
    head.appendChild(el("h2", "sfd-title", "熏香（吸入 / 扩香）安全"));
    head.appendChild(el("p", "sfd-sub",
      "涂抹和熏香不是同一件事。涂抹的顾虑是局部刺激、致敏、光毒性；熏香多了一层——呼吸道黏膜直接暴露，" +
      "而且剂量无法用百分比描述。下面这张表按外用评估，熏香要看这一节。"));
    wrap.appendChild(head);

    // 机制差异
    const mech = el("div", "sfd-mech");
    (m.diffuse_mechanism || []).forEach((x) => {
      const c = el("div", "sfd-mech-card");
      c.appendChild(el("div", "sfd-mech-t", x.t));
      const s = el("p", "sfd-mech-s");
      // 支持 **加粗**
      x.s.split(/\*\*(.+?)\*\*/).forEach((seg, i) => {
        if (i % 2 === 1) s.appendChild(el("strong", null, seg));
        else if (seg) s.appendChild(document.createTextNode(seg));
      });
      c.appendChild(s);
      mech.appendChild(c);
    });
    wrap.appendChild(mech);

    // 规则 + 红线两栏
    const cols = el("div", "sfd-cols");

    const left = el("div", "sfd-col");
    left.appendChild(el("h3", "sfd-h3", "六条操作规则"));
    const ol = el("ol", "sfd-rules");
    (m.diffuse_rules || []).forEach((x) => {
      const li = el("li", "sfd-rule");
      li.appendChild(el("span", "sfd-rule-t", x.t));
      li.appendChild(el("span", "sfd-rule-s", x.s));
      ol.appendChild(li);
    });
    left.appendChild(ol);
    cols.appendChild(left);

    const right = el("div", "sfd-col");
    right.appendChild(el("h3", "sfd-h3", "这些情况不做扩香"));
    const gl = el("div", "sfd-groups");
    (m.diffuse_groups || []).forEach((g) => {
      const c = el("div", "sfd-group sfd-lv-" + g.level);
      const t = el("div", "sfd-group-head");
      t.appendChild(el("span", "sfd-group-lv", DIFF_LABEL[g.level] || ""));
      t.appendChild(el("span", "sfd-group-name", g.name));
      c.appendChild(t);
      c.appendChild(el("p", "sfd-group-s", g.s));
      gl.appendChild(c);
    });
    right.appendChild(gl);
    cols.appendChild(right);
    wrap.appendChild(cols);

    // 依据来源
    const refs = el("details", "sfd-refs");
    const sum = el("summary", "sfd-refs-sum", "这一节依据什么？（" + (m.diffuse_refs || []).length + " 类来源）");
    refs.appendChild(sum);
    const rl = el("div", "sfd-ref-list");
    (m.diffuse_refs || []).forEach((r, i) => {
      const c = el("div", "sfd-ref");
      c.appendChild(el("span", "sfd-ref-n", String(i + 1)));
      const body = el("div", "sfd-ref-body");
      body.appendChild(el("div", "sfd-ref-t", r.t));
      body.appendChild(el("p", "sfd-ref-s", r.s));
      c.appendChild(body);
      rl.appendChild(c);
    });
    refs.appendChild(rl);
    wrap.appendChild(refs);

    const foot = el("div", "sfd-foot");
    foot.textContent = "以上为文献与安全共识的汇总性提示，不构成个体化医疗建议。呼吸道症状（咳嗽、喘息、胸闷）出现即停止并通风；婴幼儿与猫家庭建议完全不做扩香。";
    wrap.appendChild(foot);
  }
})();
