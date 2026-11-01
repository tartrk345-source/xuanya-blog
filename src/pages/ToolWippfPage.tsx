import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import ProfileChart, { type ChartRow } from '../components/tools/ProfileChart';
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
  digitsToAnswers,
  encodeAnswerCode,
  decodeAnswerCode,
  pairHypothesis,
  type NamedScore,
  type WippfScore,
} from '../data/tools/wippf';

type Stage = 'intro' | 'quiz' | 'handoff' | 'result';
type Turn = 'me' | 'pa';
/** single：只做自己；device：同设备轮流；code：已有对方答案码 */
type Mode = 'single' | 'device' | 'code';

const ME_COLOR = '#DA583F';
const PA_COLOR = '#3E9A7E';

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-2xl p-5 sm:p-6">
      <div className="text-sm font-bold mb-1">{title}</div>
      {sub && <div className="text-[11.5px] text-[#B8B4B0] dark:text-[#64748B] mb-4 leading-relaxed">{sub}</div>}
      <div className={sub ? '' : 'mt-4'}>{children}</div>
    </div>
  );
}

/* ---------- 单项明细表：每一行＝一项能力（a／b／c ＋ 合计），点击展开原题 ---------- */
function CapRows({
  rows, colLabels, myScore, paScore, meAns, paAns, myLabel, partnerLabel,
}: {
  rows: { id: number; name: string; codes: string[] }[];
  colLabels: [string, string, string];
  myScore: WippfScore;
  paScore: WippfScore | null;
  meAns: Record<string, number>;
  paAns: Record<string, number>;
  myLabel: string;
  partnerLabel: string;
}) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (id: number) =>
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px] min-w-[420px]">
        <thead>
          <tr className="text-[#767693] dark:text-[#94A3B8]">
            <th className="text-left font-medium py-1.5 pr-2 w-9">编号</th>
            <th className="text-left font-medium py-1.5 pr-2">能力</th>
            {paScore ? (
              <>
                <th className="text-right font-medium py-1.5 px-2" style={{ color: ME_COLOR }}>{myLabel} a／b／c</th>
                <th className="text-right font-medium py-1.5 px-2" style={{ color: PA_COLOR }}>{partnerLabel} a／b／c</th>
                <th className="text-right font-medium py-1.5 pl-2">差</th>
              </>
            ) : (
              <>
                <th className="text-right font-medium py-1.5 px-1.5">{colLabels[0]}</th>
                <th className="text-right font-medium py-1.5 px-1.5">{colLabels[1]}</th>
                <th className="text-right font-medium py-1.5 px-1.5">{colLabels[2]}</th>
                <th className="text-right font-medium py-1.5 pl-2">合计</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const total = myScore.cap[r.id] ?? 0;
            const paTotal = paScore ? (paScore.cap[r.id] ?? 0) : 0;
            const d = total - paTotal;
            const isOpen = open.has(r.id);
            return (
              <>
                <tr
                  key={r.id}
                  onClick={() => toggle(r.id)}
                  className="border-t border-[#F1E5E3] dark:border-[#334155] cursor-pointer hover:bg-[#FBF7F6] dark:hover:bg-[#17233B] transition-colors"
                  title="点击展开这 3 道原题"
                >
                  <td className="py-2 pr-2 text-[#B8B4B0] dark:text-[#64748B] tabular-nums">{r.id}</td>
                  <td className="py-2 pr-2">
                    {r.name}
                    <span className={`inline-block ml-1 text-[10px] text-[#B8B4B0] dark:text-[#64748B] transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                  </td>
                  {paScore ? (
                    <>
                      <td className="text-right py-2 px-2 tabular-nums">{r.codes.map(k => meAns[k] ?? 0).join(' / ')}</td>
                      <td className="text-right py-2 px-2 tabular-nums text-[#767693] dark:text-[#94A3B8]">{r.codes.map(k => paAns[k] ?? 0).join(' / ')}</td>
                      <td className={`text-right py-2 pl-2 tabular-nums font-semibold ${d > 0 ? 'text-[#DA583F] dark:text-[#60A5FA]' : d < 0 ? 'text-[#3E9A7E]' : 'text-[#B8B4B0] dark:text-[#64748B]'}`}>
                        {d > 0 ? `+${d}` : d}
                      </td>
                    </>
                  ) : (
                    <>
                      {r.codes.map(k => (
                        <td key={k} className="text-right py-2 px-1.5 tabular-nums text-[#767693] dark:text-[#94A3B8]">{meAns[k] ?? 0}</td>
                      ))}
                      <td className="text-right py-2 pl-2 tabular-nums font-bold">{total}</td>
                    </>
                  )}
                </tr>
                {isOpen && (
                  <tr key={`${r.id}-q`} className="border-t border-[#F1E5E3]/60 dark:border-[#334155]/60">
                    <td colSpan={paScore ? 5 : 6} className="py-2.5 pr-2 bg-[#F9F6F5] dark:bg-[#0F172A]">
                      <div className="text-[11px] text-[#B8B4B0] dark:text-[#64748B] mb-1.5">该能力对应的 3 道原题（再点一次收起）</div>
                      <div className="space-y-1">
                        {r.codes.map(k => {
                          const it = WIPPF_ITEMS.find(i => i.code === k);
                          if (!it) return null;
                          return (
                            <div key={k} className="text-[11.5px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                              <b>第 {it.no} 题</b>　{it.text}　　→ {myLabel}：{meAns[k] ?? '—'}
                              {paScore ? `　　${partnerLabel}：${paAns[k] ?? '—'}` : ''}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- 页面 ---------- */
export default function ToolWippfPage() {
  const [stage, setStage] = useState<Stage>('intro');
  const [mode, setMode] = useState<Mode>('single');
  const [meName, setMeName] = useState('');
  const [paName, setPaName] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [loadedCode, setLoadedCode] = useState<{ name: string; digits: string } | null>(null);
  const [turn, setTurn] = useState<Turn>('me');
  const [index, setIndex] = useState(0);
  const [meAns, setMeAns] = useState<Record<string, number>>({});
  const [paAns, setPaAns] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const pairActive = mode !== 'single';
  const myLabel = meName.trim() || '我';
  const partnerLabel = (loadedCode?.name || paName).trim() || '对方';

  const answers = turn === 'me' ? meAns : paAns;
  const setAnswers = turn === 'me' ? setMeAns : setPaAns;

  const answeredCount = useMemo(
    () => WIPPF_ITEMS.filter(it => answers[it.code] !== undefined).length,
    [answers],
  );
  const progress = Math.round((answeredCount / WIPPF_ITEMS.length) * 100);
  const total = WIPPF_ITEMS.length;
  const current = WIPPF_ITEMS[index];
  const allDone = answeredCount === total;

  const myScore = useMemo(() => scoreWippf(meAns), [meAns]);
  const paAnswers = loadedCode ? digitsToAnswers(loadedCode.digits) : paAns;
  const hasPartner = pairActive && WIPPF_ITEMS.every(it => paAnswers[it.code] !== undefined);
  const paScore = useMemo(() => (hasPartner ? scoreWippf(paAnswers) : null), [paAnswers, hasPartner]);

  const answerCode = useMemo(
    () => (WIPPF_ITEMS.every(it => meAns[it.code] !== undefined) ? encodeAnswerCode(meAns, myLabel) : ''),
    [meAns, myLabel],
  );

  const start = () => {
    if (mode === 'code' && !loadedCode) {
      setCodeError('请先粘贴对方的答案码，或改选其他方式。');
      return;
    }
    setCodeError('');
    setTurn('me');
    setIndex(0);
    setStage('quiz');
    window.scrollTo({ top: 0 });
  };

  const finishTurn = () => {
    if (mode === 'device' && turn === 'me') {
      setStage('handoff');
      window.scrollTo({ top: 0 });
      return;
    }
    setStage('result');
    window.scrollTo({ top: 0 });
  };

  const startPartner = () => {
    setTurn('pa');
    setIndex(0);
    setStage('quiz');
    window.scrollTo({ top: 0 });
  };

  /** 选完一档：记下答案，稍作停顿后自动进入下一题（最后一题答满则出结果） */
  const choose = (value: number) => {
    const item = WIPPF_ITEMS[index];
    if (!item) return;
    const nextAns = { ...answers, [item.code]: value };
    setAnswers(nextAns);
    const complete = WIPPF_ITEMS.every(it => nextAns[it.code] !== undefined);
    if (index < total - 1) {
      window.setTimeout(() => setIndex(i => (i === index ? index + 1 : i)), 160);
    } else if (complete) {
      window.setTimeout(() => finishTurn(), 280);
    }
  };

  const goPrev = () => setIndex(i => Math.max(0, i - 1));

  const goNext = () => {
    if (index < total - 1) {
      setIndex(index + 1);
      return;
    }
    if (allDone) {
      finishTurn();
      return;
    }
    const firstMissing = WIPPF_ITEMS.findIndex(it => answers[it.code] === undefined);
    if (firstMissing >= 0) setIndex(firstMissing);
  };

  /* 键盘：1–4 直接选，← → 翻题 */
  useEffect(() => {
    if (stage !== 'quiz') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        choose(Number(e.key));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const restart = () => {
    setStage('intro');
    setMode('single');
    setCodeInput('');
    setCodeError('');
    setLoadedCode(null);
    setMeAns({});
    setPaAns({});
    setPaName('');
    setTurn('me');
    setIndex(0);
    setCopied(false);
    setCopiedCode(false);
    window.scrollTo({ top: 0 });
  };

  const tryDecode = (raw: string) => {
    setCodeInput(raw);
    if (!raw.trim()) {
      setLoadedCode(null);
      setCodeError('');
      return;
    }
    const decoded = decodeAnswerCode(raw);
    if (!decoded) {
      setLoadedCode(null);
      setCodeError('答案码无法识别：请确认整串都复制进来（含开头的 W1.），且对方 87 题已答完。');
      return;
    }
    setLoadedCode({ name: decoded.name, digits: decoded.digits });
    setCodeError('');
    if (decoded.name) setPaName(decoded.name);
  };

  const copyCode = async () => {
    if (!answerCode) return;
    try {
      await navigator.clipboard.writeText(answerCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(false);
    }
  };

  const copyResult = async () => {
    const sorted = [...secList(myScore), ...priList(myScore), ...conList(myScore)].sort((a, b) => b.value - a.value);
    const lines = hasPartner && paScore
      ? [
        'WIPPF 双人对照（自评）',
        `继发能力：${myLabel} ${myScore.secAll} / ${partnerLabel} ${paScore.secAll}`,
        `原发能力：${myLabel} ${myScore.priAll} / ${partnerLabel} ${paScore.priAll}`,
        `冲突反应：${myLabel} ${myScore.conAll} / ${partnerLabel} ${paScore.conAll}`,
        `榜样模型：${myLabel} ${myScore.modAll} / ${partnerLabel} ${paScore.modAll}`,
        '— 来自 x2ya.com/tools/wippf（仅自我觉察，非诊断）',
      ]
      : [
        'WIPPF 威斯巴登积极心理治疗与家庭治疗调查表（自评）',
        `继发能力 ${myScore.secAll} / ${SUBSCALE_MAX.sec}　原发能力 ${myScore.priAll} / ${SUBSCALE_MAX.pri}`,
        `冲突反应 ${myScore.conAll} / ${SUBSCALE_MAX.con}　榜样模型 ${myScore.modAll} / ${SUBSCALE_MAX.mod}`,
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
  const sec = secList(myScore);
  const pri = priList(myScore);
  const con = conList(myScore);
  const mod = modList(myScore);
  const secExt = extremes(sec);
  const priExt = extremes(pri);
  const secZone = overallZone(sec);
  const priZone = overallZone(pri);
  const allSorted = [...sec, ...pri, ...con].sort((a, b) => b.value - a.value);

  const sumRows = [
    { label: '继发能力（社会规范）', a: myScore.secA, b: myScore.secB, c: myScore.secC, range: '每列 11–44', total: myScore.secAll, max: SUBSCALE_MAX.sec },
    { label: '原发能力（情感力）', a: myScore.priA, b: myScore.priB, c: myScore.priC, range: '每列 8–32', total: myScore.priAll, max: SUBSCALE_MAX.pri },
    { label: '冲突反应（平衡模型）', a: myScore.conA, b: myScore.conB, c: myScore.conC, range: '每列 4–16', total: myScore.conAll, max: SUBSCALE_MAX.con },
    { label: '榜样模型', a: myScore.modT, b: myScore.modP, c: myScore.modR, range: '每列 6–24', total: myScore.modAll, max: SUBSCALE_MAX.mod },
  ];

  const detailGroups: { title: string; rows: { id: number; name: string; codes: string[] }[]; labels: [string, string, string] }[] = [
    {
      title: '继发能力（社会规范） · a／b／c',
      labels: ['a', 'b', 'c'],
      rows: SEC_IDS.map(id => ({ id, name: ITEM_NAME[id], codes: [`${id}a`, `${id}b`, `${id}c`] })),
    },
    {
      title: '原发能力（情感力） · a／b／c',
      labels: ['a', 'b', 'c'],
      rows: PRI_IDS.map(id => ({ id, name: ITEM_NAME[id], codes: [`${id}a`, `${id}b`, `${id}c`] })),
    },
    {
      title: '冲突反应（平衡模型） · a／b／c',
      labels: ['a', 'b', 'c'],
      rows: CON_IDS.map(id => ({ id, name: ITEM_NAME[id], codes: [`${id}a`, `${id}b`, `${id}c`] })),
    },
    {
      title: '榜样模型 · 三列＝时间／耐心／榜样',
      labels: ['时间', '耐心', '榜样'],
      rows: MOD_ROWS.map(r => ({ id: Number(r.codes[0].slice(0, 2)), name: r.name, codes: r.codes })),
    },
  ];

  const hypothesis = paScore ? pairHypothesis(myScore, paScore) : null;

  /* 曲线图数据 */
  const secRows: ChartRow[] = SEC_IDS.map(id => ({ label: ITEM_NAME[id] }));
  const priRows: ChartRow[] = PRI_IDS.map(id => ({ label: ITEM_NAME[id] }));
  const conRows: ChartRow[] = CON_IDS.map(id => ({ label: ITEM_NAME[id], left: CON_POLE[id][0], right: CON_POLE[id][1] }));
  const modChartRows: ChartRow[] = MOD_ROWS.map(r => ({ label: r.short, left: r.pole[0], right: r.pole[1] }));
  const behRows: ChartRow[] = BEH_POLE.map(b => ({ label: `${b.col} · ${b.name}`, left: b.left, right: b.right }));
  const relRows: ChartRow[] = REL_POLE.map(r => ({ label: `${r.col} · ${r.name}`, left: r.left, right: r.right }));

  const chartSeries = (mine: number[], theirs?: number[]) =>
    theirs
      ? [
        { name: myLabel, color: ME_COLOR, values: mine },
        { name: partnerLabel, color: PA_COLOR, values: theirs, dashed: true },
      ]
      : [{ name: myLabel, color: ME_COLOR, values: mine }];

  const capVals = (score: WippfScore, ids: readonly number[]) => ids.map(id => score.cap[id] ?? 0);

  return (
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0A0E1A] text-[#313131] dark:text-[#E2E8F0] font-['PingFang_SC','Microsoft_YaHei','Noto_Sans_SC',sans-serif] transition-colors duration-300">
      <Helmet>
        <title>WIPPF 威斯巴登问卷 · 自助工具 · 玄牙</title>
        <meta name="description" content="威斯巴登积极心理治疗与家庭治疗调查表（WIPPF 2.04 国际版）在线自评：87 题，看继发能力、原发能力、冲突反应与榜样模型；支持双人对照与答案码。仅作自我觉察，非诊断。" />
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

          {/* ============ 开始页 ============ */}
          {stage === 'intro' && (
            <>
              <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase mb-2">WIPPF · 2.04</div>
              <h1 className="text-[clamp(1.5rem,3.6vw,2.2rem)] font-extrabold tracking-wide leading-tight font-['PingFang_SC','Noto_Serif_SC',serif] mb-3">
                威斯巴登积极心理治疗与家庭治疗调查表
              </h1>
              <p className="text-[14px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed mb-5">
                N. Peseschkian &amp; H. Deidenbach 编制 · 87 道题 · 四级评分（1 完全不同意 → 4 完全同意）· 一题一屏，约 10–15 分钟
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

              <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-2xl p-4 sm:p-5 mb-4">
                <div className="text-[13px] font-semibold mb-3">称呼（可留空，只用于结果标签）</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11.5px] text-[#767693] dark:text-[#94A3B8]">我</span>
                    <input
                      value={meName}
                      onChange={e => setMeName(e.target.value)}
                      placeholder="我"
                      maxLength={12}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-[#ECD8D9] dark:border-[#334155] bg-transparent text-[13.5px] outline-none focus:border-[#DA583F] dark:focus:border-[#60A5FA]"
                    />
                  </label>
                  <label className={`block ${pairActive ? '' : 'opacity-40'}`}>
                    <span className="text-[11.5px] text-[#767693] dark:text-[#94A3B8]">对方</span>
                    <input
                      value={loadedCode?.name || paName}
                      onChange={e => setPaName(e.target.value)}
                      placeholder="对方"
                      maxLength={12}
                      disabled={!pairActive}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-[#ECD8D9] dark:border-[#334155] bg-transparent text-[13.5px] outline-none focus:border-[#DA583F] dark:focus:border-[#60A5FA] disabled:cursor-not-allowed"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  { key: 'single' as Mode, title: '只做我自己的', desc: '一人一轮，出个人剖面与逐步解读。' },
                  { key: 'device' as Mode, title: '两人一起做 · 同一台设备轮流', desc: '我先答完，把设备交给对方；结束后出双人对照与双线图。' },
                  { key: 'code' as Mode, title: '我有对方的答案码', desc: '对方在 TA 的设备答完并把码发给你，粘贴后你只答自己这一轮。' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setMode(opt.key); setCodeError(''); }}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all duration-200 ${
                      mode === opt.key
                        ? 'border-[#DA583F] dark:border-[#60A5FA] bg-[#FEF3F0] dark:bg-[#17233B]'
                        : 'border-[#ECD8D9] dark:border-[#334155] hover:border-[#DA583F]/50 dark:hover:border-[#60A5FA]/50'
                    }`}
                  >
                    <div className={`text-[14.5px] font-semibold ${mode === opt.key ? 'text-[#DA583F] dark:text-[#60A5FA]' : ''}`}>
                      {opt.title}
                    </div>
                    <div className="text-[12.5px] text-[#6E6A7C] dark:text-[#94A3B8] mt-1 leading-relaxed">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {mode === 'code' && (
                <div className="mb-5">
                  <textarea
                    value={codeInput}
                    onChange={e => tryDecode(e.target.value)}
                    placeholder="把对方发来的答案码整串粘贴到这里（以 W1. 开头）"
                    className="w-full min-h-[86px] px-3 py-2.5 rounded-xl border border-[#ECD8D9] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[12px] font-mono outline-none focus:border-[#DA583F] dark:focus:border-[#60A5FA] resize-y"
                  />
                  {loadedCode && (
                    <div className="text-[12.5px] text-[#3E9A7E] mt-1.5">
                      ✓ 已读取 {loadedCode.name} 的答案（87 题齐全），下面只需答你自己这一轮。
                    </div>
                  )}
                  {codeError && <div className="text-[12.5px] text-[#DA583F] mt-1.5">{codeError}</div>}
                </div>
              )}

              <button
                onClick={start}
                className="w-full py-3.5 rounded-full bg-[#DA583F] dark:bg-[#2563EB] text-white text-[15px] font-semibold hover:bg-[#C43F30] dark:hover:bg-[#1D4ED8] transition-colors"
              >
                开始作答
              </button>

              <p className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] mt-8 leading-relaxed">
                本页仅作自评与教学辅助，不作诊断；正式解读请由受训的积极心理治疗师进行。
                原表：N. Peseschkian &amp; H. Deidenbach, 1988；WIPPF 2.0 of DPPB, Varna, A. Remmers 1995，中译 2009。
              </p>
            </>
          )}

          {/* ============ 答题页（一题一屏） ============ */}
          {stage === 'quiz' && current && (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase">WIPPF · 2.04</div>
                {pairActive && (
                  <div className="text-[12px] px-2.5 py-1 rounded-full bg-[#FEF3F0] dark:bg-[#17233B] text-[#DA583F] dark:text-[#60A5FA]">
                    现在由 {turn === 'me' ? myLabel : partnerLabel} 作答
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-[#767693] dark:text-[#94A3B8] mb-2">
                  <span>第 {index + 1} / {total} 题 · 已答 {answeredCount}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F1E5E3] dark:bg-[#1E293B] overflow-hidden">
                  <div className="h-full rounded-full bg-[#DA583F] dark:bg-[#60A5FA] transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-3xl p-5 sm:p-8">
                <div className="text-[11.5px] text-[#B8B4B0] dark:text-[#64748B] mb-2">原表第 {current.no} 题</div>
                <div className="text-[1.15rem] sm:text-[1.3rem] font-medium leading-relaxed mb-7 min-h-[3.5rem]">
                  {current.text}
                </div>

                <div className="flex flex-col gap-3">
                  {[...SCORE_OPTIONS].reverse().map(opt => {
                    const selected = answers[current.code] === opt.value;
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
                  onClick={goPrev}
                  disabled={index === 0}
                  className="text-sm text-[#767693] dark:text-[#94A3B8] disabled:opacity-30 hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors"
                >
                  ← 上一题
                </button>

                {index === total - 1 && allDone ? (
                  <button
                    onClick={() => finishTurn()}
                    className="px-6 py-2.5 rounded-full bg-[#DA583F] dark:bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#C43F30] dark:hover:bg-[#1D4ED8] transition-colors"
                  >
                    {mode === 'device' && turn === 'me' ? '我答完了 →' : '看结果'}
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    disabled={answers[current.code] === undefined}
                    className="text-sm text-[#767693] dark:text-[#94A3B8] disabled:opacity-30 hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors"
                  >
                    下一题 →
                  </button>
                )}
              </div>

              <p className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] mt-8 leading-relaxed">
                选完自动进入下一题；电脑上可用键盘 <span className="font-mono">1–4</span> 直接选、<span className="font-mono">← →</span> 翻题。
                作答只在本页内存里计算，刷新即清空。正式解读请由受训的积极心理治疗师进行。
              </p>
            </>
          )}

          {/* ============ 交接页（双人 · 同设备） ============ */}
          {stage === 'handoff' && (
            <>
              <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase mb-2">Step 2 / 2</div>
              <h1 className="text-[clamp(1.4rem,3.2vw,1.9rem)] font-extrabold tracking-wide leading-tight font-['PingFang_SC','Noto_Serif_SC',serif] mb-3">
                {myLabel} 答完了，接下来交给 {partnerLabel}
              </h1>
              <p className="text-[14px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed mb-6">
                两种方式都可以——同设备接力最省事；如果 TA 不在身边，把这串答案码发给 TA 也行。
              </p>

              <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-2xl p-5 sm:p-6 mb-4">
                <div className="text-[13.5px] font-semibold mb-1">方式一：同一台设备接力</div>
                <p className="text-[12.5px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed mb-3">
                  把手机／电脑交给 {partnerLabel}，由 TA 自己点选。切换后，你这一轮的答案会保留。
                </p>
                <button
                  onClick={startPartner}
                  className="w-full py-3 rounded-full bg-[#DA583F] dark:bg-[#2563EB] text-white text-[14.5px] font-semibold hover:bg-[#C43F30] dark:hover:bg-[#1D4ED8] transition-colors"
                >
                  换成 {partnerLabel} 作答 →
                </button>
              </div>

              <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-2xl p-5 sm:p-6">
                <div className="text-[13.5px] font-semibold mb-1">方式二：把答案码发给 {partnerLabel}</div>
                <p className="text-[12.5px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed mb-3">
                  TA 在自己的设备打开 <span className="font-mono">x2ya.com/tools/wippf</span>，选「我有对方的答案码」，粘贴后只答自己这一轮，就能看到你们两人的对照。
                </p>
                <textarea
                  readOnly
                  value={answerCode}
                  onFocus={e => e.currentTarget.select()}
                  className="w-full min-h-[78px] px-3 py-2.5 rounded-xl border border-[#ECD8D9] dark:border-[#334155] bg-[#F9F6F5] dark:bg-[#0F172A] text-[11px] font-mono leading-relaxed outline-none resize-y"
                />
                <button
                  onClick={copyCode}
                  className="mt-2.5 w-full py-2.5 rounded-full border border-[#ECD8D9] dark:border-[#334155] text-[13.5px] font-medium hover:border-[#DA583F] dark:hover:border-[#60A5FA] transition-colors"
                >
                  {copiedCode ? '已复制 ✓ 粘贴给 TA 即可' : '复制答案码'}
                </button>
              </div>

              <p className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] mt-6 leading-relaxed">
                答案码只包含称呼与 87 个选项，不含设备、位置或任何账号信息；对方不需要注册。
              </p>
            </>
          )}

          {/* ============ 结果页 ============ */}
          {stage === 'result' && (
            <>
              <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase mb-2">Result</div>
              <h1 className="text-[clamp(1.5rem,3.6vw,2.2rem)] font-extrabold tracking-wide leading-tight font-['PingFang_SC','Noto_Serif_SC',serif] mb-2">
                {hasPartner ? `${myLabel} 与 ${partnerLabel} 的对照` : '你的 WIPPF 剖面'}
              </h1>
              <p className="text-[14px] text-[#6E6A7C] dark:text-[#94A3B8] mb-8 leading-relaxed">
                {hasPartner
                  ? '差异不是对错，是两套习惯的距离。先看总评，再对照单项明细与剖面曲线，看两条线在哪几行分开得最远。'
                  : `24 个现实能力，每项 3 题、单项 ${ITEM_MIN}–${ITEM_MAX} 分。先看总评，再顺着一、二、三往下看——最低与最高的几项，常常是冲突最容易发生的地方。`}
              </p>

              {/* 1. 总评 · 三项速览 */}
              <Card title="总评" sub="三项速览 · 详细解读见页末「逐步解读」">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12.5px] text-[#767693] dark:text-[#94A3B8] w-[92px]">最高三项</span>
                    {allSorted.slice(0, 3).map(x => (
                      <span key={`${x.name}-hi`} className="px-2.5 py-1 rounded-full text-[12.5px] bg-[#FEF3F0] dark:bg-[#17233B] text-[#DA583F] dark:text-[#60A5FA]">
                        {x.name} {x.value}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12.5px] text-[#767693] dark:text-[#94A3B8] w-[92px]">最低三项</span>
                    {allSorted.slice(-3).reverse().map(x => (
                      <span key={`${x.name}-lo`} className="px-2.5 py-1 rounded-full text-[12.5px] bg-[#F5F1F0] dark:bg-[#0F172A] text-[#767693] dark:text-[#94A3B8]">
                        {x.name} {x.value}
                      </span>
                    ))}
                  </div>
                  {hypothesis && hypothesis.biggest.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12.5px] text-[#767693] dark:text-[#94A3B8] w-[92px]">差异最大</span>
                      {hypothesis.biggest.slice(0, 3).map(x => (
                        <span key={x.name} className="px-2.5 py-1 rounded-full text-[12.5px] bg-[#FBF3E4] dark:bg-[#2A2418] text-[#C08A2E]">
                          {x.name} {x.diff > 0 ? `+${x.diff}` : x.diff}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* 2. 一、单项明细 */}
              <div className="mt-4">
                <Card title="一、单项明细" sub="每一项能力的 a／b／c 分与合计（单项区间 3–12）。点击任意一行，可展开它对应的 3 道原题。">
                  <div className="space-y-5">
                    {detailGroups.map(g => (
                      <div key={g.title}>
                        <div className="text-[12.5px] font-semibold mb-2">{g.title}</div>
                        <CapRows
                          rows={g.rows}
                          colLabels={g.labels}
                          myScore={myScore}
                          paScore={paScore}
                          meAns={meAns}
                          paAns={paAnswers}
                          myLabel={myLabel}
                          partnerLabel={partnerLabel}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-[11.5px] text-[#B8B4B0] dark:text-[#64748B] leading-relaxed">
                    a＝我怎么做（自我） · b＝我期待别人怎么做（本我／期待） · c＝我认为应该怎样（超我／理念）
                  </div>
                </Card>
              </div>

              {/* 3. 二、总分表 */}
              <div className="mt-4">
                <Card title="二、总分表" sub="各列小分与区间，即计分表底部的 Σ 行。样本参考：继发约 108、原发约 69，非人群常模，只作个体内比较。">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="text-[#767693] dark:text-[#94A3B8]">
                          <th className="text-left font-medium py-1.5 pr-2">分量表</th>
                          <th className="text-right font-medium py-1.5 px-2" style={{ color: ME_COLOR }}>{myLabel} a／b／c</th>
                          {paScore && <th className="text-right font-medium py-1.5 px-2" style={{ color: PA_COLOR }}>{partnerLabel} a／b／c</th>}
                          <th className="text-right font-medium py-1.5 px-2">Σ</th>
                          <th className="text-right font-medium py-1.5 pl-2">理论区间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sumRows.map(r => (
                          <tr key={r.label} className="border-t border-[#F1E5E3] dark:border-[#334155]">
                            <td className="py-2 pr-2">{r.label}</td>
                            <td className="text-right py-2 px-2 tabular-nums">{r.a} / {r.b} / {r.c}</td>
                            {paScore && (
                              <td className="text-right py-2 px-2 tabular-nums text-[#767693] dark:text-[#94A3B8]">
                                {{ sec: [paScore.secA, paScore.secB, paScore.secC], pri: [paScore.priA, paScore.priB, paScore.priC], con: [paScore.conA, paScore.conB, paScore.conC], mod: [paScore.modT, paScore.modP, paScore.modR] }[r.label.startsWith('继发') ? 'sec' : r.label.startsWith('原发') ? 'pri' : r.label.startsWith('冲突') ? 'con' : 'mod']!.join(' / ')}
                              </td>
                            )}
                            <td className="text-right py-2 px-2 tabular-nums font-bold">{r.total} / {r.max}</td>
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
                </Card>
              </div>

              {/* 4. 三、纵向剖面曲线图 */}
              <div className="mt-4">
                <Card
                  title="三、纵向剖面曲线图"
                  sub={`每行：左侧能力名、右侧得分；横轴＝得分区间，虚线为低／中／高分区界。${hasPartner ? `实线○＝${myLabel}，虚线□＝${partnerLabel}，行末数值按「${myLabel} / ${partnerLabel}」排列。` : ''}`}
                >
                  <div className="space-y-7">
                    <div>
                      <div className="text-[12.5px] font-semibold mb-1">继发能力（社会规范）· 单项 3–12</div>
                      <ProfileChart
                        rows={secRows}
                        series={chartSeries(capVals(myScore, SEC_IDS), paScore ? capVals(paScore, SEC_IDS) : undefined)}
                        min={3}
                        max={12}
                      />
                    </div>
                    <div>
                      <div className="text-[12.5px] font-semibold mb-1">原发能力（情感力）· 单项 3–12</div>
                      <ProfileChart
                        rows={priRows}
                        series={chartSeries(capVals(myScore, PRI_IDS), paScore ? capVals(paScore, PRI_IDS) : undefined)}
                        min={3}
                        max={12}
                      />
                    </div>
                    <div>
                      <div className="text-[12.5px] font-semibold mb-1">冲突反应（平衡模型四域）· 3–12</div>
                      <ProfileChart
                        rows={conRows}
                        series={chartSeries(capVals(myScore, CON_IDS), paScore ? capVals(paScore, CON_IDS) : undefined)}
                        min={3}
                        max={12}
                      />
                    </div>
                    <div>
                      <div className="text-[12.5px] font-semibold mb-1">榜样模型 · 3–12</div>
                      <ProfileChart
                        rows={modChartRows}
                        series={chartSeries(myScore.mod, paScore ? paScore.mod : undefined)}
                        min={3}
                        max={12}
                      />
                    </div>
                    <div>
                      <div className="text-[12.5px] font-semibold mb-1">社会行为（三列）· 每列 11–44</div>
                      <ProfileChart
                        rows={behRows}
                        series={chartSeries(
                          [myScore.secA, myScore.secB, myScore.secC],
                          paScore ? [paScore.secA, paScore.secB, paScore.secC] : undefined,
                        )}
                        min={11}
                        max={44}
                      />
                    </div>
                    <div>
                      <div className="text-[12.5px] font-semibold mb-1">情感力（情感关系三列）· 每列 8–32</div>
                      <ProfileChart
                        rows={relRows}
                        series={chartSeries(
                          [myScore.priA, myScore.priB, myScore.priC],
                          paScore ? [paScore.priA, paScore.priB, paScore.priC] : undefined,
                        )}
                        min={8}
                        max={32}
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* 5. 双人：现实能力对照 */}
              {hasPartner && paScore && (
                <div className="mt-4">
                  <Card title="四、现实能力对照" sub={`继发 11 项 + 原发 8 项 · 差＝${myLabel} − ${partnerLabel}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12.5px]">
                        <thead>
                          <tr className="text-[#767693] dark:text-[#94A3B8]">
                            <th className="text-left font-medium py-1.5 pr-2 w-9">编号</th>
                            <th className="text-left font-medium py-1.5 pr-2">能力</th>
                            <th className="text-right font-medium py-1.5 px-2" style={{ color: ME_COLOR }}>{myLabel}</th>
                            <th className="text-right font-medium py-1.5 px-2" style={{ color: PA_COLOR }}>{partnerLabel}</th>
                            <th className="text-right font-medium py-1.5 pl-2">差</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...SEC_IDS, ...PRI_IDS].map(id => {
                            const a = myScore.cap[id] ?? 0;
                            const b = paScore.cap[id] ?? 0;
                            const d = a - b;
                            return (
                              <tr key={id} className="border-t border-[#F1E5E3] dark:border-[#334155]">
                                <td className="py-1.5 pr-2 text-[#B8B4B0] dark:text-[#64748B] tabular-nums">{id}</td>
                                <td className="py-1.5 pr-2">{ITEM_NAME[id]}</td>
                                <td className={`text-right py-1.5 px-2 tabular-nums ${d > 0 ? 'font-bold' : ''}`} style={{ color: d > 0 ? ME_COLOR : undefined }}>{a}</td>
                                <td className={`text-right py-1.5 px-2 tabular-nums ${d < 0 ? 'font-bold' : ''}`} style={{ color: d < 0 ? PA_COLOR : undefined }}>{b}</td>
                                <td className="text-right py-1.5 pl-2 tabular-nums text-[#767693] dark:text-[#94A3B8]">{d > 0 ? `+${d}` : d}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 text-[11.5px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                      差异最大的几项，通常是两人互动中最容易被踩到的地方——不是谁对谁错，是两套习惯的距离。
                    </div>
                  </Card>
                </div>
              )}

              {/* 6. 双人：互动假设 */}
              {hypothesis && (
                <div className="mt-4">
                  <Card title="五、互动假设" sub="不是谁对谁错，是两套习惯的距离；这几项通常最容易在日常里被踩到。">
                    <div className="space-y-3 text-[13px] leading-relaxed">
                      <div>
                        <div className="text-[12.5px] font-semibold mb-1.5">两人都偏低（≤6）</div>
                        <div className="flex flex-wrap gap-2">
                          {hypothesis.bothLow.length ? hypothesis.bothLow.map(x => (
                            <span key={x.name} className="px-2.5 py-1 rounded-full text-[12px] bg-[#F5F1F0] dark:bg-[#0F172A] text-[#767693] dark:text-[#94A3B8]">
                              {x.name}（{x.a} / {x.b}）
                            </span>
                          )) : <span className="text-[12.5px] text-[#6E6A7C] dark:text-[#94A3B8]">没有两人同时偏低的项。</span>}
                        </div>
                        {hypothesis.bothLow.length > 0 && (
                          <p className="text-[12px] text-[#6E6A7C] dark:text-[#94A3B8] mt-1.5">
                            这一块两人都不太熟——它更容易变成「谁都没做」的空白，而不是争吵点。
                          </p>
                        )}
                      </div>
                      <div>
                        <div className="text-[12.5px] font-semibold mb-1.5">差异最大的四项</div>
                        <div className="flex flex-wrap gap-2">
                          {hypothesis.biggest.length ? hypothesis.biggest.map(x => (
                            <span key={x.name} className="px-2.5 py-1 rounded-full text-[12px] bg-[#FEF3F0] dark:bg-[#17233B] text-[#DA583F] dark:text-[#60A5FA]">
                              {x.name}（{x.a} / {x.b}，差 {x.diff > 0 ? `+${x.diff}` : x.diff}）
                            </span>
                          )) : <span className="text-[12.5px] text-[#6E6A7C] dark:text-[#94A3B8]">两人各项几乎一致。</span>}
                        </div>
                        {hypothesis.biggest.length > 0 && (
                          <p className="text-[12px] text-[#6E6A7C] dark:text-[#94A3B8] mt-1.5">
                            差异大的一项，往往一方觉得「这不是常识吗」，另一方觉得「有必要吗」——先把它说出来，比争谁对更省力。
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* 7. 逐步解读（双人时默认折叠） */}
              {hasPartner ? (
                <details className="mt-4">
                  <summary className="cursor-pointer list-none bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-2xl px-5 py-4 text-sm font-bold flex items-center justify-between hover:border-[#DA583F] dark:hover:border-[#60A5FA] transition-colors">
                    <span>展开 {myLabel} 的逐步解读</span>
                    <span className="text-[11px] font-normal text-[#B8B4B0] dark:text-[#64748B]">九步解读</span>
                  </summary>
                  <StepGuide
                    myScore={myScore} con={con} mod={mod}
                    secExt={secExt} priExt={priExt} secZone={secZone} priZone={priZone}
                  />
                </details>
              ) : (
                <div className="mt-4">
                  <StepGuide
                    myScore={myScore} con={con} mod={mod}
                    secExt={secExt} priExt={priExt} secZone={secZone} priZone={priZone}
                  />
                </div>
              )}

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
                {hasPartner && (
                  <button
                    onClick={copyCode}
                    className="px-5 py-2.5 rounded-full border border-[#ECD8D9] dark:border-[#334155] text-sm text-[#4F4F4F] dark:text-[#CBD5E1] hover:border-[#DA583F] dark:hover:border-[#60A5FA] transition-colors"
                  >
                    {copiedCode ? '已复制 ✓' : `复制${myLabel}的答案码`}
                  </button>
                )}
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

/* ---------- 逐步解读（九步） ---------- */
function StepGuide({
  myScore, con, mod, secExt, priExt, secZone, priZone,
}: {
  myScore: WippfScore;
  con: NamedScore[];
  mod: NamedScore[];
  secExt: ReturnType<typeof extremes>;
  priExt: ReturnType<typeof extremes>;
  secZone: ReturnType<typeof overallZone>;
  priZone: ReturnType<typeof overallZone>;
}) {
  return (
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
            最低 {secExt.bottomNames}（{secExt.bottom.value}），最高 {secExt.topNames}（{secExt.top.value}）。这两项常是容易产生冲突的触发点。
          </div>
        </li>
        <li>
          <b>三、继发能力的三列 a／b／c</b>
          <div className="mt-1 text-[#6E6A7C] dark:text-[#94A3B8]">
            自我 {myScore.secA} · 本我 {myScore.secB} · 超我 {myScore.secC}（每列 11–44）。
            三列之间的高低差，说明「我怎么做」「我期待别人怎么做」「我认为应该怎样」这三套标准是否一致。
          </div>
        </li>
        <li>
          <b>四、原发能力：最低与最高的项</b>
          <div className="mt-1 text-[#6E6A7C] dark:text-[#94A3B8]">
            最低 {priExt.bottomNames}（{priExt.bottom.value}），最高 {priExt.topNames}（{priExt.top.value}）。这两项常常提示着我们对情感的需求度。
          </div>
        </li>
        <li>
          <b>五、原发能力的三列 a／b／c</b>
          <div className="mt-1 text-[#6E6A7C] dark:text-[#94A3B8]">
            与自己 {myScore.priA} · 与他人 {myScore.priB} · 与理念 {myScore.priC}（每列 8–32）。哪一种情感关系最强？还是几乎都缺？
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
            a（主动）{myScore.secA} · r（被动）{myScore.secB} · k（理念）{myScore.secC}。需求来自自己、别人，还是偶像身上？
          </div>
        </li>
        <li>
          <b>九、情感力：最强的情感关系</b>
          <div className="mt-1 text-[#6E6A7C] dark:text-[#94A3B8]">
            e（自我）{myScore.priA} · w（我们／你）{myScore.priB} · i（理想）{myScore.priC}。
          </div>
        </li>
      </ol>
    </Card>
  );
}
