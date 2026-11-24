/* 设备与线圈比较（数据源 data/devices.json） */
(function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function regionTag(r) {
    if (!r) return '';
    var cls = /国产/.test(r) ? 'cn' : (/进口/.test(r) ? 'imp' : 'gen');
    return '<span class="dv-region ' + cls + '">' + esc(r) + '</span>';
  }

  fetch('data/devices.json', { credentials: 'same-origin' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (D) {
      document.getElementById('dv-disclaimer').innerHTML = '<b>数据口径</b>：' + esc(D._meta.source) + '<br><b>免责</b>：' + esc(D._meta.disclaimer);

      /* ===== 线圈表：结构化表格 + 深度条 ===== */
      var box = document.getElementById('dv-coils');
      var tb = document.createElement('div'); tb.className = 'dv-table';
      tb.innerHTML = '<div class="dv-tr dv-th"><span>线圈</span><span>深度</span><span>体积</span><span>聚焦</span><span>靶点</span><span>适应症 / 许可</span></div>';
      D.coils.forEach(function (c, i) {
        var row = document.createElement('div'); row.className = 'dv-tr' + (i % 2 ? ' dv-alt' : '');
        var pct = c.depthNum ? Math.round(c.depthNum / 3.0 * 100) : null;
        var depthHtml = esc(c.depth) + (pct ? '<span class="dv-bar"><i style="width:' + pct + '%"></i></span>' : '');
        row.innerHTML =
          '<span class="dv-name"><b>' + esc(c.name) + '</b><em>' + regionTag(c.region) + ' ' + esc(c.maker) + '</em></span>' +
          '<span class="dv-depth">' + depthHtml + '</span>' +
          '<span>' + esc(c.volume) + '</span>' +
          '<span>' + esc(c.focus) + '</span>' +
          '<span>' + esc(c.target) + '</span>' +
          '<span class="dv-ind">' + esc(c.indications) + '<em>' + esc(c.clearance) + '</em></span>';
        var note = document.createElement('div'); note.className = 'dv-note'; note.textContent = c.note;
        var wrap = document.createElement('div'); wrap.className = 'dv-row-wrap';
        wrap.appendChild(row); wrap.appendChild(note);
        tb.appendChild(wrap);
      });
      box.appendChild(tb);

      /* ===== 设备卡片：分组标题占满行 + 卡片多列网格 ===== */
      var db = document.getElementById('dv-devices');
      var groups = [
        { key: 'imp', badge: '进口', title: '进口设备', sub: 'FDA 明确适应症，循证与保险数据扎实', filter: function (d) { return /进口/.test(d.region || ''); } },
        { key: 'cn', badge: '国产', title: '国产设备（NMPA 注册）', sub: '注册适用范围多为「辅助治疗」，与 FDA 适应症不可等同', filter: function (d) { return /国产/.test(d.region || ''); } }
      ];
      groups.forEach(function (g) {
        var items = (D.devices || []).filter(g.filter);
        if (!items.length) return;

        var group = document.createElement('div'); group.className = 'dv-group dv-group-' + g.key;

        var gh = document.createElement('div'); gh.className = 'dv-group-h';
        gh.innerHTML =
          '<span class="dv-g-badge">' + g.badge + '</span>' +
          '<div class="dv-g-title"><h3>' + g.title + '</h3><p>' + esc(g.sub) + '</p></div>' +
          '<span class="dv-g-count">' + items.length + ' 款</span>';
        group.appendChild(gh);

        var grid = document.createElement('div'); grid.className = 'dv-card-grid';
        items.forEach(function (d) {
          var card = document.createElement('div'); card.className = 'dv-card';
          var cnCls = /国产/.test(d.region || '') ? ' is-cn' : ' is-imp';
          card.innerHTML =
            '<div class="dv-card-h' + cnCls + '"><b>' + esc(d.name) + '</b><span class="dv-type">' + esc(d.type) + '</span></div>' +
            '<div class="dv-maker">' + regionTag(d.region) + ' ' + esc(d.maker) + '</div>' +
            '<dl class="dv-grid2">' +
              '<div><dt>线圈</dt><dd>' + esc(d.coil) + '</dd></div>' +
              '<div><dt>适应症 / 注册范围</dt><dd>' + esc(d.indications) + '</dd></div>' +
              '<div><dt>疗程</dt><dd>' + esc(d.sessions) + '</dd></div>' +
              '<div><dt>定位方式</dt><dd>' + esc(d.targeting) + '</dd></div>' +
              '<div class="dv-full"><dt>参考价</dt><dd>' + esc(d.price) + '</dd></div>' +
            '</dl>' +
            '<div class="dv-pc"><span class="pro">优点</span>' + esc(d.pros) + '</div>' +
            '<div class="dv-pc"><span class="con">局限</span>' + esc(d.cons) + '</div>' +
            '<div class="dv-dnote">' + esc(d.note) + '</div>';
          grid.appendChild(card);
        });
        group.appendChild(grid);
        db.appendChild(group);
      });
    })
    .catch(function (e) {
      console.error('devices:', e);
      document.getElementById('dv-coils').innerHTML = '<div class="ev-empty">数据加载失败，请通过 HTTP 服务打开页面。</div>';
    });
})();
