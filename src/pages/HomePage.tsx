import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types/article';
import { getPublishedArticles, getAllArticles } from '../storage/articleStore';
import { downloadBackup, importArticles, parseBackupFile, hasExportedToday, markExportedToday } from '../utils/export';
import { syncToGist, restoreFromGist } from '../utils/gistSync';
import ArticleCard from '../components/ArticleCard';
import AdminLogin from '../components/AdminLogin';
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function HomePage() {
  const { isAdmin } = useAdminAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'published' | 'draft'>('published');
  const [searchQuery, setSearchQuery] = useState('');
  const [importDialog, setImportDialog] = useState<{ open: boolean; articles: Article[] }>({ open: false, articles: [] });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const onRefresh = () => setRefreshKey(prev => prev + 1);
    window.addEventListener('articles-changed', onRefresh);
    return () => window.removeEventListener('articles-changed', onRefresh);
  }, []);

  const refreshList = () => setRefreshKey(prev => prev + 1);

  const searchLower = searchQuery.toLowerCase();
  const filterBySearch = (articles: Article[]) => {
    if (!searchLower) return articles;
    return articles.filter(
      (a: Article) => a.title.toLowerCase().includes(searchLower) || a.content.toLowerCase().includes(searchLower)
    );
  };

  const allArticles = getAllArticles();
  const key = refreshKey;
  void key;
  const draftCount = allArticles.filter(a => a.status === 'draft').length;
  const publishedArticles = getPublishedArticles();
  const displayedArticles = filterBySearch(
    viewMode === 'published' ? publishedArticles : allArticles.filter(a => a.status === 'draft')
  );

  const clearSyncMessage = () => setSyncMessage(null);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncToGist();
      setSyncMessage({ type: 'success', text: result });
    } catch (e: any) {
      setSyncMessage({ type: 'error', text: e.message || '同步失败' });
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleRestore = useCallback(async () => {
    if (!confirm('将从云端恢复文章，本地新增的文章会被合并，确定继续？')) return;
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const result = await restoreFromGist();
      setSyncMessage({ type: 'success', text: result });
      refreshList();
    } catch (e: any) {
      setSyncMessage({ type: 'error', text: e.message || '恢复失败' });
    } finally {
      setIsSyncing(false);
    }
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
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* 顶部：标题 + 操作按钮（仅管理员可见）*/}
        <div className="flex items-end justify-between mb-12">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">玄牙个人世界</h1>
            <p className="mt-1.5 text-sm text-gray-400">记录思考，分享洞察</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button onClick={() => { downloadBackup(); markExportedToday(); }} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all">
                ↓ 导出备份{!hasExportedToday() && <span className="ml-1.5 text-[10px] text-amber-600">（今日未备份）</span>}
              </button>
              <button onClick={handleImport} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all">
                ↑ 导入备份
              </button>
              <button onClick={handleSync} disabled={isSyncing} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40">
                {isSyncing ? '同步中…' : '☁ 同步到云端'}
              </button>
              <button onClick={handleRestore} disabled={isSyncing} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40">
                ↳ 从云端恢复
              </button>
              <Link to="/write" className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all">
                + 写文章
              </Link>
            </div>
          )}
        </div>

        {/* 同步提示 */}
        {syncMessage && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${syncMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {syncMessage.text}
            <button onClick={clearSyncMessage} className="ml-3 text-xs underline">关闭</button>
          </div>
        )}

        {/* 搜索框 */}
        <div className="mb-8">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索文章标题或内容…"
              className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white focus:border-gray-400 focus:outline-none transition-all placeholder-gray-300"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-sm">✕</button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-xs text-gray-400">找到 {displayedArticles.length} 篇匹配文章</p>
          )}
        </div>

        {/* 已发布 / 草稿箱 切换 */}
        {isAdmin && (
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-8 w-fit">
            <button onClick={() => { setViewMode('published'); setSearchQuery(''); }} className={`px-4 py-1.5 text-sm rounded-md transition-all ${viewMode === 'published' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              已发布 {publishedArticles.length > 0 && <span className="ml-1.5 text-[10px] bg-gray-900 text-white rounded-full px-1.5 py-0.5">{publishedArticles.length}</span>}
            </button>
            <button onClick={() => { setViewMode('draft'); setSearchQuery(''); }} className={`px-4 py-1.5 text-sm rounded-md transition-all ${viewMode === 'draft' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              草稿箱 {draftCount > 0 && <span className="ml-1.5 text-[10px] bg-amber-500 text-white rounded-full px-1.5 py-0.5">{draftCount}</span>}
            </button>
          </div>
        )}

        {/* 文章列表 */}
        {displayedArticles.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {displayedArticles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-gray-300 text-sm">{
              searchQuery ? '未找到匹配的文章' : viewMode === 'draft' ? '暂无草稿' : '暂无文章，开始写作吧'
            }</p>
            {isAdmin && !searchQuery && viewMode === 'published' && (
              <Link to="/write" className="mt-4 inline-block text-sm text-gray-500 hover:text-gray-700 transition-colors">开始写作 →</Link>
            )}
          </div>
        )}
      </div>

      {/* 导入确认弹窗 */}
      {importDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" onClick={() => setImportDialog({ open: false, articles: [] })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认导入</h3>
            <p className="text-sm text-gray-500 mb-4">即将导入 {importDialog.articles.length} 篇文章：</p>
            <ul className="text-sm text-gray-600 mb-6 max-h-40 overflow-y-auto">
              {importDialog.articles.map(a => <li key={a.id} className="py-1">· {a.title} <span className="text-xs text-gray-400">[{a.status === 'published' ? '已发布' : '草稿'}]</span></li>)}
            </ul>
            <div className="flex gap-3">
              <button onClick={() => setImportDialog({ open: false, articles: [] })} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">取消</button>
              <button onClick={handleImportConfirm} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all">确认导入</button>
            </div>
          </div>
        </div>
      )}

      {/* 管理员登录组件 */}
      <AdminLogin />
    </div>
  );
}
