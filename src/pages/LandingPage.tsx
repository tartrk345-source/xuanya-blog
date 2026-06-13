import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import type { Article } from '../types/article';
import { getPublishedArticles } from '../storage/articleStore';
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
   子组件：最新文章预览卡片（Hero 区底部）
   ============================== */
function LatestArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getPublishedArticles().then(list => {
      if (mounted) {
        setArticles(list.slice(0, 3));
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  if (loading) return null;
  if (articles.length === 0) return null;

  return (
    <div className="mt-14 w-full">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs font-bold tracking-[0.12em] text-[#DA583F] uppercase">Latest</span>
        <span className="flex-1 h-px bg-[#ECD8D9] dark:bg-[#2A2020]" />
        <Link
          to="/blog"
          className="text-xs text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F] transition-colors"
        >
          查看全部 →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {articles.map(a => (
          <Link
            key={a.id}
            to={`/article/${a.id}`}
            className="group bg-white/70 dark:bg-[#1C1818]/70 backdrop-blur-sm rounded-xl p-5 border border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(218,88,63,0.08)] transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg" title={EMOJI_MEANINGS[a.emoji] || ''}>{a.emoji}</span>
              <span className="text-sm font-medium text-[#313131] dark:text-[#E8E4E1] group-hover:text-[#DA583F] transition-colors line-clamp-1">
                {a.title}
              </span>
            </div>
            <p className="text-xs text-[#767693] dark:text-[#8A8688] line-clamp-2 mb-2 ml-7">
              {getExcerpt(a.content, 60)}
            </p>
            <p className="text-[11px] text-[#B8B4B0] ml-7">
              {formatDate(a.createdAt)}
            </p>
          </Link>
        ))}
      </div>
    </div>
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
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0F0D0E] text-[#313131] dark:text-[#E8E4E1] font-['PingFang_SC','Microsoft_YaHei','Noto_Sans_SC',sans-serif] transition-colors duration-300">
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
        className="min-h-[70vh] flex items-center justify-center relative overflow-hidden px-8 py-24"
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
          <h1 className="text-[clamp(3rem,8vw,6rem)] font-black text-[#313131] dark:text-[#E8E4E1] leading-tight mb-2 tracking-wider font-['PingFang_SC','Noto_Serif_SC',serif] max-sm:text-[2.5rem]">
            玄<span className="text-[#DA583F]">牙</span>
          </h1>
          {/* 身份标签 */}
          <p className="text-[0.95rem] text-[#616FD3] dark:text-[#8B9AE8] font-medium tracking-[0.15em] mb-5">
            精神科医师 · 心灵探索者
          </p>
          <p className="text-[1.1rem] text-[#6E6A7C] dark:text-[#A09CA8] leading-relaxed mb-10 max-w-[480px] mx-auto">
            知无不言，正直之极。<br />
            以理性观照心灵，以热忱探索未知。
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/blog"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-[0.95rem] font-bold tracking-wider bg-[#DA583F] !text-white shadow-[0_4px_20px_rgba(218,88,63,0.25)] hover:bg-[#C43F30] hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(218,88,63,0.35)] transition-all"
              style={{ color: '#ffffff' }}
            >
              浏览文章
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[0.95rem] font-semibold tracking-wider bg-transparent text-[#313131] dark:text-[#E8E4E1] border-[1.5px] border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F] hover:text-[#DA583F] hover:-translate-y-0.5 transition-all"
            >
              取得联系
            </a>
          </div>

          {/* 最新文章预览 */}
          <LatestArticles />
        </div>
      </section>

      {/* ===== About ===== */}
      <section className="relative py-32 px-4 sm:px-8 overflow-hidden" id="about">
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
          <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] uppercase mb-2">About</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#313131] dark:text-[#E8E4E1] mb-4 tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif]">认识玄牙</h2>
          <p className="text-[1.05rem] text-[#6E6A7C] dark:text-[#A09CA8] max-w-[560px] mb-12">
            字博謇，取《楚辞》「汝何博謇而好修兮，纷独有此姱节」——知无不言，此心光明。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* 左侧：头像 + 简介 */}
            <RevealOnScroll>
              <div className="flex flex-col items-center md:items-start">
                <div className="flex flex-col items-center gap-2 mb-8">
                  <img
                    src="/images/avatar.webp"
                    alt="玄牙"
                    className="w-[120px] h-[120px] rounded-full object-cover border-[3px] border-white dark:border-[#1C1818] shadow-[0_4px_20px_rgba(218,88,63,0.15)]"
                    loading="lazy"
                  />
                  <span className="text-xs text-[#767693] dark:text-[#8A8688] tracking-wider">字博謇</span>
                </div>
                <p className="text-[0.98rem] text-[#4F4F4F] dark:text-[#B8B4B0] mb-4 leading-relaxed">
                  精神科医师，ENTP人格。一个对心灵世界永远好奇的探索者——在理性与直觉、科学与人文的边界游走。
                </p>
                <p className="text-[0.98rem] text-[#4F4F4F] dark:text-[#B8B4B0] leading-relaxed">
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
                { num: '科研', label: '学术探索方向', color: '#616FD3' },
              ].map(s => (
                <RevealOnScroll key={s.label}>
                  <div className="bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-xl p-8 text-center hover:border-[#DA583F] hover:shadow-[0_8px_30px_rgba(218,88,63,0.08)] transition-all">
                    <div
                      className="text-[2rem] font-extrabold font-['PingFang_SC','Noto_Serif_SC',serif]"
                      style={{ color: s.color || '#DA583F' }}
                    >
                      {s.num}
                    </div>
                    <div className="text-[0.85rem] text-[#767693] dark:text-[#8A8688] mt-1.5">{s.label}</div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 兴趣领域 ===== */}
      <section className="py-32 px-4 sm:px-8 bg-[#FEFAF9] dark:bg-[#0F0D0E]" id="interests">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] uppercase mb-2">Interests</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#313131] dark:text-[#E8E4E1] mb-4 tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif]">兴趣领域</h2>
          <p className="text-[1.05rem] text-[#6E6A7C] dark:text-[#A09CA8] max-w-[560px] mb-12">
            精神、心理、传统、科技——在多条河流的交汇处，找到自己的航道。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '🧠', title: '精神医学', desc: '临床一线，以科学照护心灵', color: '#DA583F' },
              { icon: '🌿', title: '积极心理治疗', desc: '东方智慧与现代心理学的融合', color: '#5BA890' },
              { icon: '📜', title: '国学玄学', desc: '古老典籍中的心性智慧', color: '#8B6BAE' },
              { icon: '🌸', title: '芳香疗法', desc: '借草木之力，调身心之气', color: '#C88A3D' },
              { icon: '⚡', title: '脑机接口', desc: '技术前沿与神经科学的交汇', color: '#616FD3' },
              { icon: '✍️', title: '写作随笔', desc: '以文字记录思考与觉察', color: '#6E6A7C' },
            ].map(item => (
              <RevealOnScroll key={item.title}>
                <div className="group bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-2xl p-6 hover:border-[#DA583F] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(218,88,63,0.06)] transition-all duration-300">
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="text-[1.05rem] font-bold text-[#313131] dark:text-[#E8E4E1] mb-1.5 group-hover:text-[#DA583F] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#767693] dark:text-[#8A8688] leading-relaxed">
                    {item.desc}
                  </p>
                  <div className="mt-4 h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-12" style={{ background: item.color }} />
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 行迹 Timeline ===== */}
      <section className="py-32 px-4 sm:px-8" id="work">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] uppercase mb-2">Journey</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#313131] dark:text-[#E8E4E1] mb-4 tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif]">学医行迹</h2>
          <p className="text-[1.05rem] text-[#6E6A7C] dark:text-[#A09CA8] max-w-[560px] mb-12">
            从课堂到临床，从理论到实践——每一步都在靠近那个想成为的精神科医师。
          </p>

          <div className="relative pl-16 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#ECD8D9] dark:before:bg-[#2A2020]">
            {[
              { year: '此刻', title: '精神科临床一线', desc: '完成住院医师规范化培训，正式开启精神科医师执业之路。', dotColor: '#DA583F' },
              { year: '硕士阶段', title: '医学硕士 · 精神卫生方向', desc: '系统深入精神医学研究，建立临床与科研双线并行的思维框架。', dotColor: '#616FD3' },
              { year: '本科', title: '临床医学', desc: '医学之路的起点，从解剖到病理，从理论到临床的初次跨越。', dotColor: '#767693' },
            ].map(item => (
              <RevealOnScroll key={item.title}>
                <div className="relative mb-16 last:mb-0">
                  <div
                    className="absolute left-[-57px] top-1 w-[14px] h-[14px] rounded-full border-[3px] border-[#FEF3F0] dark:border-[#1A1516]"
                    style={{ background: item.dotColor }}
                  />
                  <div className="text-xs font-bold text-[#DA583F] tracking-[0.08em] mb-1">{item.year}</div>
                  <div className="text-[1.1rem] font-bold text-[#313131] dark:text-[#E8E4E1] mb-1">{item.title}</div>
                  <div className="text-sm text-[#767693] dark:text-[#8A8688]">{item.desc}</div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* 旅行记录入口卡片 */}
          <RevealOnScroll>
            <Link
              to="/travels"
              className="mt-12 group flex items-center gap-5 bg-[#FEF3F0] dark:bg-[#1A1516] border border-[#ECD8D9] dark:border-[#2A2020] rounded-2xl p-6 sm:p-8 hover:border-[#DA583F] hover:shadow-[0_8px_30px_rgba(218,88,63,0.08)] transition-all duration-300"
            >
              <div className="text-4xl flex-shrink-0">🏜️</div>
              <div className="flex-1 min-w-0">
                <div className="text-[1.1rem] font-bold text-[#313131] dark:text-[#E8E4E1] group-hover:text-[#DA583F] transition-colors tracking-wide">
                  旅行记录
                </div>
                <div className="text-sm text-[#767693] dark:text-[#8A8688] mt-1 truncate">
                  西北+青海环线 14 日 · 银川·河西走廊·北疆·独库公路·青海湖
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[#B8B4B0] group-hover:text-[#DA583F] group-hover:translate-x-1 transition-all">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== Contact ===== */}
      <section className="py-32 px-4 sm:px-8 bg-[#FEF3F0] dark:bg-[#1A1516]" id="contact">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] uppercase mb-2">Contact</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#313131] dark:text-[#E8E4E1] mb-4 tracking-wider leading-tight text-center font-['PingFang_SC','Noto_Serif_SC',serif]">取得联系</h2>
          <RevealOnScroll>
            <div className="bg-white dark:bg-[#1C1818] border border-[#ECD8D9] dark:border-[#2A2020] rounded-3xl p-16 text-center max-w-[600px] mx-auto hover:border-[#DA583F] hover:shadow-[0_16px_50px_rgba(218,88,63,0.06)] transition-all">
              <p className="text-[1.05rem] text-[#4F4F4F] dark:text-[#B8B4B0] mb-8">
                来玄牙的世界坐坐，聊聊你最近在想的事。
              </p>
              <div className="flex gap-8 justify-center flex-wrap">
                <a
                  href="https://www.x2ya.com"
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#FEFAF9] dark:bg-[#0F0D0E] text-[#313131] dark:text-[#E8E4E1] font-medium text-[0.92rem] hover:bg-[#FEF3F0] hover:text-[#DA583F] transition-all"
                >
                  🌐 x2ya.com
                </a>
                <a
                  href="mailto:zhuxinyuan@x2ya.com"
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#FEFAF9] dark:bg-[#0F0D0E] text-[#313131] dark:text-[#E8E4E1] font-medium text-[0.92rem] hover:bg-[#FEF3F0] hover:text-[#DA583F] transition-all"
                >
                  ✉ zhuxinyuan@x2ya.com
                </a>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="text-center py-16 px-8 text-[0.85rem] text-[#767693] dark:text-[#8A8688] border-t border-[#ECD8D9] dark:border-[#2A2020]">
        <p>
          <span className="text-[#DA583F] font-semibold">玄牙</span> — 玄牙个人世界
        </p>
        <div className="max-w-[640px] mx-auto mt-8 pt-4 border-t border-dashed border-[#ECD8D9] dark:border-[#2A2020] text-left text-xs leading-relaxed">
          <h4 className="text-[0.8rem] text-[#313131] dark:text-[#E8E4E1] font-semibold mb-1">免责声明</h4>
          <p className="text-[#767693] dark:text-[#8A8688] mb-1.5">
            本站内容仅供信息参考与个人观点表达，不构成任何形式的医疗建议、诊断或治疗意见。如有心理健康困扰，请务必前往正规医疗机构就诊，切勿将本站内容替代专业诊疗。
          </p>
          <h4 className="text-[0.8rem] text-[#313131] dark:text-[#E8E4E1] font-semibold mt-2 mb-1">版权声明</h4>
          <p className="text-[#767693] dark:text-[#8A8688]">
            本站所有原创内容（文字、设计、图片等）版权归本站所有者所有。未经书面许可，禁止任何形式的转载或商业使用。
          </p>
        </div>
        <div className="mt-6 flex gap-8 justify-center flex-wrap">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.82rem] text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F] transition-colors"
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
