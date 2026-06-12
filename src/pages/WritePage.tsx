import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MarkdownEditor from '../components/MarkdownEditor';
import ConfirmDialog from '../components/ConfirmDialog';
import { createArticle, updateArticle, deleteArticle, getArticleById } from '../storage/articleStore';
import { EMOJI_PRESETS } from '../utils/helpers';
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function WritePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { isAdmin } = useAdminAuth();

  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 未登录管理员，跳转首页
  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, navigate]);

  // 编辑模式：加载已有文章数据
  useEffect(() => {
    if (id) {
      const article = getArticleById(id);
      if (article) {
        setTitle(article.title);
        setEmoji(article.emoji);
        setContent(article.content);
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [id, navigate]);

  const canSave = title.trim() && content.trim();

  const handleSave = (status: 'draft' | 'published') => {
    if (!canSave) return;
    setSaving(true);

    if (isEditing && id) {
      updateArticle(id, {
        title: title.trim(),
        emoji,
        content: content.trim(),
        status,
      });
      setTimeout(() => {
        setSaving(false);
        navigate(`/article/${id}`);
      }, 100);
    } else {
      createArticle({
        title: title.trim(),
        emoji,
        content: content.trim(),
        status,
      });
      setTimeout(() => {
        setSaving(false);
        navigate('/');
      }, 100);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    deleteArticle(id);
    setShowDeleteConfirm(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← 返回
        </button>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
                className="px-5 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                删除
              </button>
              <button
                onClick={() => handleSave('draft')}
                disabled={!canSave || saving}
                className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? '保存中…' : '存为草稿'}
              </button>
              <button
                onClick={() => handleSave('published')}
                disabled={!canSave || saving}
                className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? '保存中…' : '保存修改'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSave('draft')}
                disabled={!canSave || saving}
                className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? '保存中…' : '存为草稿'}
              </button>
              <button
                onClick={() => handleSave('published')}
                disabled={!canSave || saving}
                className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? '发布中…' : '发布'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* emoji 选择器 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {EMOJI_PRESETS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`w-10 h-10 flex items-center justify-center text-lg rounded-lg transition-all border ${
                e === emoji
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* 标题输入 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="文章标题…"
        className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 outline-none mb-6 bg-transparent"
      />

      {/* Markdown 编辑器 */}
      <MarkdownEditor content={content} onChange={setContent} />

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
