import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import type { Article } from '../types/article';
import { getPublishedArticles } from '../storage/articleStore';
import { getCategories, type CategoryItem } from '../storage/categoryStore';
import { formatDate, getExcerpt, EMOJI_MEANINGS } from '../utils/helpers';
import Navigation from '../components/Navigation';
import AdminLogin from '../components/AdminLogin';

/**
 * 按分类展示文章的独立页面
 * 路由: /category/:key
 * 每个分类一个专属版面，含该分类下所有文章
 */
export default function CategoryPage() {
  const { key: catKey } = useParams<{ key: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [catInfo, setCatInfo] = useState<CategoryItem | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!catKey) { setLoading(false); return; }

    Promise.all([
      getPublishedArticles(),
      getCategories(),
    ]).then(([all, cats]) => {
      if (!mounted) return;
      const cat = cats.find(c => c.key === catKey);
      setCatInfo(cat);
      setArticles(all.filter(a => a.category === catKey));
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [catKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FEF3F0] dark:bg-[#1A1516] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#DA583F]/20 border-t-[#DA583F] rounded-full animate-spin" />
      </div>
    );
  }

  // 分类不存在 → 404
  if (!catInfo) {
    return (
      <div className="min-h-screen bg-[#FEF3F0] dark:bg-[#1A1516]">
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="text-4xl">🔍</div>
          <h2 className="text-xl font-bold text-[#313131] dark:text-[#E8E4E1]">分类不存在</h2>
          <p className="text-sm text-[#767693] dark:text-[#8A8688]">找不到 {catKey} 对应的分类</p>
          <Link to="/#interests" className="mt-4 px-5 py-2.5 text-sm font-medium bg-[#DA583F] text-white rounded-full hover:bg-[#C43F30] transition-colors">
            返回志趣区
          </Link>
        </div>
      </div>
    );
  }

  const isEmpty = articles.length === 0;

  return (
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0F0D0E] text-[#313131] dark:text-[#E8E4E1] font-['PingFang_SC','Microsoft_YaHei','Noto_Sans_SC',sans-serif] transition-colors duration-300">
      <Helmet>
        <title>{catInfo.label} — 玄牙志趣</title>
        <meta name="description" content={`玄牙在「${catInfo.label}」领域的探索——${catInfo.description}`} />
        <meta property="og:title" content={`${catInfo.label} — 玄牙志趣`} />
        <meta property="og:description" content={catInfo.description} />
        <meta property="og:url" content={`https://www.x2ya.com/category/${catKey}`} />
        <link rel="canonical" href={`https://www.x2ya.com/category/${catKey}`} />
      </Helmet>
      <Navigation />

      {/* 页头 */}
      <div className="pt-20 pb-8 px-4 sm:px-8">
        <div className="max-w-[1100px] mx-auto">
          {/* 返回 */}
          <Link
            to="/#interests"
            className="inline-flex items-center gap-2 text-sm text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F] transition-colors mb-8"
          >
            ← 回到志趣区
          </Link>

          {/* 标题区 */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{catInfo.icon}</span>
            <div>
              <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#313131] dark:text-[#E8E4E1] tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif]">
                {catInfo.label}
              </h1>
              <p className="text-[1.05rem] text-[#6E6A7C] dark:text-[#A09CA8] mt-2">{catInfo.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs text-[#B8B4B0] dark:text-[#8A8688]">{articles.length} 篇文章</span>
            <span className="flex-1 h-px bg-[#ECD8D9] dark:bg-[#2A2020]" />
            <Link
              to="/#interests"
              className="text-xs text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F] transition-colors"
            >
              查看全部分类
            </Link>
          </div>
        </div>
      </div>

      {/* 文章列表 */}
      {isEmpty ? (
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pb-32">
          <div className="text-center py-20 bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-3xl">
            <div className="text-4xl mb-4">{catInfo.icon}</div>
            <h3 className="text-lg font-bold text-[#313131] dark:text-[#E8E4E1] mb-2">还没有文章</h3>
            <p className="text-sm text-[#767693] dark:text-[#8A8688]">
              来日方长——「{catInfo.label}」领域的内容正在酝酿中。
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pb-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map(a => (
              <Link
                key={a.id}
                to={`/article/${a.id}`}
                className="group bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-2xl p-6 hover:border-[#DA583F] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(218,88,63,0.06)] transition-all duration-300 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl" title={EMOJI_MEANINGS[a.emoji] || ''}>{a.emoji}</span>
                  <span className="text-sm font-semibold text-[#313131] dark:text-[#E8E4E1] group-hover:text-[#DA583F] transition-colors line-clamp-2 leading-snug">
                    {a.title}
                  </span>
                </div>
                <p className="text-xs text-[#767693] dark:text-[#8A8688] line-clamp-2 mb-4 ml-8 flex-1">
                  {getExcerpt(a.content, 100)}
                </p>
                <div className="flex items-center justify-between ml-8">
                  <span className="text-[11px] text-[#B8B4B0]">{formatDate(a.createdAt)}</span>
                  {a.tags && a.tags.length > 0 && (
                    <span className="text-[10px] text-[#B8B4B0]/60">#{(a.tags as string[])[0]}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <AdminLogin />
    </div>
  );
}
