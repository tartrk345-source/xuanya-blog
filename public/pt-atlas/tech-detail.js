/* 技术详情：机制 + 参数 + 真实证据统计 + Cochrane 结论卡 + 安全 + 人群 + 上海叙事线 */
(function () {
  'use strict';

  var key = new URLSearchParams(location.search).get('key') || '';
  var NAME = {
    rtms: ['重复经颅磁刺激', 'rTMS'], itbs: ['间歇θ爆发刺激', 'iTBS'], dtms: ['深部经颅磁刺激', 'dTMS'],
    tdcs: ['经颅直流电刺激', 'tDCS'], tacs: ['经颅交流电刺激', 'tACS'], vns: ['迷走神经刺激', 'VNS/taVNS'],
    ces: ['颅电刺激', 'CES'], tfus: ['经颅聚焦超声', 'tFUS'], ect: ['电抽搐治疗', 'ECT/MECT'],
    mst: ['磁惊厥治疗', 'MST'], dbs: ['脑深部电刺激', 'DBS'], blt: ['光照治疗', 'BLT'],
    sdt: ['睡眠剥夺疗法', 'Wake therapy'], exercise: ['运动干预', 'Exercise'],
    tpbm: ['经颅光生物调节', 'tPBM'], bfb: ['生物反馈', 'Biofeedback'],
    acup: ['针刺/电针', 'Acupuncture'], hbot: ['高压氧', 'HBOT'],
    bci: ['脑机接口', 'BCI'], 'tfus-x': ['超声神经调控', 'tFUS / LIFU / TUS'],
    sleep: ['睡眠干预', 'Sleep'], nutrition: ['营养干预', 'Nutrition'],
    digital: ['数字疗法', 'Digital therapeutics'], wearable: ['可穿戴监测', 'Wearable']
  };
  var n = NAME[key] || ['技术详情', key || '未指定'];
  document.getElementById('td-title').textContent = n[0] + ' · ' + n[1];
  document.title = n[0] + ' · 技术档案';

  function txt(id, v) { var el = document.getElementById(id); if (el) el.textContent = v && v !== '' ? v : '—'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  // 免责声明条
  document.getElementById('td-disclaimer').innerHTML =
    '<b>知识层级说明</b>：机制/参数/安全为通识整理（待同行逐条核验）；证据数字来自 PubMed 精选证据池，' +
    'Cochrane 结论为英文原文摘录、中文要点为系统标注。本页不构成诊疗建议。';

  // 可靠性字段（静态，强调事实）
  document.getElementById('td-reliability').innerHTML = [
    '<li><b>可回溯</b>：下列代表文献均带 PMID，可在 PubMed 逐条核对。</li>',
    '<li><b>数字口径</b>：证据池按去重 PMID 统计；矩阵格子为 PubMed 全量检索命中数，两者口径不同，勿混用。</li>',
    '<li><b>人机分工</b>：检索式与去重由脚本执行；结论解读、GRADE 评级、是否纳入由人判断，AI 不做最终定性。</li>',
    '<li><b>核验状态</b>：中文要点标「待核验」；未核验条目不进入结论性表述。</li>',
    '<li><b>检索方法</b>：详见 <a href="method.html">方法说明</a>；修订见 <a href="changelog.html">修订记录</a>。</li>'
  ].join('');

  Promise.all([
    fetch('data/tech_knowledge.json', { credentials: 'same-origin' }).then(function (r) { return r.json(); }),
    fetch('data/tech_dossiers.json', { credentials: 'same-origin' }).then(function (r) { return r.json(); })
  ]).then(function (arr) {
    var K = arr[0], D = arr[1];
    var k = K[key], d = (D.tech || {})[key];

    // ---- 知识字段 ----
    if (k) {
      txt('td-mechanism', k.mechanism);
      txt('td-target', k.target);
      txt('td-params', k.params);
      txt('td-patient', k.patient);
      txt('td-clinic', k.clinic);
      txt('td-shanghai', k.shanghai);
      var ul = document.getElementById('td-safety');
      ul.innerHTML = '';
      (k.safety || []).forEach(function (s) { var li = document.createElement('li'); li.textContent = s; ul.appendChild(li); });
    } else {
      // 大健康/拓展层：暂无知识卡
      ['td-mechanism','td-target','td-params','td-patient','td-clinic','td-shanghai'].forEach(function (id) { txt(id, '拓展层方向，知识卡待补（宁缺毋滥，未编造内容）。'); });
      document.getElementById('td-safety').innerHTML = '<li>拓展层方向，安全质控字段待逐条核验。</li>';
    }

    // ---- 证据统计 ----
    var statBox = document.getElementById('td-stats');
    var evbar = document.getElementById('td-evbar');
    if (d) {
      var s = d.stats;
      statBox.innerHTML =
        '<div class="td-stat"><b>' + s.papers + '</b><span>证据池文献</span></div>' +
        '<div class="td-stat"><b>' + s.cochrane + '</b><span>Cochrane 综述</span></div>' +
        '<div class="td-stat"><b>' + s.rct + '</b><span>RCT</span></div>' +
        '<div class="td-stat"><b>' + s.sr + '</b><span>系统综述</span></div>' +
        '<div class="td-stat"><b>' + s.ma + '</b><span>Meta 分析</span></div>';
      evbar.innerHTML = '<span class="pt-sub-inline">统计口径：去重 PMID ' + s.papers + ' 篇 · Cochrane ' + s.cochrane +
        ' · RCT ' + s.rct + ' · SR ' + s.sr + ' · MA ' + s.ma + '</span>';

      // 适应症分布条
      var inds = d.inds || [];
      var maxN = inds.length ? inds[0].n : 1;
      var indBox = document.getElementById('td-inds');
      indBox.innerHTML = '';
      inds.slice(0, 8).forEach(function (it) {
        var row = document.createElement('div'); row.className = 'td-ind-row';
        var name = document.createElement('span'); name.className = 'td-ind-name'; name.textContent = it.cn;
        var bar = document.createElement('span'); bar.className = 'td-ind-bar';
        var fill = document.createElement('i'); fill.style.width = Math.max(2, Math.round(it.n / maxN * 100)) + '%';
        bar.appendChild(fill);
        var val = document.createElement('span'); val.className = 'td-ind-val'; val.textContent = it.n;
        row.appendChild(name); row.appendChild(bar); row.appendChild(val);
        indBox.appendChild(row);
      });

      // 证据空白标注
      var gapBox = document.getElementById('td-gap');
      if (k && k.evidence_gap) {
        gapBox.className = 'td-gap show';
        gapBox.textContent = '⚑ 证据空白：' + k.evidence_gap;
      } else if (s.cochrane === 0) {
        gapBox.className = 'td-gap show';
        gapBox.textContent = '⚑ 该技术在证据池内暂无 Cochrane 系统综述——如实标注，未用宽泛检索凑数。';
      }

      // Cochrane 结论卡
      var cb = document.getElementById('td-cochrane');
      var cards = d.cochrane_cards || [];
      if (!cards.length) {
        cb.innerHTML = '<div class="ev-empty">证据池内暂无该技术的 Cochrane 系统综述结论卡（如实留白）。</div>';
      } else {
        cb.innerHTML = '';
        cards.forEach(function (c) {
          var card = document.createElement('div'); card.className = 'td-coch-card' + (c.cautious ? ' cautious' : '');
          var h = '<div class="td-coch-top">' +
            '<span class="td-coch-ind">' + esc(c.ind_cn || '综合') + '</span>' +
            (c.cautious ? '<span class="td-flag neg">结论谨慎</span>' : '<span class="td-flag">原文结论</span>') +
            '<span class="td-coch-yr">' + esc(c.year) + '</span></div>' +
            '<div class="td-coch-title">' + esc(c.title) + '</div>' +
            '<div class="td-coch-hint">' + esc(c.hint) + '</div>' +
            (c.conclusion ? '<div class="td-coch-concl">' + esc(c.conclusion) + '</div>' : '') +
            '<div class="td-coch-pmid">PMID: ' + esc(c.pmid) + (c.doi ? ' · DOI: ' + esc(c.doi) : '') + '</div>';
          card.innerHTML = h;
          cb.appendChild(card);
        });
      }

      // 代表文献表
      var out = document.getElementById('td-ev');
      var reps = d.top_evidence || [];
      if (!reps.length) { out.innerHTML = '<div class="ev-empty">暂无匹配文献。</div>'; }
      else {
        var t = document.createElement('table');
        t.innerHTML = '<thead><tr><th>题名</th><th>适应症</th><th>年份</th><th>PMID</th></tr></thead>';
        var tb = document.createElement('tbody');
        reps.forEach(function (r) {
          var tr = document.createElement('tr');
          tr.innerHTML = '<td class="ti">' + esc(r.title) + '</td>' +
            '<td>' + (r.inds || []).map(function (x) { return '<span class="ev-tag">' + esc(x) + '</span>'; }).join('') + '</td>' +
            '<td class="num">' + esc(r.year) + '</td>' +
            '<td class="num">' + esc(r.pmid) + '</td>';
          tb.appendChild(tr);
        });
        t.appendChild(tb); out.innerHTML = ''; out.appendChild(t);
      }
    } else {
      // 拓展层未进证据矩阵
      statBox.innerHTML = '';
      evbar.innerHTML = '<span class="pt-sub-inline">拓展层方向，尚未纳入 18×19 证据矩阵，暂无证据统计（如实留白）。</span>';
      document.getElementById('td-inds').innerHTML = '';
      document.getElementById('td-gap').className = 'td-gap show';
      document.getElementById('td-gap').textContent = '⚑ 拓展层方向：BCI 与超声为主轴、大健康为产业出口，数据待按学习阶梯补入。';
      document.getElementById('td-cochrane').innerHTML = '<div class="ev-empty">暂无证据数据（如实留白）。</div>';
      document.getElementById('td-ev').innerHTML = '<div class="ev-empty">暂无证据数据（如实留白）。</div>';
    }
  }).catch(function (e) {
    console.error('tech-detail load:', e);
    document.getElementById('td-ev').innerHTML = '<div class="ev-empty">数据加载失败，请通过 HTTP 服务打开页面。</div>';
  });
})();
