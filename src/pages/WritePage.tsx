import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import MarkdownEditor from '../components/MarkdownEditor';
import ConfirmDialog from '../components/ConfirmDialog';
import { createArticle, updateArticle, deleteArticle, getArticleById } from '../storage/articleStore';
import { EMOJI_PRESETS, CATEGORIES } from '../utils/helpers';
import type { CategoryKey } from '../types/article';
import { useAdminAuth } from '../hooks/useAdminAuth';
import Navigation from '../components/Navigation';

export default function WritePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { isAdmin } = useAdminAuth();

  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [category, setCategory] = useState<CategoryKey | ''>('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isAdmin) navigate('/blog', { replace: true });
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (id) {
      const article = getArticleById(id);
      if (article) {
        setTitle(article.title);
        setEmoji(article.emoji);
        setCategory(article.category || '');
        setContent(article.content);
      } else {
        navigate('/blog', { replace: true });
      }
    }
  }, [id, navigate]);

  const canSave = title.trim() && content.trim();
  const catValue = category || undefined;

  const handleSave = (status: 'draft' | 'published') => {
    if (!canSave) return;
    setSaving(true);
    if (isEditing && id) {
      updateArticle(id, { title: title.trim(), emoji, content: content.trim(), status, category: catValue });
      setTimeout(() => { setSaving(false); navigate(`/article/${id}`); }, 100);
    } else {
      createArticle({ title: title.trim(), emoji, content: content.trim(), status, category: catValue });
      setTimeout(() => { setSaving(false); navigate('/blog'); }, 100);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    deleteArticle(id);
    setShowDeleteConfirm(false);
    navigate('/blog', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0F0D0E] transition-colors duration-300">
      <Navigation />
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/blog" className="text-sm text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F] transition-colors">
            ← 返回博客
          </Link>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={() => setShowDeleteConfirm(true)} disabled={saving} className="px-5 py-2 text-sm font-medium text-red-600 bg-white dark:bg-[#1C1818] border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 transition-all disabled:opacity-40">
                  删除
                </button>
                <button onClick={() => handleSave('draft')} disabled={!canSave || saving} className="px-5 py-2 text-sm font-medium text-[#4F4F4F] dark:text-[#B8B4B0] bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg hover:bg-[#FEF3F0] dark:hover:bg-[#1A1516] hover:border-[#DA583F] transition-all disabled:opacity-40">
                  {saving ? '保存中…' : '存为草稿'}
                </button>
                <button onClick={() => handleSave('published')} disabled={!canSave || saving} className="px-5 py-2 text-sm font-medium text-white bg-[#DA583F] rounded-lg hover:bg-[#C43F30] transition-all disabled:opacity-40">
                  {saving ? '保存中…' : '保存修改'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => handleSave('draft')} disabled={!canSave || saving} className="px-5 py-2 text-sm font-medium text-[#4F4F4F] dark:text-[#B8B4B0] bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg hover:bg-[#FEF3F0] dark:hover:bg-[#1A1516] hover:border-[#DA583F] transition-all disabled:opacity-40">
                  {saving ? '保存中…' : '存为草稿'}
                </button>
                <button onClick={() => handleSave('published')} disabled={!canSave || saving} className="px-5 py-2 text-sm font-medium text-white bg-[#DA583F] rounded-lg hover:bg-[#C43F30] transition-all disabled:opacity-40">
                  {saving ? '发布中…' : '发布'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 分类选择器 */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-[#767693] dark:text-[#8A8688] mb-2">选择志趣分类</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategory(prev => prev === cat.key ? '' : cat.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm transition-all border ${
                  category === cat.key
                    ? 'bg-[#DA583F] text-white border-[#DA583F]'
                    : 'bg-white dark:bg-[#1C1818] border-[#ECD8D9] dark:border-[#2A2020] text-[#4F4F4F] dark:text-[#B8B4B0] hover:border-[#DA583F] hover:text-[#DA583F]'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* emoji 选择器 */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-[#767693] dark:text-[#8A8688] mb-2">选择标识</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_PRESETS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-10 h-10 flex items-center justify-center text-lg rounded-lg transition-all border ${
                  e === emoji
                    ? 'bg-[#DA583F] text-white border-[#DA583F]'
                    : 'bg-white dark:bg-[#1C1818] border-[#ECD8D9] dark:border-[#2A2020] text-[#4F4F4F] dark:text-[#B8B4B0] hover:border-[#DA583F] hover:bg-[#FEF3F0] dark:hover:bg-[#1A1516]'
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
          onChange={e => setTitle(e.target.value)}
          placeholder="文章标题…"
          className="w-full text-2xl font-bold text-[#313131] dark:text-[#E8E4E1] placeholder-[#B8B4B0] outline-none mb-6 bg-transparent"
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
    </div>
  );
}
