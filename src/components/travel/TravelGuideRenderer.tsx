import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  TravelGuideData, DayData, TimelineItem, ContentSection,
  AlertSection, TableSection, ListSection, HeadingSection,
  ParagraphSection, PhotoGuideSection, WarningSection,
  CostSection, LinkSection, SubToggleSection, HotelSection,
  BlockquoteSection, PreSection, SectionLabel,
} from '../../data/travelTypes';
import './styles.css';

/* ============ Helper: render inline Markdown-like bold ============ */
function RichText({ text }: { text: string }) {
  // Support **bold** and line breaks
  const parts = text.split(/(\*\*.*?\*\*|\n)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === '\n') return <br key={i} />;
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ============ Stars ============ */
function Stars({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="tg-stars">{'★'.repeat(count)}</span>;
}

/* ============ Status Badge ============ */
function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    locked: '已锁定',
    pending: '待确认',
    warn: '注意',
  };
  return (
    <span className={`tg-badge tg-badge-${status}`}>
      {labels[status] || status}
    </span>
  );
}

/* ============ Timeline Item ============ */
function TimelineRow({ item, isLast }: { item: TimelineItem; isLast: boolean }) {
  return (
    <div className="tg-tl-row">
      <div className="tg-tl-time">{item.time}</div>
      <div className={`tg-tl-dot ${isLast ? 'last' : ''}`}>
        {!isLast && <div className="tg-tl-line" />}
      </div>
      <div className="tg-tl-content">
        {item.stars && item.stars > 0 && <Stars count={item.stars} />}
        {item.icon && <span className="tg-tl-icon">{item.icon}</span>}
        <RichText text={item.content} />
        {item.note && <span className="tg-tl-note"><RichText text={item.note} /></span>}
      </div>
    </div>
  );
}

/* ============ Section Renderer ============ */
function Section({ section }: { section: ContentSection }): ReactNode {
  switch (section.type) {
    case 'sectionLabel':
      return (
        <div className={`tg-section-label ${(section as SectionLabel).color}`}>
          {(section as SectionLabel).text}
        </div>
      );

    case 'alert': {
      const s = section as AlertSection;
      return (
        <div className={`tg-alert tg-alert-${s.color}`}>
          <span className="tg-alert-title"><RichText text={s.title} /></span>
          <RichText text={s.content} />
        </div>
      );
    }

    case 'table': {
      const s = section as TableSection;
      return (
        <table className="tg-table">
          <thead>
            <tr>{s.headers.map((h, i) => <th key={i}><RichText text={h} /></th>)}</tr>
          </thead>
          <tbody>
            {s.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => {
                  let cls = '';
                  if (s.highlight && ri === s.highlight.row) {
                    if (s.highlight.col === undefined || s.highlight.col === ci) {
                      cls = s.highlight.color === 'blue' ? 'cell-highlight-blue' : 'cell-highlight-amber';
                    }
                  }
                  return <td key={ci} className={cls}><RichText text={cell} /></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    case 'list': {
      const s = section as ListSection;
      return (
        <ul className="tg-ul">
          {s.items.map((item, i) => <li key={i}><RichText text={item} /></li>)}
        </ul>
      );
    }

    case 'heading': {
      const s = section as HeadingSection;
      return <h4 className="tg-h4"><RichText text={s.text} /></h4>;
    }

    case 'paragraph': {
      const s = section as ParagraphSection;
      return <p className="tg-p"><RichText text={s.text} /></p>;
    }

    case 'photo': {
      const s = section as PhotoGuideSection;
      return (
        <div className="tg-photo">
          <span className="tg-photo-title">📸 拍照指南 · ZV-E10 + Pocket 3</span><br />
          {s.items.map((item, i) => (
            <span key={i} className="tg-photo-item">
              ▪ <b>{item.place}</b> — <b>{item.camera}</b> {item.tip}
              {i < s.items.length - 1 && <br />}
            </span>
          ))}
        </div>
      );
    }

    case 'warning': {
      const s = section as WarningSection;
      return (
        <div className="tg-warning">
          <span className="tg-warning-title">⚠️ 当天避坑</span><br />
          {s.items.map((item, i) => (
            <span key={i} className="tg-photo-item">
              ▪ <RichText text={item} />
              {i < s.items.length - 1 && <br />}
            </span>
          ))}
        </div>
      );
    }

    case 'cost': {
      const s = section as CostSection;
      return (
        <div className="tg-cost">
          {s.tags.map((tag, i) => (
            <span key={i} className={`tg-tag tg-tag-${tag.color}`}>{tag.label}</span>
          ))}
          <span className="total">{s.total}</span>
        </div>
      );
    }

    case 'links': {
      const s = section as LinkSection;
      // If we have raw text but no structured items, render raw
      if ((!s.items || s.items.length === 0) && s.raw) {
        return (
          <>
            <hr className="tg-sep" />
            <div className="tg-links">
              <RichText text={s.raw} />
            </div>
          </>
        );
      }
      return (
        <>
          <hr className="tg-sep" />
          <div className="tg-links">
            <strong>🔗 相关链接：</strong>{' '}
            {s.items.map((item, i) => (
              <span key={i}>
                {item.icon || ''}{' '}
                {item.url
                  ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.text}</a>
                  : item.text}
                {item.note && <> — {item.note}</>}
                {i < s.items.length - 1 && ' · '}
              </span>
            ))}
          </div>
        </>
      );
    }

    case 'subToggle': {
      return <SubToggle section={section as SubToggleSection} />;
    }

    case 'hotel': {
      const s = section as HotelSection;
      return (
        <div className="tg-hotel">
          <strong>🏨 {s.name}</strong><br />
          <RichText text={s.detail} />
        </div>
      );
    }

    case 'blockquote': {
      const s = section as BlockquoteSection;
      return <blockquote className="tg-blockquote"><RichText text={s.text} /></blockquote>;
    }

    case 'pre': {
      const s = section as PreSection;
      return <pre className="tg-pre">{s.text}</pre>;
    }

    default:
      return null;
  }
}

/* ============ Sub-Toggle ============ */
function SubToggle({ section }: { section: SubToggleSection }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`tg-sub-toggle ${open ? 'open' : ''}`}>
      <div className="tg-sub-toggle-header" onClick={() => setOpen(!open)}>
        {section.title}
      </div>
      <div className="tg-sub-toggle-body">
        {section.sections.map((s, i) => <Section key={i} section={s} />)}
      </div>
    </div>
  );
}

/* ============ Day Card ============ */
function DayCard({ day, journalStatus, guideSlug }: {
  day: DayData;
  journalStatus?: { visibility: string } | null;
  guideSlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dayNumber = parseInt(day.num, 10);

  const hasJournal = !!journalStatus;
  const isPublic = journalStatus?.visibility === 'public';

  const handleJournalClick = () => {
    if (guideSlug) {
      navigate(`/travels/${guideSlug}/journal/${dayNumber}`);
    }
  };

  return (
    <div className={`tg-day ${open ? 'open' : ''}`}>
      <div className="tg-day-header" onClick={() => setOpen(!open)}>
        <div className="tg-day-num">{day.num}</div>
        <div className="tg-day-meta">
          <h3>
            {day.title}
            {day.titleNote && <span className="tg-title-note"> {day.titleNote}</span>}
            {' '}{day.status && <StatusBadge status={day.status} />}
            {hasJournal && (
              <span className="tg-journal-badge" title={isPublic ? '已写公开游记' : '有私密游记'}>
                {isPublic ? '📝' : '🔒'}
              </span>
            )}
          </h3>
          <div className="tg-day-date">{day.date}</div>
        </div>
        <span className="tg-day-arrow">▾</span>
      </div>
      <div className="tg-day-body">
        {day.timeline && day.timeline.length > 0 && (
          <div className="tg-tl">
            {day.timeline.map((item, i) => (
              <TimelineRow key={i} item={item} isLast={i === day.timeline!.length - 1} />
            ))}
          </div>
        )}
        {day.sections.map((section, i) => <Section key={i} section={section} />)}

        {/* 游记链接 */}
        <div className="tg-journal-link-row">
          {hasJournal ? (
            <button className="tg-journal-btn has-journal" onClick={handleJournalClick}>
              {isPublic ? '📝 查看游记' : '🔒 私密游记'} →
            </button>
          ) : (
            <button className="tg-journal-btn" onClick={handleJournalClick}>
              📝 记录这一天 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ Packing List ============ */
function PackingList({ data }: { data: TravelGuideData['packing'] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`tg-day ${open ? 'open' : ''}`} style={{ marginBottom: 20 }}>
      <div className="tg-day-header" onClick={() => setOpen(!open)}>
        <div className="tg-day-num">🎒</div>
        <div className="tg-day-meta">
          <h3>行李清单 · 只背一个包</h3>
          <div className="tg-day-date">14天 / 温差 −5~35°C · 海拔 500–3800m</div>
        </div>
        <span className="tg-day-arrow">▾</span>
      </div>
      <div className="tg-day-body">
        <div className="tg-packing-grid">
          {data.categories.map((cat, i) => (
            <div key={i} className={`tg-packing-col ${cat.color}`}>
              <div className="tg-packing-col-title">{cat.emoji} {cat.label}</div>
              <ul className="tg-packing-list">
                {cat.items.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="tg-packing-tip">
          💡 <b>打包原则</b>：{data.tip}
        </div>
      </div>
    </div>
  );
}

/* ============ Main Renderer ============ */
export default function TravelGuideRenderer({
  data,
  journalStatuses,
  guideSlug,
}: {
  data: TravelGuideData;
  journalStatuses?: Map<number, { visibility: string }>;
  guideSlug?: string;
}) {
  return (
    <div className="travel-guide">
      {/* Header */}
      <div className="tg-header">
        <h1>{data.meta.title}</h1>
        <p className="sub">{data.meta.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="tg-stats">
        {data.meta.stats.map((s, i) => (
          <div key={i} className="tg-stat">
            <div className="num">{s.num}</div>
            <div className="lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Route */}
      <div className="tg-route">
        {data.meta.route.map((stop, i) => (
          <span key={i}>
            {stop}{i < data.meta.route.length - 1 && <span className="arrow"> → </span>}
          </span>
        ))}
      </div>

      {/* Packing */}
      <PackingList data={data.packing} />

      {/* Days */}
      {data.days.map((day, i) => {
        const dayNum = parseInt(day.num, 10);
        const status = journalStatuses?.get(dayNum);
        return (
          <DayCard
            key={i}
            day={day}
            journalStatus={status}
            guideSlug={guideSlug}
          />
        );
      })}

      {/* Booked Summary */}
      {data.booked.rows.length > 0 && (
        <div className="tg-section-card">
          <h2>📋 已订/待抢/待确认</h2>
          <table className="tg-booked">
            <thead>
              <tr>{data.booked.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.booked.rows.map((row, i) => (
                <tr key={i}>
                  {row.cells.map((cell, j) => <td key={j}><RichText text={cell} /></td>)}
                  {row.status && <td><StatusBadge status={row.status} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Todo Checklist */}
      {data.todo.pending.length > 0 && (
        <div className="tg-section-card">
          <h2>✅ 出发前必做清单</h2>
          <ul className="tg-checklist">
            {data.todo.done.map((item, i) => (
              <li key={`d${i}`} className="done">{item}</li>
            ))}
            {data.todo.pending.map((item, i) => (
              <li key={`p${i}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="tg-footer">
        最后更新：{data.meta.lastUpdate}<br />
        <span style={{ opacity: 0.6 }}>{data.meta.footer}</span>
      </div>
    </div>
  );
}
