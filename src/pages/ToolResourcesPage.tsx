import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import {
  RESOURCE_QUESTIONS,
  RESOURCE_OPTS,
  LOAD_ITEMS,
  RESOURCE_TOTAL,
  RESOURCE_MAX_PER_DIM,
  scoreResources,
} from '../data/tools/resources';

const ALL_QUESTIONS = [
  ...RESOURCE_QUESTIONS.map(q => ({ text: q.text, isLoad: false })),
  ...LOAD_ITEMS.map(t => ({ text: t, isLoad: true })),
];

export default function ToolResourcesPage() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const current = ALL_QUESTIONS[index];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / RESOURCE_TOTAL) * 100);

  const result = useMemo(() => scoreResources(answers), [answers]);
  const allAnswered = answeredCount === RESOURCE_TOTAL;

  const choose = (value: number) => {
    const next = { ...answers, [index]: value };
    setAnswers(next);
    if (index < RESOURCE_TOTAL - 1) {
      window.setTimeout(() => setIndex(i => Math.min(i + 1, RESOURCE_TOTAL - 1)), 150);
    } else if (Object.keys(next).length === RESOURCE_TOTAL) {
      window.setTimeout(() => setDone(true), 200);
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
      '我的资源图谱 · 十种能力（十次版）',
      `主力：${result.top.map(d => `${d.cap} ${d.score}/${RESOURCE_MAX_PER_DIM}`).join(' · ')}`,
      `顺手度：${result.pct}% · ${result.level.label}（${result.level.note}）`,
      `耗损：${result.load} / 20`,
      ...result.ranked.map(d => `${d.cap}：${d.score}/${RESOURCE_MAX_PER_DIM}`),
      '— 来自 x2ya.com/tools/resources',
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
        <title>资源图谱 · 十种能力 — 自助工具 · 玄牙</title>
        <meta name="description" content="把十种常被当成缺点的模式，还原成十种能力：托付、谨慎、尽责、感染、感受、审辨、出彩、曲线坚持、自立、体贴。45 题自评，即时出图。" />
        <link rel="canonical" href="https://www.x2ya.com/tools/resources" />
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
              <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase mb-2">Resources</div>
              <h1 className="text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif] mb-3">
                我的资源图谱
              </h1>
              <p className="text-[15px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed mb-4">
                这不是成绩单，是一张资源图——没有一项是缺点，每一项都是你保护自己、活到今天的能力；只是有的出现得多，有的出现得少。
              </p>
              <div className="rounded-2xl border border-[#ECD8D9] dark:border-[#334155] bg-[#FBF3E4] dark:bg-[#2A2418] px-4 py-3 mb-8">
                <div className="text-[14px] font-semibold">同一个情境，假如遇到十次，我会这样几次？</div>
                <div className="text-[12.5px] text-[#6E6A7C] dark:text-[#94A3B8] mt-1 leading-relaxed">
                  说明只读这一次，下面的题不用再想「几次」。0＝从不这样 · 10＝每次都是。
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-[#767693] dark:text-[#94A3B8] mb-2">
                  <span>第 {index + 1} / {RESOURCE_TOTAL} 题{current.isLoad ? ' · 耗损自检' : ''}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F1E5E3] dark:bg-[#1E293B] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#DA583F] dark:bg-[#60A5FA] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-3xl p-5 sm:p-8">
                <div className="text-[1.15rem] sm:text-[1.3rem] font-semibold leading-relaxed mb-7 min-h-[3.5rem]">
                  {current.text}
                </div>

                <div className="flex flex-col gap-2.5">
                  {RESOURCE_OPTS.map((label, value) => {
                    const selected = answers[index] === value;
                    return (
                      <button
                        key={label}
                        onClick={() => choose(value)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-left transition-all duration-200 ${
                          selected
                            ? 'border-[#DA583F] dark:border-[#60A5FA] bg-[#FEF3F0] dark:bg-[#17233B]'
                            : 'border-[#ECD8D9] dark:border-[#334155] hover:border-[#DA583F]/60 dark:hover:border-[#60A5FA]/60 hover:bg-[#FEF3F0]/60 dark:hover:bg-[#17233B]/60'
                        }`}
                      >
                        <span className={`text-[15px] ${selected ? 'font-semibold text-[#DA583F] dark:text-[#60A5FA]' : 'text-[#4F4F4F] dark:text-[#CBD5E1]'}`}>
                          {label}
                        </span>
                        <span className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                i <= value
                                  ? 'bg-[#DA583F] dark:bg-[#60A5FA]'
                                  : 'bg-[#ECD8D9] dark:bg-[#334155]'
                              }`}
                            />
                          ))}
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

                {allAnswered ? (
                  <button
                    onClick={() => setDone(true)}
                    className="px-6 py-2.5 rounded-full bg-[#DA583F] dark:bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#C43F30] dark:hover:bg-[#1D4ED8] transition-colors"
                  >
                    看我的资源图
                  </button>
                ) : (
                  <button
                    onClick={() => setIndex(i => Math.min(RESOURCE_TOTAL - 1, i + 1))}
                    disabled={answers[index] === undefined}
                    className="text-sm text-[#767693] dark:text-[#94A3B8] disabled:opacity-30 hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors"
                  >
                    下一题 →
                  </button>
                )}
              </div>

              <p className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] mt-10 leading-relaxed">
                本工具为自省用，无信效度验证，不是诊断。作答只在本页内存里计算，刷新即清空。
              </p>
            </>
          ) : (
            <>
              <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase mb-2">Result</div>
              <h1 className="text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif] mb-2">
                你的资源图
              </h1>
              <p className="text-[15px] text-[#6E6A7C] dark:text-[#94A3B8] mb-8">
                没有一个是缺点——这是你身上最常出现的三样能力。
              </p>

              {/* 三种主力 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {result.top.map((d, i) => (
                  <div
                    key={d.key}
                    className="rounded-2xl border border-[#ECD8D9] dark:border-[#334155] bg-white dark:bg-[#1E293B] px-4 py-5 text-center"
                  >
                    <div className="text-[11.5px] tracking-[0.1em] text-[#B8B4B0] dark:text-[#64748B]">
                      {i === 0 ? '主力' : i === 1 ? '次主力' : '后援'}
                    </div>
                    <div className="text-xl font-bold mt-1.5">{d.cap}</div>
                    <div className="text-[12px] text-[#767693] dark:text-[#94A3B8] mt-1">
                      {d.score} / {RESOURCE_MAX_PER_DIM}
                    </div>
                  </div>
                ))}
              </div>

              {/* 十项条形 */}
              <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-3xl p-5 sm:p-8">
                <div className="text-sm font-bold mb-1">十种能力</div>
                <div className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] mb-5">出现最多的排前面 · 单维 0–{RESOURCE_MAX_PER_DIM} 分</div>
                <div className="space-y-4">
                  {result.ranked.map(d => (
                    <div key={d.key}>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[14.5px] font-semibold">{d.cap}</span>
                          <span className="text-[11px] text-[#B8B4B0] dark:text-[#64748B]">曾被叫作「{d.former}」</span>
                        </div>
                        <span className="text-[12.5px] font-bold tabular-nums text-[#DA583F] dark:text-[#60A5FA]">
                          {d.score}<span className="text-[11px] font-normal text-[#B8B4B0] dark:text-[#64748B]"> / {RESOURCE_MAX_PER_DIM}</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#F5F1F0] dark:bg-[#0F172A] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#DA583F] dark:bg-[#60A5FA] transition-all duration-500"
                          style={{ width: `${Math.max(4, (d.score / RESOURCE_MAX_PER_DIM) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 每一种都是能力 */}
              <div className="mt-6 bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-2xl p-5 sm:p-6">
                <div className="text-sm font-bold mb-4">每一种，都是能力</div>
                <div className="space-y-4">
                  {result.ranked.map(d => (
                    <div key={d.key} className="pb-4 border-b border-[#F1E5E3] dark:border-[#334155] last:border-0 last:pb-0">
                      <div className="text-[14.5px] font-semibold mb-1">
                        {d.cap}
                        <span className="text-[11px] font-normal text-[#B8B4B0] dark:text-[#64748B] ml-2">{d.score} / {RESOURCE_MAX_PER_DIM}</span>
                      </div>
                      <div className="text-[13px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">✦ {d.pos}</div>
                      <div className="text-[13px] text-[#C08A2E] dark:text-[#FBBF24] leading-relaxed mt-1">平衡一句：{d.bal}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[12.5px] text-[#767693] dark:text-[#94A3B8] leading-relaxed mt-4 pl-3 border-l-2 border-[#ECD8D9] dark:border-[#334155]">
                  自检一句：这些能力，你都能收放自如吗？——能收放＝自由；只会一个姿势＝记得也练练另一只手。
                </p>
              </div>

              {/* 顺手度与耗损 */}
              <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-[#FEF3F0] dark:bg-[#17233B] border border-[#ECD8D9] dark:border-[#334155]">
                <div className="text-sm font-bold mb-2">顺手度与耗损</div>
                <div className="text-[15px] mb-1">
                  顺手度 <span className="font-bold text-[#DA583F] dark:text-[#60A5FA]">{result.pct}%</span> · {result.level.label}
                  <span className="text-[13px] text-[#6E6A7C] dark:text-[#94A3B8]"> —— {result.level.note}</span>
                </div>
                <p className="text-[13px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed mt-2">
                  耗损自检 {result.load} / 20：{result.loadNote}
                </p>
                <p className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] leading-relaxed mt-3">
                  这一版量的是「十次里几次」——已经扣掉了环境的影响，所以同一个人隔一个月再答，分数应该更稳。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-8">
                <button
                  onClick={restart}
                  className="px-5 py-2.5 rounded-full bg-[#DA583F] dark:bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#C43F30] dark:hover:bg-[#1D4ED8] transition-colors"
                >
                  重新作答
                </button>
                <button
                  onClick={copyResult}
                  className="px-5 py-2.5 rounded-full border border-[#ECD8D9] dark:border-[#334155] text-sm text-[#4F4F4F] dark:text-[#CBD5E1] hover:border-[#DA583F] dark:hover:border-[#60A5FA] transition-colors"
                >
                  {copied ? '已复制 ✓' : '复制结果'}
                </button>
                <Link
                  to="/tools/wippf"
                  className="text-sm text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors"
                >
                  想更有信效度的版本 → WIPPF
                </Link>
              </div>

              <p className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] mt-8 leading-relaxed">
                本结果仅供自我觉察，非诊断。想要有信效度的版本，请使用 WIPPF（威斯巴登积极心理治疗问卷），或在专业陪伴下讨论。
                若近期持续情绪低落、睡眠明显改变，或出现伤害自己的想法，请直接联系精神科 / 心理专业机构。
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
