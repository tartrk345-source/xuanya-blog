import { useState, useEffect, useCallback } from 'react';

/**
 * 图片灯箱组件
 * 监听文章内容中的图片点击，全屏预览
 */
export function ArticleImage({
  src,
  alt,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const openLightbox = useCallback(() => {
    if (!src) return;
    // 触发自定义事件，由 Lightbox 监听
    window.dispatchEvent(new CustomEvent('lightbox-open', { detail: { src, alt: alt || '' } }));
  }, [src, alt]);

  return (
    <img
      src={src}
      alt={alt}
      {...props}
      onClick={openLightbox}
      className="cursor-zoom-in transition-transform duration-200 hover:scale-[1.02]"
      loading="lazy"
    />
  );
}

/**
 * 灯箱 overlay 组件 - 全局挂载一个即可
 */
export default function ImageLightbox() {
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [imgAlt, setImgAlt] = useState('');

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const ce = e as CustomEvent<{ src: string; alt: string }>;
      setImgSrc(ce.detail.src);
      setImgAlt(ce.detail.alt);
      setOpen(true);
    };

    window.addEventListener('lightbox-open', handleOpen);
    return () => window.removeEventListener('lightbox-open', handleOpen);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={() => setOpen(false)}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" />

      {/* 图片 */}
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

      {/* 关闭按钮 */}
      <button
        onClick={() => setOpen(false)}
        className="absolute top-6 right-6 z-20 w-10 h-10 flex items-center justify-center
          rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white
          transition-all duration-200 cursor-pointer"
        aria-label="关闭"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
