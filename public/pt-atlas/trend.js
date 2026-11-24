/* 趋势雷达：从 trend.json 取 2005 与 2025 发文量画条形 */
(function () {
  'use strict';
  var NAMES = {
    rtms: '重复经颅磁刺激', itbs: '间歇θ爆发刺激', dtms: '深部经颅磁刺激',
    tdcs: '经颅直流电刺激', tacs: '经颅交流电刺激', vns: '迷走神经刺激',
    ces: '颅电刺激', tfus: '经颅聚焦超声', ect: '电抽搐治疗', mst: '磁惊厥治疗',
    dbs: '脑深部电刺激', blt: '光照治疗', sdt: '睡眠剥夺', exercise: '运动干预',
    tpbm: '经颅光生物调节', bfb: '生物反馈', acup: '针刺/电针', hbot: '高压氧'
  };

  fetch('data/trend.json', { credentials: 'same-origin' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      var box = document.getElementById('trend-list');
      if (!box) return;
      var rows = [];
      Object.keys(d.series).forEach(function (k) {
        var s = d.series[k] || {};
        var a = s['2005'] || 0, b = s['2025'] || 0;
        rows.push({ k: k, name: NAMES[k] || k, a: a, b: b });
      });
      rows.sort(function (x, y) { return y.b - x.b; });
      var max = Math.max.apply(null, rows.map(function (r) { return r.b; })) || 1;
      rows.slice(0, 8).forEach(function (r) {
        var row = document.createElement('div');
        row.className = 'trend-row';
        var name = document.createElement('span');
        name.className = 'trend-name';
        name.textContent = r.name;
        name.title = r.k;
        var bar = document.createElement('div');
        bar.className = 'trend-bar';
        var fill = document.createElement('i');
        if (r.k === 'tfus') fill.className = 'em';
        fill.style.width = (r.b / max * 100).toFixed(1) + '%';
        bar.appendChild(fill);
        var val = document.createElement('span');
        val.className = 'trend-val';
        val.textContent = r.a + ' → ' + r.b;
        row.appendChild(name); row.appendChild(bar); row.appendChild(val);
        box.appendChild(row);
      });
    })
    .catch(function (e) { console.error('trend:', e); });
})();
