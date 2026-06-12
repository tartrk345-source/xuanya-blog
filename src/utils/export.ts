import { exportAllArticles, importArticles } from '../storage/articleStore';
import type { Article } from '../types/article';

export { exportAllArticles, importArticles };

/**
 * 一键导出全部文章为 JSON 文件并触发浏览器下载
 * 文件命名格式：xuanya-blog-backup-YYYY-MM-DD.json
 */
export function downloadBackup(): void {
  const articles = exportAllArticles();
  const json = JSON.stringify(articles, null, 2);

  const today = new Date().toISOString().slice(0, 10);
  const filename = `xuanya-blog-backup-${today}.json`;

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 解析结果 */
export interface ParseResult {
  articles: Article[];
  error?: string;
}

/**
 * 打开文件选择器，解析用户选择的 JSON 备份文件。
 * 仅解析不导入，返回解析出的文章列表供用户确认。
 */
export function parseBackupFile(): Promise<ParseResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve({ articles: [], error: '未选择文件' });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result as string;
          const data = JSON.parse(text);

          if (!Array.isArray(data)) {
            resolve({ articles: [], error: '文件格式错误：需要一个 JSON 数组' });
            return;
          }

          const articles = data as Article[];
          const invalid = articles.some(
            (item) => !item || typeof item.id !== 'string' || typeof item.title !== 'string' || typeof item.content !== 'string'
          );
          if (invalid) {
            resolve({ articles: [], error: '文件格式错误：文章字段不完整' });
            return;
          }

          resolve({ articles });
        } catch {
          resolve({ articles: [], error: '无法解析 JSON 文件' });
        }
      };

      reader.onerror = () => {
        resolve({ articles: [], error: '读取文件失败' });
      };

      reader.readAsText(file);
    };

    input.click();
  });
}

const EXPORT_DATE_KEY = 'xuanya-blog-last-export-date';

/** 检查今天是否已导出过 */
export function hasExportedToday(): boolean {
  try {
    const last = localStorage.getItem(EXPORT_DATE_KEY);
    if (!last) return false;
    return last === new Date().toISOString().slice(0, 10);
  } catch {
    return false;
  }
}

/** 标记今天已导出 */
export function markExportedToday(): void {
  try {
    localStorage.setItem(EXPORT_DATE_KEY, new Date().toISOString().slice(0, 10));
  } catch { /* ignore */ }
}
