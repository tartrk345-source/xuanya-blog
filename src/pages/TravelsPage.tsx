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
      } bg-white dark:bg-[#1E293B] border-[#CBD5E1] dark:border-[#334155] hover:border-[#3B82F6] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(218,88,63,0.08)]`}
    >
      {/* 顶部色带 */}
      <div className="h-2" style={{ background: travel.color }} />

      <div className="p-6 sm:p-8">
        {/* Emoji + 日期 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl">{travel.emoji}</span>
          <span className="text-xs text-[#94A3B8] dark:text-[#94A3B8] tracking-wider font-medium">
            {travel.date}
          </span>
        </div>

        {/* 标题 */}
        <h3 className="text-[1.3rem] font-bold text-[#1E293B] dark:text-[#E2E8F0] mb-2 tracking-wide group-hover:text-[#3B82F6] transition-colors">
          {travel.title}
        </h3>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4 leading-relaxed">
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
        <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#3B82F6] transition-colors">
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
  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0A0E1A]">
      <Navigation />

      {/* 顶栏：返回按钮 + 标题 */}
      <div className="flex-shrink-0 px-4 sm:px-8 pt-3 pb-2 border-b border-[#CBD5E1] dark:border-[#334155]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#3B82F6] transition-colors cursor-pointer flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">返回</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-[#1E293B] dark:text-[#E2E8F0] truncate">
              {travel.emoji} {travel.title}
            </h1>
          </div>
        </div>
      </div>

      {/* iframe 全屏嵌入，原生 CSS/JS 完整运行 */}
      <iframe
        src={travel.file}
        title={travel.title}
        className="flex-1 w-full border-none"
      />
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

      <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0E1A]">
        <div className="max-w-[820px] mx-auto px-4 sm:px-8 pt-16 pb-20">
          {/* 页头 */}
          <div className="mb-12">
            <div className="text-xs font-bold tracking-[0.12em] text-[#3B82F6] uppercase mb-2">Travel Records</div>
            <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#1E293B] dark:text-[#E2E8F0] mb-3 tracking-wider leading-tight">
              旅行记录
            </h1>
            <p className="text-[1.05rem] text-[#64748B] dark:text-[#94A3B8] max-w-[500px]">
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
              <p className="text-[#94A3B8] dark:text-[#94A3B8]">还没有旅行记录，未来可期。</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
