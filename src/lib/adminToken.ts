/** 管理员 token 存储（无依赖，供 api.ts 与 useAdminAuth.ts 共用，避免循环引用） */

export const ADMIN_TOKEN_KEY = 'xuanya-admin-token';

export interface TokenInfo { token: string; expiresAt: number }

export function readAdminToken(): string | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!raw) return null;
    const info: TokenInfo = JSON.parse(raw);
    if (!info.token || !info.expiresAt || info.expiresAt < Date.now()) {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      return null;
    }
    return info.token;
  } catch { return null; }
}

export function writeAdminToken(token: string, ttlSeconds: number): void {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify({
    token,
    expiresAt: Date.now() + ttlSeconds * 1000,
  }));
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}
