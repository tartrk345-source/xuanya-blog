import { useState, useEffect } from 'react';
import type { Article } from '../types/article';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getArticleById, deleteArticle } from '../storage/articleStore';
import { formatDate, getCategoryInfo, getExcerpt } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';
import Navigation from '../components/Navigation';
import AdminLogin from '../components/AdminLogin';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { syncToGist } from '../utils/gistSync';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAdminAuth();
  const [article, setArticle] = useState<Article | undefined>(undefined);
  const [catInfo, setCatInfo] = useState<{ icon: string; label: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let mounted = true;
    getArticleById(id).then(a => {
      if (mounted) { setArticle(a); setLoading(false); }
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0F0D0E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#DA583F]/20 border-t-[#DA583F] rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) return <Navigate to="/blog" replace />;

  const goBack = () => {
    navigate('/blog');
  };

  useEffect(() => {
    if (!article?.category) { setCatInfo(null); return; }
    getCategoryInfo(article.category).then(setCatInfo);
  }, [article]);

  const handleDelete = async () => {
    if (!id) return;
    await deleteArticle(id);
    setShowDeleteConfirm(false);
    syncToGist().catch(() => {});
    navigate('/blog', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0F0D0E] transition-colors duration-300">
      <Helmet>
        <title>{article.title} — 玄牙个人世界</title>
        <meta name="description" content={getExcerpt(article.content, 120)} />
        <meta property="og:title" content={`${article.title} — 玄牙个人世界`} />
        <meta property="og:description" content={getExcerpt(article.content, 120)} />
        <meta property="og:url" content={`https://www.x2ya.com/article/${article.id}`} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://www.x2ya.com/images/og-image.svg" />
        <meta name="twitter:title" content={`${article.title} — 玄牙个人世界`} />
        <meta name="twitter:description" content={getExcerpt(article.content, 120)} />
        <meta name="twitter:image" content="https://www.x2ya.com/images/og-image.svg" />
        <link rel="canonical" href={`https://www.x2ya.com/article/${article.id}`} />
      </Helmet>
      <Navigation />
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* 顶部导航 */}
        <div className="mb-12">
          <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F] transition-colors">
            <span>←</span> 返回志趣
          </button>
        </div>

        {/* 文章头部 */}
        <header className="mb-10 pb-10 border-b border-[#ECD8D9] dark:border-[#2A2020]">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl select-none">{article.emoji}</span>
            <h1 className="text-3xl font-bold text-[#313131] dark:text-[#E8E4E1] leading-tight tracking-tight">
              {article.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <time className="text-sm text-[#767693] dark:text-[#8A8688]" dateTime={new Date(article.createdAt).toISOString()}>
              {formatDate(article.createdAt)}
              {article.updatedAt !== article.createdAt && ' · 已编辑'}
            </time>
            {catInfo && (
              <span className="text-xs text-[#DA583F] bg-[#FEF3F0] dark:bg-[#1A1516] border border-[#ECD8D9] dark:border-[#2A2020] rounded-full px-2 py-0.5">
                {catInfo.icon} {catInfo.label}
              </span>
            )}
            {article.status === 'draft' && (
              <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5">
                草稿
              </span>
            )}
          </div>
        </header>

        {/* 正文 */}
        <div className="prose-container">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
        </div>

        {/* 底部操作 */}
        <div className="mt-16 pt-8 border-t border-[#ECD8D9] dark:border-[#2A2020] flex items-center justify-between">
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

      <AdminLogin />
    </div>
  );
}
