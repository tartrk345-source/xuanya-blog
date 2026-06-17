import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navigation from '../components/Navigation';
import TravelGuideRenderer from '../components/travel/TravelGuideRenderer';
import { northwest2026 } from '../data/northwest2026';
import { getTravelList, getTravelById, type TravelGuideMeta } from '../storage/travelGuideStore';
import { getJournalStatuses } from '../lib/journals';
import { useAdminAuth } from '../hooks/useAdminAuth';
import type { TravelGuideData } from '../data/travelTypes';

interface Travel {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  emoji: string;
  tags: string[];
  color: string;
  file?: string;
  dataId?: string;
  fromSupabase?: boolean;
}

/** 本地静态数据作为 fallback */
const LOCAL_TRAVELS: Travel[] = [
  {
    id: 'northwest-2026',
    title: '西北+青海环线',
    subtitle: '14日穿越银川·河西走廊·北疆·伊犁·独库公路·青海湖',
    date: '2026.06.17 – 06.30',
    emoji: '🏜️',
    tags: ['甘肃', '新疆', '青海', '自驾'],
    color: '#c88a3d',
    dataId: 'northwest-2026',
  },
];

/** 本地数据查询 */
const localDataMap: Record<string, TravelGuideData> = {
  'northwest-2026': northwest2026,
};

/** Supabase 列表 → Travel 卡片格式 */
function supabaseToTravel(g: TravelGuideMeta): Travel {
  return {
    id: g.id,
    title: g.title,
    subtitle: g.subtitle,
    date: g.date,
    emoji: g.emoji,
    tags: g.tags,
    color: g.color,
    fromSupabase: true,
  };
}

/* ========== TravelCard ========== */
function TravelCard({ travel, onClick }: { travel: Travel; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 },
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
      } bg-white dark:bg-[#1E293B] border-[#ECD8D9] dark:border-[#334155] hover:border-[#DA583F] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(218,88,63,0.08)]`}
    >
      <div className="h-2" style={{ background: travel.color }} />
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl">{travel.emoji}</span>
          <span className="text-xs text-[#B8B4B0] dark:text-[#94A3B8] tracking-wider font-medium">
            {travel.date}
          </span>
        </div>
        <h3 className="text-[1.3rem] font-bold text-[#313131] dark:text-[#E2E8F0] mb-2 tracking-wide group-hover:text-[#DA583F] group-hover:dark:text-[#60A5FA] transition-colors">
          {travel.title}
        </h3>
        <p className="text-sm text-[#6E6A7C] dark:text-[#94A3B8] mb-4 leading-relaxed">
          {travel.subtitle}
        </p>
        <div className="flex flex-wrap gap-2">
          {travel.tags.map(tag => (
            <span key={tag} className="text-[11px] font-medium px-3 py-1 rounded-full border"
              style={{ color: travel.color, borderColor: `${travel.color}30`, background: `${travel.color}08` }}>
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[#767693] dark:text-[#94A3B8] group-hover:text-[#DA583F] group-hover:dark:text-[#60A5FA] transition-colors">
          <span>查看行程攻略</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ========== TravelDetail ========== */
function TravelDetail({ travel, onBack }: { travel: Travel; onBack: () => void }) {
  const navigate = useNavigate();
  const { isAdmin } = useAdminAuth();
  const [data, setData] = useState<TravelGuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [journalStatuses, setJournalStatuses] = useState<Map<number, { visibility: string }>>(new Map());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      // 优先 Supabase 实时数据
      if (travel.fromSupabase) {
        const remote = await getTravelById(travel.id);
        if (!cancelled && remote) {
          setData(remote);
          setLoading(false);
          return;
        }
      }
      // Fallback: 本地数据
      if (!cancelled && travel.dataId) {
        setData(localDataMap[travel.dataId] ?? null);
      }
      setLoading(false);
    }

    // 加载游记状态
    async function loadJournalStatuses() {
      const statuses = await getJournalStatuses(travel.id);
      if (!cancelled && statuses.length > 0) {
        const map = new Map<number, { visibility: string }>();
        for (const s of statuses) {
          map.set(s.day_number, { visibility: s.visibility });
        }
        setJournalStatuses(map);
      }
    }

    load();
    loadJournalStatuses();
    return () => { cancelled = true; };
  }, [travel.id, travel.fromSupabase, travel.dataId]);

  return (
    <div className="h-screen flex flex-col bg-[#FEFAF9] dark:bg-[#0A0E1A]">
      <Navigation />
      <div className="flex-shrink-0 px-4 sm:px-8 pt-3 pb-2 border-b border-[#ECD8D9] dark:border-[#334155]">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors cursor-pointer flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">返回</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-[#313131] dark:text-[#E2E8F0] truncate">
              {travel.emoji} {travel.title}
            </h1>
          </div>
          {/* 管理员编辑入口 */}
          {isAdmin && (
            <button
              onClick={() => navigate(`/admin/travels/${travel.id}`)}
              className="flex-shrink-0 px-2.5 py-1 text-[11px] font-medium text-[#DA583F] bg-[#FEF3F0] dark:bg-[#1E293B] border border-[#DA583F]/20 rounded-md hover:bg-[#DA583F] hover:text-white transition-all"
            >
              ✏️ 编辑
            </button>
          )}
        </div>
      </div>

      {/* Content area */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#DA583F]/20 border-t-[#DA583F] rounded-full animate-spin" />
            <span className="text-xs text-[#B8B4B0]">加载攻略…</span>
          </div>
        </div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto">
          <TravelGuideRenderer data={data} journalStatuses={journalStatuses} guideSlug={travel.id} />
        </div>
      ) : travel.file ? (
        <iframe src={travel.file} title={travel.title} className="flex-1 w-full border-none" />
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#B8B4B0]">
          内容加载中...
        </div>
      )}
    </div>
  );
}

/* ========== TravelsPage ========== */
export default function TravelsPage() {
  const { isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [activeTravel, setActiveTravel] = useState<Travel | null>(null);
  const [travels, setTravels] = useState<Travel[]>(LOCAL_TRAVELS);

  // 从 Supabase 拉取列表，与本地数据去重合并
  useEffect(() => {
    getTravelList()
      .then(list => {
        if (list.length === 0) return;
        const remote = list.map(supabaseToTravel);
        // 合并：Supabase 优先，本地不在 remote 中的保留
        const remoteIds = new Set(remote.map(r => r.id));
        const merged = [
          ...remote,
          ...LOCAL_TRAVELS.filter(t => !remoteIds.has(t.id)),
        ];
        setTravels(merged);
      })
      .catch(() => {
        // Supabase 不可用时使用本地数据
      });
  }, []);

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

      <main className="min-h-screen bg-[#FEFAF9] dark:bg-[#0A0E1A]">
        <div className="max-w-[820px] mx-auto px-4 sm:px-8 pt-16 pb-20">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase">
                Travel Records
              </div>
              {isAdmin && (
                <button
                  onClick={() => navigate(`/admin/travels/${travels[0]?.id || 'northwest-2026'}`)}
                  className="text-[11px] font-medium text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] transition-colors flex items-center gap-1"
                >
                  ⚙ 管理
                </button>
              )}
            </div>
            <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#313131] dark:text-[#E2E8F0] mb-3 tracking-wider leading-tight">
              旅行记录
            </h1>
            <p className="text-[1.05rem] text-[#6E6A7C] dark:text-[#94A3B8] max-w-[500px]">
              脚步不停，记录每一段旅途——行程攻略、避坑指南、沿途见闻。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {travels.map(t => (
              <TravelCard
                key={t.id}
                travel={t}
                onClick={() => { setActiveTravel(t); window.scrollTo({ top: 0 }); }}
              />
            ))}
          </div>

          {travels.length === 0 && (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">🎒</div>
              <p className="text-[#B8B4B0] dark:text-[#94A3B8]">还没有旅行记录，未来可期。</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
