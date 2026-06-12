/**
 * GitHub Gist 同步工具
 *
 * PAT 优先级：
 * 1. import.meta.env.VITE_GITHUB_PAT（Vercel 环境变量，生产环境）
 * 2. localStorage（本地开发手动设置，或覆盖用）
 *
 * 将文章数据同步到私有 Gist，实现跨设备恢复。
 */

import { getAllArticles, importArticles } from '../storage/articleStore';

const STORAGE_KEY_PAT = 'xuanya-blog-github-pat';
const STORAGE_KEY_GIST_ID = 'xuanya-blog-gist-id';

function getEnvPat(): string | null {
  return (import.meta as any).env.VITE_GITHUB_PAT || null;
}

export function getPat(): string | null {
  return getEnvPat() || localStorage.getItem(STORAGE_KEY_PAT);
}

export function setPat(pat: string): void {
  localStorage.setItem(STORAGE_KEY_PAT, pat.trim());
}

export function clearPat(): void {
  localStorage.removeItem(STORAGE_KEY_PAT);
}

export function getGistId(): string | null {
  return localStorage.getItem(STORAGE_KEY_GIST_ID);
}

export function setGistId(id: string): void {
  localStorage.setItem(STORAGE_KEY_GIST_ID, id);
}

interface GistFile {
  content: string;
}

interface GistData {
  description: string;
  public: boolean;
  files: Record<string, GistFile>;
}

interface GistResponse {
  id: string;
  files: Record<string, { content: string }>;
}

async function gistFetch(path: string, options?: RequestInit): Promise<Response> {
  const pat = getPat();
  if (!pat) {
    throw new Error('未配置 GitHub Token，请在 Vercel 环境变量中设置 VITE_GITHUB_PAT');
  }
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `token ${pat}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
  });
}

export async function syncToGist(): Promise<string> {
  const articles = getAllArticles();
  const now = new Date().toISOString().split('T')[0];
  const gistId = getGistId();
  const body: GistData = {
    description: `玄牙个人世界文章备份 ${now}`,
    public: false,
    files: {
      'xuanya-blog-articles.json': {
        content: JSON.stringify({ exportedAt: now, articles }, null, 2),
      },
    },
  };

  if (gistId) {
    const resp = await gistFetch(`/gists/${gistId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(err?.message || `更新 Gist 失败（${resp.status}）`);
    }
    return `已更新云端备份，共 ${articles.length} 篇文章`;
  } else {
    const resp = await gistFetch('/gists', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(err?.message || `创建 Gist 失败（${resp.status}）`);
    }
    const data: GistResponse = await resp.json();
    setGistId(data.id);
    return `已创建云端备份，共 ${articles.length} 篇文章`;
  }
}

export async function restoreFromGist(): Promise<string> {
  const gistId = getGistId();
  if (!gistId) {
    throw new Error('未找到云端备份 ID，请先执行一次同步');
  }
  const resp = await gistFetch(`/gists/${gistId}`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => null);
    throw new Error(err?.message || `获取 Gist 失败（${resp.status}）`);
  }
  const data: GistResponse = await resp.json();
  const file = data.files['xuanya-blog-articles.json'];
  if (!file) throw new Error('Gist 中未找到文章数据');
  const parsed = JSON.parse(file.content);
  if (!Array.isArray(parsed.articles)) throw new Error('云端数据格式异常');

  importArticles(parsed.articles);
  return `已从云端恢复 ${parsed.articles.length} 篇文章`;
}
