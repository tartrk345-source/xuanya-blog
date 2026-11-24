import { useState, useEffect } from 'react';

/**
 * 阅读进度条 - 固定在页面顶部
 * 根据 document 滚动位置实时计算阅读进度
 */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      if (scrollHeight > 0) {
        setProgress((scrollTop / scrollHeight) * 100);
      }
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 w-full h-[4px] z-[200] transition-opacity duration-300 ${
        progress > 0 ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="relative h-full bg-gradient-to-r from-[#DA583F] to-[#E77B61] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      >
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-[#DA583F] ring-2 ring-[#FEFAF9] dark:ring-[#0A0E1A]" />
      </div>
    </div>
  );
}
