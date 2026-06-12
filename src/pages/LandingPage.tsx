import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Article, CategoryKey } from '../types/article';
import { getPublishedArticles } from '../storage/articleStore';
import { downloadBackup, importArticles, parseBackupFile, hasExportedToday, markExportedToday } from '../utils/export';
import { syncToGist, restoreFromGist } from '../utils/gistSync';
import { CATEGORIES, formatDate, getExcerpt, getCategoryInfo } from '../utils/helpers';
import { useAdminAuth } from '../hooks/useAdminAuth';
import Navigation from '../components/Navigation';
import AdminLogin from '../components/AdminLogin';

/* ==============================
   子组件：滚动渐显包装
   ============================== */
function RevealOnScroll({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }
      },
      { threshold: 0.15 }
    );
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}

/* ==============================
   子组件：兴趣卡片 + 搜索 + 文章展开
   ============================== */
function InterestSection() {
  const { isAdmin } = useAdminAuth();
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshArticles = useCallback(() => {
    setArticles(getPublishedArticles());
  }, []);

  useEffect(() => {
    refreshArticles();
    const handler = () => refreshArticles();
    window.addEventListener('articles-changed', handler);
    return () => window.removeEventListener('articles-changed', handler);
  }, [refreshArticles]);

  // 搜索过滤 + 分类分组
  const searchLower = searchQuery.toLowerCase();
  const filteredArticles = searchLower
    ? articles.filter(a => a.title.toLowerCase().includes(searchLower) || a.content.toLowerCase().includes(searchLower))
    : articles;

  const articlesByCategory: Record<CategoryKey, Article[]> = {} as any;
  for (const c of CATEGORIES) {
    articlesByCategory[c.key] = filteredArticles
      .filter(a => a.category === c.key)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  const toggleCategory = (key: CategoryKey) => {
    setActiveCategory(prev => (prev === key ? null : key));
  };

  // 管理员：同步/导出/导入
  const handleSync = useCallback(async () => {
    setIsSyncing(true); setSyncMessage(null);
    try {
      const result = await syncToGist();
      setSyncMessage({ type: 'success', text: result });
    } catch (e: any) {
      setSyncMessage({ type: 'error', text: e.message || '同步失败' });
    } finally { setIsSyncing(false); }
  }, []);

  const handleRestore = useCallback(async () => {
    if (!confirm('将从云端恢复文章，本地新增的文章会被合并，确定继续？')) return;
    setIsSyncing(true); setSyncMessage(null);
    try {
      const result = await restoreFromGist();
      setSyncMessage({ type: 'success', text: result });
      refreshArticles();
    } catch (e: any) {
      setSyncMessage({ type: 'error', text: e.message || '恢复失败' });
    } finally { setIsSyncing(false); }
  }, [refreshArticles]);

  const [importDialog, setImportDialog] = useState<{ open: boolean; items: Article[] }>({ open: false, items: [] });

  const handleImport = useCallback(async () => {
    const result = await parseBackupFile();
    if (result.error) { alert(result.error); return; }
    if (result.articles.length === 0) return;
    setImportDialog({ open: true, items: result.articles });
  }, []);

  const handleImportConfirm = useCallback(() => {
    importArticles(importDialog.items);
    setImportDialog({ open: false, items: [] });
    refreshArticles();
  }, [importDialog.items, refreshArticles]);

  const clearSyncMsg = () => setSyncMessage(null);

  return (
    <section className="relative py-32 px-4 sm:px-8 bg-[#FEF3F0] dark:bg-[#1A1516]" id="interests">
      {/* 装饰图 */}
      <div
        className="absolute top-[5%] -left-[8%] w-[280px] h-[280px] rounded-full pointer-events-none opacity-25 dark:opacity-12 z-0"
        style={{
          background: "url('/images/card-deco-1.webp') no-repeat center/cover",
          maskImage: 'radial-gradient(circle at center, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 100%)',
        }}
      />
      <div className="max-w-[1100px] mx-auto relative z-[1]">
        <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] uppercase mb-2">Interests</div>
        <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#313131] dark:text-[#E8E4E1] mb-4 tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif]">志趣所在</h2>
        <p className="text-[1.05rem] text-[#6E6A7C] dark:text-[#A09CA8] max-w-[560px] mb-8">
          医学是主干，但枝叶蔓延至多个领域——它们共同构成了玄牙的精神世界。
        </p>

        {/* 搜索框 + 管理员操作 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10">
          <div className="relative flex-1 max-w-[420px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#B8B4B0]">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索文章标题或内容…"
              className="w-full pl-9 pr-9 py-2.5 text-sm border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg bg-white dark:bg-[#1C1818] text-[#313131] dark:text-[#E8E4E1] focus:border-[#DA583F] outline-none transition-all placeholder-[#B8B4B0]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B4B0] hover:text-[#DA583F] text-sm">✕</button>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <Link to="/write" className="px-4 py-2 text-sm font-medium text-white bg-[#DA583F] rounded-lg hover:bg-[#C43F30] transition-all whitespace-nowrap">
                + 写文章
              </Link>
              <button onClick={() => { downloadBackup(); markExportedToday(); }} className="px-3 py-2 text-sm font-medium text-[#4F4F4F] dark:text-[#B8B4B0] bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg hover:bg-[#FEF3F0] dark:hover:bg-[#1A1516] hover:border-[#DA583F] transition-all whitespace-nowrap">
                ↓ 导出{!hasExportedToday() && <span className="ml-1 text-[10px] text-[#DA583F]">·未备份</span>}
              </button>
              <button onClick={handleImport} className="px-3 py-2 text-sm font-medium text-[#4F4F4F] dark:text-[#B8B4B0] bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg hover:bg-[#FEF3F0] dark:hover:bg-[#1A1516] hover:border-[#DA583F] transition-all whitespace-nowrap">
                ↑ 导入
              </button>
              <button onClick={handleSync} disabled={isSyncing} className="px-3 py-2 text-sm font-medium text-[#4F4F4F] dark:text-[#B8B4B0] bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg hover:bg-[#FEF3F0] dark:hover:bg-[#1A1516] hover:border-[#DA583F] transition-all disabled:opacity-40 whitespace-nowrap">
                {isSyncing ? '同步中…' : '☁ 同步'}
              </button>
              <button onClick={handleRestore} disabled={isSyncing} className="px-3 py-2 text-sm font-medium text-[#4F4F4F] dark:text-[#B8B4B0] bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg hover:bg-[#FEF3F0] dark:hover:bg-[#1A1516] hover:border-[#DA583F] transition-all disabled:opacity-40 whitespace-nowrap">
                ↳ 恢复
              </button>
            </div>
          )}
        </div>

        {/* 同步提示 */}
        {syncMessage && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${syncMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
            {syncMessage.text}
            <button onClick={clearSyncMsg} className="ml-3 text-xs underline">关闭</button>
          </div>
        )}

        {/* 搜索匹配数 */}
        {searchQuery && (
          <p className="mb-5 text-xs text-[#767693] dark:text-[#8A8688]">找到 {filteredArticles.length} 篇匹配文章</p>
        )}

        {/* 卡片网格 */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6 mb-8">
          {CATEGORIES.map((cat, i) => {
            const count = articlesByCategory[cat.key].length;
            const isActive = activeCategory === cat.key;
            const bgColors = [
              'rgba(218,88,63,0.1)', 'rgba(97,111,211,0.1)', 'rgba(199,29,38,0.08)',
              'rgba(110,106,124,0.1)', 'rgba(218,88,63,0.06)', 'rgba(46,73,100,0.08)',
            ];
            return (
              <RevealOnScroll key={cat.key}>
                <button
                  onClick={() => toggleCategory(cat.key)}
                  className={`w-full text-left bg-white dark:bg-[#1C1818] rounded-xl p-8 border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'border-[#DA583F] shadow-[0_12px_40px_rgba(218,88,63,0.12)] -translate-y-1'
                      : 'border-transparent hover:border-[#DA583F] hover:shadow-[0_12px_40px_rgba(218,88,63,0.08)] hover:-translate-y-1'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-[1.4rem] mb-4"
                    style={{ background: bgColors[i % bgColors.length] }}
                  >
                    {cat.icon}
                  </div>
                  <h3 className="text-base font-bold text-[#313131] dark:text-[#E8E4E1] mb-1.5 flex items-center gap-2">
                    {cat.label}
                    {count > 0 && (
                      <span className="text-[11px] font-medium bg-[#FEF3F0] dark:bg-[#1A1516] text-[#DA583F] rounded-full px-2 py-0.5">
                        {count}篇
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-[#767693] dark:text-[#8A8688] leading-relaxed">{cat.desc}</p>
                </button>
              </RevealOnScroll>
            );
          })}
        </div>

        {/* 展开的文章列表 */}
        {activeCategory && (
          <div className="mt-6 animate-[fadeIn_0.25s_ease-out]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-[#4F4F4F] dark:text-[#B8B4B0]">
                {getCategoryInfo(activeCategory).icon} {getCategoryInfo(activeCategory).label}
                {articlesByCategory[activeCategory].length > 0 && (
                  <span className="ml-2 text-xs text-[#B8B4B0]">· {articlesByCategory[activeCategory].length} 篇</span>
                )}
              </h4>
            </div>

            {articlesByCategory[activeCategory].length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {articlesByCategory[activeCategory].map(a => (
                  <Link
                    key={a.id}
                    to={`/article/${a.id}`}
                    className="block bg-white dark:bg-[#1C1818] rounded-lg p-5 border border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F] transition-all duration-300 hover:-translate-y-0.5 group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{a.emoji}</span>
                      <span className="text-sm font-medium text-[#313131] dark:text-[#E8E4E1] group-hover:text-[#DA583F] transition-colors line-clamp-1">
                        {a.title}
                      </span>
                    </div>
                    <p className="text-xs text-[#767693] dark:text-[#8A8688] line-clamp-2 ml-7 mb-2">
                      {getExcerpt(a.content, 80)}
                    </p>
                    <p className="text-[11px] text-[#B8B4B0] ml-7">
                      {formatDate(a.createdAt)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8A8688] dark:text-[#8A8688] py-6 text-center">
                {searchQuery ? '该版块无匹配文章' : '该领域暂无文章，'}
                {isAdmin ? (
                  <Link to="/write" className="text-[#DA583F] hover:underline">写一篇</Link>
                ) : (
                  <span>敬请期待</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* 搜索但未选分类时：按分类展示搜索结果 */}
        {searchQuery && !activeCategory && filteredArticles.length > 0 && (
          <div className="mt-8 space-y-10">
            {CATEGORIES.filter(c => articlesByCategory[c.key].length > 0).map(cat => (
              <div key={cat.key}>
                <h4 className="text-sm font-semibold text-[#4F4F4F] dark:text-[#B8B4B0] mb-3">
                  {cat.icon} {cat.label} · {articlesByCategory[cat.key].length} 篇
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {articlesByCategory[cat.key].map(a => (
                    <Link
                      key={a.id}
                      to={`/article/${a.id}`}
                      className="block bg-white dark:bg-[#1C1818] rounded-lg p-5 border border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F] transition-all duration-300 hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">{a.emoji}</span>
                        <span className="text-sm font-medium text-[#313131] dark:text-[#E8E4E1] group-hover:text-[#DA583F] transition-colors line-clamp-1">
                          {a.title}
                        </span>
                      </div>
                      <p className="text-xs text-[#767693] dark:text-[#8A8688] line-clamp-2 ml-7 mb-2">
                        {getExcerpt(a.content, 80)}
                      </p>
                      <p className="text-[11px] text-[#B8B4B0] ml-7">
                        {formatDate(a.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 搜索结果为空 */}
        {searchQuery && !activeCategory && filteredArticles.length === 0 && (
          <p className="text-sm text-[#8A8688] dark:text-[#8A8688] py-8 text-center">未找到匹配文章</p>
        )}
      </div>

      {/* 导入确认弹窗 */}
      {importDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" onClick={() => setImportDialog({ open: false, items: [] })} />
          <div className="relative bg-white dark:bg-[#1C1818] rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-lg font-semibold text-[#313131] dark:text-[#E8E4E1] mb-2">确认导入</h3>
            <p className="text-sm text-[#767693] dark:text-[#8A8688] mb-4">即将导入 {importDialog.items.length} 篇文章：</p>
            <ul className="text-sm text-[#4F4F4F] dark:text-[#B8B4B0] mb-6 max-h-40 overflow-y-auto">
              {importDialog.items.map(a => <li key={a.id} className="py-1">· {a.title} <span className="text-xs text-[#B8B4B0]">[{a.status === 'published' ? '已发布' : '草稿'}]</span></li>)}
            </ul>
            <div className="flex gap-3">
              <button onClick={() => setImportDialog({ open: false, items: [] })} className="flex-1 px-4 py-2.5 text-sm font-medium text-[#767693] bg-[#FEF3F0] dark:bg-[#1A1516] rounded-lg hover:bg-[#ECD8D9] dark:hover:bg-[#2A2020] transition-all">取消</button>
              <button onClick={handleImportConfirm} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#DA583F] rounded-lg hover:bg-[#C43F30] transition-all">确认导入</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ==============================
   主组件：LandingPage
   ============================== */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0F0D0E] text-[#313131] dark:text-[#E8E4E1] font-['PingFang_SC','Microsoft_YaHei','Noto_Sans_SC',sans-serif] transition-colors duration-300">
      <Navigation />

      {/* ===== Hero ===== */}
      <section
        className="min-h-screen flex items-center justify-center relative overflow-hidden px-8 py-32"
        id="home"
      >
        {/* 背景装饰 */}
        <div
          className="absolute top-[10%] -right-[8%] w-[520px] h-[400px] rounded-xl pointer-events-none opacity-35 dark:opacity-25 max-sm:w-[260px] max-sm:h-[200px] max-sm:top-[5%] max-sm:-right-[15%] max-sm:opacity-25"
          style={{
            background: "url('/images/hero-bg.webp') no-repeat center/cover",
            maskImage: 'radial-gradient(circle at center, black 50%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 100%)',
          }}
        />
        <div className="absolute -bottom-[30%] -left-[10%] w-[500px] h-[500px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(97,111,211,0.06)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(97,111,211,0.1)_0%,transparent_70%)]" />

        <div className="text-center relative z-10 max-w-[720px]">
          <div className="inline-block px-5 py-1.5 bg-[#FEF3F0] dark:bg-[#1A1516] text-[#C43F30] rounded-full text-[0.85rem] font-semibold tracking-wider mb-8">
            ◆ 玄牙个人世界
          </div>
          <h1 className="text-[clamp(3rem,8vw,6rem)] font-black text-[#313131] dark:text-[#E8E4E1] leading-tight mb-4 tracking-wider font-['PingFang_SC','Noto_Serif_SC',serif] max-sm:text-[2.5rem]">
            玄<span className="text-[#DA583F]">牙</span>
          </h1>
          <p className="text-[1.15rem] text-[#6E6A7C] dark:text-[#A09CA8] leading-relaxed mb-16 max-w-[480px] mx-auto">
            知无不言，正直之极。<br />
            以理性观照心灵，以热忱探索未知。
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="#about"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-[0.95rem] font-bold tracking-wider bg-[#DA583F] !text-white shadow-[0_4px_20px_rgba(218,88,63,0.25)] hover:bg-[#C43F30] hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(218,88,63,0.35)] transition-all"
              style={{ color: '#ffffff' }}
            >
              了解更多
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[0.95rem] font-semibold tracking-wider bg-transparent text-[#313131] dark:text-[#E8E4E1] border-[1.5px] border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F] hover:text-[#DA583F] hover:-translate-y-0.5 transition-all"
            >
              取得联系
            </a>
          </div>
        </div>

        {/* 滚动提示 */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#767693] dark:text-[#8A8688] text-xs tracking-[0.08em] animate-[float_2s_ease-in-out_infinite]">
          慢慢往下看
          <div className="w-px h-8 bg-[#ECD8D9] dark:bg-[#2A2020]" />
        </div>
      </section>

      {/* ===== About ===== */}
      <section className="relative py-32 px-4 sm:px-8 overflow-hidden" id="about">
        {/* 装饰 */}
        <div
          className="absolute -bottom-[5%] -right-[12%] w-[380px] h-[280px] rounded-xl pointer-events-none opacity-30 dark:opacity-18 z-0 max-sm:w-[200px] max-sm:h-[160px] max-sm:-right-[15%]"
          style={{
            background: "url('/images/about-bg.webp') no-repeat center/cover",
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
          }}
        />
        <div className="max-w-[1100px] mx-auto relative z-10">
          <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] uppercase mb-2">About</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#313131] dark:text-[#E8E4E1] mb-4 tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif]">关于玄牙</h2>
          <p className="text-[1.05rem] text-[#6E6A7C] dark:text-[#A09CA8] max-w-[560px] mb-12">
            字博謇，取《楚辞》「汝何博謇而好修兮，纷独有此姱节」——知无不言，此心光明。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* 左侧：头像 + 简介 */}
            <RevealOnScroll>
              <div className="flex flex-col items-center md:items-start">
                <div className="flex flex-col items-center gap-2 mb-8">
                  <img
                    src="/images/avatar.png"
                    alt="玄牙"
                    className="w-[120px] h-[120px] rounded-full object-cover border-[3px] border-white dark:border-[#1C1818] shadow-[0_4px_20px_rgba(218,88,63,0.15)]"
                    loading="lazy"
                  />
                  <span className="text-xs text-[#767693] dark:text-[#8A8688] tracking-wider">字博謇</span>
                </div>
                <p className="text-[0.98rem] text-[#4F4F4F] dark:text-[#B8B4B0] mb-4 leading-relaxed">
                  精神科医师，ENTP人格。一个对心灵世界永远好奇的探索者——在理性与直觉、科学与人文的边界游走。
                </p>
                <p className="text-[0.98rem] text-[#4F4F4F] dark:text-[#B8B4B0] leading-relaxed">
                  对积极心理、国学玄学同样深感兴趣，相信古老智慧与现代科学可以相互观照。
                </p>
              </div>
            </RevealOnScroll>

            {/* 右侧：数据卡片 */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: 'ENTP', label: 'MBTI 人格类型' },
                { num: 'SCI', label: '霍兰德职业类型' },
                { num: '精神科', label: '临床深耕领域' },
                { num: '科研', label: '学术探索方向', color: '#616FD3' },
              ].map(s => (
                <RevealOnScroll key={s.label}>
                  <div className="bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-xl p-8 text-center hover:border-[#DA583F] hover:shadow-[0_8px_30px_rgba(218,88,63,0.08)] transition-all">
                    <div
                      className="text-[2rem] font-extrabold font-['PingFang_SC','Noto_Serif_SC',serif]"
                      style={{ color: s.color || '#DA583F' }}
                    >
                      {s.num}
                    </div>
                    <div className="text-[0.85rem] text-[#767693] dark:text-[#8A8688] mt-1.5">{s.label}</div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 志趣 + 文章 ===== */}
      <InterestSection />

      {/* ===== 行迹 Timeline ===== */}
      <section className="py-32 px-4 sm:px-8" id="work">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] uppercase mb-2">Journey</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#313131] dark:text-[#E8E4E1] mb-4 tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif]">学医行迹</h2>
          <p className="text-[1.05rem] text-[#6E6A7C] dark:text-[#A09CA8] max-w-[560px] mb-12">
            从课堂到临床，从理论到实践——每一步都在靠近那个想成为的精神科医师。
          </p>

          <div className="relative pl-16 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#ECD8D9] dark:before:bg-[#2A2020]">
            {[
              { year: '此刻', title: '精神科临床一线', desc: '完成住院医师规范化培训，正式开启精神科医师执业之路。', dotColor: '#DA583F' },
              { year: '硕士阶段', title: '医学硕士 · 精神卫生方向', desc: '系统深入精神医学研究，建立临床与科研双线并行的思维框架。', dotColor: '#616FD3' },
              { year: '本科', title: '临床医学', desc: '医学之路的起点，从解剖到病理，从理论到临床的初次跨越。', dotColor: '#767693' },
            ].map(item => (
              <RevealOnScroll key={item.title}>
                <div className="relative mb-16 last:mb-0">
                  <div
                    className="absolute left-[-57px] top-1 w-[14px] h-[14px] rounded-full border-[3px] border-[#FEF3F0] dark:border-[#1A1516]"
                    style={{ background: item.dotColor }}
                  />
                  <div className="text-xs font-bold text-[#DA583F] tracking-[0.08em] mb-1">{item.year}</div>
                  <div className="text-[1.1rem] font-bold text-[#313131] dark:text-[#E8E4E1] mb-1">{item.title}</div>
                  <div className="text-sm text-[#767693] dark:text-[#8A8688]">{item.desc}</div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Contact ===== */}
      <section className="py-32 px-4 sm:px-8 bg-[#FEF3F0] dark:bg-[#1A1516]" id="contact">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] uppercase mb-2">Contact</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#313131] dark:text-[#E8E4E1] mb-4 tracking-wider leading-tight text-center font-['PingFang_SC','Noto_Serif_SC',serif]">取得联系</h2>
          <RevealOnScroll>
            <div className="bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-3xl p-16 text-center max-w-[600px] mx-auto hover:border-[#DA583F] hover:shadow-[0_16px_50px_rgba(218,88,63,0.06)] transition-all">
              <p className="text-[1.05rem] text-[#4F4F4F] dark:text-[#B8B4B0] mb-8">
                来玄牙的世界坐坐，聊聊你最近在想的事。
              </p>
              <div className="flex gap-8 justify-center flex-wrap">
                <a
                  href="https://www.x2ya.com"
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#FEFAF9] dark:bg-[#0F0D0E] text-[#313131] dark:text-[#E8E4E1] font-medium text-[0.92rem] hover:bg-[#FEF3F0] hover:text-[#DA583F] transition-all"
                >
                  🌐 x2ya.com
                </a>
                <a
                  href="mailto:zhuxinyuan@x2ya.com"
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#FEFAF9] dark:bg-[#0F0D0E] text-[#313131] dark:text-[#E8E4E1] font-medium text-[0.92rem] hover:bg-[#FEF3F0] hover:text-[#DA583F] transition-all"
                >
                  ✉ zhuxinyuan@x2ya.com
                </a>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="text-center py-16 px-8 text-[0.85rem] text-[#767693] dark:text-[#8A8688] border-t border-[#ECD8D9] dark:border-[#2A2020]">
        <p>
          <span className="text-[#DA583F] font-semibold">玄牙</span> — 玄牙个人世界
        </p>
        <div className="max-w-[640px] mx-auto mt-8 pt-4 border-t border-dashed border-[#ECD8D9] dark:border-[#2A2020] text-left text-xs leading-relaxed">
          <h4 className="text-[0.8rem] text-[#313131] dark:text-[#E8E4E1] font-semibold mb-1">免责声明</h4>
          <p className="text-[#767693] dark:text-[#8A8688] mb-1.5">
            本站内容仅供信息参考与个人观点表达，不构成任何形式的医疗建议、诊断或治疗意见。如有心理健康困扰，请务必前往正规医疗机构就诊，切勿将本站内容替代专业诊疗。
          </p>
          <h4 className="text-[0.8rem] text-[#313131] dark:text-[#E8E4E1] font-semibold mt-2 mb-1">版权声明</h4>
          <p className="text-[#767693] dark:text-[#8A8688]">
            本站所有原创内容（文字、设计、图片等）版权归本站所有者所有。未经书面许可，禁止任何形式的转载或商业使用。
          </p>
        </div>
        <div className="mt-6 flex gap-8 justify-center flex-wrap">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.82rem] text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F] transition-colors"
          >
            沪ICP备2023014300号-1
          </a>
        </div>
      </footer>

      {/* 管理员登录（全局齿轮入口） */}
      <AdminLogin />
    </div>
  );
}
