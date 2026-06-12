import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

/** 全局导航栏：首页全屏时玻璃质感，滚动后加边框 */
export default function Navigation() {
  const { isAdmin } = useAdminAuth();
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // 滚动检测
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 暗色模式初始化
  useEffect(() => {
    const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefers) {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  const navLinks = [
    { href: '/#about', label: '关于' },
    { href: '/#interests', label: '志趣' },
    { href: '/#work', label: '行迹' },
    { href: '/#contact', label: '联系' },
    { href: '/blog', label: '博客' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-100 transition-all duration-300 px-8 ${
          scrolled
            ? 'bg-[#FEFAF9]/85 dark:bg-[#0F0D0E]/90 backdrop-blur-xl border-b border-[#ECD8D9] dark:border-[#2A2020] shadow-[0_1px_20px_rgba(218,88,63,0.04)]'
            : 'bg-[#FEFAF9]/85 dark:bg-[#0F0D0E]/90 backdrop-blur-xl border-b border-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="text-[1.4rem] font-bold text-[#313131] dark:text-[#E8E4E1] tracking-wider font-['PingFang_SC','Noto_Serif_SC',serif]"
          >
            玄<span className="text-[#DA583F]">牙</span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden sm:flex items-center gap-8 list-none">
            {navLinks.map(link => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="relative text-sm font-medium text-[#4F4F4F] dark:text-[#B8B4B0] hover:text-[#DA583F] transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-[#DA583F] after:transition-[width] after:duration-300 hover:after:w-full"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {/* 暗色模式 */}
            <li>
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full border-[1.5px] border-[#ECD8D9] dark:border-[#2A2020] bg-white dark:bg-[#1C1818] flex items-center justify-center text-lg cursor-pointer hover:border-[#DA583F] hover:bg-[#FEF3F0] dark:hover:bg-[#1A1516] transition-all"
                title={dark ? '切换浅色模式' : '切换深色模式'}
              >
                {dark ? '☀' : '☽'}
              </button>
            </li>
            {/* 管理员入口：极简齿轮 */}
            <li>
              <Link
                to={isAdmin ? '#' : '#'}
                onClick={(e) => {
                  if (isAdmin) return;
                  e.preventDefault();
                  // 触发 AdminLogin
                  document.getElementById('admin-login-trigger')?.click();
                }}
                title={isAdmin ? '管理员模式' : '管理员登录'}
                className="text-xs text-[#B8B4B0] dark:text-[#8A8688] hover:text-[#DA583F] transition-colors px-1"
              >
                ⚙
              </Link>
            </li>
          </ul>

          {/* 移动端汉堡按钮 */}
          <button
            onClick={() => {
              setMobileOpen(prev => !prev);
              document.body.style.overflow = mobileOpen ? '' : 'hidden';
            }}
            className="sm:hidden w-10 h-10 flex flex-col items-center justify-center gap-[5px] bg-transparent border-none cursor-pointer z-[101]"
          >
            <span className={`block w-[22px] h-[2px] bg-[#313131] dark:bg-[#E8E4E1] rounded-sm transition-all ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-[22px] h-[2px] bg-[#313131] dark:bg-[#E8E4E1] rounded-sm transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-[22px] h-[2px] bg-[#313131] dark:bg-[#E8E4E1] rounded-sm transition-all ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>
        </div>
      </nav>

      {/* 移动端菜单 */}
      <div
        className={`sm:hidden fixed inset-0 z-[98] bg-[#FEFAF9]/95 dark:bg-[#0F0D0E]/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-16 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {navLinks.map(link => (
          <Link
            key={link.href}
            to={link.href}
            onClick={() => {
              setMobileOpen(false);
              document.body.style.overflow = '';
            }}
            className="text-[1.3rem] font-semibold text-[#313131] dark:text-[#E8E4E1] tracking-wider hover:text-[#DA583F] transition-colors"
          >
            {link.label}
          </Link>
        ))}
        <button
          onClick={() => { toggleTheme(); setMobileOpen(false); document.body.style.overflow = ''; }}
          className="mt-4 w-12 h-12 rounded-full border-[1.5px] border-[#ECD8D9] dark:border-[#2A2020] bg-white dark:bg-[#1C1818] flex items-center justify-center text-xl cursor-pointer hover:border-[#DA583F] transition-all"
        >
          {dark ? '☀' : '☽'}
        </button>
      </div>

      {/* 占位 */}
      <div className="h-16" />
    </>
  );
}
