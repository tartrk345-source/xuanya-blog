/**
 * GitHub Gist 同步工具
 *
 * 将文章数据同步到私有 Gist，实现跨设备恢复。
 * PAT（Personal Access Token）和 Gist ID 存储在 localStorage。
 */

const STORAGE_KEY_PAT = 'xuanya-blog-github-pat';
const STORAGE_KEY_GIST_ID = 'xuanya-blog-gist-id';

export function getPat(): string | null {
  return localStorage.getItem(STORAGE_KEY_PAT);
}

export function setPat(pat: string): void {
  localStorage.setItem(STORAGE_KEY_PAT, pat.trim());
}

export function clearPat(): void {
  localStorage.removeItem(STORAGE_KEY_PAT);
  localStorage.removeItem(STORAGE_KEY_GIST_ID);
}

function getGistId(): string | null {
  return localStorage.getItem(STORAGE_KEY_GIST_ID);
}

function setGistId(id: string): void {
  localStorage.setItem(STORAGE_KEY_GIST_ID, id);
}

interface GistFile {
  content: string;
}

interface GistUploadBody {
  description: string;
  public: boolean;
  files: Record<string, GistFile>;
}

interface GistResponse {
  id: string;
  files: Record<string, { content: string }>;
  updated_at: string;
}

export async function uploadToGist(
  articlesJson: string,
  pat: string
): Promise<{ success: boolean; gistId?: string; error?: string }> {
  const gistId = getGistId();
  const url = gistId
    ? `https://api.github.com/gists/${gistId}`
    : 'https://api.github.com/gists';
  const method = gistId ? 'PATCH' : 'POST';

  const body: GistUploadBody = {
    description: '玄牙个人世界 - 文章备份（自动同步，请勿手动编辑）',
    public: false,
    files: {
      'xuanya-blog-articles.json': { content: articlesJson },
    },
  };

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `token ${pat}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      const msg = err?.message || res.statusText;
      if (res.status === 401) return { success: false, error: 'Token 无效或已过期，请重新设置' };
      if (res.status === 403) return { success: false, error: 'Token 权限不足，需要 gist 权限' };
      return { success: false, error: `GitHub API 错误：${msg}` };
    }

    const data: GistResponse = await res.json();
    if (!gistId) setGistId(data.id);

    return { success: true, gistId: data.id };
  } catch (e) {
    return { success: false, error: `网络错误：${(e as Error).message}` };
  }
}

export async function downloadFromGist(
  pat: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  const gistId = getGistId();
  if (!gistId) return { success: false, error: '未找到同步记录，请先同步到云端' };

  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `token ${pat}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        setGistId('');
        return { success: false, error: '云端备份不存在，可能已被删除' };
      }
      return { success: false, error: `GitHub API 错误：${res.statusText}` };
    }

    const data: GistResponse = await res.json();
    const file = data.files['xuanya-blog-articles.json'];
    if (!file) return { success: false, error: 'Gist 文件格式异常' };

    return { success: true, data: file.content };
  } catch (e) {
    return { success: false, error: `网络错误：${(e as Error).message}` };
  }
}
