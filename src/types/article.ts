/** 文章状态：草稿 / 已发布 */
export type ArticleStatus = 'draft' | 'published';

/** 志趣分类标识 */
export type CategoryKey = 'psychiatry' | 'bci' | 'positive-psychology' | 'sinology' | 'aromatherapy' | 'misc';

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
}

/** 新建文章时的输入（不含自动生成字段） */
export type ArticleInput = Pick<Article, 'title' | 'content' | 'emoji' | 'status'> & { category?: CategoryKey };
