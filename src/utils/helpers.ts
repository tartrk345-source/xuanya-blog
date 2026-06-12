/**
 * 工具函数集合
 */

import type { CategoryKey } from '../types/article';

/** 生成唯一 ID：时间戳 + 6位随机十六进制 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/** 格式化时间戳为可读日期字符串 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 从 Markdown 原文提取纯文本摘要
 * 去掉标题符号、链接语法、加粗/斜体等常见标记
 */
export function getExcerpt(content: string, maxLength = 120): string {
  const plain = content
    // 去掉 Markdown 标题标记
    .replace(/^#{1,6}\s+/gm, '')
    // 去掉图片 ![alt](url)
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // 去掉链接 [text](url)，保留 text
    .replace(/\[([^\]]*?)\]\(.*?\)/g, '$1')
    // 去掉加粗/斜体标记
    .replace(/[*_]{1,3}/g, '')
    // 去掉行内代码
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    // 去掉块引用前缀
    .replace(/^>\s+/gm, '')
    // 去掉水平线
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // 去掉空行
    .replace(/\n{2,}/g, '\n')
    .trim();

  if (plain.length <= maxLength) return plain;
  return plain.substring(0, maxLength).replace(/\s+\S*$/, '') + '…';
}

/** 预设常用 emoji 列表 */
export const EMOJI_PRESETS = [
  '📝', '📚', '🔬', '🧘',
  '💭', '🌿', '✍️', '📖',
  '🎯', '💡', '🌟', '🕊️',
  '🧠', '🏥', '⛩️', '☯️',
] as const;

/** 志趣分类定义 */
export const CATEGORIES: { key: CategoryKey; label: string; icon: string; desc: string }[] = [
  { key: 'psychiatry', label: '精神心理', icon: '🧠', desc: '精神分裂症、抑郁障碍、dTMS神经调控——深耕临床一线，以实证回应困惑。' },
  { key: 'bci', label: '脑机接口', icon: '🔬', desc: '神经调控与工程技术的交叉地带，探索精神科治疗的下一站。' },
  { key: 'positive-psychology', label: '积极心理', icon: '🌿', desc: '积极心理治疗、心理韧性与幸福感研究——从疗愈疾病到滋养幸福的视角转换。' },
  { key: 'sinology', label: '国学玄学', icon: '🌏', desc: '国学经典、传统智慧——以理性之眼观照古老学问，在古今之间寻找共鸣。' },
  { key: 'aromatherapy', label: '芳香疗法', icon: '🌸', desc: '精油的科学应用与临床推广——让自然疗愈力触达更多人。' },
  { key: 'misc', label: '万象', icon: '✨', desc: '其余热爱——它们散落在生活的缝隙里，静默发光。' },
];

/** 根据 category key 获取分类信息 */
export function getCategoryInfo(key: CategoryKey) {
  return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[5]; // 默认万象
}
