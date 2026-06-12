/**
 * 志趣分类存储层（Supabase 版）
 *
 * 分类数据持久化于 Supabase，支持管理员 CRUD。
 * 首次访问时若 Supabase 为空则自动初始化默认分类。
 */

import { supabase } from '../lib/supabase';

export interface CategoryItem {
  key: string;
  label: string;
  icon: string;
  description: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { key: 'psychiatry', label: '精神心理', icon: '🧠', description: '精神分裂症、抑郁障碍、dTMS神经调控——深耕临床一线，以实证回应困惑。' },
  { key: 'bci', label: '脑机接口', icon: '🔬', description: '神经调控与工程技术的交叉地带，探索精神科治疗的下一站。' },
  { key: 'positive-psychology', label: '积极心理', icon: '🌿', description: '积极心理治疗、心理韧性与幸福感研究——从疗愈疾病到滋养幸福的视角转换。' },
  { key: 'sinology', label: '国学玄学', icon: '🏯', description: '国学经典、传统智慧——以理性之眼观照古老学问，在古今之间寻找共鸣。' },
  { key: 'aromatherapy', label: '芳香疗法', icon: '🌸', description: '精油的科学应用与临床推广——让自然疗愈力触达更多人。' },
  { key: 'misc', label: '万象', icon: '✨', description: '其余热爱——它们散落在生活的缝隙里，静默发光。' },
];

// 内存缓存，减少重复请求
let categoriesCache: CategoryItem[] | null = null;

async function loadCategoriesFromSupabase(): Promise<CategoryItem[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('key, label, icon, description');

  if (error) {
    console.error('[categoryStore] 加载分类失败', error);
    return DEFAULT_CATEGORIES;
  }

  if (!data || data.length === 0) {
    // 数据库为空，初始化默认分类
    const toInsert = DEFAULT_CATEGORIES.map(({ key, label, icon, description }) => ({
      key,
      label,
      icon,
      description,
    }));
    await supabase.from('categories').insert(toInsert);
    categoriesCache = [...DEFAULT_CATEGORIES];
    return categoriesCache;
  }

  // 按 DEFAULT_CATEGORIES 的顺序排列（保证前端展示顺序一致）
  const orderMap = new Map(DEFAULT_CATEGORIES.map((c, i) => [c.key, i]));
  const sorted = [...(data as CategoryItem[])]
    .sort((a, b) => (orderMap.get(a.key) ?? 99) - (orderMap.get(b.key) ?? 99));
  categoriesCache = sorted;
  return categoriesCache;
}

/** 获取所有志趣分类 */
export async function getCategories(): Promise<CategoryItem[]> {
  if (categoriesCache) return categoriesCache;
  return await loadCategoriesFromSupabase();
}

/** 添加新分类 */
export async function addCategory(item: CategoryItem): Promise<CategoryItem[]> {
  const { error } = await supabase
    .from('categories')
    .insert([{ key: item.key, label: item.label, icon: item.icon, description: item.description }]);
  if (error) {
    console.error('[categoryStore] 添加分类失败', error);
    return categoriesCache || DEFAULT_CATEGORIES;
  }
  categoriesCache = [...(categoriesCache || []), item];
  emitCategoriesChange();
  return categoriesCache;
}

/** 更新分类（按 key 匹配） */
export async function updateCategory(key: string, updates: Partial<Omit<CategoryItem, 'key'>>): Promise<CategoryItem[]> {
  const { error } = await supabase
    .from('categories')
    .update(updates)
    .eq('key', key);
  if (error) {
    console.error('[categoryStore] 更新分类失败', error);
    return categoriesCache || DEFAULT_CATEGORIES;
  }
  if (categoriesCache) {
    const idx = categoriesCache.findIndex(c => c.key === key);
    if (idx !== -1) {
      categoriesCache[idx] = { ...categoriesCache[idx], ...updates };
    }
  }
  emitCategoriesChange();
  return categoriesCache || await getCategories();
}

/** 删除分类（不影响已有文章的 category 字段，每次加载时会兜底到 'misc'） */
export async function deleteCategory(key: string): Promise<CategoryItem[]> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('key', key);
  if (error) {
    console.error('[categoryStore] 删除分类失败', error);
    return categoriesCache || DEFAULT_CATEGORIES;
  }
  if (categoriesCache) {
    categoriesCache = categoriesCache.filter(c => c.key !== key);
  }
  emitCategoriesChange();
  return categoriesCache || await getCategories();
}

/** 监听分类变更（跨组件同步） */
export function onCategoriesChange(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener('categories-changed', handler);
  return () => window.removeEventListener('categories-changed', handler);
}

/** 触发分类变更事件 */
export function emitCategoriesChange(): void {
  window.dispatchEvent(new CustomEvent('categories-changed'));
}
