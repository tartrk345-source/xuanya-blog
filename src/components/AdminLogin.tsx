import { useState } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function AdminLogin() {
  const { isAdmin, login, logout } = useAdminAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await login(password);
      if (ok) {
        setShowDialog(false);
        setPassword('');
        setError(false);
      } else {
        setError(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* 隐藏触发按钮：Navigation 的齿轮图标通过此元素触发 */}
      <button
        id="admin-login-trigger"
        onClick={() => {
          if (isAdmin) {
            handleLogout();
          } else {
            setShowDialog(true);
            setError(false);
          }
        }}
        className="hidden"
      />

      {/* 右下角齿轮（在 LandingPage 上不可见，仅 blog 页面 fallback）*/}
      {!isAdmin && (
        <button
          onClick={() => {
            setShowDialog(true);
            setError(false);
          }}
          title="管理员登录"
          className="fixed bottom-4 right-4 w-8 h-8 flex items-center justify-center text-[#B8B4B0] hover:text-[#DA583F] dark:text-[#60A5FA] hover:bg-[#FEF3F0] dark:hover:bg-[#1E293B] rounded-full transition-all text-xs z-50"
        >
          ⚙
        </button>
      )}

      {/* 登录弹窗 */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-xs"
            onClick={() => setShowDialog(false)}
          />
          {/* 弹窗内容 */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-[fadeIn_0.15s_ease-out]">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              管理员验证
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              请输入管理员密码以解锁编辑功能
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="请输入密码…"
                autoFocus
                className={`w-full px-4 py-3 text-sm border rounded-lg outline-none transition-all ${
                  error
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'
                }`}
              />
              {error && (
                <p className="mt-2 text-xs text-red-500">
                  密码错误，请重试
                </p>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  {submitting ? '验证中…' : '确认'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 管理员模式标识 — 点击可退出 */}
      {isAdmin && (
        <button
          onClick={handleLogout}
          title="点击退出管理模式"
          className="fixed bottom-14 right-4 text-[10px] text-[#DA583F] dark:text-[#60A5FA] bg-[#FEF3F0] dark:bg-[#1E293B] px-2 py-0.5 rounded-full cursor-pointer hover:bg-[#ECD8D9] dark:hover:bg-[#334155] transition-all select-none border border-[#DA583F]/15"
        >
          管理员模式 · 退出
        </button>
      )}
    </>
  );
}
