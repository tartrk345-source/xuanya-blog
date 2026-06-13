/** 文章状态：草稿 / 已发布 */
export type ArticleStatus = 'draft' | 'published';

/** 志趣分类标识（支持自定义） */
export type CategoryKey = string;

/** 文章数据结构 */
export interface Article {
  /** 唯一标识（时间戳 + 随机数生成） */
  id: string;
  /** 文章标题 */
  title: string;
  /** Markdown 原始内容 */
  content: string;
  /** 文章标识 emoji，默认 📝 */
  emoji: string;
  /** 发布状态 */
  status: ArticleStatus;
  /** 志趣分类 */
  category?: CategoryKey;
  /** 创建时间戳 */
  createdAt: number;
  /** 最后修改时间戳 */
  updatedAt: number;
  /** 标签列表（最多 8 个） */
  tags?: string[];
  /** 封面图 URL */
  coverImage?: string;
  /** 是否置顶 */
  isPinned?: boolean;
  /** 是否精选 */
  isFeatured?: boolean;
  /** 系列名称（同系列文章关联） */
  series?: string;
}

/** 新建文章时的输入（不含自动生成字段） */
export type ArticleInput = Pick<Article, 'title' | 'content' | 'emoji' | 'status'> & {
  category?: CategoryKey;
  tags?: string[];
  coverImage?: string;
  isPinned?: boolean;
  isFeatured?: boolean;
  series?: string;
};
