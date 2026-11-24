/* 速查：术语词典（静态）+ 安全速查（从技术知识库单一数据源读取） */
(function () {
  'use strict';

  // 术语层：对齐药监局 BCI 术语 + 循证方法学核心词
  var TERMS = [
    ['重复经颅磁刺激 (rTMS)', 'repetitive transcranial magnetic stimulation', '经颅磁刺激的重复给药模式，高频趋向兴奋、低频趋向抑制皮层。'],
    ['间歇θ爆发刺激 (iTBS)', 'intermittent theta-burst stimulation', '以θ节律成簇 giving 50Hz 脉冲的短时程磁刺激模式，疗程显著缩短。'],
    ['深部经颅磁刺激 (dTMS)', 'deep transcranial magnetic stimulation', '采用 H 型线圈、可到达较深皮层的磁刺激方式。'],
    ['经颅直流电刺激 (tDCS)', 'transcranial direct current stimulation', '弱直流电（约1–2mA）调节皮层兴奋性，阳极/阴极效应依布局而定。'],
    ['经颅交流电刺激 (tACS)', 'transcranial alternating current stimulation', '正弦交流电与脑振荡节律同步，试图夹带特定频段活动。'],
    ['电抽搐治疗 (ECT/MECT)', 'electroconvulsive therapy', '诱发全面性癫痫发作治疗严重抑郁；MECT 为改良（麻醉+肌松）方案。'],
    ['磁惊厥治疗 (MST)', 'magnetic seizure therapy', '以快速变化磁场诱发癫痫，刺激较 ECT 局限，认知副作用可能较小。'],
    ['迷走神经刺激 (VNS/taVNS)', 'vagus nerve stimulation', '刺激迷走神经调节脑网络；taVNS 为耳部无创路线。'],
    ['脑机接口 (BCI)', 'brain-computer interface', '依 2025 药监局术语；采集脑信号并解码，实现读脑—解码—写脑闭环。'],
    ['神经反馈', 'neurofeedback', '将脑信号实时反馈给个体以调节脑功能，属 BCI 应用范畴。'],
    ['低强度聚焦超声 (LIFU)', 'low-intensity focused ultrasound', '无创、可聚焦至深部核团的超声神经调控方式。'],
    ['经颅聚焦超声 (tFUS)', 'transcranial focused ultrasound', '经颅施加的聚焦超声，神经调控方向中增速最快的新兴技术。'],
    ['经颅光生物调节 (tPBM)', 'transcranial photobiomodulation', '近红外光经颅照射，据称改善皮层线粒体代谢。'],
    ['GRADE', 'Grading of Recommendations Assessment, Development and Evaluation', '证据等级与推荐强度评定体系，不等于文献数量。'],
    ['Cochrane 系统综述', 'Cochrane systematic review', '遵循严格方法学的系统评价；有综述不等于高等级证据，仍须看结论与 GRADE。'],
    ['随机对照试验 (RCT)', 'randomized controlled trial', '随机分组对照的研究设计，是判断疗效的关键证据类型。'],
    ['系统综述 (SR) / Meta 分析 (MA)', 'systematic review / meta-analysis', 'SR 系统汇总证据，MA 对结果做定量合并；二者方法学质量差异很大。'],
    ['主要终点 / 次要终点', 'primary / secondary outcome', '主要终点是预设的核心评价指标；未达标即为阴性主结果，不可被次要终点掩盖。'],
    ['PRISMA 2020', 'Preferred Reporting Items for Systematic Reviews and Meta-Analyses', '系统综述与 Meta 的报告规范，提升可重复性。'],
    ['真实世界证据 (RWE)', 'real-world evidence', '来自常规医疗环境的数据，与 RCT 互补，偏倚风险需单独评估。']
  ];

  var NAME = {
    rtms:'重复经颅磁刺激', itbs:'间歇θ爆发刺激', dtms:'深部经颅磁刺激', tdcs:'经颅直流电刺激',
    tacs:'经颅交流电刺激', vns:'迷走神经刺激', ces:'颅电刺激', tfus:'经颅聚焦超声',
    ect:'电抽搐治疗', mst:'磁惊厥治疗', dbs:'脑深部电刺激', blt:'光照治疗',
    sdt:'睡眠剥夺疗法', exercise:'运动干预', tpbm:'经颅光生物调节', bfb:'生物反馈',
    acup:'针刺/电针', hbot:'高压氧', bci:'脑机接口', 'tfus-x':'超声神经调控'
  };

  // 术语渲染
  var termBox = document.getElementById('qk-terms');
  function drawTerms(q) {
    q = (q || '').trim().toLowerCase();
    termBox.innerHTML = '';
    TERMS.filter(function (t) {
      return !q || (t[0] + ' ' + t[1] + ' ' + t[2]).toLowerCase().indexOf(q) >= 0;
    }).forEach(function (t) {
      var d = document.createElement('div'); d.className = 'qk-item';
      var b = document.createElement('b'); b.textContent = t[0];
      var s = document.createElement('span'); s.textContent = t[1];
      var p = document.createElement('p'); p.textContent = t[2];
      d.appendChild(b); d.appendChild(s); d.appendChild(p);
      termBox.appendChild(d);
    });
  }
  drawTerms('');
  document.getElementById('qk-q').addEventListener('input', function (e) { drawTerms(e.target.value); });

  // 安全速查：从知识库读取 18 技术，单一数据源
  var safeBox = document.getElementById('qk-safety');
  fetch('data/tech_knowledge.json', { credentials: 'same-origin' })
    .then(function (r) { if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (K) {
      safeBox.innerHTML = '';
      var keys = ['rtms','itbs','dtms','tdcs','tacs','vns','ect','mst','dbs','tfus','blt','sdt','exercise','bfb','acup','ces','tpbm','hbot'];
      keys.forEach(function (key) {
        var k = K[key]; if (!k) return;
        var d = document.createElement('div'); d.className = 'qk-item';
        var b = document.createElement('b'); b.textContent = NAME[key] || k.cn || key;
        var p1 = document.createElement('p'); p1.textContent = (k.safety || []).join(' ');
        var p2 = document.createElement('span');
        p2.textContent = '设备类别/支付：以当地注册证与医保目录为准 · 详见技术档案';
        d.appendChild(b); d.appendChild(p1); d.appendChild(p2);
        safeBox.appendChild(d);
      });
    })
    .catch(function (e) {
      console.error('quick safety:', e);
      safeBox.innerHTML = '<div class="ev-empty">安全速查数据加载失败，请通过 HTTP 服务打开页面。</div>';
    });
})();
