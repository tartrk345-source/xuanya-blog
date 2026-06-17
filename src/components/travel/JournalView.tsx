/**
 * JournalView — 游记只读展示组件
 */
import type { TravelJournal, ActualTimelineEntry, JournalPhoto } from '../../data/travelTypes';

interface Props {
  journal: TravelJournal;
  dayTitle: string;
}

/** 简单的 Markdown 渲染 (支持 **bold**, ## heading, - list, 换行) */
function SimpleMarkdown({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="jv-h3">{line.slice(3)}</h3>);
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="jv-h4">{line.slice(4)}</h4>);
      i++;
      continue;
    }
    if (line.startsWith('- ')) {
      elements.push(<li key={i} className="jv-li">{renderInline(line.slice(2))}</li>);
      i++;
      continue;
    }

    if (line.trim() === '') {
      elements.push(<br key={i} />);
      i++;
      continue;
    }

    elements.push(<p key={i} className="jv-p">{renderInline(line)}</p>);
    i++;
  }

  return <div className="jv-content">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/** 实际时间线展示 */
function ActualTimeline({ entries }: { entries: ActualTimelineEntry[] }) {
  if (!entries || entries.length === 0) return null;

  return (
    <div className="jv-section">
      <h3 className="jv-section-title">⏱️ 实际时间线</h3>
      <div className="jv-timeline">
        {entries.map((entry, idx) => (
          <div key={idx} className="jv-tl-row">
            <div className="jv-tl-planned">{entry.planned}</div>
            <div className="jv-tl-arrow">→</div>
            <div className="jv-tl-actual">
              {entry.actual_time ? (
                <span className="jv-tl-time">{entry.actual_time}</span>
              ) : (
                <span className="jv-tl-none">未记录</span>
              )}
              {entry.note && <span className="jv-tl-note">{entry.note}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 花费展示 */
function ExpenseView({ expenses }: { expenses: TravelJournal['expenses'] }) {
  if (!expenses || expenses.length === 0) return null;

  return (
    <div className="jv-section">
      <h3 className="jv-section-title">💰 花费记录</h3>
      <table className="jv-expense-table">
        <thead>
          <tr>
            <th>项目</th>
            <th>计划</th>
            <th>实际</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e, idx) => (
            <tr key={idx}>
              <td>{e.item}</td>
              <td className="jv-exp-planned">{e.planned || '-'}</td>
              <td className={e.actual ? 'jv-exp-actual' : ''}>{e.actual || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 照片网格 */
function PhotoGrid({ photos }: { photos: JournalPhoto[] }) {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="jv-section">
      <h3 className="jv-section-title">📸 照片 ({photos.length})</h3>
      <div className="jv-photos">
        {photos.map((photo, idx) => (
          <figure key={idx} className="jv-photo-fig">
            <img
              src={photo.url}
              alt={photo.caption || `照片 ${idx + 1}`}
              className="jv-photo-img"
              loading="lazy"
            />
            {photo.caption && <figcaption>{photo.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Meta 信息条 */
function MetaBar({ journal }: { journal: TravelJournal }) {
  const hasMeta = journal.weather || journal.location || journal.mood;

  if (!hasMeta) return null;

  return (
    <div className="jv-meta-bar">
      {journal.weather && <span className="jv-meta-tag">☁️ {journal.weather}</span>}
      {journal.location && <span className="jv-meta-tag">📍 {journal.location}</span>}
      {journal.mood && (
        <span className="jv-meta-tag">
          😊 {journal.mood} {journal.mood_note || ''}
        </span>
      )}
    </div>
  );
}

// ============================================================
export default function JournalView({ journal, dayTitle }: Props) {
  return (
    <div className="journal-view">
      {/* Header */}
      <div className="jv-header">
        <span className="jv-label">游记</span>
        <h2 className="jv-title">{dayTitle}</h2>
        {journal.created_at && (
          <span className="jv-date">
            记录于 {new Date(journal.created_at).toLocaleDateString('zh-CN', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </span>
        )}
      </div>

      {/* Meta */}
      <MetaBar journal={journal} />

      {/* 正文 */}
      <SimpleMarkdown text={journal.content} />

      {/* 时间线 */}
      <ActualTimeline entries={journal.actual_timeline} />

      {/* 花费 */}
      <ExpenseView expenses={journal.expenses} />

      {/* 照片 */}
      <PhotoGrid photos={journal.photos} />
    </div>
  );
}
