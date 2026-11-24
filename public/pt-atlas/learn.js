/* 学习阶梯：进度存 localStorage */
(function () {
  'use strict';
  var KEY = 'pt-learn-done';
  var done = {};
  try { done = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { done = {}; }

  function paint() {
    Object.keys(done).forEach(function (k) {
      if (!done[k]) return;
      var card = document.querySelector('.step-card[data-step="' + k + '"]');
      var btn = document.querySelector('.step-done[data-step="' + k + '"]');
      if (card) card.style.opacity = '1';
      if (btn) { btn.classList.add('done'); btn.textContent = '已完成 ✓'; }
    });
  }

  document.querySelectorAll('.step-done').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.dataset.step;
      done[k] = !done[k];
      try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {}
      b.classList.toggle('done', !!done[k]);
      b.textContent = done[k] ? '已完成 ✓' : '标记完成';
    });
  });

  paint();
})();
