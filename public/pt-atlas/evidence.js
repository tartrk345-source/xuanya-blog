/* 证据池：本地筛选 2103 条记录，客户端分页 */
(function () {
  'use strict';
  var all = [];
  var PAGE = 60, shown = PAGE;
  var $ = function (s) { return document.querySelector(s); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function initFilters() {
    var years = {}, types = {};
    all.forEach(function (r) {
      if (r.year) years[r.year] = 1;
      (r.ptypes || []).forEach(function (p) { if (p) types[p] = 1; });
    });
    var ysel = $('#ev-year');
    Object.keys(years).sort().reverse().forEach(function (y) {
      var o = document.createElement('option'); o.value = y; o.textContent = y; ysel.appendChild(o);
    });
    var tsel = $('#ev-type');
    Object.keys(types).sort().forEach(function (t) {
      var o = document.createElement('option'); o.value = t; o.textContent = t; tsel.appendChild(o);
    });
  }

  function filtered() {
    var q = ($('#ev-q').value || '').trim().toLowerCase();
    var y = $('#ev-year').value;
    var t = $('#ev-type').value;
    return all.filter(function (r) {
      if (y && String(r.year) !== y) return false;
      if (t && (r.ptypes || []).indexOf(t) < 0) return false;
      if (q) {
        var s = ((r.title || '') + ' ' + (r.abstract || '') + ' ' + (r.journal || '')).toLowerCase();
        if (s.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function render() {
    var list = filtered();
    $('#ev-count').textContent = '显示 ' + Math.min(shown, list.length) + ' / ' + list.length + ' 篇';
    var box = $('#ev-table');
    if (!list.length) { box.innerHTML = '<div class="ev-empty">没有匹配的文献，换个关键词试试。</div>'; return; }
    var h = '<table><thead><tr><th>题名</th><th>年份</th><th>研究类型</th><th>期刊</th><th>PMID</th></tr></thead><tbody>';
    list.slice(0, shown).forEach(function (r) {
      var tags = (r.ptypes || []).slice(0, 3).map(function (p) { return '<span class="ev-tag">' + esc(p) + '</span>'; }).join('');
      var abs = r.abstract ? '<div class="ev-abs">' + esc(r.abstract.slice(0, 130)) + '…</div>' : '';
      h += '<tr><td class="ti">' + esc(r.title) + abs + '</td><td class="num">' + esc(r.year) + '</td>' +
           '<td>' + tags + '</td><td>' + esc(r.journal) + '</td><td class="num">' + esc(r.pmid) + '</td></tr>';
    });
    h += '</tbody></table>';
    if (shown < list.length) h += '<div class="ev-empty">已显示前 ' + shown + ' 条（共 ' + list.length + ' 条），用上方筛选缩小范围。</div>';
    box.innerHTML = h;
  }

  fetch('data/evidence.json', { credentials: 'same-origin' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      all = d.records || [];
      $('#ev-gen').textContent = (d.meta && d.meta.generated) || '';
      initFilters();
      render();
    })
    .catch(function (e) { $('#ev-table').innerHTML = '<div class="ev-empty">数据加载失败：' + esc(e.message) + '</div>'; });

  ['#ev-q', '#ev-year', '#ev-type'].forEach(function (sel) {
    $(sel).addEventListener('input', function () { shown = PAGE; render(); });
    $(sel).addEventListener('change', function () { shown = PAGE; render(); });
  });
})();
