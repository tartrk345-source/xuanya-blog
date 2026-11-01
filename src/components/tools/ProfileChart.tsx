/**
 * 双线剖面图：用于 WIPPF 单人 / 双人对照
 * 行标签在左，数值在右，横轴为得分区间；两条系列分别为实线圆点与虚线方块
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
  const rowH = hasPole ? 54 : 38;
  const top = 26;
  const H = top + rows.length * rowH + 6;
  const plotL = LABEL_W;
  const plotR = W - VALUE_W;
  const x = (v: number) => plotL + ((v - min) / (max - min)) * (plotR - plotL);

  const step = (max - min) / 3;
  const ticks = [0, 1, 2, 3].map(i => Math.round((min + step * i) * 10) / 10);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="剖面图">
      {/* 刻度 */}
      {ticks.map(t => (
        <text
          key={`t-${t}`}
          x={x(t)}
          y={top - 10}
          textAnchor="middle"
          fontSize="10.5"
          fill="#94A3B8"
        >
          {t}
        </text>
      ))}
      {ticks.map(t => (
        <line
          key={`g-${t}`}
          x1={x(t)}
          y1={top}
          x2={x(t)}
          y2={top + rows.length * rowH}
          stroke="#94A3B8"
          strokeOpacity="0.22"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}

      {rows.map((row, i) => {
        const y = top + i * rowH + (hasPole ? 24 : 20);
        return (
          <g key={row.label}>
            <line
              x1={plotL}
              y1={y}
              x2={plotR}
              y2={y}
              stroke="#94A3B8"
              strokeOpacity="0.18"
              strokeWidth="1"
            />
            <text x={0} y={y - 6} fontSize="12.5" fill="currentColor">
              {row.label}
            </text>
            {series.map((s, si) => {
              const v = s.values[i];
              if (!v) return null;
              if (s.dashed) {
                return (
                  <rect
                    key={s.name}
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
                );
              }
              return (
                <circle
                  key={s.name}
                  cx={x(v)}
                  cy={y}
                  r={si === 0 ? 4.6 : 4}
                  fill="#fff"
                  fillOpacity="0.9"
                  stroke={s.color}
                  strokeWidth="2.4"
                />
              );
            })}
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
    </svg>
  );
}
