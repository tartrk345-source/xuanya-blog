import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

/** 全局导航栏：首页全屏时玻璃质感，滚动后加边框 */
export default function Navigation() {
  const { isAdmin, logout } = useAdminAuth();
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // 滚动检测
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 暗色模式初始化：localStorage > prefers-color-scheme > 默认浅色
  useEffect(() => {
    const stored = localStorage.getItem('x2ya-theme');
    if (stored === 'dark' || stored === 'light') {
      const isDark = stored === 'dark';
      setDark(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefers) {
        setDark(true);
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    setDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('x2ya-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // 滚动到对应区块（同时兼容同页和跨页导航）
  const handleNavClick = useCallback((e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
      window.location.href = `/#${sectionId}`;
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    window.history.pushState(null, '', `/#${sectionId}`);
  }, []);

  // 路由变化时确保 body overflow 恢复（防止浏览器后退时菜单关闭但页面仍被锁定）
  useEffect(() => {
    const handleRouteChange = () => {
      if (mobileOpen) {
        setMobileOpen(false);
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [mobileOpen]);

  const navLinks = [
    { id: 'about', label: '认识', type: 'anchor' as const },
    { id: 'interests', label: '志趣', type: 'anchor' as const },
    { id: 'work', label: '行迹', type: 'dropdown' as const,
      children: [
        { id: 'work', label: '学医行迹', type: 'anchor' as const },
        { id: '/travels', label: '旅行记录', type: 'route' as const },
      ],
    },
    { id: 'contact', label: '联系', type: 'anchor' as const },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-100 transition-all duration-300 px-8 ${
          scrolled
            ? 'bg-[#FEFAF9]/85 dark:bg-[#0A0E1A]/90 backdrop-blur-xl border-b border-[#ECD8D9] dark:border-[#334155] shadow-[0_1px_20px_rgba(218,88,63,0.04)]'
            : 'bg-[#FEFAF9]/85 dark:bg-[#0A0E1A]/90 backdrop-blur-xl border-b border-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16">
          {/* Logo：角色形象 + 文字 */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
          >
            <img src="/images/logo.webp" alt="玄牙" className="w-8 h-8 rounded-full object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-200" />
            <span className="text-[1.2rem] font-bold text-[#313131] dark:text-[#E2E8F0] tracking-wider font-['PingFang_SC','Noto_Serif_SC',serif] group-hover:text-[#DA583F] dark:text-[#60A5FA] transition-colors">
              玄牙
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden sm:flex items-center gap-8 list-none">
            {navLinks.map(link => (
              <li key={link.id}>
                {link.type === 'dropdown' ? (
                  <div
                    ref={dropdownRef}
                    className="relative"
                  >
                    <a
                      href={`/#${link.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setDropdownOpen(!dropdownOpen);
                      }}
                      className="relative text-sm font-medium text-[#4F4F4F] dark:text-[#94A3B8] hover:text-[#DA583F] dark:text-[#60A5FA] transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-[#DA583F] dark:after:bg-[#60A5FA] after:transition-[width] after:duration-300 hover:after:w-full cursor-pointer flex items-center gap-1 select-none"
                    >
                      {link.label}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </a>
                    {dropdownOpen && link.children && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 py-2 px-1 bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] min-w-[130px] z-50 animate-[fadeIn_0.15s_ease-out]">
                        {link.children.map(child => (
                          child.type === 'route' ? (
                            <Link
                              key={child.id}
                              to={child.id}
                              onClick={() => setDropdownOpen(false)}
                              className="block px-4 py-2.5 text-sm text-[#4F4F4F] dark:text-[#94A3B8] hover:text-[#DA583F] dark:text-[#60A5FA] hover:bg-[#FEF3F0] dark:hover:bg-[#1E293B] rounded-lg transition-colors whitespace-nowrap"
                            >
                              {child.label}
                            </Link>
                          ) : (
                            <a
                              key={child.id}
                              href={`/#${child.id}`}
                              onClick={(e) => {
                                handleNavClick(e, child.id);
                                setDropdownOpen(false);
                              }}
                              className="block px-4 py-2.5 text-sm text-[#4F4F4F] dark:text-[#94A3B8] hover:text-[#DA583F] dark:text-[#60A5FA] hover:bg-[#FEF3F0] dark:hover:bg-[#1E293B] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                            >
                              {child.label}
                            </a>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <a
                    href={`/#${link.id}`}
                    onClick={(e) => handleNavClick(e, link.id)}
                    className="relative text-sm font-medium text-[#4F4F4F] dark:text-[#94A3B8] hover:text-[#DA583F] dark:text-[#60A5FA] transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-[#DA583F] dark:after:bg-[#60A5FA] after:transition-[width] after:duration-300 hover:after:w-full cursor-pointer"
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
            {/* 暗色模式 */}
            <li>
              <a
                href="/rss.xml"
                target="_blank"
                className="w-10 h-10 rounded-full border-[1.5px] border-[#ECD8D9] dark:border-[#334155] bg-white dark:bg-[#1E293B] flex items-center justify-center text-sm cursor-pointer hover:border-[#DA583F] hover:bg-[#FEF3F0] dark:hover:bg-[#1E293B] transition-all"
                title="RSS 订阅"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 019 9"/><path d="M4 4a16 16 0 0116 16"/><circle cx="5" cy="19" r="1" fill="currentColor"/></svg>
              </a>
            </li>
            <li>
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full border-[1.5px] border-[#ECD8D9] dark:border-[#334155] bg-white dark:bg-[#1E293B] flex items-center justify-center text-lg cursor-pointer hover:border-[#DA583F] hover:bg-[#FEF3F0] dark:hover:bg-[#1E293B] transition-all"
                title={dark ? '切换浅色模式' : '切换深色模式'}
              >
                {dark ? '☀' : '☽'}
              </button>
            </li>
            {/* 管理员入口 */}
            <li>
              {isAdmin ? (
                <button
                  onClick={() => { logout(); }}
                  className="text-xs font-medium text-[#DA583F] dark:text-[#60A5FA] bg-[#FEF3F0] dark:bg-[#1E293B] hover:bg-[#ECD8D9] dark:hover:bg-[#334155] px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap"
                  title="退出管理模式"
                >
                  退出
                </button>
              ) : (
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('admin-login-trigger')?.click();
                  }}
                  title="管理员登录"
                  className="text-xs text-[#B8B4B0] dark:text-[#94A3B8] hover:text-[#DA583F] dark:text-[#60A5FA] transition-colors px-1"
                >
                  ⚙
                </Link>
              )}
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
            <span className={`block w-[22px] h-[2px] bg-[#313131] dark:bg-[#E2E8F0] rounded-sm transition-all ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-[22px] h-[2px] bg-[#313131] dark:bg-[#E2E8F0] rounded-sm transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-[22px] h-[2px] bg-[#313131] dark:bg-[#E2E8F0] rounded-sm transition-all ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>
        </div>
      </nav>

      {/* 移动端菜单 */}
      <div
        className={`sm:hidden fixed inset-0 z-[98] bg-[#FEFAF9]/95 dark:bg-[#0A0E1A]/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-10 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {navLinks.map(link => (
          link.type === 'dropdown' ? (
            <div key={link.id} className="flex flex-col items-center gap-4">
              <a
                href={`/#${link.id}`}
                onClick={(e) => {
                  handleNavClick(e, link.id);
                  setMobileOpen(false);
                  document.body.style.overflow = '';
                }}
                className="text-[1.3rem] font-semibold text-[#313131] dark:text-[#E2E8F0] tracking-wider hover:text-[#DA583F] dark:text-[#60A5FA] transition-colors cursor-pointer"
              >
                {link.label}
              </a>
              <div className="flex flex-col items-center gap-3">
                {link.children?.map(child => (
                  child.type === 'route' ? (
                    <Link
                      key={child.id}
                      to={child.id}
                      onClick={() => { setMobileOpen(false); document.body.style.overflow = ''; }}
                      className="text-[1.05rem] text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] dark:text-[#60A5FA] transition-colors pl-2 border-l-2 border-[#ECD8D9] dark:border-[#334155]"
                    >
                      {child.label}
                    </Link>
                  ) : (
                    <a
                      key={child.id}
                      href={`/#${child.id}`}
                      onClick={(e) => {
                        handleNavClick(e, child.id);
                        setMobileOpen(false);
                        document.body.style.overflow = '';
                      }}
                      className="text-[1.05rem] text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] dark:text-[#60A5FA] transition-colors pl-2 border-l-2 border-[#ECD8D9] dark:border-[#334155] cursor-pointer"
                    >
                      {child.label}
                    </a>
                  )
                ))}
              </div>
            </div>
          ) : (
            <a
              key={link.id}
              href={`/#${link.id}`}
              onClick={(e) => {
                handleNavClick(e, link.id);
                setMobileOpen(false);
                document.body.style.overflow = '';
              }}
              className="text-[1.3rem] font-semibold text-[#313131] dark:text-[#E2E8F0] tracking-wider hover:text-[#DA583F] dark:text-[#60A5FA] transition-colors cursor-pointer"
            >
              {link.label}
            </a>
          )
        ))}
        <button
          onClick={() => { toggleTheme(); setMobileOpen(false); document.body.style.overflow = ''; }}
          className="mt-4 w-12 h-12 rounded-full border-[1.5px] border-[#ECD8D9] dark:border-[#334155] bg-white dark:bg-[#1E293B] flex items-center justify-center text-xl cursor-pointer hover:border-[#DA583F] transition-all"
        >
          {dark ? '☀' : '☽'}
        </button>
        {/* 移动端 RSS */}
        <a
          href="/rss.xml"
          target="_blank"
          className="w-12 h-12 rounded-full border-[1.5px] border-[#ECD8D9] dark:border-[#334155] bg-white dark:bg-[#1E293B] flex items-center justify-center text-sm cursor-pointer hover:border-[#DA583F] hover:bg-[#FEF3F0] dark:hover:bg-[#1E293B] transition-all"
          title="RSS 订阅"
          onClick={() => { setMobileOpen(false); document.body.style.overflow = ''; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 019 9"/><path d="M4 4a16 16 0 0116 16"/><circle cx="5" cy="19" r="1" fill="currentColor"/></svg>
        </a>
        {/* 移动端管理员 */}
        {isAdmin ? (
          <button
            onClick={() => { logout(); setMobileOpen(false); document.body.style.overflow = ''; }}
            className="mt-2 px-5 py-2 text-sm font-medium text-[#DA583F] dark:text-[#60A5FA] bg-[#FEF3F0] dark:bg-[#1E293B] rounded-lg border border-[#DA583F]/20 dark:border-[#3B82F6]/20 hover:bg-[#ECD8D9] dark:hover:bg-[#334155] transition-all cursor-pointer"
          >
            退出管理模式
          </button>
        ) : (
          <button
            onClick={() => { document.getElementById('admin-login-trigger')?.click(); setMobileOpen(false); document.body.style.overflow = ''; }}
            className="mt-2 text-xs text-[#B8B4B0] dark:text-[#94A3B8] hover:text-[#DA583F] dark:text-[#60A5FA] transition-colors cursor-pointer"
          >
            ⚙ 管理员登录
          </button>
        )}
      </div>

      {/* 占位 */}
      <div className="h-16" />
    </>
  );
}
