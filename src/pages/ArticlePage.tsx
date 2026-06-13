import { useState, useEffect, useRef } from 'react';
import type { Article } from '../types/article';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getArticleById, deleteArticle, getPublishedArticles, getRelatedArticles, getArticlesBySeries } from '../storage/articleStore';
import ConfirmDialog from '../components/ConfirmDialog';
import Navigation from '../components/Navigation';
import AdminLogin from '../components/AdminLogin';
import ReadingProgress from '../components/ReadingProgress';
import BackToTop from '../components/BackToTop';
import TableOfContents from '../components/TableOfContents';
import { ArticleImageLightbox, useCodeBlockCopy } from '../components/CodeBlock';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { syncToGist } from '../utils/gistSync';
import { getCategoryInfo, formatDate, getExcerpt, EMOJI_MEANINGS, estimateReadingTime } from '../utils/helpers';
import { recordPageView, getPageViews } from '../storage/pageViews';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAdminAuth();
  const [article, setArticle] = useState<Article | undefined>(undefined);
  const [catInfo, setCatInfo] = useState<{ icon: string; label: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [prevArticle, setPrevArticle] = useState<Article | undefined>();
  const [nextArticle, setNextArticle] = useState<Article | undefined>();
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [seriesArticles, setSeriesArticles] = useState<Article[]>([]);
  const [tocVisible, setTocVisible] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [loadError, setLoadError] = useState<string>('');

  // 文章容器 ref — 用于代码块复制按钮、图片灯箱
  const articleRef = useRef<HTMLDivElement>(null);
  useCodeBlockCopy(articleRef);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let mounted = true;
    Promise.all([
      getArticleById(id),
      getPublishedArticles(),
    ]).then(([a, all]) => {
      if (!mounted) return;
      setArticle(a);

      // 计算上下篇（按创建时间排序）
      if (all.length > 0) {
        const sorted = all.sort((a, b) => a.createdAt - b.createdAt);
        const idx = sorted.findIndex(x => x.id === id);
        if (idx >= 0) {
          setPrevArticle(idx > 0 ? sorted[idx - 1] : undefined);
          setNextArticle(idx < sorted.length - 1 ? sorted[idx + 1] : undefined);
        }
      }

      // 相关文章
      if (a) {
        getRelatedArticles(id, a.tags, a.category).then(setRelatedArticles);
        // 系列文章
        if (a.series) {
          getArticlesBySeries(a.series).then(setSeriesArticles);
        }
        // 记录访问 + 获取浏览量
        recordPageView(id);
        getPageViews(id).then(setViewCount);
      }

      setLoading(false);
    }).catch((err) => {
      console.error('[ArticlePage] 加载失败:', err);
      if (mounted) {
        setLoadError(err?.message || String(err));
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [id]);

  // 获取分类信息（必须在所有条件返回之前，保证 hooks 数量一致）
  useEffect(() => {
    if (!article?.category) { setCatInfo(null); return; }
    getCategoryInfo(article.category).then(setCatInfo);
  }, [article]);

  // 监听滚动 — 显示/隐藏 TOC
  useEffect(() => {
    const handler = () => setTocVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0F0D0E] flex items-center justify-center">
        {/* 骨架屏 */}
        <div className="w-full max-w-3xl mx-auto px-6 animate-[fadeIn_0.4s_ease-out]">
          <div className="h-8 w-32 bg-[#ECD8D9]/40 dark:bg-[#2A2020]/40 rounded-lg mb-6" />
          <div className="h-10 w-3/4 bg-[#ECD8D9]/40 dark:bg-[#2A2020]/40 rounded-lg mb-3" />
          <div className="h-6 w-1/4 bg-[#ECD8D9]/30 dark:bg-[#2A2020]/30 rounded-lg mb-12" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mb-3 space-y-2">
              <div
                className="h-[18px] bg-[#ECD8D9]/25 dark:bg-[#2A2020]/25 rounded"
                style={{ width: `${70 + Math.random() * 30}%` }}
              />
              <div
                className="h-[18px] bg-[#ECD8D9]/20 dark:bg-[#2A2020]/20 rounded"
                style={{ width: `${85 + Math.random() * 15}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!article) {
    if (loadError) {
      return (
        <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0F0D0E] flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-lg font-bold text-[#313131] dark:text-[#E8E4E1]">文章加载失败</h2>
            <p className="text-sm text-[#767693] dark:text-[#8A8688] break-all">{loadError}</p>
            <p className="text-xs text-[#B8B4B0]">ID: {id}</p>
            <button onClick={() => window.location.reload()} className="px-5 py-2 text-sm bg-[#DA583F] text-white rounded-lg hover:bg-[#C44A35] transition-colors">
              重新加载
            </button>
          </div>
        </div>
      );
    }
    // 没有错误但也没数据 → 重定向（兼容旧行为）
    return <Navigate to="/blog" replace />;
  }

  const goBack = () => {
    navigate('/blog');
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteArticle(id);
    setShowDeleteConfirm(false);
    syncToGist().catch(() => {});
    navigate('/blog', { replace: true });
  };

  const readingTime = estimateReadingTime(article.content);

  // OG 图片优先使用封面图
  const ogImage = article.coverImage || 'https://www.x2ya.com/images/og-image.svg';

  return (
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0F0D0E] transition-colors duration-300">
      <Helmet>
        <title>{article.title} — 玄牙个人世界</title>
        <meta name="description" content={getExcerpt(article.content, 120)} />
        <meta property="og:title" content={`${article.title} — 玄牙个人世界`} />
        <meta property="og:description" content={getExcerpt(article.content, 120)} />
        <meta property="og:url" content={`https://www.x2ya.com/article/${article.id}`} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:title" content={`${article.title} — 玄牙个人世界`} />
        <meta name="twitter:description" content={getExcerpt(article.content, 120)} />
        <meta name="twitter:image" content={ogImage} />
        <link rel="canonical" href={`https://www.x2ya.com/article/${article.id}`} />
      </Helmet>

      {/* 阅读进度条 */}
      <ReadingProgress />

      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 animate-[fadeIn_0.4s_ease-out]">
        {/* 顶部导航 */}
        <div className="mb-12">
          <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F] transition-colors">
            <span>←</span> 返回志趣
          </button>
        </div>

        {/* 封面图 */}
        {article.coverImage && (
          <div className="mb-10 rounded-2xl overflow-hidden border border-[#ECD8D9] dark:border-[#2A2020] shadow-sm">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-auto max-h-[400px] object-cover"
            />
          </div>
        )}

        {/* 文章头部 */}
        <header className="mb-10 pb-10 border-b border-[#ECD8D9] dark:border-[#2A2020]">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl select-none" title={EMOJI_MEANINGS[article.emoji] || ''}>{article.emoji}</span>
            <h1 className="text-3xl font-bold text-[#313131] dark:text-[#E8E4E1] leading-tight tracking-tight">
              {article.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <time className="text-sm text-[#767693] dark:text-[#8A8688]" dateTime={new Date(article.createdAt).toISOString()}>
              {formatDate(article.createdAt)}
              {article.updatedAt !== article.createdAt && ' · 已编辑'}
            </time>
            <span className="text-sm text-[#B8B4B0] dark:text-[#8A8688]">
              · {readingTime} 分钟阅读
              {viewCount > 0 && <> · {viewCount} 次阅读</>}
            </span>
            {catInfo && (
              <span className="text-xs text-[#DA583F] bg-[#FEF3F0] dark:bg-[#1A1516] border border-[#ECD8D9] dark:border-[#2A2020] rounded-full px-2 py-0.5" title={EMOJI_MEANINGS[catInfo.icon] || ''}>
                {catInfo.icon} {catInfo.label}
              </span>
            )}
            {article.isPinned && (
              <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5">
                📌 置顶
              </span>
            )}
            {article.isFeatured && (
              <span className="text-xs text-[#DA583F] bg-[#FEF3F0] dark:bg-[#1A1516] border border-[#ECD8D9] dark:border-[#2A2020] rounded-full px-2 py-0.5">
                ⭐ 精选
              </span>
            )}
            {article.status === 'draft' && (
              <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5">
                草稿
              </span>
            )}
          </div>

          {/* 标签 */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {article.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs text-[#767693] dark:text-[#8A8688] bg-[#FEFAF9] dark:bg-[#0F0D0E] border border-[#ECD8D9] dark:border-[#2A2020] rounded-full px-2.5 py-0.5 hover:border-[#DA583F] hover:text-[#DA583F] transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* 系列导航 */}
        {article.series && seriesArticles.length > 1 && (
          <div className="mb-8 p-4 bg-[#FEF3F0] dark:bg-[#1A1516] rounded-xl border border-[#ECD8D9] dark:border-[#2A2020]">
            <div className="text-xs font-bold text-[#DA583F] mb-2 flex items-center gap-1.5">
              📖 {article.series}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {seriesArticles.map((a, idx) => (
                <Link
                  key={a.id}
                  to={`/article/${a.id}`}
                  className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                    a.id === id
                      ? 'bg-[#DA583F] text-white font-semibold'
                      : 'bg-white dark:bg-[#1C1818] text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F] hover:border-[#DA583F] border border-[#ECD8D9] dark:border-[#2A2020]'
                  }`}
                >
                  {idx + 1}. {a.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 正文 + TOC 布局 */}
        <div className="flex gap-8 relative">
          {/* 目录（桌面端粘性侧栏） */}
          {tocVisible && (
            <aside className="hidden lg:block w-[200px] flex-shrink-0 sticky top-24 self-start animate-[fadeIn_0.3s_ease-out]">
              <TableOfContents content={article.content} />
            </aside>
          )}

          {/* 正文 */}
          <div ref={articleRef} className="prose-container flex-1 min-w-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
            >
              {article.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* 相关文章推荐 */}
        {relatedArticles.length > 0 && (
          <div className="mt-16 pt-8 border-t border-[#ECD8D9] dark:border-[#2A2020]">
            <h3 className="text-sm font-bold text-[#313131] dark:text-[#E8E4E1] mb-5 flex items-center gap-2">
              <span className="text-[#DA583F]">📚</span> 推荐阅读
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedArticles.map(a => (
                <Link
                  key={a.id}
                  to={`/article/${a.id}`}
                  className="group flex flex-col p-4 rounded-xl bg-[#FEFAF9] dark:bg-[#0F0D0E] border border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F] transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{a.emoji}</span>
                    <span className="text-sm font-medium text-[#313131] dark:text-[#E8E4E1] group-hover:text-[#DA583F] transition-colors line-clamp-1">
                      {a.title}
                    </span>
                  </div>
                  <p className="text-xs text-[#767693] dark:text-[#8A8688] line-clamp-2 ml-7 mb-1">
                    {getExcerpt(a.content, 60)}
                  </p>
                  {a.tags && a.tags.length > 0 && (
                    <div className="flex gap-1 ml-7 mt-1">
                      {a.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] text-[#B8B4B0]">#{t}</span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 上下篇导航 */}
        {(prevArticle || nextArticle) && (
          <div className="mt-12 pt-8 border-t border-[#ECD8D9] dark:border-[#2A2020]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevArticle ? (
                <Link
                  to={`/article/${prevArticle.id}`}
                  className="group flex flex-col p-4 rounded-xl bg-[#FEFAF9] dark:bg-[#0F0D0E] border border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F] transition-all duration-300 hover:-translate-y-0.5"
                >
                  <span className="text-[11px] text-[#B8B4B0] dark:text-[#8A8688] mb-1">← 上一篇</span>
                  <span className="text-sm font-medium text-[#313131] dark:text-[#E8E4E1] group-hover:text-[#DA583F] transition-colors line-clamp-2">
                    {prevArticle.emoji} {prevArticle.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {nextArticle ? (
                <Link
                  to={`/article/${nextArticle.id}`}
                  className="group flex flex-col p-4 rounded-xl bg-[#FEFAF9] dark:bg-[#0F0D0E] border border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F] transition-all duration-300 hover:-translate-y-0.5 sm:text-right"
                >
                  <span className="text-[11px] text-[#B8B4B0] dark:text-[#8A8688] mb-1">下一篇 →</span>
                  <span className="text-sm font-medium text-[#313131] dark:text-[#E8E4E1] group-hover:text-[#DA583F] transition-colors line-clamp-2">
                    {nextArticle.emoji} {nextArticle.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        )}

        {/* 底部操作 */}
        <div className="mt-8 pt-6 border-t border-[#ECD8D9] dark:border-[#2A2020] flex items-center justify-between">
          <button onClick={goBack} className="text-sm text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F] transition-colors">
            ← 返回博客
          </button>
          {isAdmin && (
            <div className="flex items-center gap-4">
              <Link to={`/write/${article.id}`} className="text-sm text-[#4F4F4F] dark:text-[#B8B4B0] hover:text-[#DA583F] transition-colors">
                编辑
              </Link>
              <button onClick={() => setShowDeleteConfirm(true)} className="text-sm text-red-400 hover:text-red-600 transition-colors">
                删除
              </button>
            </div>
          )}
        </div>

        {/* 删除确认弹窗 */}
        <ConfirmDialog
          open={showDeleteConfirm}
          title="确认删除"
          message="此操作不可撤销，文章将被永久删除。"
          confirmLabel="删除"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>

      {/* 返回顶部 */}
      <BackToTop />

      {/* 图片灯箱 */}
      <ArticleImageLightbox />

      <AdminLogin />
    </div>
  );
}
