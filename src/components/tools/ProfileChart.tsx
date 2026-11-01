/**
 * 纵向剖面曲线图：用于 WIPPF 单人 / 双人对照
 * 版式对照原表：行标签在左、数值在右，折线连接各点（实线○ / 虚线□），
 * 3–12 区间含 5.5 / 9.5 两条分区虚线与「低分 / 中间 / 高分」标注
 */

export interface ChartRow {
  label: string;
  /** 左极锚点（如「麻木」），有值时此行会自动加高 */
  left?: string;
  right?: string;
}

export interface ChartSeries {
  name: string;
  color: string;
  values: number[];
  dashed?: boolean;
}

interface Props {
  rows: ChartRow[];
  series: ChartSeries[];
  min: number;
  max: number;
}

const LABEL_W = 108;
const VALUE_W = 78;
const W = 720;

export default function ProfileChart({ rows, series, min, max }: Props) {
  const hasPole = rows.some(r => r.left || r.right);
  const rowH = hasPole ? 56 : 40;
  const top = 34;
  const H = top + rows.length * rowH + 6;
  const plotL = LABEL_W;
  const plotR = W - VALUE_W;
  const x = (v: number) => plotL + ((v - min) / (max - min)) * (plotR - plotL);
  const chartBottom = top + rows.length * rowH;

  /* 刻度：3–12 逐整数并画分区线；其他区间只标 lo / mid / hi */
  const zoneMode = min === 3 && max === 12;
  const ticks = zoneMode
    ? Array.from({ length: max - min + 1 }, (_, i) => min + i)
    : [min, (min + max) / 2, max];
  const zoneLines = zoneMode ? [5.5, 9.5] : [];
  const zoneLabels = zoneMode
    ? [
      { v: 4.25, t: '低分 3–5' },
      { v: 7.5, t: '中间 6–9' },
      { v: 10.75, t: '高分 10–12' },
    ]
    : [];

  const seriesLine = (s: ChartSeries) =>
    s.values
      .map((v, i) => `${i ? 'L' : 'M'}${x(v).toFixed(1)} ${(top + i * rowH + (hasPole ? 26 : 22)).toFixed(1)}`)
      .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="剖面曲线图">
      {/* 刻度数字 */}
      {ticks.map(t => (
        <text
          key={`t-${t}`}
          x={x(t)}
          y={top - 20}
          textAnchor="middle"
          fontSize="10.5"
          fill="#94A3B8"
        >
          {t}
        </text>
      ))}
      {/* 分区虚线 */}
      {zoneLines.map(v => (
        <line
          key={`z-${v}`}
          x1={x(v)}
          y1={top - 14}
          x2={x(v)}
          y2={chartBottom}
          stroke="#94A3B8"
          strokeOpacity="0.3"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}
      {/* 分区文字 */}
      {zoneLabels.map(z => (
        <text key={z.t} x={x(z.v)} y={top - 7} textAnchor="middle" fontSize="9.5" fill="#94A3B8">
          {z.t}
        </text>
      ))}

      {rows.map((row, i) => {
        const y = top + i * rowH + (hasPole ? 26 : 22);
        return (
          <g key={row.label}>
            <line
              x1={plotL}
              y1={y}
              x2={plotR}
              y2={y}
              stroke="#94A3B8"
              strokeOpacity="0.16"
              strokeWidth="1"
            />
            <text x={0} y={y - 6} fontSize="12.5" fill="currentColor">
              {row.label}
            </text>
            <text
              x={W}
              y={y - 6}
              textAnchor="end"
              fontSize="12"
              fontWeight="600"
              fill="currentColor"
              fillOpacity="0.8"
            >
              {series.length > 1 ? series.map(s => s.values[i]).join(' / ') : series[0].values[i]}
            </text>
            {(row.left || row.right) && (
              <text x={(plotL + plotR) / 2} y={y + 18} textAnchor="middle" fontSize="10.5" fill="#94A3B8">
                {row.left} ←→ {row.right}
              </text>
            )}
          </g>
        );
      })}

      {/* 折线（先画线，再画点） */}
      {series.map(s => (
        <path
          key={`p-${s.name}`}
          d={seriesLine(s)}
          fill="none"
          stroke={s.color}
          strokeWidth="2.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={s.dashed ? '9 6' : undefined}
        />
      ))}
      {series.map(s =>
        s.values.map((v, i) => {
          const y = top + i * rowH + (hasPole ? 26 : 22);
          if (!v) return null;
          return s.dashed ? (
            <rect
              key={`d-${s.name}-${i}`}
              x={x(v) - 4.5}
              y={y - 4.5}
              width="9"
              height="9"
              rx="1.5"
              fill="#fff"
              fillOpacity="0.9"
              stroke={s.color}
              strokeWidth="2.4"
            />
          ) : (
            <circle
              key={`c-${s.name}-${i}`}
              cx={x(v)}
              cy={y}
              r={4.6}
              fill="#fff"
              fillOpacity="0.9"
              stroke={s.color}
              strokeWidth="2.4"
            />
          );
        }),
      )}
    </svg>
  );
}
