import { useState, useCallback, useEffect } from 'react';

const ADMIN_PASSWORD = 'xuanya2026';
const STORAGE_KEY = 'xuanya-admin-session';
const EVENT_NAME = 'xuanya-admin-auth-changed';

function getSession(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function setSession(val: boolean): void {
  try {
    if (val) {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* ignore */ }
}

function emitAuthChange(): void {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(getSession());

  // 监听其他 hook 实例触发的登录/登出事件
  useEffect(() => {
    const handler = () => setIsAdmin(getSession());
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const login = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setSession(true);
      setIsAdmin(true);
      emitAuthChange();
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setSession(false);
    setIsAdmin(false);
    emitAuthChange();
  }, []);

  return { isAdmin, login, logout };
}
