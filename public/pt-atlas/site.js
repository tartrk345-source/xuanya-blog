/* 全站统一导航 + 页脚 + 子视图条高亮（静态注入，零依赖） */
(function () {
  'use strict';

  // 主导航收敛为 7 项：阅读计划并入学习阶梯；靶点地图、设备线圈并入技术档案
  var NAV = [
    { href: 'index.html', label: '全景地图' },
    { href: 'learn.html', label: '学习阶梯', also: ['reading.html', 'deep-guide.html'] },
    { href: 'tech.html', label: '技术档案', also: ['targets.html', 'devices.html', 'tech-detail.html'] },
    { href: 'evidence.html', label: '证据池' },
    { href: 'scenes.html', label: '场景导览' },
    { href: 'quick.html', label: '速查工具' },
    { href: 'method.html', label: '方法说明', also: ['changelog.html', 'notes.html'] }
  ];

  function current() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  function buildHeader(brand, ver) {
    var head = document.querySelector('.pt-head-inner');
    if (!head) return;
    var cur = current();
    var nav = head.querySelector('.pt-tabs');
    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'pt-tabs';
      var verEl0 = head.querySelector('.pt-ver');
      head.insertBefore(nav, verEl0 || null);
    }
    nav.innerHTML = '';
    NAV.forEach(function (n) {
      var a = document.createElement('a');
      a.href = n.href;
      a.textContent = n.label;
      if (n.href === cur || (n.also && n.also.indexOf(cur) >= 0)) a.className = 'active';
      nav.appendChild(a);
    });
    var brandEl = head.querySelector('.pt-brand');
    if (brandEl) brandEl.textContent = brand || '玄牙 · 精神科物理治疗';
    var verEl = head.querySelector('.pt-ver');
    if (verEl) verEl.textContent = ver || 'v0.6';
  }

  // 页内子视图条：按当前文件名高亮（无 data-group 依赖，直接匹配 href）
  function buildSubtabs() {
    var cur = current();
    document.querySelectorAll('.pt-subtabs').forEach(function (bar) {
      var links = bar.querySelectorAll('a');
      var matched = false;
      links.forEach(function (a) {
        a.classList.remove('active');
        var href = (a.getAttribute('href') || '').split('/').pop();
        if (href === cur) { a.classList.add('active'); matched = true; }
      });
      // 若当前页不在子视图列表内，默认高亮第一项（如 tech-detail 归技术目录）
      if (!matched && links.length) links[0].classList.add('active');
    });
  }

  function buildFooter(extra) {
    var foot = document.querySelector('.pt-foot');
    if (!foot) return;
    if (extra) {
      var s = document.createElement('span');
      s.textContent = extra;
      foot.insertBefore(s, foot.firstChild);
    }
  }

  function init() {
    var cfg = window.PT_SITE || {};
    buildHeader(cfg.brand, cfg.ver);
    buildSubtabs();
    buildFooter(cfg.foot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
