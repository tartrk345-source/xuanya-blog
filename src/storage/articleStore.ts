import { supabase } from '../lib/supabase';
import type { Article, CategoryKey } from '../types/article';
import { v4 as uuidv4 } from 'uuid';

// 内存缓存（减少重复请求）
let cache: Article[] = [];
let listCache: Article[] = [];  // 轻量列表缓存（不含 content）
let cacheTime = 0;
let listCacheTime = 0;
const CACHE_TTL = 60_000; // 60秒内复用缓存（之前10秒太短）

/** 轻量查询：只拉列表页需要的字段，不含 content（大幅减少数据传输） */
async function fetchList(): Promise<Article[]> {
  const now = Date.now();
  if (listCache.length > 0 && now - listCacheTime < CACHE_TTL) return listCache;

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, content, emoji, status, category, created_at, updated_at, tags, cover_image, is_pinned, is_featured, series')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] 加载文章列表失败', error);
    return listCache;
  }

  console.log('[Supabase] fetchList 返回', data?.length, '篇文章');
  listCache = (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    content: '',  // 列表页不需要正文
    emoji: row.emoji ?? '📝',
    status: row.status as 'draft' | 'published',
    category: row.category as CategoryKey | undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags ?? [],
    coverImage: row.cover_image ?? '',
    isPinned: row.is_pinned ?? false,
    isFeatured: row.is_featured ?? false,
    series: row.series ?? '',
  }));
  listCacheTime = now;
  return listCache;
}

/** 全量查询（含 content，仅文章详情页使用） */
async function fetchAll(): Promise<Article[]> {
  const now = Date.now();
  if (cache.length > 0 && now - cacheTime < CACHE_TTL) return cache;

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] 加载文章失败', error);
    return cache;
  }

  console.log('[Supabase] fetchAll 返回', data?.length, '篇文章');
  cache = (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    emoji: row.emoji ?? '📝',
    status: row.status as 'draft' | 'published',
    category: row.category as CategoryKey | undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags ?? [],
    coverImage: row.cover_image ?? '',
    isPinned: row.is_pinned ?? false,
    isFeatured: row.is_featured ?? false,
    series: row.series ?? '',
  }));
  cacheTime = now;
  return cache;
}

/** 获取所有文章（含草稿，列表用轻量查询） */
export async function getAllArticles(): Promise<Article[]> {
  return fetchList();
}

/** 获取已发布文章（列表用轻量查询） */
export async function getPublishedArticles(): Promise<Article[]> {
  const all = await fetchList();
  return all.filter(a => a.status === 'published');
}

/** 获取已发布文章（含正文，用于文章详情页和编辑） */
export async function getPublishedArticlesFull(): Promise<Article[]> {
  return fetchAll();
}

/** 按分类分组（仅已发布） */
export async function getArticlesByCategory(): Promise<Partial<Record<CategoryKey, Article[]>>> {
  const published = await getPublishedArticles();
  const result: Partial<Record<CategoryKey, Article[]>> = {};
  for (const a of published) {
    if (a.category) {
      (result as any)[a.category] ??= [];
      (result as any)[a.category].push(a);
    }
  }
  return result;
}

/** 根据 ID 获取文章（含正文，用全量查询） */
export async function getArticleById(id: string): Promise<Article | undefined> {
  const all = await fetchAll();
  return all.find(a => a.id === id);
}

/** 根据标签获取相关文章（排除当前文章） */
export async function getRelatedArticles(articleId: string, tags?: string[], category?: string, limit = 5): Promise<Article[]> {
  const published = await getPublishedArticles();
  if (!tags || tags.length === 0) {
    // 没有标签时按分类推荐
    if (!category) return [];
    return published
      .filter(a => a.id !== articleId && a.category === category)
      .slice(0, limit);
  }
  // 按标签匹配度排序
  const scored = published
    .filter(a => a.id !== articleId)
    .map(a => {
      const overlap = (a.tags ?? []).filter(t => tags!.includes(t)).length;
      const catBonus = a.category === category ? 1 : 0;
      return { article: a, score: overlap + catBonus };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.article);
}

/** 根据系列获取文章列表 */
export async function getArticlesBySeries(seriesName: string): Promise<Article[]> {
  const published = await getPublishedArticles();
  return published
    .filter(a => a.series === seriesName)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/** 获取所有标签（聚合） */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const published = await getPublishedArticles();
  const tagMap = new Map<string, number>();
  for (const a of published) {
    for (const t of (a.tags ?? [])) {
      tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
    }
  }
  return [...tagMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/** 创建文章 */
export async function createArticle(input: {
  title: string;
  content: string;
  emoji?: string;
  status?: 'draft' | 'published';
  category?: CategoryKey;
  tags?: string[];
  coverImage?: string;
  isPinned?: boolean;
  isFeatured?: boolean;
  series?: string;
}): Promise<Article> {
  const now = Date.now();
  const article: Article = {
    id: uuidv4(),
    title: input.title,
    content: input.content,
    emoji: input.emoji ?? '📝',
    status: input.status ?? 'draft',
    category: input.category,
    createdAt: now,
    updatedAt: now,
    tags: input.tags ?? [],
    coverImage: input.coverImage ?? '',
    isPinned: input.isPinned ?? false,
    isFeatured: input.isFeatured ?? false,
    series: input.series ?? '',
  };

  const { error } = await supabase.from('articles').insert({
    id: article.id,
    title: article.title,
    content: article.content,
    emoji: article.emoji,
    status: article.status,
    category: article.category ?? null,
    created_at: article.createdAt,
    updated_at: article.updatedAt,
    tags: article.tags,
    cover_image: article.coverImage || null,
    is_pinned: article.isPinned,
    is_featured: article.isFeatured,
    series: article.series || null,
  });

  if (error) {
    console.error('[Supabase] 创建文章失败', error);
    throw new Error('创建文章失败');
  }

  cache = [article, ...cache];
  cacheTime = Date.now();
  window.dispatchEvent(new Event('articles-changed'));
  return article;
}

/** 更新文章 */
export async function updateArticle(id: string, input: Partial<Article>): Promise<void> {
  const updates: any = { updated_at: Date.now() };
  if (input.title !== undefined) updates.title = input.title;
  if (input.content !== undefined) {
    // 🛡️ 安全阀：拒绝写入空正文
    if (!input.content || input.content.trim().length === 0) {
      console.warn('[Supabase] 拒绝更新: content 为空');
    } else {
      updates.content = input.content;
    }
  }
  if (input.emoji !== undefined) updates.emoji = input.emoji;
  if (input.status !== undefined) updates.status = input.status;
  if (input.category !== undefined) updates.category = input.category ?? null;
  if (input.tags !== undefined) updates.tags = input.tags;
  if (input.coverImage !== undefined) updates.cover_image = input.coverImage || null;
  if (input.isPinned !== undefined) updates.is_pinned = input.isPinned;
  if (input.isFeatured !== undefined) updates.is_featured = input.isFeatured;
  if (input.series !== undefined) updates.series = input.series || null;

  const { error } = await supabase
    .from('articles')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('[Supabase] 更新文章失败', error);
    throw new Error('更新文章失败');
  }

  const idx = cache.findIndex(a => a.id === id);
  if (idx !== -1) {
    cache[idx] = { ...cache[idx], ...input, updatedAt: updates.updated_at };
  }
  cacheTime = 0; // 强制下次重新拉取
  window.dispatchEvent(new Event('articles-changed'));
}

/** 删除文章 */
export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] 删除文章失败', error);
    throw new Error('删除文章失败');
  }

  cache = cache.filter(a => a.id !== id);
  window.dispatchEvent(new Event('articles-changed'));
}

/** 导出所有文章（用于备份） */
export function exportAllArticles(): Article[] {
  return [...cache];
}

/** 导入文章（安全 upsert 模式，不删现有数据，拒绝空 content） */
export async function importArticles(articles: Article[]): Promise<void> {
  for (const a of articles) {
    // 🛡️ 安全阀：拒绝写入空正文（防止 Gist 空数据覆盖数据库）
    if (!a.content || a.content.trim().length === 0) {
      console.warn(`[Supabase] 跳过文章 ${a.id}: content 为空，拒绝写入`);
      continue;
    }

    const row = {
      id: a.id,
      title: a.title,
      content: a.content,
      emoji: a.emoji ?? '📝',
      status: a.status,
      category: a.category ?? null,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
      tags: a.tags ?? [],
      cover_image: a.coverImage || null,
      is_pinned: a.isPinned ?? false,
      is_featured: a.isFeatured ?? false,
      series: a.series || null,
    };

    const { error } = await supabase
      .from('articles')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error(`[Supabase] 导入文章 ${a.id} 失败`, error);
    }
  }

  cacheTime = 0;
  listCacheTime = 0;
  await fetchAll();
}
