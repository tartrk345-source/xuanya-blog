import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MarkdownEditor from '../components/MarkdownEditor';
import ConfirmDialog from '../components/ConfirmDialog';
import { createArticle, updateArticle, deleteArticle, getArticleById } from '../storage/articleStore';
import { EMOJI_PRESETS, EMOJI_MEANINGS } from '../utils/helpers';
import { getCategories, type CategoryItem } from '../storage/categoryStore';
import type { CategoryKey } from '../types/article';
import { useAdminAuth } from '../hooks/useAdminAuth';
import Navigation from '../components/Navigation';
import AdminLogin from '../components/AdminLogin';
import { syncToGist } from '../utils/gistSync';

/** 标签输入组件 */
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (value: string) => {
    const tag = value.trim();
    if (tag && tags.length < 8 && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-[#FEF3F0] dark:bg-[#1E293B] text-[#DA583F] dark:text-[#60A5FA] border border-[#ECD8D9] dark:border-[#334155]"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="w-3.5 h-3.5 flex items-center justify-center rounded-full text-[#DA583F] dark:text-[#60A5FA] hover:bg-[#DA583F] hover:text-white transition-colors cursor-pointer"
            >×</button>
          </span>
        ))}
        {tags.length < 8 && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addTag(input); }
              if (e.key === 'Backspace' && !input && tags.length > 0) removeTag(tags[tags.length - 1]);
            }}
            placeholder={tags.length === 0 ? '输入标签后回车添加…' : ''}
            className="px-2.5 py-1 text-xs border border-[#ECD8D9] dark:border-[#334155] rounded-full bg-transparent text-[#313131] dark:text-[#E2E8F0] outline-none focus:border-[#DA583F] transition-all placeholder-[#B8B4B0] w-[140px]"
          />
        )}
      </div>
      {tags.length > 0 && <p className="text-[10px] text-[#B8B4B0]">最多 8 个标签，回车添加</p>}
    </div>
  );
}

/** 开关切换组件 */
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
          checked ? 'bg-[#DA583F]' : 'bg-[#ECD8D9] dark:bg-[#334155]'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
      <span className="text-sm text-[#4F4F4F] dark:text-[#94A3B8]">{label}</span>
    </label>
  );
}

export default function WritePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { isAdmin } = useAdminAuth();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [category, setCategory] = useState<CategoryKey | ''>('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Phase 2 新增字段
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [series, setSeries] = useState('');

  // 自动保存草稿
  const draftTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  // 分类加载后初始化默认分类
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]?.key ?? '');
    }
  }, [categories]);

  useEffect(() => {
    if (!isAdmin) navigate('/', { replace: true });
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    getArticleById(id).then(article => {
      if (!mounted) return;
      if (article) {
        setTitle(article.title);
        setEmoji(article.emoji);
        setCategory(article.category || '');
        setContent(article.content);
        setTags(article.tags ?? []);
        setCoverImage(article.coverImage ?? '');
        setIsPinned(article.isPinned ?? false);
        setIsFeatured(article.isFeatured ?? false);
        setSeries(article.series ?? '');
      } else {
        navigate('/', { replace: true });
      }
    }).catch(() => {
      if (mounted) navigate('/', { replace: true });
    });
    return () => { mounted = false; };
  }, [id, navigate]);

  // 自动保存到 localStorage
  useEffect(() => {
    if (!title && !content) return;
    clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const key = id || 'new-draft';
      localStorage.setItem(`draft-${key}`, JSON.stringify({
        title, content, emoji, category, tags, coverImage, isPinned, isFeatured, series,
      }));
    }, 2000);
    return () => clearTimeout(draftTimerRef.current);
  }, [title, content, emoji, category, tags, coverImage, isPinned, isFeatured, series, id]);

  // 加载自动保存的草稿（仅新建时）
  useEffect(() => {
    if (id) return; // 编辑模式不加载自动草稿
    const saved = localStorage.getItem('draft-new-draft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.title || draft.content) {
          const shouldRestore = confirm('检测到未保存的草稿，是否恢复？');
          if (shouldRestore) {
            setTitle(draft.title || '');
            setContent(draft.content || '');
            setEmoji(draft.emoji || '📝');
            setCategory(draft.category || '');
            setTags(draft.tags || []);
            setCoverImage(draft.coverImage || '');
            setIsPinned(draft.isPinned || false);
            setIsFeatured(draft.isFeatured || false);
            setSeries(draft.series || '');
          }
          localStorage.removeItem('draft-new-draft');
        }
      } catch {}
    }
  }, [id]);

  const canSave = title.trim() && content.trim() && category;
  const catValue = category || undefined;

  const handleSave = async (status: 'draft' | 'published') => {
    if (!canSave) return;
    setSaving(true);
    try {
      const articleData = {
        title: title.trim(),
        emoji,
        content: content.trim(),
        status,
        category: catValue,
        tags,
        coverImage: coverImage.trim(),
        isPinned,
        isFeatured,
        series: series.trim(),
      };
      if (isEditing && id) {
        await updateArticle(id, articleData);
        await syncToGist().catch(() => {});
        setSaving(false);
        // 清除草稿
        localStorage.removeItem(`draft-${id}`);
        navigate(`/article/${id}`);
      } else {
        const newArticle = await createArticle(articleData);
        await syncToGist().catch(() => {});
        setSaving(false);
        localStorage.removeItem('draft-new-draft');
        navigate(`/article/${newArticle.id}`);
      }
    } catch {
      setSaving(false);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteArticle(id);
    setShowDeleteConfirm(false);
    navigate('/blog', { replace: true });
  };

  const goBack = () => {
    navigate('/blog');
  };

  return (
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0A0E1A] transition-colors duration-300">
      <Navigation />
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={goBack} className="text-sm text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] dark:text-[#60A5FA] transition-colors">
            ← 返回志趣
          </button>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={() => setShowDeleteConfirm(true)} disabled={saving} className="px-5 py-2 text-sm font-medium text-red-600 bg-white dark:bg-[#1E293B] border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 transition-all disabled:opacity-40">
                  删除
                </button>
                <button onClick={() => handleSave('draft')} disabled={!canSave || saving} className="px-5 py-2 text-sm font-medium text-[#4F4F4F] dark:text-[#94A3B8] bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-lg hover:bg-[#FEF3F0] dark:hover:bg-[#1E293B] hover:border-[#DA583F] transition-all disabled:opacity-40">
                  {saving ? '保存中…' : '存为草稿'}
                </button>
                <button onClick={() => handleSave('published')} disabled={!canSave || saving} className="px-5 py-2 text-sm font-medium text-white bg-[#DA583F] dark:bg-[#3B82F6] rounded-lg hover:bg-[#C43F30] dark:hover:bg-[#2563EB] transition-all disabled:opacity-40">
                  {saving ? '保存中…' : '保存修改'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => handleSave('draft')} disabled={!canSave || saving} className="px-5 py-2 text-sm font-medium text-[#4F4F4F] dark:text-[#94A3B8] bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-lg hover:bg-[#FEF3F0] dark:hover:bg-[#1E293B] hover:border-[#DA583F] transition-all disabled:opacity-40">
                  {saving ? '保存中…' : '存为草稿'}
                </button>
                <button onClick={() => handleSave('published')} disabled={!canSave || saving} className="px-5 py-2 text-sm font-medium text-white bg-[#DA583F] dark:bg-[#3B82F6] rounded-lg hover:bg-[#C43F30] dark:hover:bg-[#2563EB] transition-all disabled:opacity-40">
                  {saving ? '发布中…' : '发布'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 分类选择器 */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-[#767693] dark:text-[#94A3B8] mb-2">选择志趣分类</label>
          <div className="flex flex-wrap gap-2">
            {!category && (
              <p className="w-full text-xs text-amber-500 mb-1">请选择一个分类再保存</p>
            )}
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategory(prev => prev === cat.key ? '' : cat.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm transition-all border ${
                  category === cat.key
                    ? 'bg-[#DA583F] text-white border-[#DA583F]'
                    : 'bg-white dark:bg-[#1E293B] border-[#ECD8D9] dark:border-[#334155] text-[#4F4F4F] dark:text-[#94A3B8] hover:border-[#DA583F] hover:text-[#DA583F] dark:text-[#60A5FA]'
                }`}
              >
                <span className="text-base" title={EMOJI_MEANINGS[cat.icon] || ''}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* emoji 选择器 */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-[#767693] dark:text-[#94A3B8] mb-2">选择标识</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_PRESETS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                title={EMOJI_MEANINGS[e] || ''}
                className={`w-10 h-10 flex items-center justify-center text-lg rounded-lg transition-all border ${
                  e === emoji
                    ? 'bg-[#DA583F] text-white border-[#DA583F]'
                    : 'bg-white dark:bg-[#1E293B] border-[#ECD8D9] dark:border-[#334155] text-[#4F4F4F] dark:text-[#94A3B8] hover:border-[#DA583F] hover:bg-[#FEF3F0] dark:hover:bg-[#1E293B]'
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
          className="w-full text-2xl font-bold text-[#313131] dark:text-[#E2E8F0] placeholder-[#B8B4B0] outline-none mb-6 bg-transparent"
        />

        {/* === Phase 2 新增字段区域 === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 p-5 bg-[#FEFAF9] dark:bg-[#0A0E1A] rounded-xl border border-[#ECD8D9] dark:border-[#334155]">
          {/* 标签 */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#767693] dark:text-[#94A3B8] mb-2">🏷️ 标签</label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          {/* 封面图 */}
          <div>
            <label className="block text-xs font-medium text-[#767693] dark:text-[#94A3B8] mb-2">🖼️ 封面图 URL</label>
            <input
              type="text"
              value={coverImage}
              onChange={e => setCoverImage(e.target.value)}
              placeholder="https://example.com/cover.jpg"
              className="w-full px-3 py-2 text-sm border border-[#ECD8D9] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1E293B] text-[#313131] dark:text-[#E2E8F0] focus:border-[#DA583F] outline-none transition-all placeholder-[#B8B4B0]"
            />
            {coverImage && (
              <div className="mt-2 w-full h-20 rounded-lg overflow-hidden border border-[#ECD8D9] dark:border-[#334155]">
                <img src={coverImage} alt="封面预览" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>

          {/* 系列 */}
          <div>
            <label className="block text-xs font-medium text-[#767693] dark:text-[#94A3B8] mb-2">📖 系列/专栏</label>
            <input
              type="text"
              value={series}
              onChange={e => setSeries(e.target.value)}
              placeholder="如：积极心理治疗入门"
              className="w-full px-3 py-2 text-sm border border-[#ECD8D9] dark:border-[#334155] rounded-lg bg-white dark:bg-[#1E293B] text-[#313131] dark:text-[#E2E8F0] focus:border-[#DA583F] outline-none transition-all placeholder-[#B8B4B0]"
            />
          </div>

          {/* 开关 */}
          <div className="md:col-span-2 flex items-center gap-6 pt-1">
            <Toggle label="📌 置顶" checked={isPinned} onChange={setIsPinned} />
            <Toggle label="⭐ 精选" checked={isFeatured} onChange={setIsFeatured} />
          </div>
        </div>

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

      <AdminLogin />
    </div>
  );
}
