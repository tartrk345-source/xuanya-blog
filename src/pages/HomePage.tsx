import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllArticles, getPublishedArticles, importArticles } from '../storage/articleStore';
import { downloadBackup, parseBackupFile } from '../utils/export';
import {
  uploadToGist,
  downloadFromGist,
  getPat,
  setPat,
  clearPat,
} from '../utils/gistSync';
import ConfirmDialog from '../components/ConfirmDialog';
import ArticleCard from '../components/ArticleCard';
import type { Article } from '../types/article';

type ViewMode = 'published' | 'draft';

export default function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('published');
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // 导入相关状态
  const [importDialog, setImportDialog] = useState<{
    open: boolean;
    articles: Article[];
    error?: string;
  }>({ open: false, articles: [] });

  // GitHub 同步相关状态
  const [showPatDialog, setShowPatDialog] = useState(!getPat());
  const [patInput, setPatInput] = useState(getPat() || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 每次 refreshKey 变化重新读取
  const key = refreshKey;
  void key;
  const allArticles = getAllArticles();
  const draftArticles = allArticles.filter((a) => a.status === 'draft');
  const publishedArticles = getPublishedArticles();

  // 搜索过滤（在当前视图内过滤）
  const searchLower = searchQuery.toLowerCase();
  const filterBySearch = (articles: Article[]) => {
    if (!searchLower) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(searchLower) ||
        a.content.toLowerCase().includes(searchLower)
    );
  };

  const displayedArticles = filterBySearch(
    viewMode === 'published' ? publishedArticles : draftArticles
  );

  /** 清除同步消息 */
  const clearSyncMessage = () => {
    setSyncMessage(null);
  };

  /** 点击导入按钮 */
  const handleImport = useCallback(async () => {
    const result = await parseBackupFile();
    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.articles.length === 0) return;
    setImportDialog({ open: true, articles: result.articles });
  }, []);

  /** 确认导入 */
  const handleImportConfirm = useCallback(() => {
    importArticles(importDialog.articles);
    setImportDialog({ open: false, articles: [] });
    setRefreshKey((k) => k + 1);
  }, [importDialog.articles]);

  /** 取消导入 */
  const handleImportCancel = useCallback(() => {
    setImportDialog({ open: false, articles: [] });
  }, []);

  /** 保存 PAT */
  const handleSavePat = useCallback(() => {
    const token = patInput.trim();
    if (!token) return;
    setPat(token);
    setShowPatDialog(false);
    setPatInput(token);
    setSyncMessage({ type: 'success', text: 'Token 已保存，可以开始同步' });
    setTimeout(clearSyncMessage, 3000);
  }, [patInput]);

  /** 同步到云端 */
  const handleUpload = useCallback(async () => {
    const pat = getPat();
    if (!pat) {
      setShowPatDialog(true);
      return;
    }
    setIsSyncing(true);
    setSyncMessage(null);
    const articles = getAllArticles();
    const result = await uploadToGist(JSON.stringify(articles, null, 2), pat);
    setIsSyncing(false);
    if (result.success) {
      setSyncMessage({ type: 'success', text: '同步成功，已备份到 GitHub Gist' });
    } else {
      setSyncMessage({ type: 'error', text: result.error || '同步失败' });
    }
    setTimeout(clearSyncMessage, 5000);
  }, []);

  /** 从云端恢复 */
  const handleDownload = useCallback(async () => {
    const pat = getPat();
    if (!pat) {
      setShowPatDialog(true);
      return;
    }
    setIsSyncing(true);
    setSyncMessage(null);
    const result = await downloadFromGist(pat);
    setIsSyncing(false);
    if (!result.success) {
      setSyncMessage({ type: 'error', text: result.error || '恢复失败' });
      setTimeout(clearSyncMessage, 5000);
      return;
    }
    try {
      const articles: Article[] = JSON.parse(result.data || '[]');
      const { imported, skipped } = importArticles(articles);
      setRefreshKey((k) => k + 1);
      setSyncMessage({
        type: 'success',
        text: `恢复成功，导入 ${imported} 篇新文章${skipped > 0 ? `，跳过 ${skipped} 篇已有文章` : ''}`,
      });
    } catch {
      setSyncMessage({ type: 'error', text: '恢复数据格式异常' });
    }
    setTimeout(clearSyncMessage, 5000);
  }, []);

  // 导入弹窗计数
  const existingIds = new Set(allArticles.map((a) => a.id));
  const newCount = importDialog.articles.filter(
    (a) => !existingIds.has(a.id)
  ).length;
  const skipCount = importDialog.articles.length - newCount;

  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      {/* 头部 */}
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
          玄牙个人世界
        </h1>
        <p className="text-base text-gray-500 leading-relaxed">
          写作、思考与记录的空间
        </p>
      </header>

      {/* 同步状态提示 */}
      {syncMessage && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg text-sm ${
            syncMessage.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {syncMessage.text}
        </div>
      )}

      {/* 搜索框 */}
      <div className="mb-8">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文章标题或内容…"
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-colors bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-xs text-gray-400">
            找到 {displayedArticles.length} 篇匹配文章
          </p>
        )}
      </div>

      {/* 操作栏 */}
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200 flex-wrap">
        <Link
          to="/write"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          <span className="text-base">＋</span>
          写文章
        </Link>

        <button
          onClick={downloadBackup}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          title="导出全部文章为 JSON 文件备份"
        >
          ↓ 导出备份
        </button>

        <button
          onClick={handleImport}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          title="从 JSON 备份文件恢复文章"
        >
          ↑ 导入备份
        </button>

        {/* GitHub 同步按钮 */}
        <button
          onClick={handleUpload}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
          title="同步文章到 GitHub Gist"
        >
          {isSyncing ? '同步中…' : '☁ 同步到云端'}
        </button>

        <button
          onClick={handleDownload}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
          title="从 GitHub Gist 恢复文章"
        >
          ↳ 从云端恢复
        </button>

        {/* Token 设置 */}
        <button
          onClick={() => {
            setPatInput(getPat() || '');
            setShowPatDialog(true);
          }}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          title="设置 GitHub Token"
        >
          ⚙ {getPat() ? 'Token 已设置' : '设置 Token'}
        </button>

        {/* 切换按钮：已发布 / 草稿箱 */}
        <div className="ml-auto flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setViewMode('published')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'published'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            已发布
          </button>
          <button
            onClick={() => setViewMode('draft')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 ${
              viewMode === 'draft'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            草稿箱
            {draftArticles.length > 0 && (
              <span
                className={`ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                  viewMode === 'draft'
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {draftArticles.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 文章列表 */}
      {displayedArticles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-base">
            {searchQuery
              ? '没有找到匹配的文章'
              : viewMode === 'published'
              ? '还没有文章'
              : '没有草稿'}
          </p>
          {!searchQuery && viewMode === 'published' && (
            <Link
              to="/write"
              className="inline-block mt-4 text-sm text-gray-500 underline underline-offset-4 hover:text-gray-700"
            >
              写第一篇
            </Link>
          )}
          {!searchQuery && viewMode === 'draft' && (
            <Link
              to="/write"
              className="inline-block mt-4 text-sm text-gray-500 underline underline-offset-4 hover:text-gray-700"
            >
              写新草稿
            </Link>
          )}
        </div>
      ) : (
        <section className="divide-y divide-gray-100">
          {displayedArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </section>
      )}

      {/* 底部 */}
      <footer className="mt-20 pt-8 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-400">
          {publishedArticles.length} 篇已发布
          {draftArticles.length > 0 && ` · ${draftArticles.length} 篇草稿`}
          {' · '}数据保存在本地浏览器
          {getPat() && ' · ☁ 已连接 GitHub'}
        </p>
      </footer>

      {/* 导入确认弹窗 */}
      <ConfirmDialog
        open={importDialog.open}
        title="确认导入备份"
        message={`找到 ${importDialog.articles.length} 篇文章，其中 ${newCount} 篇新文章将导入${skipCount > 0 ? `，${skipCount} 篇已有文章将跳过` : ''}。是否继续？`}
        confirmLabel="导入"
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
      />

      {/* PAT 设置弹窗 */}
      {showPatDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              GitHub Token 设置
            </h2>
            <p className="text-sm text-gray-500 mb-1 leading-relaxed">
              需要 GitHub Personal Access Token 才能同步到云端。
            </p>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              请访问{' '}
              <a
                href="https://github.com/settings/tokens/new?scopes=gist&description=玄牙个人世界同步"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                github.com/settings/tokens/new
              </a>
              {' '}创建 Token（只需勾选{' '}
              <code className="bg-gray-100 px-1 rounded text-gray-600">gist</code>
              {' '}权限）
            </p>
            <textarea
              value={patInput}
              onChange={(e) => setPatInput(e.target.value)}
              placeholder="粘贴你的 GitHub Personal Access Token（ghp_ 开头）…"
              className="w-full h-20 p-3 border border-gray-200 rounded-lg text-sm font-mono text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 mb-4"
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  clearPat();
                  setPatInput('');
                  setShowPatDialog(false);
                  setSyncMessage({ type: 'success', text: 'Token 已清除' });
                  setTimeout(clearSyncMessage, 3000);
                }}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                清除 Token
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPatDialog(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSavePat}
                  disabled={!patInput.trim()}
                  className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
