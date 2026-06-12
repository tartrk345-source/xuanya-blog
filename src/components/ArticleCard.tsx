import { Link } from 'react-router-dom';
import type { Article } from '../types/article';
import { formatDate, getExcerpt } from '../utils/helpers';

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const excerpt = getExcerpt(article.content);

  return (
    <article className="group">
      <Link
        to={`/article/${article.id}`}
        className="block py-7 -mx-4 px-4 rounded-lg transition-colors hover:bg-white/60"
      >
        <div className="flex items-baseline gap-3 mb-2">
          {/* emoji 标识 */}
          <span className="text-2xl leading-none select-none" role="img" aria-label="文章标识">
            {article.emoji}
          </span>

          {/* 标题 */}
          <h2 className="text-xl font-medium text-gray-900 leading-snug group-hover:text-gray-600 transition-colors">
            {article.title}
          </h2>
        </div>

        {/* 摘要 */}
        <p className="text-base text-gray-500 leading-relaxed ml-10 line-clamp-2">
          {excerpt}
        </p>

        {/* 日期 */}
        <div className="ml-10 mt-3 flex items-center gap-3">
          <time className="text-sm text-gray-400" dateTime={new Date(article.createdAt).toISOString()}>
            {formatDate(article.createdAt)}
          </time>
          {article.updatedAt !== article.createdAt && (
            <span className="text-xs text-gray-300">（已编辑）</span>
          )}
        </div>
      </Link>
    </article>
  );
}
