import { useState, useCallback, useEffect } from 'react';
import { readAdminToken, writeAdminToken, clearAdminToken } from '../lib/adminToken';

const EVENT_NAME = 'xuanya-admin-auth-changed';

/**
 * 管理员鉴权（服务端校验版）
 * - 密码不再出现在前端源码里
 * - 登录由服务端验证，返回签名 token（7 天有效）
 * - token 存 sessionStorage，关闭标签页即失效
 * - 所有写操作由服务端校验 token
 */
export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => readAdminToken() !== null);

  useEffect(() => {
    const handler = () => setIsAdmin(readAdminToken() !== null);
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/supabase?p=' + encodeURIComponent('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (!data.token) return false;
      writeAdminToken(data.token, data.expiresIn ?? 604800);
      setIsAdmin(true);
      emitAuthChange();
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    setIsAdmin(false);
    emitAuthChange();
  }, []);

  return { isAdmin, login, logout };
}

function emitAuthChange(): void {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}
