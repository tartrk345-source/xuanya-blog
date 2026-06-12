/**
 * 工具函数集合
 */

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
