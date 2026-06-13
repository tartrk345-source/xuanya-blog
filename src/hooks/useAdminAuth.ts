import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'xuanya-admin-session';
const EVENT_NAME = 'xuanya-admin-auth-changed';

// SHA-256 哈希密码（用 Web Crypto API 生成）
// 原始密码: xuanya2026
// 更新方法: 在浏览器控制台跑 crypto.subtle.digest('SHA-256', new TextEncoder().encode('新密码')).then(b => Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''))
const HASHED_PASSWORD = '7672d11020834a2bf9b0be5a86a5c84d632f1976c5db2da1703238a329c62eab'; // xuanya2026

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

  const login = useCallback(async (password: string): Promise<boolean> => {
    const hash = await sha256(password);
    if (hash === HASHED_PASSWORD) {
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
