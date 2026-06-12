/**
 * 志趣分类存储层
 *
 * 分类数据持久化于 browser localStorage，支持管理员 CRUD。
 * 首次访问时自动初始化默认分类。
 */

export interface CategoryItem {
  key: string;
  label: string;
  icon: string;
  desc: string;
}

const STORAGE_KEY = 'xuanya-blog-categories';

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { key: 'psychiatry', label: '精神心理', icon: '🧠', desc: '精神分裂症、抑郁障碍、dTMS神经调控——深耕临床一线，以实证回应困惑。' },
  { key: 'bci', label: '脑机接口', icon: '🔬', desc: '神经调控与工程技术的交叉地带，探索精神科治疗的下一站。' },
  { key: 'positive-psychology', label: '积极心理', icon: '🌿', desc: '积极心理治疗、心理韧性与幸福感研究——从疗愈疾病到滋养幸福的视角转换。' },
  { key: 'sinology', label: '国学玄学', icon: '🌏', desc: '国学经典、传统智慧——以理性之眼观照古老学问，在古今之间寻找共鸣。' },
  { key: 'aromatherapy', label: '芳香疗法', icon: '🌸', desc: '精油的科学应用与临床推广——让自然疗愈力触达更多人。' },
  { key: 'misc', label: '万象', icon: '✨', desc: '其余热爱——它们散落在生活的缝隙里，静默发光。' },
];

function loadCategories(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveCategories(DEFAULT_CATEGORIES);
      return [...DEFAULT_CATEGORIES];
    }
    return JSON.parse(raw) as CategoryItem[];
  } catch {
    return [...DEFAULT_CATEGORIES];
  }
}

function saveCategories(items: CategoryItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** 获取所有志趣分类 */
export function getCategories(): CategoryItem[] {
  return loadCategories();
}

/** 添加新分类 */
export function addCategory(item: CategoryItem): CategoryItem[] {
  const items = loadCategories();
  items.push(item);
  saveCategories(items);
  return items;
}

/** 更新分类（按 key 匹配） */
export function updateCategory(key: string, updates: Partial<Omit<CategoryItem, 'key'>>): CategoryItem[] {
  const items = loadCategories();
  const idx = items.findIndex(c => c.key === key);
  if (idx === -1) return items;
  items[idx] = { ...items[idx], ...updates };
  saveCategories(items);
  return items;
}

/** 删除分类（不影响已有文章的 category 字段，每次加载时会兜底到 'misc'） */
export function deleteCategory(key: string): CategoryItem[] {
  const items = loadCategories();
  const filtered = items.filter(c => c.key !== key);
  if (filtered.length === items.length) return items;
  saveCategories(filtered);
  return filtered;
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
