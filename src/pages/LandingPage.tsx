import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import type { Article } from '../types/article';
import { getPublishedArticles, getAllTags } from '../storage/articleStore';
import { getCategories, type CategoryItem } from '../storage/categoryStore';
import { formatDate, getExcerpt, EMOJI_MEANINGS } from '../utils/helpers';
import Navigation from '../components/Navigation';
import AdminLogin from '../components/AdminLogin';

/* ==============================
   子组件：滚动渐显包装
   ============================== */
function RevealOnScroll({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }
      },
      { threshold: 0.15 }
    );
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}

/* ==============================
   子组件：文章探索区（搜索 + 标签云 + 分类文章）
   ============================== */
function ArticleExplorer() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false); // 延迟加载
  const sectionRef = useRef<HTMLElement>(null);

  // 滚动触发数据加载，避免首屏被 Supabase 请求阻塞
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setHydrated(true); obs.disconnect(); }
      },
      { rootMargin: '400px' } // 提前 400px 触发
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let mounted = true;
    Promise.all([
      getPublishedArticles(),
      getCategories(),
      getAllTags(),
    ]).then(([list, cats, tgs]) => {
      if (mounted) {
        setArticles(list);
        setCategories(cats);
        setTags(tgs);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [hydrated]);

  // 按分类分组
  const categoryArticles = new Map<string, Article[]>();
  for (const a of articles) {
    const cat = a.category || 'misc';
    if (!categoryArticles.has(cat)) categoryArticles.set(cat, []);
    categoryArticles.get(cat)!.push(a);
  }

  // 搜索 + 标签过滤
  const searchLower = searchQuery.toLowerCase();
  const filteredBySearch = searchLower
    ? articles.filter(a => a.title.toLowerCase().includes(searchLower) || (a.content || '').toLowerCase().includes(searchLower))
    : articles;

  const filtered = activeTag
    ? filteredBySearch.filter(a => (a.tags ?? []).includes(activeTag))
    : filteredBySearch;

  if (!hydrated) {
    // 滚动前只渲染轻量占位，不加载 Supabase，加速首屏
    return (
      <section ref={sectionRef} id="interests" className="scroll-mt-20 py-20 snap-section snap-overflow">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#1E293B] dark:text-[#E2E8F0] tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif]">
              志趣探索
            </h2>
            <Link to="/blog" className="flex items-center gap-2 text-sm font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#3B82F6] transition-colors bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-full px-4 py-2.5 hover:border-[#3B82F6] flex-shrink-0">
              志趣所在
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
          <div className="h-3 w-56 bg-[#CBD5E1]/40 dark:bg-[#334155]/40 rounded animate-pulse mb-6" />
          <div className="space-y-4 mt-8">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-[#CBD5E1]/20 dark:bg-[#334155]/20 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (loading) return null;

  return (
    <section ref={sectionRef} id="interests" className="scroll-mt-20">
      {/* 搜索栏 */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pt-28 pb-10">
        <div className="text-xs font-bold tracking-[0.12em] text-[#3B82F6] uppercase mb-2">Explore</div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#1E293B] dark:text-[#E2E8F0] tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif]">
            志趣探索
          </h2>
          <Link
            to="/blog"
            className="flex items-center gap-2 text-sm font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#3B82F6] transition-colors bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-full px-4 py-2.5 hover:border-[#3B82F6] flex-shrink-0"
          >
            志趣所在
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* 搜索输入 */}
        <div className="relative max-w-[480px] mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索文章…"
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm text-[#1E293B] dark:text-[#E2E8F0] placeholder-[#94A3B8] outline-none focus:border-[#3B82F6] transition-colors"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>

        {/* 标签云 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="text-xs px-3 py-1.5 rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors"
              >
                全部 ✕
              </button>
            )}
            {tags.slice(0, 12).map(t => (
              <button
                key={t.tag}
                onClick={() => setActiveTag(activeTag === t.tag ? null : t.tag)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  activeTag === t.tag
                    ? 'border-[#3B82F6] bg-[#EFF6FF] dark:bg-[#1E293B] text-[#3B82F6] font-semibold'
                    : 'border-[#CBD5E1] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:border-[#3B82F6] hover:text-[#3B82F6]'
                }`}
              >
                #{t.tag} <span className="opacity-40 text-[10px]">{t.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 有搜索/标签过滤时：全局结果 */}
      {(searchQuery || activeTag) ? (
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pb-20">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-[#94A3B8] dark:text-[#94A3B8]">没有找到匹配的文章</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(a => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 无过滤时：按分类展示 */
        <>
          {categories.map(cat => {
            const items = (categoryArticles.get(cat.key) || []);
            const hasArticles = items.length > 0;
            return (
              <div key={cat.key} className="py-16 px-4 sm:px-8 border-t border-[#CBD5E1] dark:border-[#334155] first:border-t-0">
                <div className="max-w-[1100px] mx-auto">
                  <CategorySectionHeader cat={cat} count={items.length} />
                  {hasArticles ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
                      {items.slice(0, 3).map(a => (
                        <ArticleCard key={a.id} article={a} />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-8 p-10 text-center bg-white dark:bg-[#1E293B] border border-dashed border-[#CBD5E1] dark:border-[#334155] rounded-2xl">
                      <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">
                        来日方长——「{cat.label}」领域的内容正在酝酿中。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}

function CategorySectionHeader({ cat, count }: { cat: CategoryItem; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-2xl">{cat.icon}</span>
      <div className="flex-1 min-w-0">
        <Link
          to={`/category/${cat.key}`}
          className="inline-flex items-center gap-2 text-[1.2rem] font-bold text-[#1E293B] dark:text-[#E2E8F0] hover:text-[#3B82F6] transition-colors group"
        >
          {cat.label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <p className="text-xs text-[#94A3B8] dark:text-[#94A3B8]">{count} 篇文章 · {cat.description}</p>
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      to={`/article/${article.id}`}
      className="group bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-5 hover:border-[#3B82F6] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(218,88,63,0.06)] transition-all duration-300 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg" title={EMOJI_MEANINGS[article.emoji] || ''}>{article.emoji}</span>
        <span className="text-sm font-medium text-[#1E293B] dark:text-[#E2E8F0] group-hover:text-[#3B82F6] transition-colors line-clamp-1">
          {article.title}
        </span>
      </div>
      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] line-clamp-2 mb-3 ml-7 flex-1">
        {getExcerpt(article.content, 80)}
      </p>
      <div className="flex items-center gap-3 ml-7">
        <span className="text-[11px] text-[#94A3B8]">{formatDate(article.createdAt)}</span>
        {article.tags && article.tags.length > 0 && (
          <span className="text-[10px] text-[#94A3B8]/70">#{(article.tags as string[])[0]}</span>
        )}
      </div>
    </Link>
  );
}

/* ==============================
   主组件：LandingPage
   ============================== */
export default function LandingPage() {
  // 挂载时处理 hash：从其他页面跳转过来或直接访问 /#xxx 时滚动到对应区块
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0E1A] text-[#1E293B] dark:text-[#E2E8F0] font-['PingFang_SC','Microsoft_YaHei','Noto_Sans_SC',sans-serif] transition-colors duration-300 overflow-x-hidden">
      <Helmet>
        <title>玄牙个人世界 — 知无不言，正直之极</title>
        <meta name="description" content="玄牙个人世界——精神科医师的心灵志趣。探索精神医学、积极心理、国学玄学与芳香疗法的交汇处。" />
        <meta property="og:title" content="玄牙个人世界" />
        <meta property="og:description" content="知无不言，正直之极。以理性观照心灵，以热忱探索未知。" />
        <meta property="og:url" content="https://www.x2ya.com" />
        <meta property="og:image" content="https://www.x2ya.com/images/og-image.svg" />
        <meta name="twitter:title" content="玄牙个人世界" />
        <meta name="twitter:description" content="知无不言，正直之极。以理性观照心灵，以热忱探索未知。" />
        <meta name="twitter:image" content="https://www.x2ya.com/images/og-image.svg" />
        <link rel="canonical" href="https://www.x2ya.com" />
      </Helmet>
      <Navigation />

      {/* ===== Hero ===== */}
      <section
        className="snap-section min-h-[100svh] md:min-h-[70vh] flex items-center justify-center relative overflow-hidden px-4 sm:px-8 py-16 sm:py-24"
        id="home"
      >
        {/* 背景装饰 */}
        <div
          className="absolute top-[10%] -right-[8%] w-[520px] h-[400px] rounded-xl pointer-events-none opacity-35 dark:opacity-25 max-sm:w-[260px] max-sm:h-[200px] max-sm:top-[5%] max-sm:-right-[15%] max-sm:opacity-25"
          style={{
            background: "url('/images/hero-bg.webp') no-repeat center/cover",
            maskImage: 'radial-gradient(circle at center, black 50%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 100%)',
          }}
        />
        <div className="absolute -bottom-[30%] -left-[10%] w-[500px] h-[500px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(97,111,211,0.06)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(97,111,211,0.1)_0%,transparent_70%)]" />

        <div className="text-center relative z-10 max-w-[720px] w-full">
          {/* 角色形象 Logo */}
          <div className="flex justify-center mb-6">
            <img src="/images/logo.webp" alt="玄牙" className="w-20 h-20 rounded-full object-cover opacity-90" />
          </div>
          <h1 className="text-[clamp(3rem,8vw,6rem)] font-black text-[#1E293B] dark:text-[#E2E8F0] leading-tight mb-2 tracking-wider font-['PingFang_SC','Noto_Serif_SC',serif] max-sm:text-[2.5rem]">
            玄<span className="text-[#3B82F6]">牙</span>
          </h1>
          {/* 身份标签 */}
          <p className="text-[0.95rem] text-[#6366F1] dark:text-[#8B9AE8] font-medium tracking-[0.15em] mb-5">
            精神科医师 · 心灵探索者
          </p>
          <p className="text-[1.1rem] text-[#64748B] dark:text-[#94A3B8] leading-relaxed mb-10 max-w-[480px] mx-auto">
            知无不言，正直之极。<br />
            以理性观照心灵，以热忱探索未知。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center flex-wrap">
            <Link
              to="/blog"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-[0.95rem] font-bold tracking-wider bg-[#3B82F6] !text-white shadow-[0_4px_20px_rgba(218,88,63,0.25)] hover:bg-[#2563EB] hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(218,88,63,0.35)] transition-all w-full sm:w-auto"
              style={{ color: '#ffffff' }}
            >
              浏览文章
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-[0.95rem] font-semibold tracking-wider bg-transparent text-[#1E293B] dark:text-[#E2E8F0] border-[1.5px] border-[#CBD5E1] dark:border-[#334155] hover:border-[#3B82F6] hover:text-[#3B82F6] hover:-translate-y-0.5 transition-all w-full sm:w-auto"
            >
              取得联系
            </a>
          </div>
        </div>

        {/* 下滑指示器（仅手机端可见） */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 sm:hidden animate-bounce opacity-40">
          <span className="text-[10px] tracking-[0.15em] text-[#64748B] dark:text-[#94A3B8]">上滑探索</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#64748B] dark:text-[#94A3B8]">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ===== About ===== */}
      <section className="snap-section snap-overflow relative py-20 sm:py-32 px-4 sm:px-8 overflow-hidden" id="about">
        {/* 装饰 */}
        <div
          className="absolute -bottom-[5%] -right-[12%] w-[380px] h-[280px] rounded-xl pointer-events-none opacity-30 dark:opacity-18 z-0 max-sm:w-[200px] max-sm:h-[160px] max-sm:-right-[15%]"
          style={{
            background: "url('/images/about-bg.webp') no-repeat center/cover",
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
          }}
        />
        <div className="max-w-[1100px] mx-auto relative z-10">
          <div className="text-xs font-bold tracking-[0.12em] text-[#3B82F6] uppercase mb-2">About</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#1E293B] dark:text-[#E2E8F0] mb-4 tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif]">认识玄牙</h2>
          <p className="text-[1.05rem] text-[#64748B] dark:text-[#94A3B8] max-w-[560px] mb-12">
            字博謇，取《楚辞》「汝何博謇而好修兮，纷独有此姱节」——知无不言，此心光明。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            {/* 左侧：头像 + 简介 */}
            <RevealOnScroll>
              <div className="flex flex-col items-center md:items-start">
                <div className="flex flex-col items-center gap-2 mb-8">
                  <img
                    src="/images/avatar.webp"
                    alt="玄牙"
                    className="w-[120px] h-[120px] rounded-full object-cover border-[3px] border-white dark:border-[#1E293B] shadow-[0_4px_20px_rgba(218,88,63,0.15)]"
                    loading="lazy"
                  />
                  <span className="text-xs text-[#64748B] dark:text-[#94A3B8] tracking-wider">字博謇</span>
                </div>
                <p className="text-[0.98rem] text-[#475569] dark:text-[#94A3B8] mb-4 leading-relaxed">
                  精神科医师，ENTP人格。一个对心灵世界永远好奇的探索者——在理性与直觉、科学与人文的边界游走。
                </p>
                <p className="text-[0.98rem] text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                  对积极心理、国学玄学同样深感兴趣，相信古老智慧与现代科学可以相互观照。
                </p>
              </div>
            </RevealOnScroll>

            {/* 右侧：数据卡片 */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: 'ENTP', label: 'MBTI 人格类型' },
                { num: 'SCI', label: '霍兰德职业类型' },
                { num: '精神科', label: '临床深耕领域' },
                { num: '科研', label: '学术探索方向', color: '#6366F1' },
              ].map(s => (
                <RevealOnScroll key={s.label}>
                  <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl p-8 text-center hover:border-[#3B82F6] hover:shadow-[0_8px_30px_rgba(218,88,63,0.08)] transition-all">
                    <div
                      className="text-[2rem] font-extrabold font-['PingFang_SC','Noto_Serif_SC',serif]"
                      style={{ color: s.color || '#3B82F6' }}
                    >
                      {s.num}
                    </div>
                    <div className="text-[0.85rem] text-[#64748B] dark:text-[#94A3B8] mt-1.5">{s.label}</div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 志趣探索（文章总览）===== */}
      <ArticleExplorer />

      {/* ===== 行迹 Timeline ===== */}
      <section className="snap-section snap-overflow py-20 sm:py-32 px-4 sm:px-8" id="work">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-xs font-bold tracking-[0.12em] text-[#3B82F6] uppercase mb-2">Journey</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#1E293B] dark:text-[#E2E8F0] mb-4 tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif]">学医行迹</h2>
          <p className="text-[1.05rem] text-[#64748B] dark:text-[#94A3B8] max-w-[560px] mb-12">
            从课堂到临床，从理论到实践——每一步都在靠近那个想成为的精神科医师。
          </p>

          <div className="relative pl-16 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#CBD5E1] dark:before:bg-[#334155]">
            {[
              { year: '此刻', title: '精神科临床一线', desc: '完成住院医师规范化培训，正式开启精神科医师执业之路。', dotColor: '#3B82F6' },
              { year: '硕士阶段', title: '医学硕士 · 精神卫生方向', desc: '系统深入精神医学研究，建立临床与科研双线并行的思维框架。', dotColor: '#6366F1' },
              { year: '本科', title: '临床医学', desc: '医学之路的起点，从解剖到病理，从理论到临床的初次跨越。', dotColor: '#64748B' },
            ].map(item => (
              <RevealOnScroll key={item.title}>
                <div className="relative mb-16 last:mb-0">
                  <div
                    className="absolute left-[-57px] top-1 w-[14px] h-[14px] rounded-full border-[3px] border-[#EFF6FF] dark:border-[#1E293B]"
                    style={{ background: item.dotColor }}
                  />
                  <div className="text-xs font-bold text-[#3B82F6] tracking-[0.08em] mb-1">{item.year}</div>
                  <div className="text-[1.1rem] font-bold text-[#1E293B] dark:text-[#E2E8F0] mb-1">{item.title}</div>
                  <div className="text-sm text-[#64748B] dark:text-[#94A3B8]">{item.desc}</div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* 旅行记录入口卡片 */}
          <RevealOnScroll>
            <Link
              to="/travels"
              className="mt-12 group flex items-center gap-3 sm:gap-5 bg-[#EFF6FF] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-4 sm:p-8 hover:border-[#3B82F6] hover:shadow-[0_8px_30px_rgba(218,88,63,0.08)] transition-all duration-300"
            >
              <div className="text-4xl flex-shrink-0">🏜️</div>
              <div className="flex-1 min-w-0">
                <div className="text-[1.1rem] font-bold text-[#1E293B] dark:text-[#E2E8F0] group-hover:text-[#3B82F6] transition-colors tracking-wide">
                  旅行记录
                </div>
                <div className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1 truncate">
                  西北+青海环线 14 日 · 银川·河西走廊·北疆·独库公路·青海湖
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[#94A3B8] group-hover:text-[#3B82F6] group-hover:translate-x-1 transition-all">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== Contact ===== */}
      <section className="snap-section py-20 sm:py-32 px-4 sm:px-8 bg-[#EFF6FF] dark:bg-[#1E293B]" id="contact">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-xs font-bold tracking-[0.12em] text-[#3B82F6] uppercase mb-2">Contact</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#1E293B] dark:text-[#E2E8F0] mb-4 tracking-wider leading-tight text-center font-['PingFang_SC','Noto_Serif_SC',serif]">取得联系</h2>
          <RevealOnScroll>
            <div className="bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-3xl p-8 sm:p-16 text-center max-w-[600px] mx-auto hover:border-[#3B82F6] hover:shadow-[0_16px_50px_rgba(218,88,63,0.06)] transition-all">
              <p className="text-[1.05rem] text-[#475569] dark:text-[#94A3B8] mb-8">
                来玄牙的世界坐坐，聊聊你最近在想的事。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center">
                <a
                  href="https://www.x2ya.com"
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#F8FAFC] dark:bg-[#0A0E1A] text-[#1E293B] dark:text-[#E2E8F0] font-medium text-[0.92rem] hover:bg-[#EFF6FF] hover:text-[#3B82F6] transition-all"
                >
                  🌐 x2ya.com
                </a>
                <a
                  href="mailto:zhuxinyuan@x2ya.com"
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#F8FAFC] dark:bg-[#0A0E1A] text-[#1E293B] dark:text-[#E2E8F0] font-medium text-[0.92rem] hover:bg-[#EFF6FF] hover:text-[#3B82F6] transition-all"
                >
                  ✉ zhuxinyuan@x2ya.com
                </a>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="text-center py-12 sm:py-16 px-4 sm:px-8 text-[0.85rem] text-[#64748B] dark:text-[#94A3B8] border-t border-[#CBD5E1] dark:border-[#334155]">
        <p>
          <span className="text-[#3B82F6] font-semibold">玄牙</span> — 玄牙个人世界
        </p>
        <div className="max-w-[640px] mx-auto mt-8 pt-4 border-t border-dashed border-[#CBD5E1] dark:border-[#334155] text-left text-xs leading-relaxed">
          <h4 className="text-[0.8rem] text-[#1E293B] dark:text-[#E2E8F0] font-semibold mb-1">免责声明</h4>
          <p className="text-[#64748B] dark:text-[#94A3B8] mb-1.5">
            本站内容仅供信息参考与个人观点表达，不构成任何形式的医疗建议、诊断或治疗意见。如有心理健康困扰，请务必前往正规医疗机构就诊，切勿将本站内容替代专业诊疗。
          </p>
          <h4 className="text-[0.8rem] text-[#1E293B] dark:text-[#E2E8F0] font-semibold mt-2 mb-1">版权声明</h4>
          <p className="text-[#64748B] dark:text-[#94A3B8]">
            本站所有原创内容（文字、设计、图片等）版权归本站所有者所有。未经书面许可，禁止任何形式的转载或商业使用。
          </p>
        </div>
        <div className="mt-6 flex gap-8 justify-center flex-wrap">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.82rem] text-[#64748B] dark:text-[#94A3B8] hover:text-[#3B82F6] transition-colors"
          >
            沪ICP备2023014300号-1
          </a>
        </div>
      </footer>

      {/* 管理员登录（全局齿轮入口） */}
      <AdminLogin />
    </div>
  );
}
