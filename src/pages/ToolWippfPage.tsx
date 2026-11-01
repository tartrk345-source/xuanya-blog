import { useMemo, useState } from 'react';
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
  zoneOf,
  digitsToAnswers,
  encodeAnswerCode,
  decodeAnswerCode,
  pairHypothesis,
} from '../data/tools/wippf';

const SEG = 15;
const SEG_COUNT = Math.ceil(WIPPF_ITEMS.length / SEG);
const ZONE_LABEL = { low: '低分', mid: '中间', high: '高分' } as const;

type Stage = 'intro' | 'quiz' | 'handoff' | 'result';
type Turn = 'me' | 'pa';
/** single：只做自己；device：同设备轮流；code：已有对方答案码 */
type Mode = 'single' | 'device' | 'code';

const ME_COLOR = '#DA583F';
const PA_COLOR = '#3E9A7E';

/* ---------- 小部件 ---------- */
function ScoreBar({
  label, value, max, color, note, left, right,
}: {
  label: string; value: number; max: number; color: string; note?: string; left?: string; right?: string;
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
  const [stage, setStage] = useState<Stage>('intro');
  const [mode, setMode] = useState<Mode>('single');
  const [meName, setMeName] = useState('');
  const [paName, setPaName] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [loadedCode, setLoadedCode] = useState<{ name: string; digits: string } | null>(null);
  const [turn, setTurn] = useState<Turn>('me');
  const [seg, setSeg] = useState(0);
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
  const segStart = seg * SEG;
  const segItems = WIPPF_ITEMS.slice(segStart, Math.min(segStart + SEG, WIPPF_ITEMS.length));
  const segDone = segItems.every(it => answers[it.code] !== undefined);
  const allDone = answeredCount === WIPPF_ITEMS.length;

  const myScore = useMemo(() => scoreWippf(meAns), [meAns]);
  const paAnswers = loadedCode ? digitsToAnswers(loadedCode.digits) : paAns;
  const hasPartner = pairActive && WIPPF_ITEMS.every(it => paAnswers[it.code] !== undefined);
  const paScore = useMemo(() => (hasPartner ? scoreWippf(paAnswers) : null), [paAnswers, hasPartner]);

  const answerCode = useMemo(
    () => (WIPPF_ITEMS.every(it => meAns[it.code] !== undefined) ? encodeAnswerCode(meAns, myLabel) : ''),
    [meAns, myLabel],
  );

  const goto = (n: number) => {
    setSeg(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const start = () => {
    if (mode === 'code' && !loadedCode) {
      setCodeError('请先粘贴对方的答案码，或改选其他方式。');
      return;
    }
    setCodeError('');
    setTurn('me');
    setSeg(0);
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

  const next = () => {
    if (!segDone) return;
    if (seg < SEG_COUNT - 1) goto(seg + 1);
    else if (allDone) finishTurn();
    else {
      const first = WIPPF_ITEMS.findIndex(it => answers[it.code] === undefined);
      if (first >= 0) goto(Math.floor(first / SEG));
    }
  };

  const startPartner = () => {
    setTurn('pa');
    setSeg(0);
    setStage('quiz');
    window.scrollTo({ top: 0 });
  };

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
    setSeg(0);
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

  /* ---------- 单人结果数据 ---------- */
  const sec = secList(myScore);
  const pri = priList(myScore);
  const con = conList(myScore);
  const mod = modList(myScore);
  const secSorted = [...sec].sort((a, b) => b.value - a.value);
  const priSorted = [...pri].sort((a, b) => b.value - a.value);
  const secExt = extremes(sec);
  const priExt = extremes(pri);
  const secZone = overallZone(sec);
  const priZone = overallZone(pri);
  const allSorted = [...sec, ...pri, ...con].sort((a, b) => b.value - a.value);

  const sumRows = [
    { label: '继发能力（社会规范）', a: myScore.secA, b: myScore.secB, c: myScore.secC, range: '每列 11–44', total: myScore.secAll, max: SUBSCALE_MAX.sec, color: '#616FD3' },
    { label: '原发能力（情感力）', a: myScore.priA, b: myScore.priB, c: myScore.priC, range: '每列 8–32', total: myScore.priAll, max: SUBSCALE_MAX.pri, color: '#3E9A7E' },
    { label: '冲突反应（平衡模型）', a: myScore.conA, b: myScore.conB, c: myScore.conC, range: '每列 4–16', total: myScore.conAll, max: SUBSCALE_MAX.con, color: '#C08A2E' },
    { label: '榜样模型', a: myScore.modT, b: myScore.modP, c: myScore.modR, range: '每列 6–24', total: myScore.modAll, max: SUBSCALE_MAX.mod, color: '#DA583F' },
  ];

  /* ---------- 双人结果数据 ---------- */
  const vsRows = paScore
    ? [
      { label: '继发能力', max: SUBSCALE_MAX.sec, a: myScore.secAll, b: paScore.secAll },
      { label: '原发能力', max: SUBSCALE_MAX.pri, a: myScore.priAll, b: paScore.priAll },
      { label: '冲突反应', max: SUBSCALE_MAX.con, a: myScore.conAll, b: paScore.conAll },
      { label: '榜样模型', max: SUBSCALE_MAX.mod, a: myScore.modAll, b: paScore.modAll },
      { label: '继发 a 列（自我）', max: 44, a: myScore.secA, b: paScore.secA },
      { label: '继发 b 列（本我）', max: 44, a: myScore.secB, b: paScore.secB },
      { label: '继发 c 列（超我）', max: 44, a: myScore.secC, b: paScore.secC },
      { label: '原发 a 列（我）', max: 32, a: myScore.priA, b: paScore.priA },
      { label: '原发 b 列（我们）', max: 32, a: myScore.priB, b: paScore.priB },
      { label: '原发 c 列（理念）', max: 32, a: myScore.priC, b: paScore.priC },
    ]
    : [];

  const hypothesis = paScore ? pairHypothesis(myScore, paScore) : null;

  const secRows: ChartRow[] = SEC_IDS.map(id => ({ label: ITEM_NAME[id] }));
  const priRows: ChartRow[] = PRI_IDS.map(id => ({ label: ITEM_NAME[id] }));
  const conRows: ChartRow[] = CON_IDS.map(id => ({ label: ITEM_NAME[id], left: CON_POLE[id][0], right: CON_POLE[id][1] }));
  const modRows: ChartRow[] = MOD_ROWS.map(r => ({ label: r.short, left: r.pole[0], right: r.pole[1] }));

  const chartSeries = (mine: number[], theirs: number[]) => [
    { name: myLabel, color: ME_COLOR, values: mine },
    { name: partnerLabel, color: PA_COLOR, values: theirs, dashed: true },
  ];

  /* ---------- 单人详细区块 ---------- */
  const soloDetail = (
    <>
      <div className="mt-4">
        <Card title={hasPartner ? `三项速览（${myLabel}）` : '三项速览'}>
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
      </div>

      <div className="mt-4">
        <Card title="四个分量表" sub="总分为该分量表全部题项之和。样本参考：继发约 108、原发约 69，非人群常模，只作个体内比较。">
          <div className="space-y-4">
            {sumRows.map(r => (
              <ScoreBar key={r.label} label={r.label} value={r.total} max={r.max} color={r.color} note={r.range} />
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="继发能力（社会规范）" sub="11 项 · 单项 3–12 · 低分区域 3–5、中间 6–9、高分区域 10–12">
          <div className="space-y-3.5">
            {secSorted.map(x => (
              <ScoreBar key={x.id} label={x.name} value={x.value} max={ITEM_MAX} color="#616FD3" note={ZONE_LABEL[zoneOf(x.value)]} />
            ))}
          </div>
          <div className="mt-4 text-[12.5px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
            最低：<b>{secExt.bottomNames}</b>（{secExt.bottom.value} / 12）· 最高：<b>{secExt.topNames}</b>（{secExt.top.value} / 12）。
            这两项常是容易产生冲突的触发点——可以通过榜样模型，理解它们是怎么被培养出来的。
          </div>
        </Card>
      </div>

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

      <div className="mt-4">
        <Card title="冲突反应（平衡模型四域）" sub="3–12 分 · 左极 ←→ 右极：分数越靠右，越倾向用那一端的方式应对">
          <div className="space-y-4">
            {con.map(x => (
              <ScoreBar key={x.id} label={x.name} value={x.value} max={ITEM_MAX} color="#C08A2E" left={CON_POLE[x.id as number][0]} right={CON_POLE[x.id as number][1]} />
            ))}
          </div>
          <div className="mt-4 text-[12.5px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
            看冲突反应的类型和方式：这种反应是从哪里学来的？得到的益处是什么？它在试图避开什么？
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="榜样模型（童年时期的关系）" sub="6 项 · 3–12 分 · 左极 ←→ 右极">
          <div className="space-y-4">
            {mod.map((x, i) => (
              <ScoreBar key={x.id} label={x.name} value={x.value} max={ITEM_MAX} color="#DA583F" left={MOD_ROWS[i].pole[0]} right={MOD_ROWS[i].pole[1]} />
            ))}
          </div>
          <div className="mt-4 text-[12.5px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
            跟爸爸和妈妈的关系；父母之间的关系（共生／相反）；社交类型；人生的意义。
          </div>
        </Card>
      </div>

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
      </div>

      <div className="mt-4">
        <Card title="单项明细" sub="点开某一项，可以看到它由哪 3 道题组成、各得几分。">
          <div className="space-y-1">
            {[
              { title: '继发能力', list: sec },
              { title: '原发能力', list: pri },
              { title: '冲突反应', list: con },
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
                              第 {it.no} 题 {it.text}　→ {meAns[code] ?? '—'}
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
    </>
  );

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

          {/* ============ 答题页 ============ */}
          {stage === 'quiz' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase">WIPPF · 2.04</div>
                {pairActive && (
                  <div className="text-[12px] px-2.5 py-1 rounded-full bg-[#FEF3F0] dark:bg-[#17233B] text-[#DA583F] dark:text-[#60A5FA]">
                    现在由 {turn === 'me' ? myLabel : partnerLabel} 作答
                  </div>
                )}
              </div>
              <h1 className="text-[clamp(1.4rem,3.2vw,1.9rem)] font-extrabold tracking-wide leading-tight font-['PingFang_SC','Noto_Serif_SC',serif] mb-4">
                请从你自己的角度评价
              </h1>

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
                  {seg < SEG_COUNT - 1 ? '下一段 →' : mode === 'device' && turn === 'me' ? '我答完了 →' : '看结果'}
                </button>
              </div>

              <p className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] mt-8 leading-relaxed">
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
                  ? '差异不是对错，是两套习惯的距离。先看总分对照，再看两张剖面叠在一起时，哪几行分开得最远。'
                  : `24 个现实能力，每项 3 题、单项 ${ITEM_MIN}–${ITEM_MAX} 分。先看整体落在哪一侧，再看最高与最低的几项——那常常是冲突最容易发生的地方。`}
              </p>

              {hasPartner && paScore && (
                <>
                  <Card title="一、左右对照" sub="高的一方加粗着色；括号内为该分量表理论满分。">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12.5px]">
                        <thead>
                          <tr className="text-[#767693] dark:text-[#94A3B8]">
                            <th className="text-left font-medium py-1.5 pr-2">指标</th>
                            <th className="text-right font-medium py-1.5 px-2" style={{ color: ME_COLOR }}>{myLabel}</th>
                            <th className="text-right font-medium py-1.5 px-2" style={{ color: PA_COLOR }}>{partnerLabel}</th>
                            <th className="text-right font-medium py-1.5 pl-2">差</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vsRows.map(r => {
                            const d = r.a - r.b;
                            return (
                              <tr key={r.label} className="border-t border-[#F1E5E3] dark:border-[#334155]">
                                <td className="py-2 pr-2">
                                  {r.label}
                                  <span className="text-[10.5px] text-[#B8B4B0] dark:text-[#64748B] ml-1">/{r.max}</span>
                                </td>
                                <td className={`text-right py-2 px-2 tabular-nums ${d > 0 ? 'font-bold' : ''}`} style={{ color: d > 0 ? ME_COLOR : undefined }}>{r.a}</td>
                                <td className={`text-right py-2 px-2 tabular-nums ${d < 0 ? 'font-bold' : ''}`} style={{ color: d < 0 ? PA_COLOR : undefined }}>{r.b}</td>
                                <td className="text-right py-2 pl-2 tabular-nums text-[#767693] dark:text-[#94A3B8]">{d > 0 ? `+${d}` : d}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <div className="mt-4">
                    <Card title="二、双线剖面" sub={`实线圆点＝${myLabel}　虚线方块＝${partnerLabel}　每行右侧数值按「${myLabel} / ${partnerLabel}」排列`}>
                      <div className="space-y-7">
                        <div>
                          <div className="text-[12.5px] font-semibold mb-1">继发能力（社会规范）· 单项 3–12</div>
                          <ProfileChart
                            rows={secRows}
                            series={chartSeries(SEC_IDS.map(id => myScore.cap[id] ?? 0), SEC_IDS.map(id => paScore.cap[id] ?? 0))}
                            min={3}
                            max={12}
                          />
                        </div>
                        <div>
                          <div className="text-[12.5px] font-semibold mb-1">原发能力（情感力）· 单项 3–12</div>
                          <ProfileChart
                            rows={priRows}
                            series={chartSeries(PRI_IDS.map(id => myScore.cap[id] ?? 0), PRI_IDS.map(id => paScore.cap[id] ?? 0))}
                            min={3}
                            max={12}
                          />
                        </div>
                        <div>
                          <div className="text-[12.5px] font-semibold mb-1">冲突反应（平衡模型四域）· 3–12</div>
                          <ProfileChart
                            rows={conRows}
                            series={chartSeries(CON_IDS.map(id => myScore.cap[id] ?? 0), CON_IDS.map(id => paScore.cap[id] ?? 0))}
                            min={3}
                            max={12}
                          />
                        </div>
                        <div>
                          <div className="text-[12.5px] font-semibold mb-1">榜样模型 · 3–12</div>
                          <ProfileChart rows={modRows} series={chartSeries(myScore.mod, paScore.mod)} min={3} max={12} />
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="mt-4">
                    <Card title="三、现实能力对照" sub={`继发 11 项 + 原发 8 项 · 差＝${myLabel} − ${partnerLabel}`}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[12.5px]">
                          <thead>
                            <tr className="text-[#767693] dark:text-[#94A3B8]">
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
                    </Card>
                  </div>

                  {hypothesis && (
                    <div className="mt-4">
                      <Card title="四、互动假设" sub="不是谁对谁错，是两套习惯的距离；这几项通常最容易在日常里被踩到。">
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
                </>
              )}

              {hasPartner ? (
                <details className="mt-4">
                  <summary className="cursor-pointer list-none bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-2xl px-5 py-4 text-sm font-bold flex items-center justify-between hover:border-[#DA583F] dark:hover:border-[#60A5FA] transition-colors">
                    <span>展开 {myLabel} 的逐项明细与逐步解读</span>
                    <span className="text-[11px] font-normal text-[#B8B4B0] dark:text-[#64748B]">24 项 · 九步解读</span>
                  </summary>
                  <div className="mt-4">{soloDetail}</div>
                </details>
              ) : (
                soloDetail
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
