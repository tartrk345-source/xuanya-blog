import { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navigation from '../components/Navigation';

interface Travel {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  emoji: string;
  tags: string[];
  color: string;
  file: string;
}

const travels: Travel[] = [
  {
    id: 'northwest-2026',
    title: '西北+青海环线',
    subtitle: '14日穿越银川·河西走廊·北疆·伊犁·独库公路·青海湖',
    date: '2026.06.17 – 06.30',
    emoji: '🏜️',
    tags: ['甘肃', '新疆', '青海', '自驾'],
    color: '#c88a3d',
    file: '/travels/northwest-2026.html',
  },
  // 未来旅行在这里添加
];

function TravelCard({ travel, onClick }: { travel: Travel; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl border transition-all duration-400 overflow-hidden ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } bg-white dark:bg-[#1C1818] border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(218,88,63,0.08)]`}
    >
      {/* 顶部色带 */}
      <div className="h-2" style={{ background: travel.color }} />

      <div className="p-6 sm:p-8">
        {/* Emoji + 日期 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl">{travel.emoji}</span>
          <span className="text-xs text-[#B8B4B0] dark:text-[#8A8688] tracking-wider font-medium">
            {travel.date}
          </span>
        </div>

        {/* 标题 */}
        <h3 className="text-[1.3rem] font-bold text-[#313131] dark:text-[#E8E4E1] mb-2 tracking-wide group-hover:text-[#DA583F] transition-colors">
          {travel.title}
        </h3>
        <p className="text-sm text-[#6E6A7C] dark:text-[#A09CA8] mb-4 leading-relaxed">
          {travel.subtitle}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {travel.tags.map(tag => (
            <span
              key={tag}
              className="text-[11px] font-medium px-3 py-1 rounded-full border"
              style={{
                color: travel.color,
                borderColor: `${travel.color}30`,
                background: `${travel.color}08`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 查看提示 */}
        <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[#767693] dark:text-[#8A8688] group-hover:text-[#DA583F] transition-colors">
          <span>查看行程攻略</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function TravelDetail({ travel, onBack }: { travel: Travel; onBack: () => void }) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(travel.file)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(raw => {
        if (cancelled) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(raw, 'text/html');

        // 提取所有 <style> 块，过滤全局重置规则避免破坏页面布局
        const styles = Array.from(doc.querySelectorAll('style'))
          .map(s => {
            let css = s.textContent || '';
            // 移除全局通配符重置（会被 wrapper 限制，仅保留 box-sizing）
            css = css.replace(/\*\s*\{[^}]*\}/g, '');
            // 移除 body/html 全局样式
            css = css.replace(/body\s*\{[^}]*\}/g, '');
            css = css.replace(/html\s*\{[^}]*\}/g, '');
            // 移除 container 的 margin/padding（由 wrapper 控制）
            css = css.replace(/\.container\s*\{[^}]*\}/g, '.container { padding: 0; }');
            return css.trim();
          })
          .filter(css => css.length > 0)
          .join('\n');

        const bodyHTML = doc.body.innerHTML;
        setHtmlContent(`<style>${styles}</style>${bodyHTML}`);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => { cancelled = true; };
  }, [travel.file]);

  return (
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0F0D0E]">
      <Navigation />

      <div className="max-w-[820px] mx-auto px-4 sm:px-8 pt-8 pb-16">
        {/* 返回按钮 */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F] transition-colors mb-8 group cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>返回旅行记录</span>
        </button>

        {/* 标题区 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{travel.emoji}</span>
            <div>
              <h1 className="text-[1.6rem] font-bold text-[#313131] dark:text-[#E8E4E1] tracking-wider">
                {travel.title}
              </h1>
              <p className="text-xs text-[#B8B4B0] dark:text-[#8A8688] tracking-wider">{travel.date}</p>
            </div>
          </div>
          <p className="text-sm text-[#6E6A7C] dark:text-[#A09CA8]">{travel.subtitle}</p>
        </div>

        {/* 内联渲染旅行内容 */}
        {loadError ? (
          <div className="text-center py-16 text-[#B8B4B0] dark:text-[#8A8688]">
            <p>无法加载旅行内容，请稍后重试。</p>
          </div>
        ) : htmlContent ? (
          <div
            ref={contentRef}
            className="travel-content-wrapper"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-48 bg-[#ECD8D9]/40 dark:bg-[#2A2020]/40 rounded" />
            <div className="h-4 w-full bg-[#ECD8D9]/20 dark:bg-[#2A2020]/20 rounded" />
            <div className="h-4 w-3/4 bg-[#ECD8D9]/20 dark:bg-[#2A2020]/20 rounded" />
            <div className="h-4 w-5/6 bg-[#ECD8D9]/20 dark:bg-[#2A2020]/20 rounded" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TravelsPage() {
  const [activeTravel, setActiveTravel] = useState<Travel | null>(null);

  if (activeTravel) {
    return (
      <>
        <Helmet>
          <title>{activeTravel.title} · 玄牙旅行记录</title>
          <meta name="description" content={activeTravel.subtitle} />
        </Helmet>
        <TravelDetail travel={activeTravel} onBack={() => setActiveTravel(null)} />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>旅行记录 · 玄牙</title>
        <meta name="description" content="博謇的旅行足迹——记录每一段旅途的行程攻略与见闻。" />
      </Helmet>
      <Navigation />

      <main className="min-h-screen bg-[#FEFAF9] dark:bg-[#0F0D0E]">
        <div className="max-w-[820px] mx-auto px-4 sm:px-8 pt-16 pb-20">
          {/* 页头 */}
          <div className="mb-12">
            <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] uppercase mb-2">Travel Records</div>
            <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#313131] dark:text-[#E8E4E1] mb-3 tracking-wider leading-tight">
              旅行记录
            </h1>
            <p className="text-[1.05rem] text-[#6E6A7C] dark:text-[#A09CA8] max-w-[500px]">
              脚步不停，记录每一段旅途——行程攻略、避坑指南、沿途见闻。
            </p>
          </div>

          {/* 旅行卡片列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {travels.map(t => (
              <TravelCard
                key={t.id}
                travel={t}
                onClick={() => {
                  setActiveTravel(t);
                  window.scrollTo({ top: 0 });
                }}
              />
            ))}
          </div>

          {/* 空状态占位 — 当还没有旅行时显示 */}
          {travels.length === 0 && (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">🎒</div>
              <p className="text-[#B8B4B0] dark:text-[#8A8688]">还没有旅行记录，未来可期。</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
