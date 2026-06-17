/**
 * MoodPicker — 心情 emoji 选择器
 */
import type { JournalMood } from '../../data/travelTypes';

const MOODS: { emoji: JournalMood; label: string }[] = [
  { emoji: '😍', label: '超棒' },
  { emoji: '😊', label: '开心' },
  { emoji: '😐', label: '一般' },
  { emoji: '😵', label: '疲惫' },
  { emoji: '😡', label: '生气' },
  { emoji: '😢', label: '难过' },
];

interface Props {
  mood: JournalMood | '';
  onChange: (mood: JournalMood | '') => void;
}

export default function MoodPicker({ mood, onChange }: Props) {
  return (
    <div className="je-field">
      <label className="je-label">😊 心情</label>
      <div className="je-mood-picker">
        {MOODS.map(m => (
          <button
            key={m.emoji}
            type="button"
            className={`je-mood-btn ${mood === m.emoji ? 'active' : ''}`}
            onClick={() => onChange(mood === m.emoji ? '' : m.emoji)}
            title={m.label}
          >
            <span className="je-mood-emoji">{m.emoji}</span>
            <span className="je-mood-label">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
