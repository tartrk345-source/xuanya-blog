/**
 * 服务器本地备份（替代已废弃的 GitHub Gist 同步）
 *
 * 备份文件存在服务器 /www/wwwroot/x2ya/backups/（Web 根之外），
 * 由 /api/backup 提供，全部接口要求管理员 token。
 *
 *   POST   /api/backup                              → 生成快照
 *   GET    /api/backup?action=list                  → 快照列表
 *   GET    /api/backup?action=download&file=xxx     → 下载快照
 */

import type { Article } from '../types/article';
import { getPublishedArticlesFull, importArticles } from '../storage/articleStore';
import { readAdminToken } from '../lib/adminToken';

const API = '/api/backup';

export interface BackupItem {
  file: string;
  bytes: number;
  createdAt: string;
  count: number;
}

function authHeaders(): Record<string, string> {
  const token = readAdminToken();
  if (!token) throw new Error('管理员会话已失效，请重新登录后再操作');
  return { 'X-Admin-Token': token };
}

async function readJson(resp: Response): Promise<any> {
  return resp.json().catch(() => null);
}

/** 把北京时间显示成 2026-11-23 23:30 */
function humanTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 生成一份服务器备份 */
export async function createServerBackup(): Promise<string> {
  const articles = await getPublishedArticlesFull();
  if (articles.length === 0) throw new Error('没有可备份的文章');

  const resp = await fetch(API, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ articles }),
  });
  const data = await readJson(resp);
  if (!resp.ok || !data?.ok) throw new Error(data?.message || `备份失败（${resp.status}）`);

  return `已在服务器生成备份：${data.count} 篇 · ${humanTime(data.createdAt)}`;
}

/** 读取备份列表（新→旧） */
export async function listServerBackups(): Promise<BackupItem[]> {
  const resp = await fetch(`${API}?action=list`, { headers: authHeaders() });
  const data = await readJson(resp);
  if (!resp.ok || !data?.ok) throw new Error(data?.message || `读取备份列表失败（${resp.status}）`);
  return Array.isArray(data.items) ? data.items : [];
}

/** 从服务器备份恢复；不传 file 则用最新一份 */
export async function restoreFromServerBackup(file?: string): Promise<string> {
  const target = file || (await listServerBackups())[0]?.file;
  if (!target) throw new Error('服务器上还没有任何备份');

  const resp = await fetch(`${API}?action=download&file=${encodeURIComponent(target)}`, {
    headers: authHeaders(),
  });
  const data = await readJson(resp);
  if (!resp.ok) throw new Error(data?.message || `下载备份失败（${resp.status}）`);

  const articles = data?.articles;
  if (!Array.isArray(articles) || articles.length === 0) throw new Error('该备份中没有文章数据');

  await importArticles(articles as Article[]);
  const when = typeof data.exportedAt === 'string' ? humanTime(data.exportedAt) : target;
  return `已从服务器备份恢复 ${articles.length} 篇文章（备份时间 ${when}）`;
}
