/* 场景导览 + 行业动态索引（合规版） */
(function () {
  'use strict';

  var LAYERS = [
    { key: 'patient', label: '患者一句话', hint: '给患者与家属 · 只转述结论', cls: 'lay-patient' },
    { key: 'clinical', label: '临床一句话', hint: '给医生 · 查房门诊速览', cls: 'lay-clinical' },
    { key: 'professional', label: '专业层', hint: '给同行 · 含证据边界', cls: 'lay-pro' },
    { key: 'see_doctor', label: '何时就医', hint: '安全提示 · 不是诊疗建议', cls: 'lay-care' }
  ];

  var SRC_RANK = { '官方文件': 0, '官方媒体': 1, '期刊': 2, '企业公告': 3, '媒体报道': 4, '第三方测算': 5 };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function loadJSON(path, cb) {
    fetch(path, { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error(path + ' ' + r.status); return r.json(); })
      .then(cb)
      .catch(function (e) { console.error(e); });
  }

  /* ---------- 场景导览 ---------- */
  function renderScenes(data) {
    var rail = document.getElementById('sc-rail');
    var scenes = data.scenes;
    var current = 0;

    function show(i) {
      current = i;
      var s = scenes[i];
      var btns = rail.querySelectorAll('.sc-rail-btn');
      btns.forEach(function (b, k) { b.classList.toggle('active', k === i); });

      document.getElementById('sc-title').textContent = s.icon + '  ' + s.title;
      document.getElementById('sc-group').textContent = s.group;

      var box = document.getElementById('sc-layers');
      box.innerHTML = '';
      LAYERS.forEach(function (L) {
        var card = el('div', 'sc-layer ' + L.cls);
        var head = el('div', 'sc-layer-head');
        head.appendChild(el('span', 'sc-layer-label', L.label));
        head.appendChild(el('span', 'sc-layer-hint', L.hint));
        card.appendChild(head);
        card.appendChild(el('p', 'sc-layer-text', s[L.key]));
        box.appendChild(card);
      });

      var tech = document.getElementById('sc-tech');
      tech.innerHTML = '';
      tech.appendChild(el('span', 'sc-tech-label', '相关技术'));
      var KEYMAP = { eeg: 'bci' }; // EEG 归入脑机接口档案
      s.tech_refs.forEach(function (t) {
        var a = el('a', 'sc-tech-chip', t);
        a.href = 'tech-detail.html?key=' + encodeURIComponent(KEYMAP[t] || t);
        tech.appendChild(a);
      });
      var hint = el('span', 'sc-tech-hint', '点击标签查看技术档案');
      tech.appendChild(hint);
    }

    scenes.forEach(function (s, i) {
      var b = el('button', 'sc-rail-btn');
      b.type = 'button';
      b.appendChild(el('span', 'sc-rail-icon', s.icon));
      b.appendChild(el('span', 'sc-rail-title', s.title));
      b.appendChild(el('span', 'sc-rail-group', s.group));
      b.addEventListener('click', function () { show(i); });
      rail.appendChild(b);
    });
    show(0);
  }

  /* ---------- 行业动态索引 ---------- */
  function renderNews(data) {
    var items = data.items.slice();
    var activeCat = '全部';
    var sortBy = 'date';

    document.getElementById('news-note').textContent = data.meta.note;
    document.getElementById('news-disclaimer').textContent = data.meta.disclaimer;

    var cats = ['全部'].concat(Object.keys(items.reduce(function (a, x) { a[x.category] = 1; return a; }, {})));
    var catsBox = document.getElementById('news-cats');
    cats.forEach(function (c) {
      var b = el('button', 'pt-view' + (c === activeCat ? ' active' : ''), c);
      b.type = 'button';
      b.addEventListener('click', function () {
        activeCat = c;
        catsBox.querySelectorAll('.pt-view').forEach(function (x) { x.classList.toggle('active', x === b); });
        draw();
      });
      catsBox.appendChild(b);
    });

    document.querySelectorAll('.sc-sort .pt-view').forEach(function (b) {
      b.addEventListener('click', function () {
        sortBy = b.dataset.sort;
        document.querySelectorAll('.sc-sort .pt-view').forEach(function (x) { x.classList.toggle('active', x === b); });
        draw();
      });
    });

    function sourceBadge(type) {
      var cls = 'src-' + ({ '官方文件': 'gov', '官方媒体': 'media-gov', '期刊': 'jour', '企业公告': 'corp', '媒体报道': 'media', '第三方测算': 'est' }[type] || 'media');
      return el('span', 'sc-badge ' + cls, type);
    }

    function draw() {
      var list = items.filter(function (x) { return activeCat === '全部' || x.category === activeCat; });
      list.sort(function (a, b) {
        if (sortBy === 'source') {
          var d = (SRC_RANK[a.source_type] || 9) - (SRC_RANK[b.source_type] || 9);
          return d !== 0 ? d : String(b.date).localeCompare(String(a.date));
        }
        return String(b.date).localeCompare(String(a.date));
      });

      var grid = document.getElementById('news-grid');
      grid.innerHTML = '';
      if (!list.length) {
        grid.appendChild(el('p', 'sc-news-empty', '该分类暂无条目。'));
        return;
      }

      list.forEach(function (x) {
        var card = el('article', 'sc-news-card');

        var top = el('div', 'snc-top');
        top.appendChild(sourceBadge(x.source_type));
        top.appendChild(el('span', 'snc-cat', x.category));
        top.appendChild(el('span', 'snc-date', x.date));
        card.appendChild(top);

        card.appendChild(el('h3', 'snc-title', x.title));
        card.appendChild(el('p', 'snc-summary', x.summary));
        card.appendChild(el('div', 'snc-org', '来源：' + x.source_org));

        var flags = el('div', 'snc-flags');
        flags.appendChild(el('span', 'snc-flag ai', 'AI辅助整理 · 人工核验'));
        flags.appendChild(el('span', 'snc-flag ' + (x.verify_status === '已核验' ? 'ok' : 'pending'),
          x.verify_status === '已核验' ? '已核验' : '待核验'));
        card.appendChild(flags);

        if (x.risk_note) card.appendChild(el('p', 'snc-risk', '注：' + x.risk_note));
        if (x.url) {
          var a = el('a', 'snc-link', '查看原文 →');
          a.href = x.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          card.appendChild(a);
        } else {
          card.appendChild(el('span', 'snc-link muted', '原文链接待补'));
        }
        grid.appendChild(card);
      });
    }

    draw();
  }

  loadJSON('data/scenes.json?v=20261124b', renderScenes);
  loadJSON('data/news.json?v=20261124b', renderNews);
})();
