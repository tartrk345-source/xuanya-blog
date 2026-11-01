/**
 * 压力应对测评量表（积极心理治疗版 · PPT-ST）
 * 依据：Peseschkian 积极心理治疗「平衡模型」四领域
 * 结构：12 题 / 4 领域 × 3 题 / 每题 0–3 分 / 领域分 0–9
 * 判定：原量表以 <3 与 >6 为两端分界，3–6 为中间态
 */

export type DomainKey = 'body' | 'achievement' | 'relationship' | 'future';

export interface StressDomain {
  key: DomainKey;
  name: string;
  aspect: string;
  color: string;
  icon: string;
  low: string;
  mid: string;
  high: string;
  practice: string;
}

export interface StressItem {
  id: number;
  text: string;
  domain: DomainKey;
}

export const SCORE_OPTIONS = [
  { value: 3, label: '完全同意' },
  { value: 2, label: '基本同意' },
  { value: 1, label: '基本不同意' },
  { value: 0, label: '完全不同意' },
] as const;

export const STRESS_DOMAINS: StressDomain[] = [
  {
    key: 'body',
    name: '身体',
    aspect: '感觉',
    color: '#DA583F',
    icon: '🌡️',
    low: '压力落到身上时，你的躯体反应不明显——不太容易用身体发出信号。',
    mid: '压力大时身体会有一定反应，但通常还在你能承受的范围内。',
    high: '压力更多由身体承接：紧绷、心悸、失眠、各种查不出原因的不舒服。身体在替你说「超载了」。',
    practice: '把身体当成需要被听见的一方：固定的睡眠与进食时间、十分钟缓慢呼吸或身体扫描、热敷、规律走动。不必等到「不舒服」才照顾它。',
  },
  {
    key: 'achievement',
    name: '成就',
    aspect: '理性',
    color: '#616FD3',
    icon: '📈',
    low: '遇到压力时，你倾向从成就里退出来——少做、少争，先保住自己。',
    mid: '压力面前，你的成就投入大体稳定，会看情况加一点或减一点。',
    high: '压力越大，你越往「做事」里钻：更努力、更久、用工作把问题盖过去。高效，但也最容易耗空。',
    practice: '给「努力」设一个终点：把任务拆成能在 25 分钟内结束的小块；每天留一段明确写着「不产出」的时间；练习说「这次做到七分就够」。',
  },
  {
    key: 'relationship',
    name: '关系',
    aspect: '传统',
    color: '#3E9A7E',
    icon: '🤝',
    low: '遇到困难时，你更习惯一个人扛、自己决定，很少主动开口。',
    mid: '你会在需要时找到人，也能独自处理一部分——介于两者之间。',
    high: '压力来时你会向人靠近：需要有人在场、需要被听见，关系是你的主要缓冲。',
    practice: '独自扛不是唯一选项：挑一件具体的小事，告诉一个具体的人（「今晚能不能陪我走二十分钟」比「我最近不好」更容易被接住）。同时留一点独处时间，避免把关系用成止痛药。',
  },
  {
    key: 'future',
    name: '未来',
    aspect: '意义',
    color: '#C08A2E',
    icon: '🌌',
    low: '遇到困难时，你倾向不去想以后——先看眼前，未来的事以后再说。',
    mid: '你会在担心与放下之间摆动，偶尔反复想，但拉得回来。',
    high: '压力会把你推向「想到所有可能」：反复推演、夜里停不下来、追问意义。想得多，是因为在乎。',
    practice: '给担心一个容器：把「可能发生的后果」写在纸上，分成「我能做的」和「我做不了的」两栏，只对第一栏安排动作；给反复想设定十五分钟时间窗，到点就停；用一件具体的小事把注意力带回今天。',
  },
];

export const STRESS_ITEMS: StressItem[] = [
  { id: 1, text: '当我感到愤怒或激动时，我全身都有感觉。', domain: 'body' },
  { id: 2, text: '每当我感到激动或愤怒时，我会感到全身发紧或其他身体上的不舒服。', domain: 'body' },
  { id: 3, text: '我的身体常常让我不得不吃药调理。', domain: 'body' },
  { id: 4, text: '成绩对于我来说最重要，尤其当我遇到问题的时候。', domain: 'achievement' },
  { id: 5, text: '当我遇到问题时，我会选择更努力地工作（学习）。', domain: 'achievement' },
  { id: 6, text: '当我工作（学习）时，我能忘掉自己的问题。', domain: 'achievement' },
  { id: 7, text: '当我遇到困难时，我总是试图与人分享。', domain: 'relationship' },
  { id: 8, text: '当我在工作（学习）上或家里遇到难题时，我需要别人的帮助。', domain: 'relationship' },
  { id: 9, text: '当我遇到私人的或工作（学习）上的难题时，我需要与别人在一起，以便忘记这些烦恼。', domain: 'relationship' },
  { id: 10, text: '当我遇到困难时，我不由自主地想到所有可能发生的后果。', domain: 'future' },
  { id: 11, text: '当我遇到困难时，我会白天黑夜不停地想。', domain: 'future' },
  { id: 12, text: '当我遇到困难时，我常常会想到生命的意义。', domain: 'future' },
];

export const STRESS_MAX_PER_DOMAIN = 9;

export function scoreStress(answers: Record<number, number>) {
  const scores: Record<DomainKey, number> = {
    body: 0,
    achievement: 0,
    relationship: 0,
    future: 0,
  };

  STRESS_ITEMS.forEach(item => {
    const v = answers[item.id];
    if (typeof v === 'number') scores[item.domain] += v;
  });

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const sorted = [...STRESS_DOMAINS].sort((a, b) => scores[b.key] - scores[a.key]);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const spread = scores[highest.key] - scores[lowest.key];

  return { scores, total, highest, lowest, spread };
}

export function levelOf(score: number): 'low' | 'mid' | 'high' {
  if (score < 3) return 'low';
  if (score > 6) return 'high';
  return 'mid';
}
