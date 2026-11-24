/* 阅读计划：分级书单 + AI 阅读导览弹层 + 精读卡片（草稿存本机 localStorage） */
(function () {
  'use strict';
  var DRAFT_KEY = 'pt-reading-drafts';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  var STAGE_NAME = {
    L1: ['L1 · 认识', '说清有哪些技术、各治什么'],
    L2: ['L2 · 读证据', '判断一个证据有多强'],
    L3: ['L3 · 懂机制', '解释为什么这样刺激、刺激哪里'],
    L4: ['L4 · 会产出', '把证据写成文章']
  };

  var PLAN = null, GUIDES = null;

  // 并行取书单与导览
  Promise.all([
    fetch('data/reading_plan.json', { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
    fetch('data/reading_guides.json', { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
  ])
    .then(function (arr) {
      PLAN = arr[0]; GUIDES = arr[1].guides || {};
      renderStages();
      bindGuide();
    })
    .catch(function (e) {
      console.error('reading data:', e);
      document.getElementById('rd-stages').innerHTML = '<div class="ev-empty">数据加载失败，请通过 HTTP 服务打开页面。</div>';
    });

  function renderStages() {
    var box = document.getElementById('rd-stages');
    box.innerHTML = '';
    var groups = {};
    (PLAN.items || []).forEach(function (it) { (groups[it.stage] = groups[it.stage] || []).push(it); });
    ['L1', 'L2', 'L3', 'L4'].forEach(function (st) {
      var items = groups[st] || [];
      var meta = STAGE_NAME[st];
      var sec = document.createElement('div'); sec.className = 'rd-stage ' + st.toLowerCase();
      var h = '<div class="rd-stage-h"><span class="rd-stage-lv">' + meta[0] + '</span><b>' + meta[1] + '</b><span class="rd-stage-cnt">' + items.length + ' 篇</span></div>';
      var list = document.createElement('div'); list.className = 'rd-items';
      items.forEach(function (it) {
        var hasGuide = !!GUIDES[it.pmid];
        var hasDeep = !!it.deepKey;
        var idText = it.idLabel ? (esc(it.idType) + ' ' + esc(it.idLabel)) : ('PMID ' + esc(it.pmid));
        var row = document.createElement('div'); row.className = 'rd-item' + (hasDeep ? ' rd-item-deep' : '');
        var types = (it.types || []).map(function (t) { return '<span class="rd-type">' + esc(t) + '</span>'; }).join('');
        row.innerHTML =
          '<div class="rd-item-top">' + types + '<span class="rd-year">' + esc(it.year) + '</span></div>' +
          '<div class="rd-item-title">' + esc(it.title) + '</div>' +
          (it.titleCn ? '<div class="rd-item-cn">' + esc(it.titleCn) + '</div>' : '') +
          '<div class="rd-item-goal">目标：' + esc(it.goal) + '</div>' +
          '<div class="rd-item-foot">' +
            (hasDeep ? '<a class="rd-deep-btn" href="deep-guide.html?paper=' + encodeURIComponent(it.deepKey) + '">▤ 深度精读</a>' : '') +
            (hasGuide ? '<button type="button" class="rd-guide-btn" data-pmid="' + esc(it.pmid) + '">▸ AI 导览</button>' : '') +
            '<a href="' + esc(it.url) + '" target="_blank" rel="noopener">' + idText + ' ↗</a>' +
            '<button type="button" class="rd-use" data-pmid="' + esc(it.pmid) + '">填卡片</button>' +
          '</div>';
        list.appendChild(row);
      });
      sec.innerHTML = h; sec.appendChild(list); box.appendChild(sec);
    });
    // 填卡片：把 PMID 带入卡片
    box.querySelectorAll('.rd-use').forEach(function (b) {
      b.addEventListener('click', function () {
        document.getElementById('rc-pmid').value = b.dataset.pmid;
        document.getElementById('rc-pmid').scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('rc-pmid').focus();
      });
    });
  }

  // ---------- AI 阅读导览弹层 ----------
  var AG_STEPS = [
    { key: 'plain', label: '讲什么' },
    { key: 'pico', label: '框问题' },
    { key: 'watch', label: '盯什么' },
    { key: 'terms', label: '术语' },
    { key: 'judge', label: '下判断' }
  ];
  var curItem = null, curStep = 0;

  function bindGuide() {
    document.querySelectorAll('.rd-guide-btn').forEach(function (b) {
      b.addEventListener('click', function () { openGuide(b.dataset.pmid); });
    });
    document.getElementById('ag-close').addEventListener('click', closeGuide);
    document.getElementById('ag-overlay').addEventListener('click', function (e) {
      if (e.target.id === 'ag-overlay') closeGuide();
    });
    document.getElementById('ag-prev').addEventListener('click', function () { if (curStep > 0) { curStep--; renderGuide(); } });
    document.getElementById('ag-next').addEventListener('click', function () {
      if (curStep < AG_STEPS.length - 1) { curStep++; renderGuide(); }
      else { closeGuide(); document.getElementById('rc-pmid').value = curItem.pmid; document.getElementById('rc-oneline').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });
    document.addEventListener('keydown', function (e) {
      if (document.getElementById('ag-overlay').hidden) return;
      if (e.key === 'Escape') closeGuide();
      if (e.key === 'ArrowRight' && curStep < AG_STEPS.length - 1) { curStep++; renderGuide(); }
      if (e.key === 'ArrowLeft' && curStep > 0) { curStep--; renderGuide(); }
    });
  }

  function findItem(pmid) {
    var found = null;
    (PLAN.items || []).forEach(function (it) { if (it.pmid === pmid) found = it; });
    return found;
  }

  function openGuide(pmid) {
    curItem = findItem(pmid);
    if (!curItem || !GUIDES[pmid]) return;
    curStep = 0;
    document.getElementById('ag-overlay').hidden = false;
    document.body.style.overflow = 'hidden';
    renderGuide();
  }
  function closeGuide() {
    document.getElementById('ag-overlay').hidden = true;
    document.body.style.overflow = '';
  }

  function renderGuide() {
    if (!curItem) return;
    var g = GUIDES[curItem.pmid] || {};
    var meta = STAGE_NAME[curItem.stage] || ['', ''];
    document.getElementById('ag-stage').textContent = meta[0] + ' · ' + curItem.goal;
    document.getElementById('ag-title').textContent = curItem.title;
    document.getElementById('ag-meta').innerHTML =
      '<span class="ai-badge">AI 生成 · 待你核验</span>' +
      '<span>' + esc(curItem.year) + '</span><span>' + esc((curItem.journal || '').replace(/^The /, '')) + '</span>' +
      '<a href="' + esc(curItem.url) + '" target="_blank" rel="noopener">PMID ' + esc(curItem.pmid) + ' ↗</a>';

    // tab bar
    var tb = document.getElementById('ag-tabbar'); tb.innerHTML = '';
    AG_STEPS.forEach(function (s, i) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'ag-tab' + (i === curStep ? ' active' : '') + (i < curStep ? ' done' : '');
      b.innerHTML = '<span>' + (i + 1) + '</span>' + s.label;
      b.addEventListener('click', function () { curStep = i; renderGuide(); });
      tb.appendChild(b);
    });

    var step = AG_STEPS[curStep];
    var body = document.getElementById('ag-body');
    var h = '<div class="ag-step-tag">第 ' + (curStep + 1) + ' / 5 步 · ' + step.label + '</div>';

    if (step.key === 'plain') {
      h += '<p class="ag-plain">' + esc(g.plain) + '</p>' +
        '<div class="ag-why"><b>为什么在这个台阶读</b><p>' + esc(g.why) + '</p></div>' +
        '<div class="ag-tip">这一步只回答「这篇在问什么」。先别管结论——结论留到你读完原文自己下。</div>';
    } else if (step.key === 'pico') {
      var p = g.pico || {};
      h += '<p class="ag-lead">读之前先用 PICO 把这篇框住，带着四个问题去读：</p>' +
        '<div class="ag-pico">' +
          '<div class="ag-pico-row"><span class="ag-pico-k">P · 人群</span><span>' + esc(p.p) + '</span></div>' +
          '<div class="ag-pico-row"><span class="ag-pico-k">I · 干预</span><span>' + esc(p.i) + '</span></div>' +
          '<div class="ag-pico-row"><span class="ag-pico-k">C · 对照</span><span>' + esc(p.c) + '</span></div>' +
          '<div class="ag-pico-row"><span class="ag-pico-k">O · 结局</span><span>' + esc(p.o) + '</span></div>' +
        '</div>';
    } else if (step.key === 'watch') {
      h += '<p class="ag-lead">读原文时，眼睛盯住这几个检查点：</p><ol class="ag-watch">';
      (g.watch || []).forEach(function (w) { h += '<li>' + esc(w) + '</li>'; });
      h += '</ol>';
    } else if (step.key === 'terms') {
      h += '<p class="ag-lead">遇到这些词别卡住——先记个大概，读到后面再回来核对：</p><div class="ag-terms">';
      (g.terms || []).forEach(function (t) {
        var parts = String(t).split('：');
        h += '<div class="ag-term"><b>' + esc(parts[0]) + '</b><span>' + esc(parts.slice(1).join('：')) + '</span></div>';
      });
      h += '</div>';
    } else if (step.key === 'judge') {
      h += '<div class="ag-judge"><b>读后判断尺子</b><p>' + esc(g.judge) + '</p></div>' +
        '<div class="ag-fill"><b>一句话结论模板</b><p>读完后自己填，只转述原文、不夸大：</p>' +
          '<div class="ag-fill-tpl">' + esc(g.fill) + '</div>' +
          '<button type="button" class="ag-to-card" id="ag-to-card">把模板带入精读卡片 →</button></div>' +
        '<div class="ag-tip">提醒：模板只是句子骨架，空格里的答案必须从原文找，AI 不替你填。</div>';
    }
    body.innerHTML = h;

    var plug = document.getElementById('ag-to-card');
    if (plug) plug.addEventListener('click', function () {
      document.getElementById('rc-pmid').value = curItem.pmid;
      document.getElementById('rc-oneline').value = g.fill || '';
      closeGuide();
      document.getElementById('rc-oneline').scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('rc-oneline').focus();
    });

    document.getElementById('ag-progress').textContent = (curStep + 1) + ' / ' + AG_STEPS.length;
    document.getElementById('ag-prev').disabled = curStep === 0;
    document.getElementById('ag-next').textContent = curStep === AG_STEPS.length - 1 ? '去填卡片 →' : '下一步 →';
  }

  // ---------- 精读卡片：存草稿 / 复制 / 清空 ----------
  var F = ['rc-pmid','rc-type','rc-primary','rc-correct','rc-blind','rc-param','rc-oneline','rc-note'];
  function getDraft() {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]'); } catch (e) { return []; }
  }
  function setDraft(a) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(a)); } catch (e) {} }
  function msg(t) { var m = document.getElementById('rc-msg'); m.textContent = t; setTimeout(function () { m.textContent = ''; }, 2500); }
  function readCard() {
    var o = {};
    F.forEach(function (id) { o[id] = document.getElementById(id).value; });
    return o;
  }
  function clearCard() { F.forEach(function (id) { document.getElementById(id).value = ''; }); }
  function renderDrafts() {
    var box = document.getElementById('rd-drafts');
    var arr = getDraft();
    box.innerHTML = '<div class="rd-drafts-h">本机草稿（' + arr.length + '）</div>';
    if (!arr.length) { box.innerHTML += '<div class="rd-drafts-empty">暂无草稿</div>'; return; }
    arr.forEach(function (d, i) {
      var row = document.createElement('div'); row.className = 'rd-draft';
      row.innerHTML = '<b>PMID ' + esc(d['rc-pmid'] || '未填') + '</b><span>' + esc(d['rc-oneline'] || '（无一句话结论）') + '</span>' +
        '<button type="button" data-i="' + i + '">载入</button><button type="button" data-del="' + i + '">删</button>';
      box.appendChild(row);
    });
    box.querySelectorAll('[data-i]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = getDraft()[+b.dataset.i];
        F.forEach(function (id) { document.getElementById(id).value = d[id] || ''; });
      });
    });
    box.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () { var a = getDraft(); a.splice(+b.dataset.del, 1); setDraft(a); renderDrafts(); });
    });
  }
  document.getElementById('rc-save').addEventListener('click', function () {
    var arr = getDraft(); arr.push(readCard()); setDraft(arr); renderDrafts(); msg('已存到本机草稿');
  });
  document.getElementById('rc-copy').addEventListener('click', function () {
    var d = readCard();
    var text = '【精读卡片】\nPMID：' + d['rc-pmid'] + '\n研究类型：' + d['rc-type'] +
      '\n主要终点：' + d['rc-primary'] + '\n多重比较校正：' + d['rc-correct'] +
      '\n安慰剂/盲法：' + d['rc-blind'] + '\n参数/靶点：' + d['rc-param'] +
      '\n一句话结论：' + d['rc-oneline'] + '\n局限与疑问：' + d['rc-note'];
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { msg('已复制，可发给我'); }).catch(function () { msg('复制失败，请手动选择'); });
    } else { msg('浏览器不支持自动复制'); }
  });
  document.getElementById('rc-clear').addEventListener('click', function () { clearCard(); msg('已清空'); });
  renderDrafts();
})();
