/**
 * TimelineEditor — 实际时间线对比编辑
 * 左侧显示计划（灰色 readonly），右侧可填实际时间和备注
 */
import type { ActualTimelineEntry } from '../../data/travelTypes';

interface Props {
  entries: ActualTimelineEntry[];
  onChange: (entries: ActualTimelineEntry[]) => void;
}

export default function TimelineEditor({ entries, onChange }: Props) {
  if (entries.length === 0) {
    return (
      <div className="je-field">
        <label className="je-label">⏱️ 时间线</label>
        <p className="je-empty-hint">当天无可记录的关键节点</p>
      </div>
    );
  }

  const update = (idx: number, field: keyof ActualTimelineEntry, value: string) => {
    const next = entries.map((e, i) =>
      i === idx ? { ...e, [field]: value } : e,
    );
    onChange(next);
  };

  return (
    <div className="je-field">
      <label className="je-label">⏱️ 实际时间线</label>
      <div className="je-timeline-editor">
        {entries.map((entry, idx) => (
          <div key={idx} className="je-tl-row">
            <div className="je-tl-planned">
              <span className="je-tl-badge">计划</span>
              <span className="je-tl-text">{entry.planned}</span>
            </div>
            <div className="je-tl-arrow">→</div>
            <div className="je-tl-actual">
              <span className="je-tl-badge actual">实际</span>
              <input
                type="text"
                className="je-tl-time-input"
                placeholder="实际时间"
                value={entry.actual_time || ''}
                onChange={e => update(idx, 'actual_time', e.target.value)}
              />
              <input
                type="text"
                className="je-tl-note-input"
                placeholder="备注…"
                value={entry.note || ''}
                onChange={e => update(idx, 'note', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
