import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types/article';
import { getAllArticles, importArticles } from '../storage/articleStore';
import { downloadBackup, parseBackupFile, hasExportedToday, markExportedToday } from '../utils/export';
import { syncToGist, restoreFromGist, getGistId } from '../utils/gistSync';
import ArticleCard from '../components/ArticleCard';
import AdminLogin from '../components/AdminLogin';
import Navigation from '../components/Navigation';
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function HomePage() {
  const { isAdmin } = useAdminAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'published' | 'draft'>('published');
  const [searchQuery, setSearchQuery] = useState('');
  const [importDialog, setImportDialog] = useState<{ open: boolean; articles: Article[] }>({ open: false, articles: [] });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [allArticles, setAllArticles] = useState<Article[]>([]);

  const refreshList = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    const onRefresh = () => setRefreshKey(prev => prev + 1);
    window.addEventListener('articles-changed', onRefresh);
    return () => window.removeEventListener('articles-changed', onRefresh);
  }, []);

  // 加载文章列表
  useEffect(() => {
    let mounted = true;
    getAllArticles().then((list: Article[]) => { if (mounted) setAllArticles(list); }).catch(() => {});
    return () => { mounted = false; };
  }, [refreshKey]);

  // 自动从 Gist 恢复
  useEffect(() => {
    const autoRestore = async () => {
      if (!getGistId()) return;
      try {
        const result = await restoreFromGist();
        console.log('[AutoSync]', result);
        refreshList();
      } catch {
        // 未配置 Gist 或无备份时静默失败
      }
    };
    autoRestore();
  }, [refreshList]);

  const searchLower = searchQuery.toLowerCase();
  const filterBySearch = (articles: Article[]) => {
    if (!searchLower) return articles;
    return articles.filter(
      (a: Article) => a.title.toLowerCase().includes(searchLower) || a.content.toLowerCase().includes(searchLower)
    );
  };

  // 文章列表由 useEffect 加载，存在 allArticles state 中
  const draftCount = allArticles.filter(a => a.status === 'draft').length;
  const publishedArticles = allArticles.filter(a => a.status === 'published');
  const displayedArticles = filterBySearch(
    viewMode === 'published' ? publishedArticles : allArticles.filter(a => a.status === 'draft')
  );

  const clearSyncMessage = () => setSyncMessage(null);

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
      refreshList();
    } catch (e: any) {
      setSyncMessage({ type: 'error', text: e.message || '恢复失败' });
    } finally { setIsSyncing(false); }
  }, [refreshList]);

  const handleImport = useCallback(async () => {
    const result = await parseBackupFile();
    if (result.error) { alert(result.error); return; }
    if (result.articles.length === 0) return;
    setImportDialog({ open: true, articles: result.articles });
  }, []);

  const handleImportConfirm = useCallback(() => {
    importArticles(importDialog.articles);
    setImportDialog({ open: false, articles: [] });
    refreshList();
  }, [importDialog.articles, refreshList]);

  return (
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0F0D0E] transition-colors duration-300">
      <Navigation />
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* 顶部：标题 + 操作 */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#313131] dark:text-[#E8E4E1] tracking-tight">志趣</h1>
            <p className="mt-1.5 text-sm text-[#767693] dark:text-[#8A8688]">记录思考，分享洞察</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => { downloadBackup(); markExportedToday(); }} className="px-4 py-2 text-sm font-medium text-[#4F4F4F] dark:text-[#B8B4B0] bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg hover:bg-[#FEF3F0] dark:hover:bg-[#1A1516] hover:border-[#DA583F] transition-all">
                ↓ 导出{!hasExportedToday() && <span className="ml-1 text-[10px] text-[#DA583F]">（今日未备份）</span>}
              </button>
              <button onClick={handleImport} className="px-4 py-2 text-sm font-medium text-[#4F4F4F] dark:text-[#B8B4B0] bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg hover:bg-[#FEF3F0] dark:hover:bg-[#1A1516] hover:border-[#DA583F] transition-all">
                ↑ 导入
              </button>
              <button onClick={handleSync} disabled={isSyncing} className="px-4 py-2 text-sm font-medium text-[#4F4F4F] dark:text-[#B8B4B0] bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg hover:bg-[#FEF3F0] dark:hover:bg-[#1A1516] hover:border-[#DA583F] transition-all disabled:opacity-40">
                {isSyncing ? '同步中…' : '☁ 同步'}
              </button>
              <button onClick={handleRestore} disabled={isSyncing} className="px-4 py-2 text-sm font-medium text-[#4F4F4F] dark:text-[#B8B4B0] bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg hover:bg-[#FEF3F0] dark:hover:bg-[#1A1516] hover:border-[#DA583F] transition-all disabled:opacity-40">
                ↳ 恢复
              </button>
              <Link to="/write" className="px-5 py-2 text-sm font-medium text-white bg-[#DA583F] rounded-lg hover:bg-[#C43F30] transition-all">
                + 写文章
              </Link>
            </div>
          )}
        </div>

        {/* 同步提示 */}
        {syncMessage && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${syncMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
            {syncMessage.text}
            <button onClick={clearSyncMessage} className="ml-3 text-xs underline">关闭</button>
          </div>
        )}

        {/* 搜索框 */}
        <div className="mb-8">
          <div className="relative">
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
          {searchQuery && (
            <p className="mt-2 text-xs text-[#767693] dark:text-[#8A8688]">找到 {displayedArticles.length} 篇匹配文章</p>
          )}
        </div>

        {/* 已发布 / 草稿箱 切换 */}
        {isAdmin && (
          <div className="flex gap-1 p-1 bg-[#FEF3F0] dark:bg-[#1A1516] rounded-lg mb-8 w-fit">
            <button onClick={() => { setViewMode('published'); setSearchQuery(''); }} className={`px-4 py-1.5 text-sm rounded-md transition-all ${viewMode === 'published' ? 'bg-white dark:bg-[#1C1818] text-[#313131] dark:text-[#E8E4E1] shadow-sm' : 'text-[#767693] dark:text-[#8A8688] hover:text-[#313131] dark:hover:text-[#E8E4E1]'}`}>
              已发布 {publishedArticles.length > 0 && <span className="ml-1.5 text-[10px] bg-[#DA583F] text-white rounded-full px-1.5 py-0.5">{publishedArticles.length}</span>}
            </button>
            <button onClick={() => { setViewMode('draft'); setSearchQuery(''); }} className={`px-4 py-1.5 text-sm rounded-md transition-all ${viewMode === 'draft' ? 'bg-white dark:bg-[#1C1818] text-[#313131] dark:text-[#E8E4E1] shadow-sm' : 'text-[#767693] dark:text-[#8A8688] hover:text-[#313131] dark:hover:text-[#E8E4E1]'}`}>
              草稿箱 {draftCount > 0 && <span className="ml-1.5 text-[10px] bg-amber-500 text-white rounded-full px-1.5 py-0.5">{draftCount}</span>}
            </button>
          </div>
        )}

        {/* 文章列表 */}
        {displayedArticles.length > 0 ? (
          <div className="divide-y divide-[#ECD8D9] dark:divide-[#2A2020]">
            {displayedArticles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-[#B8B4B0] dark:text-[#8A8688] text-sm">
              {searchQuery ? '未找到匹配的文章' : viewMode === 'draft' ? '暂无草稿' : '暂无文章，开始写作吧'}
            </p>
            {isAdmin && !searchQuery && viewMode === 'published' && (
              <Link to="/write" className="mt-4 inline-block text-sm text-[#DA583F] hover:text-[#C43F30] transition-colors">开始写作 →</Link>
            )}
          </div>
        )}
      </div>

      {/* 导入确认弹窗 */}
      {importDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" onClick={() => setImportDialog({ open: false, articles: [] })} />
          <div className="relative bg-white dark:bg-[#1C1818] rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-lg font-semibold text-[#313131] dark:text-[#E8E4E1] mb-2">确认导入</h3>
            <p className="text-sm text-[#767693] dark:text-[#8A8688] mb-4">即将导入 {importDialog.articles.length} 篇文章：</p>
            <ul className="text-sm text-[#4F4F4F] dark:text-[#B8B4B0] mb-6 max-h-40 overflow-y-auto">
              {importDialog.articles.map(a => <li key={a.id} className="py-1">· {a.title} <span className="text-xs text-[#B8B4B0]">[{a.status === 'published' ? '已发布' : '草稿'}]</span></li>)}
            </ul>
            <div className="flex gap-3">
              <button onClick={() => setImportDialog({ open: false, articles: [] })} className="flex-1 px-4 py-2.5 text-sm font-medium text-[#767693] bg-[#FEF3F0] dark:bg-[#1A1516] rounded-lg hover:bg-[#ECD8D9] dark:hover:bg-[#2A2020] transition-all">取消</button>
              <button onClick={handleImportConfirm} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#DA583F] rounded-lg hover:bg-[#C43F30] transition-all">确认导入</button>
            </div>
          </div>
        </div>
      )}

      {/* 管理员登录 */}
      <AdminLogin />
    </div>
  );
}
