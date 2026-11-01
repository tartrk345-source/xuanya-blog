import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';

interface ToolMeta {
  to: string;
  title: string;
  subtitle: string;
  icon: string;
  desc: string;
  meta: string[];
}

const TOOLS: ToolMeta[] = [
  {
    to: '/tools/stress',
    title: '压力应对测评',
    subtitle: '压力落在哪个领域？',
    icon: '🌡️',
    desc: '12 道题，看清压力主要从身体、成就、关系还是未来这四个领域冒出来。答案没有对错。',
    meta: ['12 题', '约 3 分钟', '四领域结果图'],
  },
  {
    to: '/tools/balance',
    title: '平衡模型自评',
    subtitle: '你的时间与精力，分给了谁？',
    icon: '⚖️',
    desc: '拖动四个滑块，把一周的投入画成一张图，再标出每个领域的满意程度——看见失衡出在哪一块。',
    meta: ['4 个领域', '约 2 分钟', '投入 / 满意对照'],
  },
  {
    to: '/tools/resources',
    title: '资源图谱 · 十种能力',
    subtitle: '同一个情境，十次里你会这样几次？',
    icon: '🌿',
    desc: '把十种常被当成缺点的模式还原成能力：托付、谨慎、尽责、感染、感受、审辨、出彩、曲线坚持、自立、体贴。',
    meta: ['45 题', '约 6 分钟', '十种能力图谱'],
  },
  {
    to: '/tools/wippf',
    title: 'WIPPF 威斯巴登问卷',
    subtitle: '积极心理治疗的核心自评工具',
    icon: '📐',
    desc: '87 题的完整量表：继发能力、原发能力、冲突反应与榜样模型，逐项剖面与逐步解读。',
    meta: ['87 题', '约 10–15 分钟', '24 项剖面'],
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0A0E1A] text-[#313131] dark:text-[#E2E8F0] font-['PingFang_SC','Microsoft_YaHei','Noto_Sans_SC',sans-serif] transition-colors duration-300">
      <Helmet>
        <title>自助工具 — 玄牙</title>
        <meta name="description" content="基于积极心理治疗的自助测评工具：压力应对测评、平衡模型自评、资源图谱（十种能力）、WIPPF 威斯巴登问卷。可在线填写，即时出结果，数据不上传。" />
        <meta property="og:title" content="自助工具 — 玄牙" />
        <meta property="og:description" content="基于积极心理治疗的自助测评工具，可在线填写并即时出结果。" />
        <meta property="og:url" content="https://www.x2ya.com/tools" />
        <link rel="canonical" href="https://www.x2ya.com/tools" />
      </Helmet>
      <Navigation />

      <div className="pt-16 sm:pt-20 pb-8 px-4 sm:px-8">
        <div className="max-w-[1000px] mx-auto">
          <Link
            to="/category/self-help"
            className="inline-flex items-center gap-2 text-sm text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors mb-8"
          >
            ← 回到自助工具
          </Link>

          <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase mb-2">Tools</div>
          <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#313131] dark:text-[#E2E8F0] tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif] mb-4">
            自助工具
          </h1>
          <p className="text-[1.05rem] text-[#6E6A7C] dark:text-[#94A3B8] max-w-[620px] leading-relaxed mb-3">
            这些量表与方法来自积极心理治疗（Positive Psychotherapy）的平衡模型。它们不是测验，没有分数高低，只是帮你把「我说不清哪里不对」变成「原来是这一块在紧」。
          </p>
          <p className="text-sm text-[#B8B4B0] dark:text-[#94A3B8] max-w-[620px] leading-relaxed mb-12">
            所有作答只留在你自己的浏览器里，不上传、不保存。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TOOLS.map(tool => (
              <Link
                key={tool.to}
                to={tool.to}
                className="group bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-2xl p-5 sm:p-7 hover:border-[#DA583F] hover:-translate-y-1 hover:shadow-[0_10px_36px_rgba(218,88,63,0.08)] transition-all duration-300 flex flex-col"
              >
                <div className="text-3xl mb-4">{tool.icon}</div>
                <h2 className="text-lg font-bold text-[#313131] dark:text-[#E2E8F0] group-hover:text-[#DA583F] dark:group-hover:text-[#60A5FA] transition-colors mb-1">
                  {tool.title}
                </h2>
                <div className="text-[13px] text-[#DA583F] dark:text-[#60A5FA] mb-3">{tool.subtitle}</div>
                <p className="text-sm text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed mb-5 flex-1">{tool.desc}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {tool.meta.map(m => (
                    <span key={m} className="text-[11px] px-2.5 py-1 rounded-full bg-[#FEF3F0] dark:bg-[#0F172A] text-[#767693] dark:text-[#94A3B8]">
                      {m}
                    </span>
                  ))}
                  <span className="ml-auto text-[#B8B4B0] group-hover:text-[#DA583F] dark:group-hover:text-[#60A5FA] group-hover:translate-x-1 transition-all">→</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 p-5 rounded-2xl bg-[#FEF3F0] dark:bg-[#0F172A] border border-[#ECD8D9] dark:border-[#334155]">
            <div className="text-sm font-semibold text-[#313131] dark:text-[#E2E8F0] mb-2">使用前请知悉</div>
            <p className="text-[13px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
              这些工具用于自我觉察与记录，不是诊断工具，也不能替代面诊、心理评估或治疗。如果近期持续情绪低落、睡眠明显改变、出现伤害自己的想法，请直接联系精神科或心理专业机构——比起填表，这时候你更需要一个人。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
