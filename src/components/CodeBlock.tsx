import { useEffect, useState } from 'react';

/**
 * 代码块复制钩子
 * 在文章容器 ref 范围内查找所有 pre>code，附加复制按钮
 */
export function useCodeBlockCopy(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preElements = container.querySelectorAll('pre');
    const cleanups: (() => void)[] = [];

    preElements.forEach((pre) => {
      // 避免重复添加
      if (pre.querySelector('[data-copy-btn]')) return;

      const btn = document.createElement('button');
      btn.setAttribute('data-copy-btn', '');
      btn.title = '复制代码';
      btn.type = 'button';
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span style="margin-left:4px;font-size:11px">复制</span>`;
      btn.style.cssText = `
        position: absolute; top: 8px; right: 8px; z-index: 10;
        display: flex; align-items: center; gap: 4px;
        padding: 4px 10px; border-radius: 6px;
        font-size: 11px; font-weight: 500;
        background: rgba(255,255,255,0.7); backdrop-filter: blur(4px);
        border: 1px solid #CBD5E1; color: #64748B;
        cursor: pointer; transition: all 0.2s;
      `;
      // hover 样式用 JS 处理
      btn.onmouseenter = () => { btn.style.borderColor = '#3B82F6'; btn.style.color = '#3B82F6'; };
      btn.onmouseleave = () => { btn.style.borderColor = '#CBD5E1'; btn.style.color = '#64748B'; };

      const doCopy = async () => {
        const code = pre.querySelector('code');
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code.textContent || '');
        } catch {
          // fallback
          const ta = document.createElement('textarea');
          ta.value = code.textContent || '';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span style="margin-left:4px;font-size:11px;color:#16a34a">已复制</span>`;
        setTimeout(() => {
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span style="margin-left:4px;font-size:11px">复制</span>`;
        }, 2000);
      };
      btn.onclick = doCopy;

      pre.style.position = 'relative';
      pre.appendChild(btn);
      cleanups.push(() => btn.remove());
    });

    return () => cleanups.forEach(fn => fn());
  }, [containerRef]);
}

/**
 * 图片灯箱组件
 * 监听文章内容中的图片点击，全屏预览
 */
export function ArticleImageLightbox() {
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [imgAlt, setImgAlt] = useState('');

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.closest('.prose-container')) {
        e.preventDefault();
        setImgSrc((target as HTMLImageElement).src);
        setImgAlt((target as HTMLImageElement).alt || '');
        setOpen(true);
      }
    };
    document.addEventListener('click', handler, { capture: true });
    return () => document.removeEventListener('click', handler, { capture: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" />
      <div className="relative z-10 max-w-[90vw] max-h-[90vh] animate-[lightboxIn_0.3s_ease-out]">
        <img
          src={imgSrc}
          alt={imgAlt}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          onClick={e => e.stopPropagation()}
        />
        {imgAlt && (
          <p className="text-center text-sm text-white/60 mt-3">{imgAlt}</p>
        )}
      </div>
      <button
        onClick={() => setOpen(false)}
        className="absolute top-6 right-6 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
        aria-label="关闭"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
