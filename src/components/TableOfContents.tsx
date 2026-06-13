import { useState, useEffect, useMemo } from 'react';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/** 从 Markdown 内容提取标题层级结构 */
export function extractToc(content: string): TocItem[] {
  const headings: TocItem[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[*_`~]/g, '').trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      headings.push({ id, text, level });
    }
  }
  return headings;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export default function TableOfContents({ content, className = '' }: TableOfContentsProps) {
  const toc = useMemo(() => extractToc(content), [content]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // 给文章中的 h2/h3/h4 添加 id（如果还没有）
    const headers = document.querySelectorAll('.prose-container h2, .prose-container h3, .prose-container h4');
    headers.forEach(h => {
      if (!h.id) {
        const text = h.textContent?.trim() ?? '';
        h.id = text
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }
    });

    // 滚动监听高亮当前标题
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    headers.forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, [content]);

  if (toc.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className={`toc-nav ${className}`}>
      <div className="text-xs font-bold text-[#767693] dark:text-[#8A8688] uppercase tracking-widest mb-3">
        目录
      </div>
      <ul className="space-y-1.5">
        {toc.map(item => {
          const indent = item.level - 2;
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => handleClick(item.id)}
                className={`block w-full text-left text-[13px] leading-relaxed transition-all duration-200 hover:text-[#DA583F] cursor-pointer ${
                  isActive
                    ? 'text-[#DA583F] font-semibold'
                    : 'text-[#767693] dark:text-[#8A8688]'
                }`}
                style={{ paddingLeft: `${indent * 16}px` }}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 transition-colors duration-200 ${
                  isActive ? 'bg-[#DA583F]' : 'bg-[#ECD8D9] dark:bg-[#2A2020]'
                }`} style={{ marginTop: '-2px' }} />
                {item.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
