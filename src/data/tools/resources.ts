/**
 * 我的资源图谱 · 十种能力（十次版）
 * 思路：把十种「容易被当成缺点」的模式，重新命名成能力。
 * 计分：同一个情境，十次里会有几次？0–4 档（0–1 / 2–4 / 5–6 / 7–9 / 10 次）× 每维 4 题 → 单维 0–16
 * 另有 5 道「耗损题」（0–16 分制的 0–20 分），提示这些能力是否已经用得太累。
 * 说明：自省工具，无信效度验证，不作诊断；有信效度的版本请使用 WIPPF。
 */

export interface ResourceDim {
  key: string;
  cap: string;
  /** 这类做法在别人眼里常被叫作什么 */
  former: string;
  pos: string;
  bal: string;
  items: string[];
}

export const RESOURCE_DIMS: ResourceDim[] = [
  {
    key: 'dep',
    cap: '托付力',
    former: '依赖',
    pos: '你愿意信任人、把自己交出去——很多人做不到。',
    bal: '偶尔自己拿一次主意，看看也行。',
    items: [
      '要做重要决定时，我先去问别人「你觉得我该怎么办」。',
      '没人可商量时，我把决定拖着、不敢自己拍板。',
      '别人让我帮一个不太愿意的忙，我最后还是答应了。',
      '一个人去办事（看病、搬家、跑手续）时，我盼着身边有人陪。',
    ],
  },
  {
    key: 'avo',
    cap: '谨慎力',
    former: '焦虑回避',
    pos: '你预判风险、不冒失，替你避开了不少坑。',
    bal: '每周碰一件「稍微不确定」的小事。',
    items: [
      '去不熟的聚会前，我提前想好说什么、什么时候走。',
      '遇到不确定的事（新工作、新地方），先拖一拖、缓一缓。',
      '事情悬着没定的时候，我反复惦记、放松不下来。',
      '别人临时约我，我找了个理由推掉。',
    ],
  },
  {
    key: 'obs',
    cap: '尽责力',
    former: '强迫',
    pos: '你可靠、有条理，答应的事一定做到。',
    bal: '故意留一件「差不多就行」的事。',
    items: [
      '发出去的消息或文件，我再回去看一遍、甚至两遍。',
      '事情做到「差不多」了，我还是不踏实、又收拾了一遍。',
      '别人做事的标准跟我不同，我忍不住去纠正。',
      '本该休息的时候，我想「这些时间不如做点事」。',
    ],
  },
  {
    key: 'his',
    cap: '感染力',
    former: '表演',
    pos: '你能点亮一个场子、让人喜欢你——这是天赋。',
    bal: '允许自己有一次「不用被注意」。',
    items: [
      '在聚会上，我留意「有没有人在听我说」。',
      '讲一件小事时，我把它讲得比实际更有起伏、更好笑。',
      '见面聊几分钟，就跟人熟络起来。',
      '一个人待久了（比如整个周末不出门），我觉得空。',
    ],
  },
  {
    key: 'lab',
    cap: '感受力',
    former: '情绪不稳',
    pos: '你感受丰富、活得浓；别人是黑白，你是彩色。',
    bal: '情绪上来时，先做三次呼吸再行动。',
    items: [
      '别人一句话，把我当天的心情整个翻过来。',
      '生气或难过时，我做决定比平时更快、更冲。',
      '同一个人，我这一会儿很喜欢的，下一会儿就很烦。',
      '情绪过去后，我懊悔「刚才不那么说就好了」。',
    ],
  },
  {
    key: 'par',
    cap: '审辨力',
    former: '偏执',
    pos: '你警觉、能自保，不会第二次栽在同一个坑里。',
    bal: '试一次「先假设对方没有恶意」。',
    items: [
      '别人突然对我很热情，我先想「他是不是有事求我」。',
      '跟人有过不愉快后，我把对方的「旧账」记在心里。',
      '把重要的事交给别人时，我反复检查、不放心。',
      '有人说了句含糊的话，我琢磨「他是不是在说我」。',
    ],
  },
  {
    key: 'nar',
    cap: '出彩力',
    former: '自恋',
    pos: '你有标准、对自己要求高，也敢要那束光。',
    bal: '独处一天，不发布、不展示。',
    items: [
      '发出去的东西（朋友圈、发言），我留意谁点赞、谁没理。',
      '在一群人里被忽略时，我明显不舒服。',
      '做完一件事，我觉得「还不够好」。',
      '被指出错了，我在心里反复回放很久。',
    ],
  },
  {
    key: 'pas',
    cap: '曲线坚持',
    former: '被动攻击',
    pos: '你不硬碰硬，用更省力、更安全的方式守住边界。',
    bal: '把「冷着」换成一次直说。',
    items: [
      '对某个人不满时，我少回他消息、把事拖着做。',
      '答应了的事，我心里其实不愿意，但还是拖着做完。',
      '生气的时候，我选择不说话、冷着，而不是当场说清楚。',
      '我用「我没事」把不高兴盖过去，但脸色藏不住。',
    ],
  },
  {
    key: 'pse',
    cap: '自立力',
    former: '伪独立',
    pos: '你扛得住，不给人添麻烦——这也是很多人欠着的能力。',
    bal: '向一个人求助一次。',
    items: [
      '搬东西、看病、跑手续这种麻烦事，我自己扛了。',
      '别人要帮我做点什么，我说「不用不用，我自己来」。',
      '难受或撑不住的时候，我没主动告诉别人。',
      '别人照顾我（给我夹菜、送我东西）时，我想着快点还回去。',
    ],
  },
  {
    key: 'alt',
    cap: '体贴力',
    former: '利他-抑郁',
    pos: '你能共情、能照顾人，是关系里的黏合剂。',
    bal: '先给自己倒一杯，再递出去。',
    items: [
      '一起吃饭、做决定时，我说「都行，你们定」。',
      '别人不高兴，我先想「是不是我哪里做错了」。',
      '明明自己已经很累了，别人开口请我帮忙，我还是答应了。',
      '拒绝别人之后，我心里过意不去很久。',
    ],
  },
];

export const RESOURCE_OPTS = ['0–1 次', '2–4 次', '5–6 次', '7–9 次', '10 次'];

export const LOAD_ITEMS = [
  '心里想着「该歇歇了」，我还是停不下来。',
  '因为这些做法，我在关系或工作里吃过具体的亏。',
  '压力大的时候，我很难换一种做法。',
  '身边有人提醒过我「你总是这样」。',
  '回头想这些，我会觉得累。',
];

/** 题序：四轮 × 十维，把同一维度的 4 题打散，避免答题时形成定势 */
export interface ResourceQuestion {
  dim: string;
  text: string;
  index: number;
}

export const RESOURCE_QUESTIONS: ResourceQuestion[] = (() => {
  const list: ResourceQuestion[] = [];
  for (let round = 0; round < 4; round++) {
    RESOURCE_DIMS.forEach(dim => {
      list.push({ dim: dim.key, text: dim.items[round], index: list.length });
    });
  }
  return list;
})();

export const RESOURCE_TOTAL = RESOURCE_QUESTIONS.length + LOAD_ITEMS.length;

export function scoreResources(answers: Record<number, number>) {
  const sums: Record<string, number> = {};
  RESOURCE_DIMS.forEach(d => { sums[d.key] = 0; });

  RESOURCE_QUESTIONS.forEach(q => {
    const v = answers[q.index];
    if (typeof v === 'number') sums[q.dim] += v;
  });

  const load = LOAD_ITEMS.reduce((s, _, i) => s + (answers[RESOURCE_QUESTIONS.length + i] ?? 0), 0);

  const ranked = RESOURCE_DIMS.map(d => ({
    ...d,
    score: sums[d.key],
  })).sort((a, b) => b.score - a.score);

  const top = ranked.slice(0, 3);
  const pct = Math.round(top.reduce((s, d) => s + d.score, 0) / 48 * 100);
  const level = pct < 40
    ? { label: '灵活', note: '随时能换手' }
    : pct <= 70
      ? { label: '熟练', note: '有主力，也能换' }
      : { label: '专精', note: '你的看家本领，记得也练练另一只手' };

  const loadNote = load >= 13
    ? '这些能力很够用，但也让你有点累了——给自己留口气；如果长期疲惫，值得找专业的人陪你聊聊。'
    : load >= 7
      ? '偶尔会觉得累——记得给自己留口气。'
      : '你用得挺顺，也照顾得住自己。';

  return { sums, ranked, top, pct, level, load, loadNote };
}

export const RESOURCE_MAX_PER_DIM = 16;
export const LOAD_MAX = 20;
