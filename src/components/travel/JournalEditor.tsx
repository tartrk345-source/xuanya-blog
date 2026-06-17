/**
 * JournalEditor — 全屏游记编辑器模态框
 * 使用 React Portal 渲染到 document.body，真正的全屏体验
 */
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type {
  TravelJournal,
  JournalTemplate,
  JournalMood,
  JournalPhoto,
  ActualTimelineEntry,
  ExpenseEntry,
} from '../../data/travelTypes';
import { saveJournal } from '../../lib/journals';
import { uploadJournalPhoto } from '../../lib/uploadPhoto';
import PhotoUploader from './PhotoUploader';
import TimelineEditor from './TimelineEditor';
import ExpenseEditor from './ExpenseEditor';
import MoodPicker from './MoodPicker';
import VisibilityToggle from './VisibilityToggle';

interface Props {
  /** 已有游记（编辑模式），null 表示新建 */
  journal: TravelJournal | null;
  /** 游记模板（从 DayData 生成） */
  template: JournalTemplate;
  /** 关闭编辑器 */
  onClose: () => void;
  /** 保存成功回调 */
  onSaved?: (journal: TravelJournal) => void;
}

export default function JournalEditor({ journal, template, onClose, onSaved }: Props) {
  const isNew = !journal?.id;

  // Form state
  const [content, setContent] = useState(journal?.content || '');
  const [photos, setPhotos] = useState<JournalPhoto[]>(journal?.photos || []);
  const [timeline, setTimeline] = useState<ActualTimelineEntry[]>(
    journal?.actual_timeline?.length ? journal.actual_timeline : template.actual_timeline,
  );
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(
    journal?.expenses?.length ? journal.expenses : template.expenses,
  );
  const [mood, setMood] = useState<JournalMood | ''>((journal?.mood as JournalMood) || '');
  const [moodNote, setMoodNote] = useState(journal?.mood_note || '');
  const [weather, setWeather] = useState(journal?.weather || '');
  const [location, setLocation] = useState(journal?.location || '');
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    journal?.visibility || 'private',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Upload callback for PhotoUploader
  const handleUpload = useCallback(async (file: File): Promise<string | null> => {
    return uploadJournalPhoto(file, template.guide_slug, template.day_number);
  }, [template.guide_slug, template.day_number]);

  // Save
  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const payload: TravelJournal = {
        guide_slug: template.guide_slug,
        day_number: template.day_number,
        content,
        photos,
        actual_timeline: timeline,
        expenses,
        mood,
        mood_note: moodNote,
        weather,
        location,
        visibility,
      };

      // 编辑模式带上 id
      if (journal?.id) {
        payload.id = journal.id;
      }

      const saved = await saveJournal(payload);
      if (!saved) {
        setError('保存失败，请重试');
        setSaving(false);
        return;
      }

      onSaved?.(saved);
      onClose();
    } catch (e: any) {
      setError(e.message || '保存失败');
      setSaving(false);
    }
  };

  // Escape 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div className="je-overlay" onClick={onClose}>
      <div className="je-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="je-header">
          <button className="je-back-btn" onClick={onClose}>← 返回</button>
          <div className="je-header-info">
            <span className="je-day-num">Day {template.day_number}</span>
            <h2 className="je-day-title">{template.day_title}</h2>
            <span className="je-day-date">{template.day_date}</span>
          </div>
          <button
            className="je-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中…' : isNew ? '💾 保存游记' : '💾 更新游记'}
          </button>
        </div>

        {/* Error */}
        {error && <div className="je-error">{error}</div>}

        {/* Body — scrollable */}
        <div className="je-body">
          {/* 照片 */}
          <PhotoUploader
            photos={photos}
            onChange={setPhotos}
            onUpload={handleUpload}
            disabled={saving}
          />

          {/* 天气 + 位置 同行 */}
          <div className="je-row-2">
            <div className="je-field">
              <label className="je-label">☁️ 天气</label>
              <input
                type="text"
                className="je-input"
                placeholder="如：晴 28°C"
                value={weather}
                onChange={e => setWeather(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="je-field">
              <label className="je-label">📍 位置</label>
              <input
                type="text"
                className="je-input"
                placeholder="如：银川 · 西夏陵"
                value={location}
                onChange={e => setLocation(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* 心情 */}
          <MoodPicker mood={mood} onChange={setMood} />
          {mood && (
            <div className="je-field">
              <textarea
                className="je-input je-textarea-sm"
                placeholder="简单说说今天的心情…"
                value={moodNote}
                onChange={e => setMoodNote(e.target.value)}
                rows={2}
                disabled={saving}
              />
            </div>
          )}

          {/* 花费 */}
          <ExpenseEditor expenses={expenses} onChange={setExpenses} />

          {/* 时间线 */}
          <TimelineEditor entries={timeline} onChange={setTimeline} />

          {/* 正文 */}
          <div className="je-field">
            <label className="je-label">📝 游记正文（支持 Markdown）</label>
            <textarea
              className="je-input je-textarea"
              placeholder="记录今天的见闻…&#10;&#10;支持 Markdown 格式：**加粗**、- 列表、## 标题等"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={12}
              disabled={saving}
            />
          </div>

          {/* 可见性 */}
          <VisibilityToggle visibility={visibility} onChange={setVisibility} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
