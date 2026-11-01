import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import {
  WIPPF_ITEMS,
  SEC_IDS,
  PRI_IDS,
  CON_IDS,
  ITEM_NAME,
  CON_POLE,
  MOD_ROWS,
  BEH_POLE,
  REL_POLE,
  SCORE_OPTIONS,
  ITEM_MIN,
  ITEM_MAX,
  SUBSCALE_MAX,
  scoreWippf,
  overallZone,
  extremes,
  secList,
  priList,
  conList,
  modList,
  zoneOf,
} from '../data/tools/wippf';

const SEG = 15;
const SEG_COUNT = Math.ceil(WIPPF_ITEMS.length / SEG);

const ZONE_LABEL = { low: '低分', mid: '中间', high: '高分' } as const;

/* ---------- 小部件 ---------- */
function ScoreBar({
  label,
  value,
  max,
  color,
  note,
  left,
  right,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  note?: string;
  left?: string;
  right?: string;
}) {
  const pct = Math.max(3, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-[14px] font-semibold">{label}</span>
          {note && <span className="text-[11px] text-[#B8B4B0] dark:text-[#64748B]">{note}</span>}
        </div>
        <span className="text-[13px] font-bold tabular-nums" style={{ color }}>
          {value}
          <span className="text-[11px] font-normal text-[#B8B4B0] dark:text-[#64748B]"> / {max}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#F5F1F0] dark:bg-[#0F172A] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {(left || right) && (
        <div className="flex justify-between text-[10.5px] text-[#B8B4B0] dark:text-[#64748B] mt-1">
          <span>{left}</span>
          <span>{right}</span>
        </div>
      )}
    </div>
  );
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-2xl p-5 sm:p-6">
      <div className="text-sm font-bold mb-1">{title}</div>
      {sub && <div className="text-[11.5px] text-[#B8B4B0] dark:text-[#64748B] mb-4 leading-relaxed">{sub}</div>}
      <div className={sub ? '' : 'mt-4'}>{children}</div>
    </div>
  );
}

/* ---------- 页面 ---------- */
export default function ToolWippfPage() {
  const [seg, setSeg] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const answeredCount = useMemo(
    () => WIPPF_ITEMS.filter(it => answers[it.code] !== undefined).length,
    [answers],
  );
  const progress = Math.round((answeredCount / WIPPF_ITEMS.length) * 100);

  const segStart = seg * SEG;
  const segItems = WIPPF_ITEMS.slice(segStart, Math.min(segStart + SEG, WIPPF_ITEMS.length));
  const segDone = segItems.every(it => answers[it.code] !== undefined);
  const allDone = answeredCount === WIPPF_ITEMS.length;

  const score = useMemo(() => scoreWippf(answers), [answers]);

  const goto = (n: number) => {
    setSeg(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = () => {
    if (!segDone) return;
    if (seg < SEG_COUNT - 1) goto(seg + 1);
    else if (allDone) setDone(true);
    else {
      const first = WIPPF_ITEMS.findIndex(it => answers[it.code] === undefined);
      if (first >= 0) goto(Math.floor(first / SEG));
    }
  };

  const restart = () => {
    setAnswers({});
    setSeg(0);
    setDone(false);
    setCopied(false);
  };

  const copyResult = async () => {
    const sec = secList(score);
    const pri = priList(score);
    const sorted = [...sec, ...pri, ...conList(score)].sort((a, b) => b.value - a.value);
    const lines = [
      'WIPPF 威斯巴登积极心理治疗与家庭治疗调查表（自评）',
      `继发能力 ${score.secAll} / ${SUBSCALE_MAX.sec}　原发能力 ${score.priAll} / ${SUBSCALE_MAX.pri}`,
      `冲突反应 ${score.conAll} / ${SUBSCALE_MAX.con}　榜样模型 ${score.modAll} / ${SUBSCALE_MAX.mod}`,
      `最高三项：${sorted.slice(0, 3).map(x => `${x.name} ${x.value}`).join('、')}`,
      `最低三项：${sorted.slice(-3).reverse().map(x => `${x.name} ${x.value}`).join('、')}`,
      '— 来自 x2ya.com/tools/wippf（仅自我觉察，非诊断）',
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  /* ---------- 结果数据 ---------- */
  const sec = secList(score);
  const pri = priList(score);
  const con = conList(score);
  const mod = modList(score);
  const secSorted = [...sec].sort((a, b) => b.value - a.value);
  const priSorted = [...pri].sort((a, b) => b.value - a.value);
  const secExt = extremes(sec);
  const priExt = extremes(pri);
  const secZone = overallZone(sec);
  const priZone = overallZone(pri);
  const allSorted = [...sec, ...pri, ...con].sort((a, b) => b.value - a.value);

  const sumRows = [
    { label: '继发能力（社会规范）', a: score.secA, b: score.secB, c: score.secC, range: '每列 11–44', total: score.secAll, max: SUBSCALE_MAX.sec, color: '#616FD3' },
    { label: '原发能力（情感力）', a: score.priA, b: score.priB, c: score.priC, range: '每列 8–32', total: score.priAll, max: SUBSCALE_MAX.pri, color: '#3E9A7E' },
    { label: '冲突反应（平衡模型）', a: score.conA, b: score.conB, c: score.conC, range: '每列 4–16', total: score.conAll, max: SUBSCALE_MAX.con, color: '#C08A2E' },
    { label: '榜样模型', a: score.modT, b: score.modP, c: score.modR, range: '每列 6–24', total: score.modAll, max: SUBSCALE_MAX.mod, color: '#DA583F' },
  ];

  return (
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0A0E1A] text-[#313131] dark:text-[#E2E8F0] font-['PingFang_SC','Microsoft_YaHei','Noto_Sans_SC',sans-serif] transition-colors duration-300">
      <Helmet>
        <title>WIPPF 威斯巴登问卷 · 自助工具 · 玄牙</title>
        <meta name="description" content="威斯巴登积极心理治疗与家庭治疗调查表（WIPPF 2.04 国际版）在线自评：87 题，看继发能力、原发能力、冲突反应与榜样模型。仅作自我觉察，非诊断。" />
        <link rel="canonical" href="https://www.x2ya.com/tools/wippf" />
      </Helmet>
      <Navigation />

      <div className="pt-16 sm:pt-20 pb-24 px-4 sm:px-8">
        <div className="max-w-[820px] mx-auto">
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 text-sm text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors mb-8"
          >
            ← 自助工具
          </Link>

          {!done ? (
            <>
              <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase mb-2">WIPPF · 2.04</div>
              <h1 className="text-[clamp(1.5rem,3.6vw,2.2rem)] font-extrabold tracking-wide leading-tight font-['PingFang_SC','Noto_Serif_SC',serif] mb-3">
                威斯巴登积极心理治疗与家庭治疗调查表
              </h1>
              <p className="text-[14px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed mb-5">
                N. Peseschkian &amp; H. Deidenbach 编制 · 87 道题 · 四级评分（1 完全不同意 → 4 完全同意）· 约 10–15 分钟
              </p>
              <div className="rounded-2xl border border-[#ECD8D9] dark:border-[#334155] bg-[#FBF3E4] dark:bg-[#2A2418] px-4 py-3.5 mb-6">
                <div className="text-[13px] leading-relaxed text-[#6E6A7C] dark:text-[#CBD5E1]">
                  下面列出一些不同年龄、不同性别的人的表述。请从你自己的角度出发评价。不要担心填「错」，因为每个人都有自己的意见。
                  结果用于自我觉察与咨询参考，绝对保密——所有计算只在本页内存里完成，不上传。
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#767693] dark:text-[#94A3B8]">
                  <span><b>1</b> 完全不同意</span>
                  <span><b>2</b> 不同意多于同意</span>
                  <span><b>3</b> 同意多于不同意</span>
                  <span><b>4</b> 完全同意</span>
                </div>
              </div>

              {/* 进度 */}
              <div className="mb-5">
                <div className="flex items-center justify-between text-xs text-[#767693] dark:text-[#94A3B8] mb-2">
                  <span>第 {seg + 1} / {SEG_COUNT} 段 · 已答 {answeredCount} / {WIPPF_ITEMS.length}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F1E5E3] dark:bg-[#1E293B] overflow-hidden">
                  <div className="h-full rounded-full bg-[#DA583F] dark:bg-[#60A5FA] transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex gap-1.5 mt-2.5">
                  {Array.from({ length: SEG_COUNT }).map((_, i) => {
                    const s = i * SEG;
                    const e = Math.min(s + SEG, WIPPF_ITEMS.length);
                    const filled = WIPPF_ITEMS.slice(s, e).every(it => answers[it.code] !== undefined);
                    return (
                      <button
                        key={i}
                        onClick={() => goto(i)}
                        className={`flex-1 h-1.5 rounded-full transition-colors ${
                          i === seg
                            ? 'bg-[#DA583F] dark:bg-[#60A5FA]'
                            : filled
                              ? 'bg-[#DA583F]/40 dark:bg-[#60A5FA]/40'
                              : 'bg-[#F1E5E3] dark:bg-[#334155]'
                        }`}
                        aria-label={`第 ${i + 1} 段`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 题目 */}
              <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-3xl divide-y divide-[#F1E5E3] dark:divide-[#334155] overflow-hidden">
                {segItems.map(it => (
                  <div key={it.code} className="px-4 sm:px-6 py-4">
                    <div className="text-[14.5px] leading-relaxed mb-3">
                      <span className="text-[#B8B4B0] dark:text-[#64748B] tabular-nums mr-2">{it.no}.</span>
                      {it.text}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {SCORE_OPTIONS.map(opt => {
                        const selected = answers[it.code] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setAnswers(prev => ({ ...prev, [it.code]: opt.value }))}
                            className={`px-1 py-2 rounded-xl border text-[12px] leading-tight transition-all duration-150 ${
                              selected
                                ? 'border-[#DA583F] dark:border-[#60A5FA] bg-[#FEF3F0] dark:bg-[#17233B] text-[#DA583F] dark:text-[#60A5FA] font-semibold'
                                : 'border-[#ECD8D9] dark:border-[#334155] text-[#767693] dark:text-[#94A3B8] hover:border-[#DA583F]/50 dark:hover:border-[#60A5FA]/50'
                            }`}
                          >
                            {opt.value} · {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => goto(Math.max(0, seg - 1))}
                  disabled={seg === 0}
                  className="text-sm text-[#767693] dark:text-[#94A3B8] disabled:opacity-30 hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors"
                >
                  ← 上一段
                </button>
                <button
                  onClick={next}
                  disabled={!segDone}
                  className="px-6 py-2.5 rounded-full bg-[#DA583F] dark:bg-[#2563EB] text-white text-sm font-semibold disabled:opacity-30 hover:bg-[#C43F30] dark:hover:bg-[#1D4ED8] transition-colors"
                >
                  {seg < SEG_COUNT - 1 ? '下一段 →' : '看结果'}
                </button>
              </div>

              <p className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] mt-8 leading-relaxed">
                本页仅作自评与教学辅助，不作诊断；正式解读请由受训的积极心理治疗师进行。
                原表：N. Peseschkian &amp; H. Deidenbach, 1988；WIPPF 2.0 of DPPB, Varna, A. Remmers 1995，中译 2009。
              </p>
            </>
          ) : (
            <>
              <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase mb-2">Result</div>
              <h1 className="text-[clamp(1.5rem,3.6vw,2.2rem)] font-extrabold tracking-wide leading-tight font-['PingFang_SC','Noto_Serif_SC',serif] mb-2">
                你的 WIPPF 剖面
              </h1>
              <p className="text-[14px] text-[#6E6A7C] dark:text-[#94A3B8] mb-8 leading-relaxed">
                24 个现实能力，每项 3 题、单项 {ITEM_MIN}–{ITEM_MAX} 分。先看整体落在哪一侧，再看最高与最低的几项——那常常是冲突最容易发生的地方。
              </p>

              {/* 最高三项 / 最低三项 */}
              <Card title="三项速览">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12.5px] text-[#767693] dark:text-[#94A3B8] w-[52px]">最高</span>
                    {allSorted.slice(0, 3).map(x => (
                      <span key={`${x.name}-hi`} className="px-2.5 py-1 rounded-full text-[12.5px] bg-[#FEF3F0] dark:bg-[#17233B] text-[#DA583F] dark:text-[#60A5FA]">
                        {x.name} {x.value}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12.5px] text-[#767693] dark:text-[#94A3B8] w-[52px]">最低</span>
                    {allSorted.slice(-3).reverse().map(x => (
                      <span key={`${x.name}-lo`} className="px-2.5 py-1 rounded-full text-[12.5px] bg-[#F5F1F0] dark:bg-[#0F172A] text-[#767693] dark:text-[#94A3B8]">
                        {x.name} {x.value}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>

              {/* 四个分量表 */}
              <div className="mt-4">
                <Card title="四个分量表" sub="总分为该分量表全部题项之和；括号内为理论满分。样本参考：继发约 108、原发约 69，非人群常模，只作个体内比较。">
                  <div className="space-y-4">
                    {sumRows.map(r => (
                      <ScoreBar key={r.label} label={r.label} value={r.total} max={r.max} color={r.color} note={r.range} />
                    ))}
                  </div>
                </Card>
              </div>

              {/* 继发能力 */}
              <div className="mt-4">
                <Card title="继发能力（社会规范）" sub="11 项 · 单项 3–12 · 低分区域 3–5、中间 6–9、高分区域 10–12">
                  <div className="space-y-3.5">
                    {secSorted.map(x => (
                      <ScoreBar
                        key={x.id}
                        label={x.name}
                        value={x.value}
                        max={ITEM_MAX}
                        color="#616FD3"
                        note={`${x.value < 10 ? ' ' : ''}${ZONE_LABEL[zoneOf(x.value)]}`}
                      />
                    ))}
                  </div>
                  <div className="mt-4 text-[12.5px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                    最低：<b>{secExt.bottomNames}</b>（{secExt.bottom.value} / 12）· 最高：<b>{secExt.topNames}</b>（{secExt.top.value} / 12）。
                    这两项常是容易产生冲突的触发点——可以通过榜样模型，理解它们是怎么被培养出来的。
                  </div>
                </Card>
              </div>

              {/* 原发能力 */}
              <div className="mt-4">
                <Card title="原发能力（情感力）" sub="8 项 · 单项 3–12 · 低分区域 3–5、中间 6–9、高分区域 10–12">
                  <div className="space-y-3.5">
                    {priSorted.map(x => (
                      <ScoreBar key={x.id} label={x.name} value={x.value} max={ITEM_MAX} color="#3E9A7E" note={ZONE_LABEL[zoneOf(x.value)]} />
                    ))}
                  </div>
                  <div className="mt-4 text-[12.5px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                    最低：<b>{priExt.bottomNames}</b>（{priExt.bottom.value} / 12）· 最高：<b>{priExt.topNames}</b>（{priExt.top.value} / 12）。
                    这两项常常提示着我们对情感的需求度——用平衡模型的四个方面（感觉、理性、传统、直觉）看它们是怎么被开发出来的。
                  </div>
                </Card>
              </div>

              {/* 冲突反应 */}
              <div className="mt-4">
                <Card title="冲突反应（平衡模型四域）" sub="3–12 分 · 左极 ←→ 右极：分数越靠右，越倾向用那一端的方式应对">
                  <div className="space-y-4">
                    {con.map(x => (
                      <ScoreBar
                        key={x.id}
                        label={x.name}
                        value={x.value}
                        max={ITEM_MAX}
                        color="#C08A2E"
                        left={CON_POLE[x.id as number][0]}
                        right={CON_POLE[x.id as number][1]}
                      />
                    ))}
                  </div>
                  <div className="mt-4 text-[12.5px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                    看冲突反应的类型和方式：这种反应是从哪里学来的？得到的益处是什么？它在试图避开什么？
                  </div>
                </Card>
              </div>

              {/* 榜样模型 */}
              <div className="mt-4">
                <Card title="榜样模型（童年时期的关系）" sub="6 项 · 3–12 分 · 左极 ←→ 右极">
                  <div className="space-y-4">
                    {mod.map((x, i) => (
                      <ScoreBar
                        key={x.id}
                        label={`${x.name}`}
                        value={x.value}
                        max={ITEM_MAX}
                        color="#DA583F"
                        left={MOD_ROWS[i].pole[0]}
                        right={MOD_ROWS[i].pole[1]}
                      />
                    ))}
                  </div>
                  <div className="mt-4 text-[12.5px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                    跟爸爸和妈妈的关系；父母之间的关系（共生／相反）；社交类型；人生的意义。
                  </div>
                </Card>
              </div>

              {/* 三列剖面 */}
              <div className="mt-4">
                <Card title="三列剖面：a／b／c" sub="a＝我怎么做（自我）· b＝我期待别人怎么做（本我／期待）· c＝我认为应该怎样（超我／理念）">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="text-[#767693] dark:text-[#94A3B8]">
                          <th className="text-left font-medium py-1.5 pr-2">分量表</th>
                          <th className="text-right font-medium py-1.5 px-2">a</th>
                          <th className="text-right font-medium py-1.5 px-2">b</th>
                          <th className="text-right font-medium py-1.5 px-2">c</th>
                          <th className="text-right font-medium py-1.5 pl-2">区间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sumRows.map(r => (
                          <tr key={r.label} className="border-t border-[#F1E5E3] dark:border-[#334155]">
                            <td className="py-2 pr-2">{r.label}</td>
                            <td className="text-right py-2 px-2 tabular-nums">{r.a}</td>
                            <td className="text-right py-2 px-2 tabular-nums">{r.b}</td>
                            <td className="text-right py-2 px-2 tabular-nums">{r.c}</td>
                            <td className="text-right py-2 pl-2 text-[11.5px] text-[#B8B4B0] dark:text-[#64748B]">{r.range}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11.5px] text-[#6E6A7C] dark:text-[#94A3B8]">
                    {BEH_POLE.map(b => (
                      <div key={b.col} className="rounded-xl bg-[#F7F4F3] dark:bg-[#0F172A] px-3 py-2">
                        <b>{b.col}</b> · {b.name}｜{b.left} ←→ {b.right}
                        <div className="text-[10.5px] text-[#B8B4B0] dark:text-[#64748B] mt-0.5">{b.hint}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11.5px] text-[#6E6A7C] dark:text-[#94A3B8]">
                    {REL_POLE.map(r => (
                      <div key={r.col} className="rounded-xl bg-[#F7F4F3] dark:bg-[#0F172A] px-3 py-2">
                        <b>{r.col}</b> · {r.name}｜{r.left}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* 逐步解读 */}
              <div className="mt-4">
                <Card title="逐步解读" sub="按 WIPPF 的逐步解读流程整理；原文提示保留在括号里，供进一步讨论用。">
                  <ol className="space-y-4 text-[13px] leading-relaxed text-[#4F4F4F] dark:text-[#CBD5E1]">
                    <li>
                      <b>一、总体：落在低分区域还是高分区域</b>
                      <div className="mt-1 text-[#6E6A7C] dark:text-[#94A3B8]">
                        继发能力 11 项：低分 {secZone.low} 项 · 中间 {secZone.mid} 项 · 高分 {secZone.high} 项；
                        原发能力 8 项：低分 {priZone.low} 项 · 中间 {priZone.mid} 项 · 高分 {priZone.high} 项。
                        （原文提示：总体看一下继发能力和原发能力——哪一个位于左侧低分区或右侧高分区？）
                      </div>
                    </li>
                    <li>
                      <b>二、继发能力：最低与最高的项</b>
                      <div className="mt-1 text-[#6E6A7C] dark:text-[#94A3B8]">
                        最低 {secExt.bottomNames}（{secExt.bottom.value}），最高 {secExt.topNames}（{secExt.top.value}）。
                        这两项常是容易产生冲突的触发点。
                      </div>
                    </li>
                    <li>
                      <b>三、继发能力的三列 a／b／c</b>
                      <div className="mt-1 text-[#6E6A7C] dark:text-[#94A3B8]">
                        自我 {score.secA} · 本我 {score.secB} · 超我 {score.secC}（每列 11–44）。
                        三列之间的高低差，说明「我怎么做」「我期待别人怎么做」「我认为应该怎样」这三套标准是否一致。
                      </div>
                    </li>
                    <li>
                      <b>四、原发能力：最低与最高的项</b>
                      <div className="mt-1 text-[#6E6A7C] dark:text-[#94A3B8]">
                        最低 {priExt.bottomNames}（{priExt.bottom.value}），最高 {priExt.topNames}（{priExt.top.value}）。
                        这两项常常提示着我们对情感的需求度。
                      </div>
                    </li>
                    <li>
                      <b>五、原发能力的三列 a／b／c</b>
                      <div className="mt-1 text-[#6E6A7C] dark:text-[#94A3B8]">
                        与自己 {score.priA} · 与他人 {score.priB} · 与理念 {score.priC}（每列 8–32）。
                        哪一种情感关系最强？还是几乎都缺？
                      </div>
                    </li>
                    <li>
                      <b>六、冲突反应：最常用的类型与方式</b>
                      <div className="mt-1 text-[#6E6A7C] dark:text-[#94A3B8]">
                        {con.map(x => `${x.name} ${x.value}`).join(' · ')}。
                        （原文提示：这种反应方式是从哪里学到的？得到的益处是什么？在试图逃避什么？）
                      </div>
                    </li>
                    <li>
                      <b>七、榜样模型：童年时期的关系</b>
                      <div className="mt-1 text-[#6E6A7C] dark:text-[#94A3B8]">
                        {mod.map((x, i) => `${MOD_ROWS[i].name} ${x.value}`).join(' · ')}。
                      </div>
                    </li>
                    <li>
                      <b>八、社会行为：需求源从哪里来</b>
                      <div className="mt-1 text-[#6E6A7C] dark:text-[#94A3B8]">
                        a（主动）{score.secA} · r（被动）{score.secB} · k（理念）{score.secC}。
                        需求来自自己、别人，还是偶像身上？
                      </div>
                    </li>
                    <li>
                      <b>九、情感力：最强的情感关系</b>
                      <div className="mt-1 text-[#6E6A7C] dark:text-[#94A3B8]">
                        e（自我）{score.priA} · w（我们／你）{score.priB} · i（理想）{score.priC}。
                      </div>
                    </li>
                  </ol>
                </Card>
              </div>

              {/* 单项明细 */}
              <div className="mt-4">
                <Card title="单项明细" sub="点开某一项，可以看到它由哪 3 道题组成、各得几分。">
                  <div className="space-y-1">
                    {[
                      { title: '继发能力', list: sec, ids: SEC_IDS },
                      { title: '原发能力', list: pri, ids: PRI_IDS },
                      { title: '冲突反应', list: con, ids: CON_IDS },
                    ].map(group => (
                      <details key={group.title} className="group">
                        <summary className="cursor-pointer list-none py-2 text-[13px] font-semibold flex items-center justify-between hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors">
                          <span>{group.title}（{group.list.length} 项）</span>
                          <span className="text-[11px] text-[#B8B4B0] dark:text-[#64748B]">{group.list.reduce((s, x) => s + x.value, 0)} 分</span>
                        </summary>
                        <div className="pb-3 space-y-2">
                          {group.list.map(x => {
                            const codes = [`${x.id}a`, `${x.id}b`, `${x.id}c`];
                            return (
                              <div key={x.id} className="rounded-xl bg-[#F9F6F5] dark:bg-[#0F172A] px-3 py-2">
                                <div className="flex items-center justify-between text-[12.5px] font-medium mb-1">
                                  <span>{ITEM_NAME[x.id as number]}<span className="text-[11px] text-[#B8B4B0] dark:text-[#64748B] ml-2">{x.id}</span></span>
                                  <span className="tabular-nums">{x.value} / 12</span>
                                </div>
                                {codes.map(code => {
                                  const it = WIPPF_ITEMS.find(i => i.code === code);
                                  if (!it) return null;
                                  return (
                                    <div key={code} className="text-[11.5px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                                      第 {it.no} 题 {it.text}　→ {answers[code] ?? '—'}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    ))}
                  </div>
                </Card>
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
                  to="/tools/resources"
                  className="text-sm text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors"
                >
                  换个轻一点的版本 → 资源图谱
                </Link>
              </div>

              <p className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] mt-8 leading-relaxed">
                WIPPF 2.0 of DPPB, Varna, A. Remmers 1995，translation 2009（原表：N. Peseschkian &amp; H. Deidenbach, 1988）。
                本页仅作自评与教学辅助，不作诊断；正式解读请由受训的积极心理治疗师进行。数据不上传，全部在浏览器内计算。
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
