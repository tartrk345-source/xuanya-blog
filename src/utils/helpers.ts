/**
 * 工具函数集合
 */

import type { CategoryKey } from '../types/article';
import { getCategories } from '../storage/categoryStore';

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
 */
export function getExcerpt(content: string, maxLength = 120): string {
  const plain = content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*?)\]\(.*?\)/g, '$1')
    .replace(/[*_]{1,3}/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*_]{3,}\s*$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();

  if (plain.length <= maxLength) return plain;
  return plain.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

/** Emoji 含义映射（悬停提示用） */
export const EMOJI_MEANINGS: Record<string, string> = {
  '📝': '笔记', '📚': '书籍', '🔬': '研究', '🧘': '冥想',
  '💭': '思考', '🌿': '成长', '🎯': '目标', '💡': '灵感',
  '🌟': '亮点', '🕊️': '和平', '🧠': '大脑', '🏥': '医院',
  '☯️': '阴阳', '💊': '药物', '🎵': '音乐', '✨': '万象',
  '⚡': '神经', '🌸': '花香', '🔮': '玄学', '📜': '典籍',
  '🎨': '艺术', '🫀': '心脏', '📌': '标记', '✍️': '书写',
  '📖': '阅读', '⛩️': '神社',
};

/** 预设常用 emoji 列表（WritePage 文章标识选择器） */
export const EMOJI_PRESETS = [
  '📝', '📚', '🔬', '🧘',
  '💭', '🌿', '🎯', '💡',
  '🌟', '🕊️', '🧠', '🏥',
  '☯️', '💊', '🎵', '✨',
] as const;

/** 分类图标选择器 emoji 列表（BlogPage 管理编辑分类时用） */
export const CATEGORY_ICON_PRESETS = [
  '🧠', '⚡', '🌿', '☯️',
  '🌸', '✨', '📌', '💡',
  '🎯', '🎨', '🔮', '🎵',
  '📜', '🫀', '💊', '🏥',
] as const;

/** 估算阅读时间（分钟）- 中文按 300字/分钟，英文按 200词/分钟 */
export function estimateReadingTime(content: string): number {
  // 去掉 Markdown 语法标记
  const plain = content
    .replace(/```[\s\S]*?```/g, '')       // 代码块
    .replace(/`[^`]*`/g, '')               // 行内代码
    .replace(/^#{1,6}\s+/gm, '')          // 标题
    .replace(/!\[.*?\]\(.*?\)/g, '')       // 图片
    .replace(/\[([^\]]*?)\]\(.*?\)/g, '$1') // 链接
    .replace(/[*_]{1,3}/g, '')            // 加粗/斜体
    .replace(/^[>\-|]\s*/gm, '')           // 引用/列表/表格
    .replace(/\n+/g, ' ')
    .trim();

  if (!plain) return 1;

  // 中文字符数
  const chineseChars = (plain.match(/[\u4e00-\u9fff]/g) || []).length;
  // 英文单词数（去掉中文字符后的英文部分）
  const englishWords = plain
    .replace(/[\u4e00-\u9fff]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0).length;

  const minutes = Math.ceil(chineseChars / 300 + englishWords / 200);
  return Math.max(1, minutes);
}

/** 获取志趣分类（从 localStorage 动态读取） */
export { getCategories as CATEGORIES } from '../storage/categoryStore';

/** 根据 category key 获取分类信息 */
export async function getCategoryInfo(key: CategoryKey) {
  const cats = await getCategories();
  return cats.find(c => c.key === key) ?? cats.find(c => c.key === 'misc') ?? cats[0];
}
