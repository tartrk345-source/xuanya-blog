import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import {
  STRESS_ITEMS,
  STRESS_DOMAINS,
  SCORE_OPTIONS,
  STRESS_MIN_PER_DOMAIN,
  STRESS_MAX_PER_DOMAIN,
  STRESS_MIN_TOTAL,
  STRESS_MAX_TOTAL,
  scoreStress,
  levelOf,
} from '../data/tools/pptStress';

const LEVEL_LABEL = { low: '偏低', mid: '中等', high: '偏高' } as const;
const LEVEL_STYLE = {
  low: 'text-[#767693] dark:text-[#94A3B8] bg-[#F5F1F0] dark:bg-[#0F172A]',
  mid: 'text-[#C08A2E] bg-[#FBF3E4] dark:bg-[#2A2418]',
  high: 'text-[#DA583F] dark:text-[#F87171] bg-[#FEF3F0] dark:bg-[#3B1D1D]',
} as const;

export default function ToolStressPage() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const current = STRESS_ITEMS[index];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / STRESS_ITEMS.length) * 100);

  const result = useMemo(() => scoreStress(answers), [answers]);

  const choose = (value: number) => {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    if (index < STRESS_ITEMS.length - 1) {
      window.setTimeout(() => setIndex(i => Math.min(i + 1, STRESS_ITEMS.length - 1)), 180);
    } else if (Object.keys(next).length === STRESS_ITEMS.length) {
      window.setTimeout(() => setDone(true), 220);
    }
  };

  const restart = () => {
    setAnswers({});
    setIndex(0);
    setDone(false);
    setCopied(false);
  };

  const copyResult = async () => {
    const lines = [
      '压力应对测评（积极心理治疗版 · PPT-ST）',
      ...STRESS_DOMAINS.map(d => `${d.name}领域：${result.scores[d.key]} / ${STRESS_MAX_PER_DOMAIN}（${LEVEL_LABEL[levelOf(result.scores[d.key])]}）`),
      `总分：${result.total} / ${STRESS_MAX_TOTAL}`,
      `压力主要落在：${result.highest.name}领域`,
      '— 来自 x2ya.com/tools/stress',
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0A0E1A] text-[#313131] dark:text-[#E2E8F0] font-['PingFang_SC','Microsoft_YaHei','Noto_Sans_SC',sans-serif] transition-colors duration-300">
      <Helmet>
        <title>压力应对测评 — 自助工具 · 玄牙</title>
        <meta name="description" content="基于积极心理治疗平衡模型的压力应对测评（PPT-ST）：12 道题，看清压力主要落在身体、成就、关系还是未来领域。" />
        <link rel="canonical" href="https://www.x2ya.com/tools/stress" />
      </Helmet>
      <Navigation />

      <div className="pt-16 sm:pt-20 pb-24 px-4 sm:px-8">
        <div className="max-w-[760px] mx-auto">
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 text-sm text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors mb-8"
          >
            ← 自助工具
          </Link>

          {!done ? (
            <>
              <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase mb-2">PPT-ST</div>
              <h1 className="text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif] mb-3">
                压力应对测评
              </h1>
              <p className="text-[15px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed mb-8">
                每个人都有自己的压力，压力会从不同的地方冒出来。下面是一些人在压力下的说法，
                请按你的真实情况判断你有多同意——没有对错，也不会有分数高低，只看你更靠近哪一边。
              </p>

              {/* 进度 */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-[#767693] dark:text-[#94A3B8] mb-2">
                  <span>第 {index + 1} / {STRESS_ITEMS.length} 题</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F1E5E3] dark:bg-[#1E293B] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#DA583F] dark:bg-[#60A5FA] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* 题干 */}
              <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-3xl p-5 sm:p-8">
                <div className="text-[1.15rem] sm:text-[1.3rem] font-semibold leading-relaxed mb-7 min-h-[3.5rem]">
                  {current.text}
                </div>

                <div className="flex flex-col gap-3">
                  {SCORE_OPTIONS.map(opt => {
                    const selected = answers[current.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => choose(opt.value)}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all duration-200 ${
                          selected
                            ? 'border-[#DA583F] dark:border-[#60A5FA] bg-[#FEF3F0] dark:bg-[#17233B]'
                            : 'border-[#ECD8D9] dark:border-[#334155] hover:border-[#DA583F]/60 dark:hover:border-[#60A5FA]/60 hover:bg-[#FEF3F0]/60 dark:hover:bg-[#17233B]/60'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 flex-shrink-0 rounded-full border flex items-center justify-center text-xs font-bold ${
                            selected
                              ? 'border-[#DA583F] dark:border-[#60A5FA] bg-[#DA583F] dark:bg-[#2563EB] text-white'
                              : 'border-[#D9C9C7] dark:border-[#475569] text-[#767693] dark:text-[#94A3B8]'
                          }`}
                        >
                          {opt.value}
                        </span>
                        <span className={`text-[15px] ${selected ? 'font-semibold text-[#DA583F] dark:text-[#60A5FA]' : 'text-[#4F4F4F] dark:text-[#CBD5E1]'}`}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setIndex(i => Math.max(0, i - 1))}
                  disabled={index === 0}
                  className="text-sm text-[#767693] dark:text-[#94A3B8] disabled:opacity-30 hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors"
                >
                  ← 上一题
                </button>

                {answeredCount === STRESS_ITEMS.length ? (
                  <button
                    onClick={() => setDone(true)}
                    className="px-6 py-2.5 rounded-full bg-[#DA583F] dark:bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#C43F30] dark:hover:bg-[#1D4ED8] transition-colors"
                  >
                    查看结果
                  </button>
                ) : (
                  <button
                    onClick={() => setIndex(i => Math.min(STRESS_ITEMS.length - 1, i + 1))}
                    disabled={answers[current.id] === undefined}
                    className="text-sm text-[#767693] dark:text-[#94A3B8] disabled:opacity-30 hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors"
                  >
                    下一题 →
                  </button>
                )}
              </div>

              <p className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] mt-10 leading-relaxed">
                量表来源：压力应对测评量表（积极心理治疗版），依照 N. Peseschkian 平衡模型四领域编制。
                作答只在本页内存里计算，刷新即清空。
              </p>
            </>
          ) : (
            <>
              <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase mb-2">Result</div>
              <h1 className="text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif] mb-2">
                你的压力分布
              </h1>
              <p className="text-[15px] text-[#6E6A7C] dark:text-[#94A3B8] mb-8">
                压力主要落在 <span className="font-semibold text-[#DA583F] dark:text-[#60A5FA]">{result.highest.name}领域</span>
                ，相对最空的是 <span className="font-semibold">{result.lowest.name}领域</span>。总分 {result.total} / {STRESS_MAX_TOTAL}。
              </p>
              <p className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] -mt-6 mb-8 leading-relaxed">
                计分：每题 1–4 分，每个领域 3 题，领域分 {STRESS_MIN_PER_DOMAIN}–{STRESS_MAX_PER_DOMAIN} 分（{STRESS_MIN_PER_DOMAIN}–6 偏低 · 7–9 中等 · 10–{STRESS_MAX_PER_DOMAIN} 偏高），总分 {STRESS_MIN_TOTAL}–{STRESS_MAX_TOTAL} 分。
              </p>

              {/* 四领域条形 */}
              <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-3xl p-5 sm:p-8 space-y-6">
                {STRESS_DOMAINS.map(d => {
                  const score = result.scores[d.key];
                  const level = levelOf(score);
                  const pct = Math.max(
                    6,
                    Math.min(
                      100,
                      ((score - STRESS_MIN_PER_DOMAIN) / (STRESS_MAX_PER_DOMAIN - STRESS_MIN_PER_DOMAIN)) * 100,
                    ),
                  );
                  return (
                    <div key={d.key}>
                      <div className="flex items-baseline justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{d.icon}</span>
                          <span className="text-[15px] font-semibold">{d.name}</span>
                          <span className="text-[11px] text-[#B8B4B0] dark:text-[#64748B]">{d.aspect}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${LEVEL_STYLE[level]}`}>{LEVEL_LABEL[level]}</span>
                          <span className="text-sm font-bold tabular-nums" style={{ color: d.color }}>
                            {score}<span className="text-[11px] font-normal text-[#B8B4B0] dark:text-[#64748B]"> / {STRESS_MAX_PER_DOMAIN}</span>
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-[#F5F1F0] dark:bg-[#0F172A] overflow-hidden mb-2.5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: d.color }}
                        />
                      </div>
                      <p className="text-[13px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                        {level === 'low' ? d.low : level === 'mid' ? d.mid : d.high}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* 平衡提示 */}
              <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-[#FEF3F0] dark:bg-[#17233B] border border-[#ECD8D9] dark:border-[#334155]">
                <div className="text-sm font-bold mb-2">
                  {result.spread >= 4 ? '四个领域之间，落差有点大' : '四个领域之间，大致还算平均'}
                </div>
                <p className="text-[13px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                  {result.spread >= 4
                    ? `最高与最低相差 ${result.spread} 分。积极心理治疗看的不是「哪个分数高」，而是这种偏移意味着你正把能量大量押在「${result.highest.name}」上，「${result.lowest.name}」这一块暂时被放到了一边。失衡本身不是病，只是提示你可以往空的那一块补一点。`
                    : `最高与最低只差 ${result.spread} 分，四个领域的分担比较均匀。均匀不等于轻松——如果总分也不低，说明你的压力是「哪一块都在出力」的那种。`}
                </p>
              </div>

              {/* 练习建议 */}
              <div className="mt-6">
                <div className="text-sm font-bold mb-3">可以先试试</div>
                <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-2xl p-5 sm:p-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span>{result.highest.icon}</span>
                      <span className="text-[15px] font-semibold">从{result.highest.name}这一块开始</span>
                    </div>
                    <p className="text-[13px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                      {result.highest.practice}
                    </p>
                  </div>

                  {result.spread >= 4 && (
                    <div className="pt-4 border-t border-[#F1E5E3] dark:border-[#334155]">
                      <div className="flex items-center gap-2 mb-2">
                        <span>{result.lowest.icon}</span>
                        <span className="text-[15px] font-semibold">给{result.lowest.name}留一点位置</span>
                      </div>
                      <p className="text-[13px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                        {result.lowest.practice}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-8">
                <button
                  onClick={restart}
                  className="px-5 py-2.5 rounded-full bg-[#DA583F] dark:bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#C43F30] dark:hover:bg-[#1D4ED8] transition-colors"
                >
                  重新测评
                </button>
                <button
                  onClick={copyResult}
                  className="px-5 py-2.5 rounded-full border border-[#ECD8D9] dark:border-[#334155] text-sm text-[#4F4F4F] dark:text-[#CBD5E1] hover:border-[#DA583F] dark:hover:border-[#60A5FA] transition-colors"
                >
                  {copied ? '已复制 ✓' : '复制结果'}
                </button>
                <Link
                  to="/tools/balance"
                  className="text-sm text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors"
                >
                  再看平衡模型 →
                </Link>
              </div>

              <p className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] mt-8 leading-relaxed">
                本结果仅用于自我觉察，不构成诊断，也不能替代面诊或心理评估。若近期持续情绪低落、睡眠明显改变，或出现伤害自己的想法，请直接联系精神科 / 心理专业机构。
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
