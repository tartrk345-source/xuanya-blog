import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';

interface Area {
  key: string;
  name: string;
  aspect: string;
  icon: string;
  color: string;
  hint: string;
}

const AREAS: Area[] = [
  { key: 'body', name: '身体', aspect: '感觉', icon: '🌡️', color: '#DA583F', hint: '睡眠、吃饭、运动、休息、看病、身体照顾' },
  { key: 'achievement', name: '成就', aspect: '理性', icon: '📈', color: '#616FD3', hint: '工作、学习、任务、赚钱、把事情做完' },
  { key: 'relationship', name: '关系', aspect: '传统', icon: '🤝', color: '#3E9A7E', hint: '家人、朋友、伴侣、社交、陪伴与被陪伴' },
  { key: 'future', name: '未来', aspect: '意义', icon: '🌌', color: '#C08A2E', hint: '计划、思考、担心、信仰、意义与想象' },
];

type Values = Record<string, number>;

const INITIAL_INVEST: Values = { body: 5, achievement: 5, relationship: 5, future: 5 };
const INITIAL_SATISFY: Values = { body: 5, achievement: 5, relationship: 5, future: 5 };

function Donut({ invest }: { invest: Values }) {
  const R = 62;
  const C = 2 * Math.PI * R;
  const total = AREAS.reduce((sum, a) => sum + invest[a.key], 0);

  let offset = 0;
  const segments = AREAS.map(a => {
    const len = total > 0 ? (invest[a.key] / total) * C : C / AREAS.length;
    const seg = { ...a, len, offset };
    offset += len;
    return seg;
  });

  return (
    <svg viewBox="0 0 160 160" className="w-[180px] h-[180px] flex-shrink-0">
      <circle cx="80" cy="80" r={R} fill="none" stroke="currentColor" className="text-[#F5F1F0] dark:text-[#0F172A]" strokeWidth="26" />
      {segments.map(s => (
        s.len > 0.5 ? (
          <circle
            key={s.key}
            cx="80"
            cy="80"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="26"
            strokeDasharray={`${Math.max(s.len - 2, 0.5)} ${C}`}
            strokeDashoffset={-s.offset}
            transform="rotate(-90 80 80)"
            strokeLinecap="butt"
          />
        ) : null
      ))}
      <text x="80" y="76" textAnchor="middle" className="fill-[#B8B4B0] dark:fill-[#64748B]" fontSize="10">
        本周投入
      </text>
      <text x="80" y="94" textAnchor="middle" className="fill-[#313131] dark:fill-[#E2E8F0]" fontSize="15" fontWeight="700">
        {total}
      </text>
    </svg>
  );
}

export default function ToolBalancePage() {
  const [invest, setInvest] = useState<Values>(INITIAL_INVEST);
  const [satisfy, setSatisfy] = useState<Values>(INITIAL_SATISFY);
  const [showResult, setShowResult] = useState(false);

  const analysis = useMemo(() => {
    const total = AREAS.reduce((sum, a) => sum + invest[a.key], 0);
    const rows = AREAS.map(a => ({
      ...a,
      value: invest[a.key],
      share: total > 0 ? Math.round((invest[a.key] / total) * 100) : 25,
      satisfaction: satisfy[a.key],
      gap: invest[a.key] - satisfy[a.key],
    }));
    const byShare = [...rows].sort((a, b) => b.share - a.share);
    const bySatisfy = [...rows].sort((a, b) => a.satisfaction - b.satisfaction);
    const byGap = [...rows].sort((a, b) => b.gap - a.gap);
    return { total, rows, most: byShare[0], least: byShare[byShare.length - 1], leastSatisfied: bySatisfy[0], mostDrained: byGap[0], mostFed: byGap[byGap.length - 1] };
  }, [invest, satisfy]);

  const setAll = (setter: (v: Values) => void, init: Values) => { setter({ ...init }); setShowResult(false); };

  return (
    <div className="min-h-screen bg-[#FEFAF9] dark:bg-[#0A0E1A] text-[#313131] dark:text-[#E2E8F0] font-['PingFang_SC','Microsoft_YaHei','Noto_Sans_SC',sans-serif] transition-colors duration-300">
      <Helmet>
        <title>平衡模型自评 — 自助工具 · 玄牙</title>
        <meta name="description" content="积极心理治疗平衡模型自评：拖动滑块记录四个生活领域的投入与满意度，看见时间与精力分给了谁、哪里失衡。" />
        <link rel="canonical" href="https://www.x2ya.com/tools/balance" />
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

          <div className="text-xs font-bold tracking-[0.12em] text-[#DA583F] dark:text-[#60A5FA] uppercase mb-2">Balance Model</div>
          <h1 className="text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold tracking-wider leading-tight font-['PingFang_SC','Noto_Serif_SC',serif] mb-3">
            平衡模型自评
          </h1>
          <p className="text-[15px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed mb-8">
            人的生活可以分成四块：身体、成就、关系、未来。先别计算对错，凭感觉把你这周的时间与精力分配拖出来——
            再看每一块你有多满意。投入多不等于满足多，这张图只负责把差别摆到眼前。
          </p>

          {/* 图形总览 */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-3xl p-5 sm:p-7 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Donut invest={invest} />
              <div className="flex-1 w-full space-y-2.5">
                {analysis.rows.map(row => (
                  <div key={row.key} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: row.color }} />
                    <span className="text-[13px] w-10 flex-shrink-0">{row.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[#F5F1F0] dark:bg-[#0F172A] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${row.share}%`, backgroundColor: row.color }} />
                    </div>
                    <span className="text-[12px] tabular-nums text-[#767693] dark:text-[#94A3B8] w-9 text-right">{row.share}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 投入 */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-3xl p-5 sm:p-7 mb-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-bold">① 这一周，精力花在哪</h2>
              <button onClick={() => setAll(setInvest, INITIAL_INVEST)} className="text-[12px] text-[#B8B4B0] hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors">重置</button>
            </div>
            <div className="space-y-5">
              {AREAS.map(a => (
                <div key={a.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{a.icon}</span>
                      <span className="text-sm font-medium">{a.name}</span>
                      <span className="text-[11px] text-[#B8B4B0] dark:text-[#64748B] hidden sm:inline">{a.hint}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums" style={{ color: a.color }}>{invest[a.key]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={invest[a.key]}
                    onChange={e => { setInvest({ ...invest, [a.key]: Number(e.target.value) }); setShowResult(false); }}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#DA583F]"
                    style={{ background: `linear-gradient(to right, ${a.color} ${invest[a.key] * 10}%, #F1E5E3 ${invest[a.key] * 10}%)` }}
                    aria-label={`${a.name}领域投入`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 满意度 */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-3xl p-5 sm:p-7 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-bold">② 这一块，你满意吗</h2>
              <button onClick={() => setAll(setSatisfy, INITIAL_SATISFY)} className="text-[12px] text-[#B8B4B0] hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors">重置</button>
            </div>
            <div className="space-y-5">
              {AREAS.map(a => (
                <div key={a.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{a.name}领域的满意程度</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: a.color }}>{satisfy[a.key]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={satisfy[a.key]}
                    onChange={e => { setSatisfy({ ...satisfy, [a.key]: Number(e.target.value) }); setShowResult(false); }}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#DA583F]"
                    style={{ background: `linear-gradient(to right, ${a.color} ${satisfy[a.key] * 10}%, #F1E5E3 ${satisfy[a.key] * 10}%)` }}
                    aria-label={`${a.name}领域满意度`}
                  />
                </div>
              ))}
            </div>
          </div>

          {!showResult ? (
            <button
              onClick={() => setShowResult(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#DA583F] dark:bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#C43F30] dark:hover:bg-[#1D4ED8] transition-colors"
            >
              看看这张图在说什么
            </button>
          ) : (
            <div className="space-y-5">
              {/* 投入 vs 满意 */}
              <div className="bg-white dark:bg-[#1E293B] border border-[#ECD8D9] dark:border-[#334155] rounded-3xl p-5 sm:p-7">
                <h2 className="text-[15px] font-bold mb-4">投入与满意的落差</h2>
                <div className="space-y-4">
                  {analysis.rows.map(row => {
                    const diff = row.satisfaction - row.value; // >0 满意高于投入
                    const width = Math.min(Math.abs(diff) * 10, 100);
                    const positive = diff >= 0;
                    return (
                      <div key={row.key}>
                        <div className="flex items-center justify-between text-[12px] mb-1">
                          <span className="font-medium">{row.name}</span>
                          <span className="text-[#767693] dark:text-[#94A3B8]">
                            投入 {row.value} · 满意 {row.satisfaction}
                            <span className={`ml-2 font-semibold ${positive ? 'text-[#3E9A7E]' : 'text-[#DA583F] dark:text-[#F87171]'}`}>
                              {positive ? `+${diff}` : diff}
                            </span>
                          </span>
                        </div>
                        <div className="relative h-2 rounded-full bg-[#F5F1F0] dark:bg-[#0F172A] overflow-hidden">
                          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#D9C9C7] dark:bg-[#334155]" />
                          <div
                            className="absolute top-0 bottom-0 rounded-full transition-all duration-300"
                            style={{
                              width: `${width / 2}%`,
                              left: positive ? '50%' : `${50 - width / 2}%`,
                              backgroundColor: positive ? '#3E9A7E' : '#DA583F',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#B8B4B0] dark:text-[#64748B] mt-4">右侧绿色：满意度高于投入，是滋养你的地方；左侧红色：投入多于满意，在消耗你。</p>
              </div>

              {/* 解读 */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#FEF3F0] dark:bg-[#17233B] border border-[#ECD8D9] dark:border-[#334155] space-y-3">
                <div className="text-sm font-bold">这张图在说什么</div>
                <p className="text-[13px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                  你这一周把 <span className="font-semibold text-[#313131] dark:text-[#E2E8F0]">{analysis.most.share}%</span> 的精力放在
                  <span className="font-semibold text-[#313131] dark:text-[#E2E8F0]">「{analysis.most.name}」</span>，
                  最少的是<span className="font-semibold text-[#313131] dark:text-[#E2E8F0]">「{analysis.least.name}」</span>（{analysis.least.share}%）。
                </p>
                <p className="text-[13px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                  最不满意的领域是<span className="font-semibold text-[#313131] dark:text-[#E2E8F0]">「{analysis.leastSatisfied.name}」</span>；
                  {analysis.mostDrained.gap > 0
                    ? `而投入明显多于满意的，是「${analysis.mostDrained.name}」——这一块你花了不少，却没换回等量的安顿。`
                    : '四个领域的投入都没有明显超过满意，说明目前的分配大体是合算的。'}
                  {analysis.mostFed.gap < 0 && `相对最滋养你的，是「${analysis.mostFed.name}」：投入不算多，回报却不小，它是你现成的资源。`}
                </p>
                <p className="text-[13px] text-[#6E6A7C] dark:text-[#94A3B8] leading-relaxed">
                  积极心理治疗不要求四块平均，也不认为哪一块更重要。它只问一件事：
                  <span className="text-[#313131] dark:text-[#E2E8F0]">如果接下来一周只能动一块，你愿意往哪一块挪一点？</span>
                  想好一个具体动作——一次散步、一顿有人一起的饭、把担心写下来、把「再努力一点」换成「今天到这里」。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setShowResult(false)}
                  className="px-5 py-2.5 rounded-full border border-[#ECD8D9] dark:border-[#334155] text-sm text-[#4F4F4F] dark:text-[#CBD5E1] hover:border-[#DA583F] dark:hover:border-[#60A5FA] transition-colors"
                >
                  回去调整
                </button>
                <Link to="/tools/stress" className="text-sm text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] dark:hover:text-[#60A5FA] transition-colors">
                  做一次压力应对测评 →
                </Link>
              </div>
            </div>
          )}

          <p className="text-[12px] text-[#B8B4B0] dark:text-[#64748B] mt-10 leading-relaxed">
            方法来源：N. Peseschkian 积极心理治疗「平衡模型」（身体 / 成就 / 关系 / 未来四领域）。
            这是自我觉察练习，不是诊断，也不替代面诊或心理评估。数据不上传，刷新即清空。
          </p>
        </div>
      </div>
    </div>
  );
}
