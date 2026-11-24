/* 靶点地图：标准 10–20 EEG 头皮定位图 + 分靶点陈列（数据源 data/targets.json） */
(function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  var SVGNS = 'http://www.w3.org/2000/svg';

  fetch('data/targets.json', { credentials: 'same-origin' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (D) {
      var targets = D.targets || [];
      var electrodeList = (D.electrodes && D.electrodes.points) || [];
      var elec = {}; electrodeList.forEach(function (e) { elec[e.name] = [e.x, e.y]; });
      var svg = document.getElementById('tg-brain');
      var gElec = document.getElementById('tg-electrodes');
      var gPoints = document.getElementById('tg-points');
      var legend = document.getElementById('tg-legend');
      var detail = document.getElementById('tg-detail');
      var list = document.getElementById('tg-list');

      // 头皮靶点坐标：优先从电极表取，特殊靶点覆盖
      var SPECIAL = {
        sma: [230, 162],      // Cz 前、Fz 后（FCz 附近）
        cerebellum: [230, 388] // Oz 下、枕骨下
      };
      function targetPos(t) {
        if (SPECIAL[t.id]) return SPECIAL[t.id];
        var es = (t.eeg || []).map(function (n) { return elec[n]; }).filter(Boolean);
        if (!es.length) return null;
        if (es.length === 1) return es[0];
        return [Math.round(es[0][0] + es[1][0]) / 2, Math.round(es[0][1] + es[1][1]) / 2];
      }

      function el(tag, attrs, txt) {
        var n = document.createElementNS(SVGNS, tag);
        Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
        if (txt != null) n.textContent = txt;
        return n;
      }

      // ---- 绘制标准 10–20 头皮图 ----
      function drawHead() {
        // 头轮廓（俯视，鼻朝上）
        gElec.appendChild(el('path', {
          d: 'M230 62 C320 60 371 122 372 212 C373 302 330 382 230 403 C130 382 87 302 88 212 C89 122 140 60 230 62 Z',
          fill: '#f2f7f4', stroke: '#b9d2c4', 'stroke-width': 2
        }));
        //  cranial 中线
        gElec.appendChild(el('line', { x1: 230, y1: 74, x2: 230, y2: 392, stroke: '#d3e4d9', 'stroke-width': 1.4 }));
        // 电极连线（10–20 网格）
        var links = [
          ['Fp1','Fpz'],['Fpz','Fp2'],
          ['Fpz','Fz'],['Fz','Cz'],['Cz','Pz'],['Pz','Oz'],
          ['Fp1','F3'],['F3','C3'],['C3','P3'],['P3','O1'],
          ['Fp2','F4'],['F4','C4'],['C4','P4'],['P4','O2'],
          ['Fp1','F7'],['F7','T3'],['T3','T5'],['T5','O1'],
          ['Fp2','F8'],['F8','T4'],['T4','T6'],['T6','O2'],
          ['F7','F3'],['F8','F4'],['T3','C3'],['T4','C4'],['T5','P3'],['T6','P4'],
          ['O1','Oz'],['Oz','O2']
        ];
        links.forEach(function (p) {
          var a = elec[p[0]], b = elec[p[1]];
          if (a && b) gElec.appendChild(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#dbe9e1', 'stroke-width': 1 }));
        });
        // 电极点 + 标签
        electrodeList.forEach(function (e) {
          gElec.appendChild(el('circle', { cx: e.x, cy: e.y, r: 3.4, fill: '#9cb8a9', stroke: '#fff', 'stroke-width': 1 }));
          var dx = e.side === '左' ? -7 : (e.side === '右' ? 7 : 0);
          var anchor = e.side === '左' ? 'end' : (e.side === '右' ? 'start' : 'middle');
          gElec.appendChild(el('text', {
            x: e.x + dx, y: e.y - 6, 'font-size': 9.5, fill: '#6f887a',
            'text-anchor': anchor, 'font-weight': 600
          }, e.name));
        });
        // 方向标注
        gElec.appendChild(el('text', { x: 230, y: 46, 'font-size': 11, fill: '#8b9a93', 'text-anchor': 'middle' }, '鼻根 nasion · 前'));
        gElec.appendChild(el('text', { x: 230, y: 424, 'font-size': 11, fill: '#8b9a93', 'text-anchor': 'middle' }, '枕骨 inion · 后'));
        gElec.appendChild(el('text', { x: 66, y: 232, 'font-size': 10, fill: '#8b9a93', 'text-anchor': 'middle' }, '左'));
        gElec.appendChild(el('text', { x: 394, y: 232, 'font-size': 10, fill: '#8b9a93', 'text-anchor': 'middle' }, '右'));
      }
      drawHead();

      function levelClass(lv) {
        if (/FDA/.test(lv)) return 'fda';
        if (/指南推荐/.test(lv)) return 'guide';
        if (/混合/.test(lv)) return 'mixed';
        if (/前沿|待验证|积累中|限定/.test(lv)) return 'frontier';
        return 'base';
      }

      function renderDetail(t) {
        var h = '<div class="tg-d-head" style="border-left-color:' + esc(t.color) + '">' +
          '<span class="tg-d-tag">脑区靶点 · ' + (t.plane === 'deep' ? '深部' : '头皮投影') + '</span>' +
          '<h3>' + esc(t.cn) + '</h3>' +
          '<p class="tg-d-en">' + esc(t.en) + '</p></div>' +
          '<p class="tg-d-sum">' + esc(t.summary) + '</p>' +
          '<div class="tg-d-loc"><b>定位</b><span>' + esc(t.loc) + '</span></div>' +
          '<div class="tg-d-loc"><b>定位方法</b><span>' + esc(t.localization) + '</span></div>' +
          '<h4>对应治疗方案</h4><div class="tg-d-protocols">';
        (t.protocols || []).forEach(function (p) {
          h += '<div class="tg-proto">' +
            '<div class="tg-proto-top"><b>' + esc(p.tech) + '</b>' +
              '<span class="tg-type">' + esc(p.type) + '</span>' +
              '<span class="tg-level ' + levelClass(p.level) + '">' + esc(p.level) + '</span></div>' +
            '<div class="tg-proto-params">' + esc(p.params) + '</div>' +
            '<div class="tg-proto-dis">' + (p.diseases || []).map(function (x) { return '<span class="tg-dis">' + esc(x) + '</span>'; }).join('') + '</div>' +
            '<div class="tg-proto-ev">' + esc(p.evidence) + '</div>' +
            '<div class="tg-proto-note">' + esc(p.note) + '</div>' +
          '</div>';
        });
        h += '</div>';
        detail.innerHTML = h;
      }

      function clearSel() {
        document.querySelectorAll('.tg-point').forEach(function (c) { c.setAttribute('r', 11); });
        document.querySelectorAll('.tg-card').forEach(function (c) { c.classList.remove('sel'); });
        document.querySelectorAll('.tg-lg').forEach(function (c) { c.classList.remove('sel'); });
      }
      function select(t) {
        clearSel();
        var idx = targets.indexOf(t);
        var dot = gPoints.querySelector('.tg-point[data-i="' + idx + '"]');
        if (dot) dot.setAttribute('r', 15);
        var card = document.querySelector('.tg-card[data-id="' + t.id + '"]');
        var lg = document.querySelector('.tg-lg[data-id="' + t.id + '"]');
        if (card) card.classList.add('sel');
        if (lg) lg.classList.add('sel');
        renderDetail(t);
      }

      // 圆点编号（按 targets 顺序），仅 surface 靶点投影到头皮图
      targets.forEach(function (t, idx) {
        var pos = targetPos(t);
        if (!pos || t.plane === 'deep') return;
        var circle = el('circle', {
          cx: pos[0], cy: pos[1], r: 11, fill: t.color, stroke: '#fff', 'stroke-width': 2,
          'class': 'tg-point', 'data-i': idx, style: 'cursor:pointer'
        });
        var title = el('title', null, (idx + 1) + '. ' + t.cn);
        circle.appendChild(title);
        circle.addEventListener('click', function () { select(t); });
        gPoints.appendChild(circle);
        gPoints.appendChild(el('text', {
          x: pos[0], y: pos[1] + 3.6, 'font-size': 10, fill: '#fff',
          'text-anchor': 'middle', 'font-weight': 700, 'pointer-events': 'none'
        }, idx + 1));
      });

      // 图例：头皮靶点 / 深部靶点 分两组
      function legendItem(t, idx) {
        var lg = document.createElement('span');
        lg.className = 'tg-lg'; lg.setAttribute('data-id', t.id);
        lg.innerHTML = '<i style="background:' + t.color + '"></i>' + (idx + 1) + ' ' + esc(t.cn);
        lg.addEventListener('click', function () { select(t); });
        return lg;
      }
      if (legend) {
        var head1 = document.createElement('div'); head1.className = 'tg-lg-title';
        head1.textContent = '头皮可定位靶点（投影到 10–20 电极）'; legend.appendChild(head1);
        targets.forEach(function (t, idx) { if (t.plane !== 'deep') legend.appendChild(legendItem(t, idx)); });
        var head2 = document.createElement('div'); head2.className = 'tg-lg-title';
        head2.textContent = '深部 / 功能连接靶点（无法由头皮精确定位）'; legend.appendChild(head2);
        targets.forEach(function (t, idx) { if (t.plane === 'deep') legend.appendChild(legendItem(t, idx)); });
      }

      // 分靶点陈列
      targets.forEach(function (t) {
        var idx = targets.indexOf(t);
        var card = document.createElement('div');
        card.className = 'tg-card'; card.setAttribute('data-id', t.id);
        card.style.borderLeft = '4px solid ' + t.color;
        var h = '<div class="tg-card-h"><b>' + (idx + 1) + '. ' + esc(t.cn) + '</b><span>' + esc(t.en) + '</span></div>' +
          '<p class="tg-card-sum">' + esc(t.summary) + '</p>' +
          '<div class="tg-card-proto">';
        (t.protocols || []).forEach(function (p) {
          h += '<div class="tg-cp-row"><span class="tg-cp-tech">' + esc(p.tech) + ' · ' + esc(p.type) + '</span>' +
            '<span class="tg-cp-dis">' + (p.diseases || []).join(' / ') + '</span>' +
            '<span class="tg-level ' + levelClass(p.level) + '">' + esc(p.level) + '</span></div>';
        });
        h += '</div>';
        card.innerHTML = h;
        card.addEventListener('click', function () { select(t); });
        list.appendChild(card);
      });

      if (targets.length) renderDetail(targets[0]);
    })
    .catch(function (e) {
      console.error('targets:', e);
      document.getElementById('tg-detail').innerHTML = '<div class="ev-empty">数据加载失败，请通过 HTTP 服务打开页面。</div>';
    });
})();
