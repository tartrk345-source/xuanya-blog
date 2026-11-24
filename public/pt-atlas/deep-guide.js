/* AI 深度精读卡：从 data/deep_guides.json 加载，翻页卡交互（原 samples/guide-demo v0.3 正式版） */
(function () {
  'use strict';
  var DATA = null;
  var ORDER = ['rct_ocd', 'meta_ocd', 'rct_accel_ocd', 'sr_schizophrenia', 'rct_schiz_negative', 'sr_dTMS_all', 'sr_dTMS_vs_rTMS', 'letter_tus'];
  var LABEL = {
    rct_ocd: 'OCD dTMS · 随机对照',
    meta_ocd: '难治 OCD · Meta 分析',
    rct_accel_ocd: '加速双锥线圈 · RCT',
    sr_schizophrenia: '精分 dTMS · 系统综述',
    rct_schiz_negative: '精分阴性症状 · RCT',
    sr_dTMS_all: 'dTMS 全景 · 28 项综述',
    sr_dTMS_vs_rTMS: 'H1 vs F8 · 头对头',
    letter_tus: '经颅聚焦超声 · 前沿'
  };
  var curKey = 'rct_ocd', cur = 0;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function cnNum(n) {
    var a = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    if (n <= 10) return a[n - 1];
    if (n < 20) return '十' + a[n - 11];
    return a[Math.floor(n / 10) - 1] + '十' + (n % 10 ? a[n % 10 - 1] : '');
  }
  function confLabel(c) { return c === 'high' ? '高' : c === 'mid' ? '中' : '低'; }
  function lvCls(lv) { return lv === '六级' ? 'l6' : lv === '进阶' ? 'adv' : lv === '专业术语' ? 'term' : ''; }

  fetch('data/deep_guides.json', { credentials: 'same-origin' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      DATA = d.guides || {};
      // URL 深链：?paper=sr_schizophrenia
      var q = new URLSearchParams(location.search).get('paper');
      if (q && DATA[q]) curKey = q;
      buildSwitcher();
      show(curKey);
      bindKeys();
    })
    .catch(function (e) {
      console.error('deep guide data:', e);
      document.getElementById('dg-app').innerHTML = '<div class="ev-empty">数据加载失败，请通过 HTTP 服务打开页面。</div>';
    });

  function buildSwitcher() {
    var box = document.getElementById('dg-switcher'); box.innerHTML = '';
    ORDER.forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'dg-sw-btn' + (k === curKey ? ' on' : '');
      b.textContent = LABEL[k]; b.dataset.paper = k;
      b.addEventListener('click', function () { show(k); });
      box.appendChild(b);
    });
  }

  function allGroups(key) {
    var D = DATA[key], gs = D.groups.slice();
    if (D.fulltext && D.fulltext.length) {
      gs.push({ name: '四、全文 · 英中对照', items: D.fulltext.map(function (p, i) { return { label: p.sec + '（' + (i + 1) + '）', kind: 'fulltext', data: p }; }) });
    }
    if (D.tables && D.tables.length) {
      gs.push({ name: '五、表格 · 关键数据', items: D.tables.map(function (t) { return { label: t.name, kind: 'table', data: t }; }) });
    }
    return gs;
  }
  function modsOf(key) {
    var out = [];
    allGroups(key).forEach(function (g, gi) { g.items.forEach(function (m) { out.push({ data: m, gi: gi, gname: g.name }); }); });
    return out;
  }
  function payload(item) { return item.kind ? item.data : item; }

  function markHard(en, hard) {
    var s = esc(en);
    if (!hard || !hard.length) return s;
    var list = hard.slice().sort(function (a, b) { return b.w.length - a.w.length; });
    list.forEach(function (h) {
      if (h.lv === '四级内') return;
      var needle = esc(h.w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try {
        var re = new RegExp('(^|[^A-Za-z])(' + needle + ')(?=$|[^A-Za-z])', 'g');
        s = s.replace(re, function (m, p1, p2) { return p1 + '<span class="dg-hw ' + lvCls(h.lv) + '" title="' + esc(h.lv + '：' + h.zh) + '">' + p2 + '</span>'; });
      } catch (e) {}
    });
    return s;
  }
  function renderFulltext(p) {
    var h = '<span class="dg-ft-sec">' + esc(p.sec) + '</span>';
    h += '<div class="dg-ft-en">' + markHard(p.en, p.hard) + '</div>';
    h += '<div class="dg-ft-zh"><b>译</b>' + esc(p.zh) + '</div>';
    if (p.hard && p.hard.length) {
      h += '<details class="dg-hardlist"><summary>本段超四级词 ' + p.hard.filter(function (x) { return x.lv !== '四级内'; }).length + ' 个 · 展开词表</summary><div class="dg-hard-items">';
      p.hard.forEach(function (x) {
        if (x.lv === '四级内') return;
        h += '<span class="dg-hard-item ' + lvCls(x.lv) + '"><b>' + esc(x.w) + '</b> · ' + esc(x.lv) + '：' + esc(x.zh) + '</span>';
      });
      h += '</div></details>';
    }
    h += '<div class="dg-legend"><span><i class="i6"></i>六级（黄）</span><span><i class="iadv"></i>进阶（橙）</span><span><i class="iterm"></i>专业术语（紫）</span><span>悬停英文高亮词看释义</span></div>';
    return h;
  }
  function renderTable(t) {
    var h = '<div class="dg-tb-note">' + esc(t.note) + '</div><div class="dg-tb-wrap"><table class="dg-tb"><thead><tr>';
    t.head.forEach(function (x) { h += '<th>' + esc(x) + '</th>'; });
    h += '</tr></thead><tbody>';
    t.rows.forEach(function (row) { h += '<tr>'; row.forEach(function (x) { h += '<td>' + esc(x) + '</td>'; }); h += '</tr>'; });
    h += '</tbody></table></div><div class="dg-tb-explain"><b>怎么读这张表：</b>' + esc(t.explain) + '</div>';
    return h;
  }
  function renderBody(item) {
    if (item.kind === 'fulltext') return renderFulltext(item.data);
    if (item.kind === 'table') return renderTable(item.data);
    var m = payload(item), cls = /待填/.test(m.label || '') ? ' dg-fill' : '';
    var h = '<div class="dg-body' + cls + '">';
    if (m.value) {
      if (Array.isArray(m.value)) { h += '<div class="dg-val"><ul>'; m.value.forEach(function (v) { h += '<li>' + esc(v) + '</li>'; }); h += '</ul></div>'; }
      else { h += '<div class="dg-val">' + esc(m.value) + '</div>'; }
    } else if (m.pico) {
      h += '<div class="dg-pico">';
      ['P', 'I', 'C', 'O', 'S'].forEach(function (k) { if (m.pico[k]) h += '<div class="dg-pico-row"><span class="dg-pico-k">' + k + '</span><span class="dg-pico-v">' + esc(m.pico[k]) + '</span></div>'; });
      h += '</div>';
    }
    h += '</div>';
    return h;
  }
  function renderSrc(item) {
    var m = payload(item);
    if (!m.sources || !m.sources.length) return '';
    var h = '<button type="button" class="dg-src-btn" onclick="dgToggleSrc(this)">原文 ↗ ' + m.sources.length + '</button>';
    h += '<div class="dg-src-panel" style="display:none">';
    m.sources.forEach(function (s) {
      h += '<div class="dg-src-row"><div class="dg-src-loc"><span class="dg-conf ' + esc(s.conf) + '">置信度 ' + confLabel(s.conf) + '</span><span>' + esc(s.loc) + '</span></div>';
      h += '<p class="dg-src-en">' + esc(s.quote) + '</p><p class="dg-src-zh"><b>译</b> ' + esc(s.zh) + '</p></div>';
    });
    h += '</div>';
    return h;
  }
  function renderSync(D) {
    if (!D.sync || !D.sync.length) return '';
    var h = '<details class="dg-sync"><summary>全站同步清单 · 这篇文献能更新网站哪些地方（' + D.sync.length + ' 处）</summary><div class="dg-sync-body">';
    h += '<p class="dg-sync-lead">以下是 AI 从本篇提取的<b>候选更新</b>，不是既成事实。正式流程中你可在管理员模式逐条勾选，未勾选的不进正式库。</p>';
    h += '<table class="dg-sync-t"><thead><tr><th>目标文件 / 位置</th><th>操作</th><th>拟更新内容</th></tr></thead><tbody>';
    D.sync.forEach(function (s) {
      h += '<tr><td>' + esc(s.target) + '</td><td><span class="dg-op' + (/修改|补充/.test(s.op) ? ' mod' : '') + '">' + esc(s.op) + '</span></td><td>' + esc(s.detail) + '</td></tr>';
    });
    h += '</tbody></table></div></details>';
    return h;
  }

  function render() {
    var D = DATA[curKey], mods = modsOf(curKey);
    if (!D) return;
    if (cur >= mods.length) cur = mods.length - 1;
    var node = mods[cur], gs = allGroups(curKey), g = gs[node.gi];
    var inGroup = g.items.indexOf(node.data) + 1;
    var h = '';
    h += '<div class="dg-paper"><div class="dg-paper-top"><span class="dg-pill ' + esc(D.typeCls) + '">' + esc(D.type) + '</span><span class="dg-pill stage">' + esc(D.stage) + '</span></div>';
    h += '<h1>' + esc(D.title) + '</h1><p class="en">' + esc(D.en) + '</p>';
    h += '<div class="meta"><b>作者</b> ' + esc(D.author) + '　<b>出处</b> ' + esc(D.journal) + '<br><b>标识</b> ' + esc(D.ids) + '</div></div>';
    h += '<div class="dg-deck"><div class="dg-tabs">';
    gs.forEach(function (gg, i) { h += '<button type="button" class="dg-tab' + (i === node.gi ? ' active' : '') + '" onclick="dgGotoGroup(' + i + ')">' + esc(gg.name) + '<span>' + gg.items.length + '</span></button>'; });
    h += '</div>';
    h += '<div class="dg-card">';
    h += '<div class="dg-card-h"><span class="dg-idx">第 ' + (cur + 1) + ' / ' + mods.length + ' 张</span><span class="dg-group">' + esc(node.gname) + '</span></div>';
    h += '<h2 class="dg-title"><span class="cn">' + cnNum(cur + 1) + '</span>' + esc(node.data.label) + '</h2>';
    h += renderBody(node.data);
    h += renderSrc(node.data);
    h += '</div>';
    h += '<div class="dg-foot"><button type="button" onclick="dgFlip(-1)"' + (cur === 0 ? ' disabled' : '') + '>← 上一张</button>';
    h += '<span class="dg-progress">' + esc(node.gname) + ' · ' + inGroup + '/' + g.items.length + '<em>全 ' + (cur + 1) + '/' + mods.length + '</em></span>';
    h += '<button type="button" class="next" onclick="dgFlip(1)">' + (cur === mods.length - 1 ? '读完了 ✓' : '下一张 →') + '</button></div>';
    if (mods.length <= 45) h += '<div class="dg-dots">' + mods.map(function (_, i) { return '<i class="' + (i === cur ? 'on' : '') + '" onclick="dgGoto(' + i + ')"></i>'; }).join('') + '</div>';
    h += '</div>';
    h += renderSync(D);
    document.getElementById('dg-app').innerHTML = h;
  }

  function show(key) {
    if (!DATA[key]) return;
    curKey = key; cur = 0;
    document.querySelectorAll('.dg-sw-btn').forEach(function (b) { b.className = 'dg-sw-btn' + (b.dataset.paper === key ? ' on' : ''); });
    // 更新 URL 深链（不刷新）
    try { history.replaceState(null, '', '?paper=' + encodeURIComponent(key)); } catch (e) {}
    render(); window.scrollTo(0, 0);
  }
  function flip(d) { var n = modsOf(curKey).length, v = Math.max(0, Math.min(n - 1, cur + d)); if (v !== cur) { cur = v; render(); } }
  function goto(i) { cur = Math.max(0, Math.min(modsOf(curKey).length - 1, i)); render(); }
  function gotoGroup(gi) { var gs = allGroups(curKey), n = 0; for (var i = 0; i < gi; i++) n += gs[i].items.length; goto(n); }
  function toggleSrc(btn) {
    var p = btn.nextElementSibling;
    if (p.style.display === 'none') { p.style.display = 'block'; btn.classList.add('open'); btn.textContent = '收起原文 ↑'; }
    else { p.style.display = 'none'; btn.classList.remove('open'); btn.textContent = '原文 ↗ ' + p.querySelectorAll('.dg-src-row').length; }
  }
  function bindKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') flip(1);
      if (e.key === 'ArrowLeft') flip(-1);
    });
  }

  // 暴露给 inline onclick（保持与样例一致的轻量渲染）
  window.dgToggleSrc = toggleSrc;
  window.dgFlip = flip;
  window.dgGoto = goto;
  window.dgGotoGroup = gotoGroup;
})();
