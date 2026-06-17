/**
 * TravelJournalPage — 游记独立页面
 * 路由：/travels/:slug/journal/:day
 * 支持 ?edit 参数进入编辑模式（仅管理员）
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navigation from '../components/Navigation';
import JournalView from '../components/travel/JournalView';
import JournalEditor from '../components/travel/JournalEditor';
import { getJournal, generateJournalTemplate } from '../lib/journals';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { northwest2026 } from '../data/northwest2026';
import type { TravelJournal } from '../data/travelTypes';

// 只支持 northwest-2026（后续可扩展多攻略）
const GUIDE_DATA = northwest2026;

export default function TravelJournalPage() {
  const { slug, day: dayStr } = useParams<{ slug: string; day: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAdmin } = useAdminAuth();

  const dayNumber = parseInt(dayStr || '1', 10);
  const isEditing = searchParams.get('edit') === '1' && isAdmin;

  const [journal, setJournal] = useState<TravelJournal | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');

  // 找到对应 Day 数据生成模板
  const dayData = GUIDE_DATA.days.find(d => parseInt(d.num, 10) === dayNumber);
  const template = dayData
    ? generateJournalTemplate(slug || 'northwest-2026', dayData)
    : null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      const data = await getJournal(slug || '', dayNumber);

      if (cancelled) return;

      if (data) {
        setJournal(data);
      } else if (!template) {
        setError('找不到对应的攻略天数');
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [slug, dayNumber, template]);

  // 路由校验
  if (!dayData || isNaN(dayNumber) || dayNumber < 1 || dayNumber > 14) {
    return (
      <>
        <Helmet><title>游记不存在 · 玄牙</title></Helmet>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center bg-[#FEFAF9]">
          <div className="text-center">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-[#6E6A7C] mb-4">这片游记还不存在</p>
            <button
              onClick={() => navigate(`/travels`)}
              className="text-[#DA583F] text-sm underline"
            >
              返回攻略页
            </button>
          </div>
        </div>
      </>
    );
  }

  // 编辑模式
  if (isEditing && template) {
    return (
      <>
        <Helmet>
          <title>{journal ? '编辑游记' : '写游记'} · Day {dayNumber} · 玄牙</title>
        </Helmet>
        <JournalEditor
          journal={journal}
          template={template}
          onClose={() => navigate(`/travels/${slug}/journal/${dayNumber}`)}
          onSaved={(saved) => {
            setJournal(saved);
            navigate(`/travels/${slug}/journal/${dayNumber}`);
          }}
        />
      </>
    );
  }

  // 加载中
  if (loading) {
    return (
      <>
        <Helmet><title>加载中… · 玄牙</title></Helmet>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center bg-[#FEFAF9]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#DA583F]/20 border-t-[#DA583F] rounded-full animate-spin" />
            <span className="text-xs text-[#B8B4B0]">加载游记…</span>
          </div>
        </div>
      </>
    );
  }

  // 无游记但可写
  if (!journal && template) {
    return (
      <>
        <Helmet>
          <title>Day {dayNumber} 游记 · 玄牙</title>
        </Helmet>
        <Navigation />
        <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0A0E1A]">
          <div className="max-w-[780px] mx-auto px-4 sm:px-8 pt-16 pb-20">
            <div className="text-center py-20">
              <p className="text-4xl mb-4">📝</p>
              <h1 className="text-xl font-bold text-[#313131] dark:text-[#E2E8F0] mb-2">
                Day {dayNumber} · {template.day_title}
              </h1>
              <p className="text-[#6E6A7C] mb-6">还没有记录这一天的游记</p>
              {isAdmin && (
                <button
                  onClick={() => navigate(`?edit=1`)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#DA583F] text-white rounded-lg text-sm font-medium hover:bg-[#C44A33] transition-colors"
                >
                  📝 记录这一天
                </button>
              )}
              <div className="mt-6">
                <button
                  onClick={() => navigate(`/travels`)}
                  className="text-sm text-[#767693] underline"
                >
                  ← 返回攻略
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 有游记 — 展示
  return (
    <>
      <Helmet>
        <title>Day {dayNumber} 游记 · {template?.day_title} · 玄牙</title>
        <meta name="description" content={journal?.content?.slice(0, 150) || `${template?.day_title} 的旅行记录`} />
        {journal?.photos?.[0] && <meta property="og:image" content={journal.photos[0].url} />}
      </Helmet>
      <Navigation />
      <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0A0E1A]">
        <div className="max-w-[780px] mx-auto px-4 sm:px-8 pt-8 pb-20">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(`/travels`)}
              className="flex items-center gap-1.5 text-sm text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              返回攻略
            </button>
            <div className="flex items-center gap-2">
              {journal?.visibility === 'private' && (
                <span className="text-[11px] px-2 py-0.5 bg-[#FFF3CD] text-[#856404] rounded-full font-medium">
                  🔒 私密
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={() => navigate(`?edit=1`)}
                  className="text-[11px] font-medium text-[#767693] hover:text-[#DA583F] transition-colors"
                >
                  ✏️ 编辑
                </button>
              )}
            </div>
          </div>

          {/* Journal content */}
          <JournalView
            journal={journal!}
            dayTitle={`Day ${dayNumber} · ${template?.day_title || ''}`}
          />
        </div>
      </div>
    </>
  );
}
