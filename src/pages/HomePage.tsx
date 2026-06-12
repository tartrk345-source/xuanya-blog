import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllArticles, getPublishedArticles } from '../storage/articleStore';
import { downloadBackup, parseBackupFile, importArticles } from '../utils/export';
import ConfirmDialog from '../components/ConfirmDialog';
import ArticleCard from '../components/ArticleCard';
import type { Article } from '../types/article';

type ViewMode = 'published' | 'draft';

export default function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('published');
  const [refreshKey, setRefreshKey] = useState(0);

  // 导入相关状态
  const [importDialog, setImportDialog] = useState<{
    open: boolean;
    articles: Article[];
    error?: string;
  }>({ open: false, articles: [] });

  // 每次 refreshKey 变化重新读取
  const key = refreshKey;
  void key; // 触发重渲染
  const allArticles = getAllArticles();
  const draftArticles = allArticles.filter((a) => a.status === 'draft');
  const publishedArticles = getPublishedArticles();

  const displayedArticles =
    viewMode === 'published' ? publishedArticles : draftArticles;

  /** 点击导入按钮：选择文件 → 解析 → 弹出确认框 */
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

  // 统计即将导入的新文章数（已有 ID 的跳过）
  const existingIds = new Set(allArticles.map((a) => a.id));
  const newCount = importDialog.articles.filter(
    (a) => !existingIds.has(a.id)
  ).length;
  const skipCount = importDialog.articles.length - newCount;

  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      {/* 头部 */}
      <header className="mb-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
          玄牙个人世界
        </h1>
        <p className="text-base text-gray-500 leading-relaxed">
          写作、思考与记录的空间
        </p>
      </header>

      {/* 操作栏 */}
      <div className="flex items-center gap-3 mb-12 pb-6 border-b border-gray-200">
        <Link
          to="/write"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          <span className="text-base">+</span>
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
            {viewMode === 'published' ? '还没有文章' : '没有草稿'}
          </p>
          {viewMode === 'published' && (
            <Link
              to="/write"
              className="inline-block mt-4 text-sm text-gray-500 underline underline-offset-4 hover:text-gray-700"
            >
              写第一篇
            </Link>
          )}
          {viewMode === 'draft' && (
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
    </div>
  );
}
