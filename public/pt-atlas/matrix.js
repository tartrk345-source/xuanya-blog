/* 精神科物理治疗 · 证据矩阵渲染（双视图：文献量 / Cochrane 数） */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const fmt = new Intl.NumberFormat("zh-CN");

  let M = null;        // matrix_counts
  let C = null;        // cochrane_counts
  let VIEW = "all";

  // 两个视图的分级阈值不同：Cochrane 数量级小得多
  function lv(n) {
    n = n || 0;
    if (VIEW === "all") return n === 0 ? 0 : n < 10 ? 1 : n < 50 ? 2 : n < 200 ? 3 : 4;
    return n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 7 ? 3 : 4;
  }
  const LEGEND = {
    all: [["0", "0"], ["1–9", "1"], ["10–49", "2"], ["50–199", "3"], ["200+", "4"]],
    cochrane: [["0", "0"], ["1", "1"], ["2–3", "2"], ["4–6", "3"], ["7+", "4"]],
  };

  function data() {
    if (VIEW === "all") return (M && M.cells) || {};
    return (C && C.cells) || {};
  }

  Promise.all([
    fetch("data/matrix_counts.json").then((r) => (r.ok ? r.json() : null)),
    fetch("data/cochrane_counts.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ])
    .then(([m, c]) => {
      M = m; C = c;
      if (!M) throw new Error("矩阵数据缺失");
      bindView();
      render();
    })
    .catch((e) => {
      $("#pt-tbody").innerHTML =
        '<tr><td colspan="20" style="padding:24px;color:#b05244">数据加载失败：' +
        e.message + "。请通过本地服务器访问。</td></tr>";
    });

  function bindView() {
    const box = $("#pt-views");
    if (!box) return;
    box.addEventListener("click", (e) => {
      const b = e.target.closest(".pt-view");
      if (!b || b.dataset.view === VIEW) return;
      if (b.dataset.view === "cochrane" && !C) {
        b.textContent = "Cochrane 数（待生成）";
        b.disabled = true;
        return;
      }
      VIEW = b.dataset.view;
      box.querySelectorAll(".pt-view").forEach((x) => x.classList.toggle("active", x === b));
      renderLegend();
      render();
      $("#pt-detail").hidden = true;
    });
  }

  function renderLegend() {
    const lg = $("#pt-legend");
    if (!lg) return;
    lg.querySelector(".pt-legend-label").textContent = VIEW === "all" ? "文献量" : "Cochrane";
    lg.querySelectorAll(".pt-lg").forEach((el, i) => {
      el.textContent = LEGEND[VIEW][i][0];
      el.dataset.lv = LEGEND[VIEW][i][1];
    });
  }

  function render() {
    if (!M) return;
    const cells = data();
    const tech = M.tech, ind = M.ind;
    const vals = Object.values(cells).filter((v) => typeof v === "number");

    const total = vals.reduce((a, b) => a + b, 0);
    const empty = vals.filter((v) => v === 0).length;
    const stats = VIEW === "all"
      ? [[tech.length, "种技术"], [ind.length, "个适应症"], [fmt.format(total), "格内文献合计"], [empty, "个空白格"]]
      : [[tech.length, "种技术"], [ind.length, "个适应症"], [fmt.format(total), "篇 Cochrane"], [empty, "无 Cochrane 的格"]];
    $("#pt-stats").innerHTML = stats
      .map(([n, l]) => `<div class="pt-stat"><b>${n}</b><span>${l}</span></div>`)
      .join("");
    $("#pt-time").textContent = "检索于 " + M.generated;

    // 表头
    const thead = $("#pt-thead");
    thead.innerHTML = "";
    const trh = document.createElement("tr");
    const corner = document.createElement("th");
    corner.textContent = "技术 ＼ 适应症";
    corner.style.cssText = "text-align:left;padding:0 10px 10px;font-size:11px;color:#8b9a93";
    trh.appendChild(corner);
    ind.forEach((i) => {
      const th = document.createElement("th");
      th.title = i.cn;
      const sp = document.createElement("div");
      sp.className = "pt-th-ind";
      sp.textContent = i.cn;
      th.appendChild(sp);
      trh.appendChild(th);
    });
    thead.appendChild(trh);

    // 表体
    const tbody = $("#pt-tbody");
    tbody.innerHTML = "";
    [...new Set(tech.map((t) => t.cat))].forEach((cat) => {
      const gtr = document.createElement("tr");
      const gth = document.createElement("th");
      gth.colSpan = ind.length + 1;
      gth.textContent = cat;
      gth.style.cssText =
        "position:sticky;left:0;background:#eef5f1;color:#1f5c43;font-size:11px;" +
        "letter-spacing:.08em;padding:6px 10px;border-bottom:1px solid #dde9e3;font-weight:600;text-align:left;z-index:1";
      gtr.appendChild(gth);
      tbody.appendChild(gtr);

      tech.filter((t) => t.cat === cat).forEach((t) => {
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        const cn = document.createElement("span");
        cn.className = "pt-row-cn";
        cn.textContent = t.cn;
        const en = document.createElement("span");
        en.className = "pt-row-en";
        en.textContent = t.en;
        th.appendChild(cn);
        th.appendChild(en);
        tr.appendChild(th);

        ind.forEach((i) => {
          const n = cells[t.key + "|" + i.key];
          const td = document.createElement("td");
          td.className = "pt-cell lv" + lv(n);
          td.textContent = n == null ? "–" : n === 0 ? "0" : fmt.format(n);
          td.addEventListener("click", () => pick(td, t, i, n));
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    });
  }

  function pick(td, t, i, n) {
    document.querySelectorAll(".pt-cell.sel").forEach((x) => x.classList.remove("sel"));
    td.classList.add("sel");
    $("#pt-detail").hidden = false;
    $("#pt-d-kicker").textContent = t.cat + " · " + (t.en || "");
    $("#pt-d-title").textContent = t.cn + " × " + i.cn;

    const all = (M.cells[t.key + "|" + i.key] || 0);
    const co = C ? (C.cells[t.key + "|" + i.key] || 0) : null;

    let cellsHtml;
    if (VIEW === "all") {
      const pct = all ? ((all / Math.max(1, maxOf(t.key))) * 100).toFixed(0) : 0;
      cellsHtml = [
        `<div class="pt-d-num">${fmt.format(all)}<span>篇文献</span></div>`,
        `<div class="pt-d-num">${pct}%<span>占该技术全部文献</span></div>`,
        co != null ? `<div class="pt-d-num">${co}<span>篇 Cochrane</span></div>` : "",
      ].join("");
    } else {
      cellsHtml = [
        `<div class="pt-d-num">${co || 0}<span>篇 Cochrane</span></div>`,
        `<div class="pt-d-num">${fmt.format(all)}<span>篇文献总数</span></div>`,
      ].join("");
    }

    const note = noteFor(all, co);
    $("#pt-d-body").innerHTML =
      `<div class="pt-d-body-row">${cellsHtml}</div><p class="pt-d-note">${note}</p>`;
  }

  function noteFor(all, co) {
    if (!all && !co) {
      return "这个组合是 0 篇。<strong>空不等于无效</strong>——可能是没人做，可能是做了没发表，也可能是做了发现没效果。三种情况要分开看。";
    }
    if (co >= 3) {
      return `有 ${co} 篇 Cochrane，说明这个组合已经被反复系统评价过。<strong>直接读最新的那篇</strong>，别从单篇 RCT 开始。注意看结论里的 GRADE 等级——Cochrane 有结论，不代表结论是「有效」。`;
    }
    if (co > 0) {
      return `有 ${co} 篇 Cochrane 但总量 ${fmt.format(all)} 篇——证据密度不高。Cochrane 的结论值得读，但它覆盖的往往只是一小块。`;
    }
    if (all >= 100) {
      return `${fmt.format(all)} 篇文献，<strong>零篇 Cochrane</strong>。这是最需要警惕的一类格子：研究不少，但没人把它做成系统评价——可能是领域太杂，也可能是证据质量普遍不够。`;
    }
    if (all >= 10) {
      return `${all} 篇，无 Cochrane。有一定研究基础，但这个量级里多半是小样本与混杂结局，读的时候先看有没有系统评价。`;
    }
    return `只有 ${all} 篇，多半是病例报告或小样本预实验。不足以形成临床判断。`;
  }

  function maxOf(tk) {
    if (!M) return 1;
    return Math.max(1, ...M.ind.map((i) => M.cells[tk + "|" + i.key] || 0));
  }

  document.addEventListener("click", (e) => {
    if (e.target.id === "pt-d-close") {
      $("#pt-detail").hidden = true;
      document.querySelectorAll(".pt-cell.sel").forEach((x) => x.classList.remove("sel"));
    }
  });
})();
