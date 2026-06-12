import { useState } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function AdminLogin() {
  const { isAdmin, login, logout } = useAdminAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(password);
    if (ok) {
      setShowDialog(false);
      setPassword('');
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* 隐藏触发按钮：右下角小齿轮 */}
      <button
        onClick={() => {
          if (isAdmin) {
            handleLogout();
          } else {
            setShowDialog(true);
            setError(false);
          }
        }}
        title={isAdmin ? '退出管理员模式' : '管理员登录'}
        className="fixed bottom-4 right-4 w-8 h-8 flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-all text-xs"
      >
        ⚙
      </button>

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
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all"
                >
                  确认
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 管理员模式标识 */}
      {isAdmin && (
        <div className="fixed bottom-14 right-4 text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full select-none">
          管理员模式
        </div>
      )}
    </>
  );
}
