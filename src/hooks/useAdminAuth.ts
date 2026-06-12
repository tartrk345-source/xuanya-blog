import { useState, useCallback } from 'react';

const ADMIN_PASSWORD = 'xuanya2026';
const STORAGE_KEY = 'xuanya-admin-session';

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

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(getSession());

  const login = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setSession(true);
      setIsAdmin(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setSession(false);
    setIsAdmin(false);
  }, []);

  return { isAdmin, login, logout };
}
