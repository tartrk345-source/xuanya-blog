import { useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getArticleById, deleteArticle } from '../storage/articleStore';
import { formatDate } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAdminAuth();
  const article = id ? getArticleById(id) : undefined;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 文章不存在，回到首页
  if (!article) {
    return <Navigate to="/" replace />;
  }

  const handleDelete = () => {
    if (!id) return;
    deleteArticle(id);
    setShowDeleteConfirm(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* 顶部导航 */}
      <div className="mb-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span>←</span>
          返回首页
        </Link>
      </div>

      {/* 文章头部 */}
      <header className="mb-10 pb-10 border-b border-gray-200">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-3xl select-none" role="img" aria-label="文章标识">
            {article.emoji}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight tracking-tight">
            {article.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <time className="text-sm text-gray-400" dateTime={new Date(article.createdAt).toISOString()}>
            {formatDate(article.createdAt)}
            {article.updatedAt !== article.createdAt && ' · 已编辑'}
          </time>
          {article.status === 'draft' && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
              草稿
            </span>
          )}
        </div>
      </header>

      {/* 正文 */}
      <div className="prose-container">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {article.content}
        </ReactMarkdown>
      </div>

      {/* 底部操作 */}
      <div className="mt-16 pt-8 border-t border-gray-200 flex items-center justify-between">
        <Link
          to="/"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← 返回首页
        </Link>
        {isAdmin && (
          <div className="flex items-center gap-4">
            <Link
              to={`/write/${article.id}`}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              编辑
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-red-400 hover:text-red-600 transition-colors"
            >
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
  );
}
