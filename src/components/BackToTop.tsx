import { useState, useEffect } from 'react';

/**
 * 返回顶部按钮
 * 滚动超过 1 屏高度后显示，点击平滑滚回顶部
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      setVisible(scrollTop > window.innerHeight * 0.8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 w-11 h-11 flex items-center justify-center
        rounded-full bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020]
        shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)]
        text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F] hover:border-[#DA583F]
        transition-all duration-300 hover:-translate-y-0.5
        animate-[fadeIn_0.3s_ease-out]"
      aria-label="返回顶部"
      title="返回顶部"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
