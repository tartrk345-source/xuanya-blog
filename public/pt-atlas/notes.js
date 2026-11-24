/* 我的笔记：localStorage 自动保存 */
(function () {
  'use strict';
  var KEY = 'pt-notes';
  var area = document.getElementById('nt-area');
  var msg = document.getElementById('nt-msg');
  try { area.value = localStorage.getItem(KEY) || ''; } catch (e) {}

  function save() {
    try {
      localStorage.setItem(KEY, area.value);
      msg.textContent = '已保存 ' + new Date().toLocaleTimeString('zh-CN');
    } catch (e) {
      msg.textContent = '保存失败：本机存储不可用';
    }
  }
  document.getElementById('nt-save').addEventListener('click', save);
  area.addEventListener('input', function () { msg.textContent = '未保存 · 点保存或继续输入'; });
  var timer;
  area.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(save, 1500); });
})();
