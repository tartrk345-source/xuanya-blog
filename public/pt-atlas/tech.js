/* 技术目录：从 matrix_counts.json 读 18 技术，另加主轴与大健康 */
(function () {
  'use strict';

  var STRATEGY = [
    { key: 'bci', cn: '脑机接口', en: 'BCI', note: '读脑—解码—写脑闭环，瓶颈在实时解码' },
    { key: 'tfus-x', cn: '超声神经调控', en: 'tFUS / LIFU / TUS', note: '无创深部精准聚焦，BCI 的写入端' }
  ];
  var HEALTH = [
    { key: 'sleep', cn: '睡眠干预', en: 'Sleep', note: '睡眠节律与失眠非药物干预' },
    { key: 'nutrition', cn: '营养干预', en: 'Nutrition', note: '大健康产业出口·证据待逐条补' },
    { key: 'digital', cn: '数字疗法', en: 'Digital therapeutics', note: '赵敏「宛平小镇」数字疗法方向·待补' },
    { key: 'wearable', cn: '可穿戴监测', en: 'Wearable', note: '数字表型，赵敏方向锚点·待补' }
  ];
  var GIST = {
    rtms: '经颅磁刺激，高频兴奋/低频抑制，难治性抑郁证据较多',
    itbs: 'θ爆发刺激，疗程短，疗效不劣于标准高频方案',
    dtms: '深部线圈，可达更深皮层，精分阴性症状在研',
    tdcs: '经颅直流电刺激，调节皮层兴奋性',
    tacs: '经颅交流电刺激，与脑振荡节律同步相关',
    vns: '迷走神经刺激，含耳迷走（taVNS）无创路线',
    ces: '颅电刺激，低强度电流，证据较弱',
    tfus: '经颅聚焦超声，无创深部，增速最快的新兴方向',
    ect: '电抽搐治疗，严重抑郁最有效的物理治疗之一',
    mst: '磁惊厥治疗，癫痫诱导更局限，认知副作用较小',
    dbs: '脑深部电刺激，侵入性，用于难治性精分/强迫等',
    blt: '光照治疗，对睡眠节律紊乱与季节性抑郁有依据',
    sdt: '睡眠剥夺疗法，抗抑郁效果快但维持短',
    exercise: '运动干预，文献量极大，注意检索词偏倚',
    tpbm: '经颅光生物调节，近红外光调节皮层代谢',
    bfb: '生物反馈，含神经反馈，与 BCI 相邻',
    acup: '针刺/电针，中文文献是系统性盲区',
    hbot: '高压氧，探索性证据为主'
  };

  function row(t, showCnt) {
    var a = document.createElement('a');
    a.className = 'pt-list-row';
    a.href = 'tech-detail.html?key=' + encodeURIComponent(t.key) + ((t.cn || '').indexOf('脑机') >= 0 ? '' : '');
    var b = document.createElement('b');
    b.textContent = t.cn || '';
    var en = document.createElement('span');
    en.className = 'en';
    en.textContent = t.en || '';
    var cat = document.createElement('span');
    cat.className = 'cnt';
    cat.textContent = GIST[t.key] || t.note || '';
    a.appendChild(b); a.appendChild(en); a.appendChild(cat);
    return a;
  }

  fetch('data/matrix_counts.json', { credentials: 'same-origin' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (m) {
      var coreBox = document.getElementById('tech-core');
      var groups = {};
      m.tech.forEach(function (t) { (groups[t.cat] = groups[t.cat] || []).push(t); });
      Object.keys(groups).forEach(function (cat) {
        var h = document.createElement('div');
        h.style.cssText = 'padding:8px 15px;background:#eef5f1;color:#1f5c43;font-size:11px;font-weight:600;letter-spacing:.06em';
        h.textContent = cat;
        coreBox.appendChild(h);
        groups[cat].forEach(function (t) { coreBox.appendChild(row(t, true)); });
      });
    })
    .catch(function (e) { console.error('tech list:', e); });

  var sb = document.getElementById('tech-strategy');
  STRATEGY.forEach(function (t) { sb.appendChild(row(t)); });
  var hb = document.getElementById('tech-health');
  HEALTH.forEach(function (t) { hb.appendChild(row(t)); });
})();
