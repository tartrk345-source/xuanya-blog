/**
 * 威斯巴登积极心理治疗与家庭治疗调查表（WIPPF · 2.04 国际版 · 单人自评版）
 * 原表：N. Peseschkian & H. Deidenbach, 1988；WIPPF 2.0 of DPPB, Varna, A. Remmers 1995，中译 2009
 * 结构：87 道计分题，四级评分（1 完全不同意 → 4 完全同意）
 * 计分：24 个现实能力（含 6 个榜样模型），每项 3 题，单项 3–12 分
 *   · 继发能力 11 项（1–11）  · 原发能力 8 项（12–19）
 *   · 冲突反应 4 项（20–23）  · 榜样模型 6 项（24–27，三列＝时间／耐心／榜样）
 * 说明：本工具仅作自评与自我觉察，不作诊断；正式解读需由受训的积极心理治疗师进行。
 */

export interface WippfItem {
  no: number;
  text: string;
  code: string;
}

const RAW: [number, string, string][] = [
  [2, '当我感到愤怒或激动时，我全身都有感觉。', '20a'],
  [3, '我总是把工作场所/办公室/家整理得很有条理。', '1a'],
  [4, '在我小时候，我体验到我的父母有很多社会交往。', '26a'],
  [5, '当我遇到困难时，我不由自主地想到所有可能发生的后果。', '23a'],
  [6, '在职业上和社会上，「为人／处事要可靠」特别重要。', '7c'],
  [7, '当我做决定时，无论发生了什么，我都能保持这个决定不变。', '11a'],
  [8, '当我的家人花钱太多时，我很容易生气。', '8b'],
  [9, '坦白和诚实比尊重他人更为重要。', '5c'],
  [10, '在看起来绝望的处境下，总会有一条路的。', '16c'],
  [11, '当我的父母有矛盾时，他们总是试着找一个共同的解决办法。', '25a'],
  [12, '成绩对于我来说最重要，尤其当我遇到问题的时候。', '21a'],
  [13, '我喜欢与行为良好的人交往。', '4b'],
  [14, '只有当我每天都洗澡时我才感到舒服和干净。', '2a'],
  [15, '我总是很耐心，即便有事激怒我的时候。', '12a'],
  [16, '我会遵从上级的指示或者采纳权威人士的建议。', '9a'],
  [17, '我非常喜欢自己表现得很温和。', '17a'],
  [18, '一般在与别人交往时我能够信任他们。', '15b'],
  [19, '在我儿童时代，父亲对我非常有耐心。', '24e'],
  [20, '当我遇到困难时，我总是试图与人分享。', '22a'],
  [21, '我通常会花时间与别人会面。', '13b'],
  [22, '与别人分享关于生命和死亡的问题非常重要。', '19b'],
  [23, '即使有人令我生厌，我也能保持耐心。', '12b'],
  [24, '我相信我和我的家庭都会有一个美好的未来。', '16b'],
  [25, '即便有足够的钱我也不愿意花。', '8a'],
  [26, '我的父母曾与我们探讨过人生的哲学与信仰。', '27a'],
  [27, '在任何环境中都应该公正公开地对待别人。', '10c'],
  [28, '我能总是信任自己。', '15a'],
  [29, '懒惰总是会带来坏的后果。', '6c'],
  [30, '拥有好的关系比拥有财富更重要。', '14c'],
  [31, '我能够接纳现实的自己。', '18a'],
  [32, '我父母的关系是爱的关系。', '25b'],
  [33, '当我遇到困难时，我会白天黑夜不停地想。', '23b'],
  [34, '在我儿时我母亲对我非常有耐心。', '24b'],
  [35, '我期望我的配偶对我永远忠诚。', '11b'],
  [36, '我非常关注我生命/生活的意义。', '19a'],
  [37, '如果不能准时，你将掌管不了自己的生活。', '3c'],
  [38, '有耐心你就会拥有一切。', '12c'],
  [39, '我的父母对别人既宽容又坦白。', '26b'],
  [40, '没有条理的事情会使我疯狂。', '1b'],
  [41, '考虑别人的意见总是很重要的。', '4c'],
  [42, '一个不能让人绝对信赖的人，永远不会成为我的朋友。', '7b'],
  [43, '我感觉我的父母能公正地相互对待。', '25c'],
  [44, '我喜欢人们能够直接开放地说出他们心中的想法。', '5b'],
  [45, '我认为自己是重视工作和成就的人。', '6a'],
  [46, '孩子应该总是服从和关注父母的话。', '9c'],
  [47, '我有一个生活信条：所有事情都需要时间。', '13c'],
  [48, '我宁可早到十分钟也不愿迟到五分钟。', '3a'],
  [49, '我小时候父亲是我重要的偶像/榜样。', '24f'],
  [50, '每当我感到激动或愤怒时，我会感到全身发紧或其他身体上的不舒服。', '20b'],
  [51, '当我在工作上或家里遇到难题时，我需要别人的帮助。', '22b'],
  [52, '当我遇到问题时我会选择更努力地工作。', '21b'],
  [53, '忠诚对于一个好人来说是不可缺少的。', '11c'],
  [54, '我的生活哲学或信仰给与了我重要的生活指导。', '19c'],
  [55, '我父母的人生哲学或信仰给了他们强有力的支持。', '27b'],
  [56, '只有当家里人都保持整洁时我才会感觉舒服。', '2b'],
  [57, '当有人迟到时我会感到很生气。', '3b'],
  [58, '当我遇到困难时我常常会想到生命的意义。', '23c'],
  [59, '对夫妻关系来说温柔和性感是必要的前提条件。', '17c'],
  [60, '我期望家庭或工作都要有纪律。', '9b'],
  [61, '当别人的意见与我的不同时我也会考虑接受。', '18b'],
  [62, '我常常请客。', '14b'],
  [63, '对于集体生活来说，信任是必备的前提条件。', '15c'],
  [64, '在我儿时我的母亲会花很多时间与我在一起。', '24a'],
  [65, '当有人不公正时，我会非常敏感。', '10b'],
  [66, '富裕的最佳基础就是节约。', '8c'],
  [67, '清洁的人显示清洁的人品。', '2c'],
  [68, '我总是能够信守诺言。', '7a'],
  [69, '我总是能够计划好自己的生活。', '16a'],
  [70, '我总是更轻易地说「是」而不是说「不」。', '4a'],
  [71, '当我工作时，我能忘掉自己的问题。', '21c'],
  [72, '一个家庭应该井井有条，只有那样才像个家。', '1c'],
  [73, '除了工作外我有足够的时间用在自己的兴趣爱好上。', '13a'],
  [74, '我的父母有很多朋友和客人。', '26c'],
  [75, '当我儿时我的父亲能够花很多时间与我在一起。', '24d'],
  [76, '每个人身上都有优点。', '18c'],
  [77, '我的身体常常让我不得不吃药调理。', '20c'],
  [78, '我很容易交到朋友。', '14a'],
  [79, '我的父母对生命的意义很感兴趣。', '27c'],
  [80, '当有人很懒时，我会感觉很不舒服。', '6b'],
  [81, '只有当我了解了一个人的行为的原因时我才下判断。', '10a'],
  [82, '当我遇到私人的或工作上的难题时，我需要与别人在一起以便忘记这些烦恼。', '22c'],
  [83, '与我爱的配偶或男（女）朋友在一起时，我想尽快开始亲热。', '17b'],
  [84, '我的妈妈曾经是我的偶像/榜样。', '24c'],
  [85, '我能够公开地讲出我的意见与想法。', '5a'],
  [86, '小时候有个人与我在一起的时间比父母还要久。', '24g'],
  [87, '小时候有个人比我父母还要有耐心。', '24h'],
  [88, '小时候有个人对我来说比我的父母还重要。', '24i'],
];

export const WIPPF_ITEMS: WippfItem[] = RAW.map(([no, text, code]) => ({ no, text, code }));

export const SEC_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export const PRI_IDS = [12, 13, 14, 15, 16, 17, 18, 19];
export const CON_IDS = [20, 21, 22, 23];

export const ITEM_NAME: Record<number, string> = {
  1: '有条理', 2: '清洁', 3: '准时', 4: '礼貌', 5: '坦白', 6: '成就/勤奋',
  7: '可靠', 8: '节俭', 9: '顺从', 10: '公正', 11: '忠诚',
  12: '耐心', 13: '时间', 14: '交往', 15: '信任', 16: '希望', 17: '温柔/性感',
  18: '爱（接纳）', 19: '信念',
  20: '身体', 21: '工作', 22: '关系', 23: '幻想',
};

export const SEC_COL = { a: '自我', b: '本我', c: '超我' } as const;
export const PRI_COL = { a: '我', b: '我们', c: '理念' } as const;

export const CON_POLE: Record<number, [string, string]> = {
  20: ['麻木', '心身反应'],
  21: ['静止', '逃到工作中'],
  22: ['独自作决定', '寻找支持'],
  23: ['躲避', '逃到幻想中'],
};

export interface ModRow {
  key: string;
  name: string;
  short: string;
  codes: string[];
  pole: [string, string];
}

export const MOD_ROWS: ModRow[] = [
  { key: 'M1', name: '我—母亲', short: '我—母亲', codes: ['24a', '24b', '24c'], pole: ['冷淡', '依赖'] },
  { key: 'M2', name: '我—父亲', short: '我—父亲', codes: ['24d', '24e', '24f'], pole: ['冷淡', '依赖'] },
  { key: 'M3', name: '我—他人', short: '我—他人', codes: ['24g', '24h', '24i'], pole: ['冷淡', '依赖'] },
  { key: 'M4', name: '你—父母的关系', short: '你—父母', codes: ['25a', '25b', '25c'], pole: ['敌对', '亲昵'] },
  { key: 'M5', name: '我们—父母—他人关系', short: '我们—父母', codes: ['26a', '26b', '26c'], pole: ['封闭', '开放'] },
  { key: 'M6', name: '原始的我们—价值观', short: '原始我们', codes: ['27a', '27b', '27c'], pole: ['不安全感', '绝对理想化'] },
];

/** 行为 / 情感力三列的两极锚点 */
export const BEH_POLE = [
  { col: 'a', name: '主动', left: '被动-适应', right: '极度自我控制', hint: '需求从自己身上来' },
  { col: 'r', name: '被动', left: '容忍他人', right: '更多期待他人', hint: '需求从别人身上来' },
  { col: 'k', name: '理念', left: '概念／理想较自由', right: '固守既定概念／理想', hint: '需求从偶像身上来' },
];
export const REL_POLE = [
  { col: 'e', name: '自我', left: '与自己', right: '与自己（被占据）' },
  { col: 'w', name: '我们／你', left: '与他人', right: '与他人（共生）' },
  { col: 'i', name: '理想', left: '与理想／概念', right: '与理想（绝对化）' },
];

export const SCORE_OPTIONS = [
  { value: 4, label: '完全同意' },
  { value: 3, label: '基本同意' },
  { value: 2, label: '基本不同意' },
  { value: 1, label: '完全不同意' },
] as const;

export const ITEM_MIN = 3;
export const ITEM_MAX = 12;

export interface WippfScore {
  /** 每个维度（1–27）三项之和，3–12 */
  cap: Record<number, number>;
  secA: number;
  secB: number;
  secC: number;
  priA: number;
  priB: number;
  priC: number;
  conA: number;
  conB: number;
  conC: number;
  secAll: number;
  priAll: number;
  conAll: number;
  modT: number;
  modP: number;
  modR: number;
  modAll: number;
  mod: number[];
}

const sumCodes = (answers: Record<string, number>, codes: string[]) =>
  codes.reduce((s, c) => s + (answers[c] ?? 0), 0);

export function scoreWippf(answers: Record<string, number>): WippfScore {
  const cap: Record<number, number> = {};
  WIPPF_ITEMS.forEach(it => {
    const n = parseInt(it.code, 10);
    cap[n] = (cap[n] ?? 0) + (answers[it.code] ?? 0);
  });

  const col = (ids: number[], c: 'a' | 'b' | 'c') =>
    ids.reduce((s, id) => s + (answers[`${id}${c}`] ?? 0), 0);

  const secA = col(SEC_IDS, 'a');
  const secB = col(SEC_IDS, 'b');
  const secC = col(SEC_IDS, 'c');
  const priA = col(PRI_IDS, 'a');
  const priB = col(PRI_IDS, 'b');
  const priC = col(PRI_IDS, 'c');
  const conA = col(CON_IDS, 'a');
  const conB = col(CON_IDS, 'b');
  const conC = col(CON_IDS, 'c');

  /* 榜样模型三列（时间／耐心／榜样）跨全部 18 题：每列 6 题、6–24 分 */
  const modT = sumCodes(answers, ['24a', '24d', '24g', '25a', '26a', '27a']);
  const modP = sumCodes(answers, ['24b', '24e', '24h', '25b', '26b', '27b']);
  const modR = sumCodes(answers, ['24c', '24f', '24i', '25c', '26c', '27c']);

  return {
    cap,
    secA, secB, secC, priA, priB, priC, conA, conB, conC,
    secAll: secA + secB + secC,
    priAll: priA + priB + priC,
    conAll: conA + conB + conC,
    modT, modP, modR,
    modAll: modT + modP + modR,
    mod: MOD_ROWS.map(r => sumCodes(answers, r.codes)),
  };
}

/** 单项 3–12 的三档：3–5 低分区域 / 6–9 中间 / 10–12 高分区域 */
export function zoneOf(v: number): 'low' | 'mid' | 'high' {
  if (v <= 5) return 'low';
  if (v >= 10) return 'high';
  return 'mid';
}

export interface NamedScore {
  id: number | string;
  name: string;
  value: number;
}

export function secList(s: WippfScore): NamedScore[] {
  return SEC_IDS.map(id => ({ id, name: ITEM_NAME[id], value: s.cap[id] ?? 0 }));
}

export function priList(s: WippfScore): NamedScore[] {
  return PRI_IDS.map(id => ({ id, name: ITEM_NAME[id], value: s.cap[id] ?? 0 }));
}

export function conList(s: WippfScore): NamedScore[] {
  return CON_IDS.map(id => ({ id, name: ITEM_NAME[id], value: s.cap[id] ?? 0 }));
}

export function modList(s: WippfScore): NamedScore[] {
  return MOD_ROWS.map((r, i) => ({ id: r.key, name: r.short, value: s.mod[i] }));
}

export function overallZone(list: NamedScore[]) {
  const low = list.filter(x => x.value <= 5).length;
  const high = list.filter(x => x.value >= 10).length;
  return { low, mid: list.length - low - high, high };
}

export function extremes(list: NamedScore[]) {
  const sorted = [...list].sort((a, b) => b.value - a.value);
  const top = sorted.filter(x => x.value === sorted[0].value);
  const bottom = sorted.filter(x => x.value === sorted[sorted.length - 1].value);
  return {
    top: sorted[0],
    bottom: sorted[sorted.length - 1],
    topNames: top.length > 3 ? '各项接近' : top.map(x => x.name).join('、'),
    bottomNames: bottom.length > 3 ? '各项接近' : bottom.map(x => x.name).join('、'),
  };
}

/** 每题 1–4 分，87 题，单项 3–12；四大分量表理论满分 */
export const SUBSCALE_MAX = {
  sec: 132,
  pri: 96,
  con: 48,
  mod: 72,
};

/* ---------- 答案码：跨设备传答案用，纯浏览器端编码，不含个人信息 ---------- */

const CODE_PREFIX = 'W1.';

const toBase64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (s: string) => {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
};

/** 把作答记录按题序压成 87 位数字串（未答为 0） */
export function answersToDigits(answers: Record<string, number>): string {
  return WIPPF_ITEMS.map(it => answers[it.code] ?? 0).join('');
}

/** 数字串还原为作答记录；长度不足或非法字符会被忽略 */
export function digitsToAnswers(digits: string): Record<string, number> {
  const out: Record<string, number> = {};
  WIPPF_ITEMS.forEach((it, i) => {
    const v = Number(digits[i]);
    if (v >= 1 && v <= 4) out[it.code] = v;
  });
  return out;
}

export function answeredCountOf(digits: string): number {
  return [...digits].filter(c => c >= '1' && c <= '4').length;
}

/** 生成答案码：只含昵称与 87 位作答，可安全贴到聊天窗口 */
export function encodeAnswerCode(answers: Record<string, number>, name: string): string {
  const payload = { v: 1, n: name.slice(0, 12), d: answersToDigits(answers) };
  return CODE_PREFIX + toBase64Url(JSON.stringify(payload));
}

export interface DecodedAnswerCode {
  name: string;
  digits: string;
  answered: number;
}

/** 解析答案码；格式不对或题数不完整时返回 null */
export function decodeAnswerCode(raw: string): DecodedAnswerCode | null {
  try {
    const cleaned = raw.replace(/\s+/g, '');
    const body = cleaned.startsWith(CODE_PREFIX) ? cleaned.slice(CODE_PREFIX.length) : cleaned;
    if (!body) return null;
    const obj = JSON.parse(fromBase64Url(body)) as { v?: number; n?: string; d?: string };
    const digits = String(obj.d ?? '');
    if (digits.length !== WIPPF_ITEMS.length || /[^0-4]/.test(digits)) return null;
    const answered = answeredCountOf(digits);
    if (answered < WIPPF_ITEMS.length) return null;
    return { name: String(obj.n ?? '对方').slice(0, 12) || '对方', digits, answered };
  } catch {
    return null;
  }
}

/* ---------- 双人对照 ---------- */

export interface PairDiff {
  name: string;
  a: number;
  b: number;
  diff: number;
}

/** 继发 11 + 原发 8 的逐项对照（差＝我 − 对方） */
export function pairDiffs(a: WippfScore, b: WippfScore): PairDiff[] {
  return [...SEC_IDS, ...PRI_IDS].map(id => ({
    name: ITEM_NAME[id],
    a: a.cap[id] ?? 0,
    b: b.cap[id] ?? 0,
    diff: (a.cap[id] ?? 0) - (b.cap[id] ?? 0),
  }));
}

/** 双人互动假设：两人都偏低（≤6）的项、差异最大的 4 项 */
export function pairHypothesis(a: WippfScore, b: WippfScore) {
  const diffs = pairDiffs(a, b);
  const bothLow = diffs.filter(x => x.a <= 6 && x.b <= 6);
  const biggest = [...diffs]
    .map(x => ({ ...x, abs: Math.abs(x.diff) }))
    .filter(x => x.abs > 0)
    .sort((x, y) => y.abs - x.abs)
    .slice(0, 4);
  return { bothLow, biggest };
}
