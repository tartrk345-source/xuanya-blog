import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import type { Article, CategoryKey } from '../types/article';
import { getPublishedArticles } from '../storage/articleStore';
import { getCategories, addCategory, updateCategory, deleteCategory, onCategoriesChange, type CategoryItem } from '../storage/categoryStore';
import { downloadBackup, importArticles, parseBackupFile, hasExportedToday, markExportedToday } from '../utils/export';
import { syncToGist, restoreFromGist } from '../utils/gistSync';
import { formatDate, getExcerpt } from '../utils/helpers';
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
   BlogPage：独立的博客/志趣页面
   ============================== */
export default function BlogPage() {
  const { isAdmin } = useAdminAuth();
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(() => getCategories());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshArticles = useCallback(() => {
    setArticles(getPublishedArticles());
  }, []);

  useEffect(() => {
    refreshArticles();
    const h1 = () => refreshArticles();
    window.addEventListener('articles-changed', h1);
    const h2 = onCategoriesChange(() => setCategories(getCategories()));
    return () => {
      window.removeEventListener('articles-changed', h1);
      h2();
    };
  }, [refreshArticles]);

  // 搜索过滤 + 分类分组
  const searchLower = searchQuery.toLowerCase();
  const filteredArticles = searchLower
    ? articles.filter(a => a.title.toLowerCase().includes(searchLower) || a.content.toLowerCase().includes(searchLower))
    : articles;

  const articlesByCategory: Record<string, Article[]> = {};
  for (const c of categories) {
    articlesByCategory[c.key] = filteredArticles
      .filter(a => (a.category || 'misc') === c.key)
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

  // 分类管理
  const [catDialog, setCatDialog] = useState<{ open: boolean; key?: string; label: string; icon: string; desc: string }>({ open: false, label: '', icon: '📌', desc: '' });
  const [catDeleteKey, setCatDeleteKey] = useState<string | null>(null);

  const openAddCat = () => setCatDialog({ open: true, label: '', icon: '📌', desc: '' });
  const openEditCat = (c: CategoryItem) => setCatDialog({ open: true, key: c.key, label: c.label, icon: c.icon, desc: c.desc });
  const closeCatDialog = () => setCatDialog({ open: false, label: '', icon: '📌', desc: '' });

  const handleSaveCat = () => {
    if (!catDialog.label.trim()) return;
    const key = catDialog.key || catDialog.label.trim().toLowerCase().replace(/\s+/g, '-');
    if (catDialog.key) {
      updateCategory(catDialog.key, { label: catDialog.label.trim(), icon: catDialog.icon, desc: catDialog.desc });
    } else {
      addCategory({ key, label: catDialog.label.trim(), icon: catDialog.icon, desc: catDialog.desc });
    }
    closeCatDialog();
  };

  const handleDeleteCat = (key: string) => {
    deleteCategory(key);
    setCatDeleteKey(null);
  };

  const bgColors = [
    'rgba(218,88,63,0.1)', 'rgba(97,111,211,0.1)', 'rgba(199,29,38,0.08)',
    'rgba(110,106,124,0.1)', 'rgba(218,88,63,0.06)', 'rgba(46,73,100,0.08)',
  ];

  return (
    <div className="min-h-screen bg-[#FEF3F0] dark:bg-[#1A1516] text-[#313131] dark:text-[#E8E4E1] font-['PingFang_SC','Microsoft_YaHei','Noto_Sans_SC',sans-serif] transition-colors duration-300">
      <Helmet>
        <title>志趣所在 — 玄牙个人世界</title>
        <meta name="description" content="玄牙的志趣所在——精神医学、积极心理治疗、国学玄学、芳香疗法、写作随笔等多领域探索。" />
        <meta property="og:title" content="志趣所在 — 玄牙个人世界" />
        <meta property="og:description" content="医学是主干，但枝叶蔓延至多个领域——它们共同构成了玄牙的精神世界。" />
        <meta property="og:url" content="https://www.x2ya.com/blog" />
        <meta property="og:image" content="https://www.x2ya.com/images/og-image.svg" />
        <meta name="twitter:title" content="志趣所在 — 玄牙个人世界" />
        <meta name="twitter:description" content="医学是主干，但枝叶蔓延至多个领域——它们共同构成了玄牙的精神世界。" />
        <meta name="twitter:image" content="https://www.x2ya.com/images/og-image.svg" />
        <link rel="canonical" href="https://www.x2ya.com/blog" />
      </Helmet>
      <Navigation />

      {/* 页面标题区 */}
      <div className="pt-16 pb-8 px-4 sm:px-8">
        <div className="max-w-[1100px] mx-auto">
          {/* 装饰图 */}
          <div
            className="absolute top-[5%] -left-[8%] w-[280px] h-[280px] rounded-full pointer-events-none opacity-25 dark:opacity-12 z-0"
            style={{
              background: "url('/images/card-deco-1.webp') no-repeat center/cover",
              maskImage: 'radial-gradient(circle at center, black 30%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 100%)',
            }}
          />
          <div className="relative z-[1] pt-12">
            <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] uppercase mb-2">Blog</div>
            <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#313131] dark:text-[#E8E4E1] mb-4 tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif]">志趣所在</h1>
            <p className="text-[1.05rem] text-[#6E6A7C] dark:text-[#A09CA8] max-w-[560px] mb-8">
              医学是主干，但枝叶蔓延至多个领域——它们共同构成了玄牙的精神世界。
            </p>

            {/* 搜索框 + 管理员操作 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10">
              <div className="relative flex-1 w-full sm:max-w-[420px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#B8B4B0]">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索文章标题或内容…"
                  className="w-full pl-9 pr-9 py-2.5 text-sm border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg bg-white dark:bg-[#1C1818] text-[#313131] dark:text-[#E8E4E1] focus:border-[#DA583F] outline-none transition-all placeholder-[#B8B4B0]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B4B0] hover:text-[#DA583F] text-sm cursor-pointer">✕</button>
                )}
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to="/write" className="px-4 py-2 text-sm font-bold text-white bg-[#DA583F] rounded-lg hover:bg-[#C43F30] transition-all whitespace-nowrap" style={{ color: '#ffffff' }}>
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
          </div>
        </div>
      </div>

      {/* 同步提示 */}
      {syncMessage && (
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8">
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${syncMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
            {syncMessage.text}
            <button onClick={clearSyncMsg} className="ml-3 text-xs underline">关闭</button>
          </div>
        </div>
      )}

      {/* 搜索匹配数 */}
      {searchQuery && (
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8">
          <p className="mb-5 text-xs text-[#767693] dark:text-[#8A8688]">找到 {filteredArticles.length} 篇匹配文章</p>
        </div>
      )}

      {/* 分类列表（纵向手风琴） */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pb-16">
        <div className="space-y-3">
          {categories.map((cat, i) => {
            const articles = articlesByCategory[cat.key] ?? [];
            const isActive = activeCategory === cat.key;
            return (
              <RevealOnScroll key={cat.key}>
                <div
                  className={`group/cat rounded-xl border transition-all duration-300 ${
                    isActive
                      ? 'bg-white dark:bg-[#1C1818] border-[#DA583F] shadow-[0_8px_30px_rgba(218,88,63,0.08)]'
                      : 'bg-white dark:bg-[#1C1818] border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F] hover:shadow-[0_4px_20px_rgba(218,88,63,0.06)]'
                  }`}
                >
                  {/* 分类头部（始终可见） */}
                  <button
                    onClick={() => toggleCategory(cat.key)}
                    className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-4 cursor-pointer"
                  >
                    {/* 图标 */}
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center text-[1.3rem] flex-shrink-0 transition-transform duration-300"
                      style={{ background: bgColors[i % bgColors.length] }}
                    >
                      {cat.icon}
                    </div>
                    {/* 文字 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#313131] dark:text-[#E8E4E1] flex items-center gap-2">
                        {cat.label}
                        {articles.length > 0 && (
                          <span className="text-[10px] font-medium bg-[#FEF3F0] dark:bg-[#1A1516] text-[#DA583F] rounded-full px-2 py-0.5">
                            {articles.length}篇
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-[#767693] dark:text-[#8A8688] mt-0.5 truncate">{cat.desc}</p>
                    </div>
                    {/* 展开箭头 */}
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'bg-[#DA583F] text-white rotate-180' : 'bg-[#FEF3F0] dark:bg-[#1A1516] text-[#B8B4B0] group-hover/cat:bg-[#DA583F] group-hover/cat:text-white'
                    }`}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    {/* 管理员：编辑/删除 */}
                    {isAdmin && (
                      <div className="flex gap-1 flex-shrink-0 ml-1 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditCat(cat); }}
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-[#FEFAF9] dark:bg-[#0F0D0E] border border-[#ECD8D9] dark:border-[#2A2020] text-xs text-[#767693] hover:text-[#DA583F] hover:border-[#DA583F] transition-all"
                          title="编辑版块"
                        >✎</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setCatDeleteKey(cat.key); }}
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-[#FEFAF9] dark:bg-[#0F0D0E] border border-[#ECD8D9] dark:border-[#2A2020] text-xs text-[#767693] hover:text-red-500 hover:border-red-300 transition-all"
                          title="删除版块"
                        >✕</button>
                      </div>
                    )}
                  </button>

                  {/* 展开的文章列表 */}
                  {isActive && (
                    <div className="px-5 sm:px-6 pb-5 animate-[fadeIn_0.25s_ease-out]">
                      {articles.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {articles.map(a => (
                            <Link
                              key={a.id}
                              to={`/article/${a.id}`}
                              className="block bg-[#FEFAF9] dark:bg-[#0F0D0E] rounded-lg p-4 border border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F] transition-all duration-300 hover:-translate-y-0.5 group"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">{a.emoji}</span>
                                <span className="text-sm font-medium text-[#313131] dark:text-[#E8E4E1] group-hover:text-[#DA583F] transition-colors line-clamp-1">
                                  {a.title}
                                </span>
                              </div>
                              <p className="text-xs text-[#767693] dark:text-[#8A8688] line-clamp-2 ml-6 mb-1.5">
                                {getExcerpt(a.content, 80)}
                              </p>
                              <p className="text-[10px] text-[#B8B4B0] ml-6">
                                {formatDate(a.createdAt)}
                              </p>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[#8A8688] py-4 text-center">
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
                </div>
              </RevealOnScroll>
            );
          })}

          {/* 管理员：新增版块 */}
          {isAdmin && (
            <button
              onClick={openAddCat}
              className="w-full flex items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F] hover:bg-[#FEF3F0]/50 dark:hover:bg-[#1A1516]/50 transition-all cursor-pointer text-[#B8B4B0] hover:text-[#DA583F]"
            >
              <span className="text-lg">+</span>
              <span className="text-sm">新增版块</span>
            </button>
          )}
        </div>

        {/* 搜索但未选分类时：全局搜索结果 */}
        {searchQuery && !activeCategory && filteredArticles.length > 0 && (
          <div className="mt-8 animate-[fadeIn_0.25s_ease-out]">
            <h4 className="text-sm font-semibold text-[#4F4F4F] dark:text-[#B8B4B0] mb-4">
              「{searchQuery}」的搜索结果 · {filteredArticles.length} 篇
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredArticles.map(a => (
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

      {/* 分类编辑/新增弹窗 */}
      {catDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" onClick={closeCatDialog} />
          <div className="relative bg-white dark:bg-[#1C1818] rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-lg font-semibold text-[#313131] dark:text-[#E8E4E1] mb-6">
              {catDialog.key ? '编辑版块' : '新增版块'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#767693] dark:text-[#8A8688] mb-1">图标 (Emoji)</label>
                <div className="grid grid-cols-8 gap-1.5 mb-2">
                  {['🧠','🔬','🌿','🌏','🌸','✨','📌','💡','🎯','📖','🎨','⚡','🫀','🔮','🎵','🏛️'].map(e => (
                    <button
                      key={e}
                      onClick={() => setCatDialog(prev => ({ ...prev, icon: e }))}
                      className={`w-8 h-8 flex items-center justify-center text-sm rounded-md border transition-all ${
                        catDialog.icon === e
                          ? 'border-[#DA583F] bg-[#FEF3F0] dark:bg-[#1A1516]'
                          : 'border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F]'
                      }`}
                    >{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#767693] dark:text-[#8A8688] mb-1">版块名称</label>
                <input
                  type="text"
                  value={catDialog.label}
                  onChange={e => setCatDialog(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="如：精神心理"
                  className="w-full px-4 py-2.5 text-sm border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg bg-white dark:bg-[#1C1818] text-[#313131] dark:text-[#E8E4E1] focus:border-[#DA583F] outline-none transition-all placeholder-[#B8B4B0]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#767693] dark:text-[#8A8688] mb-1">版块简介</label>
                <textarea
                  value={catDialog.desc}
                  onChange={e => setCatDialog(prev => ({ ...prev, desc: e.target.value }))}
                  placeholder="一两句话描述这个版块…"
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg bg-white dark:bg-[#1C1818] text-[#313131] dark:text-[#E8E4E1] focus:border-[#DA583F] outline-none transition-all placeholder-[#B8B4B0] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeCatDialog} className="flex-1 px-4 py-2.5 text-sm font-medium text-[#767693] bg-[#FEF3F0] dark:bg-[#1A1516] rounded-lg hover:bg-[#ECD8D9] dark:hover:bg-[#2A2020] transition-all">取消</button>
              <button onClick={handleSaveCat} disabled={!catDialog.label.trim()} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#DA583F] rounded-lg hover:bg-[#C43F30] transition-all disabled:opacity-40">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 分类删除确认 */}
      {catDeleteKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" onClick={() => setCatDeleteKey(null)} />
          <div className="relative bg-white dark:bg-[#1C1818] rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-lg font-semibold text-[#313131] dark:text-[#E8E4E1] mb-2">确认删除版块</h3>
            <p className="text-sm text-[#767693] dark:text-[#8A8688] mb-6">
              该版块下的文章不会丢失，将被移至「万象」分类。确定要删除吗？
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCatDeleteKey(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-[#767693] bg-[#FEF3F0] dark:bg-[#1A1516] rounded-lg hover:bg-[#ECD8D9] dark:hover:bg-[#2A2020] transition-all">取消</button>
              <button onClick={() => handleDeleteCat(catDeleteKey)} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all">删除</button>
            </div>
          </div>
        </div>
      )}

      <AdminLogin />
    </div>
  );
}
