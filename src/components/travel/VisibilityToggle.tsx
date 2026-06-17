/**
 * VisibilityToggle — 公开/私密切换
 */

interface Props {
  visibility: 'public' | 'private';
  onChange: (v: 'public' | 'private') => void;
}

export default function VisibilityToggle({ visibility, onChange }: Props) {
  return (
    <div className="je-field">
      <label className="je-label">👁️ 可见性</label>
      <div className="je-vis-toggle">
        <button
          type="button"
          className={`je-vis-btn ${visibility === 'private' ? 'active' : ''}`}
          onClick={() => onChange('private')}
        >
          🔒 仅自己可见
          <span className="je-vis-hint">保存后不会出现在公开页面</span>
        </button>
        <button
          type="button"
          className={`je-vis-btn ${visibility === 'public' ? 'active' : ''}`}
          onClick={() => onChange('public')}
        >
          🌐 公开
          <span className="je-vis-hint">所有人可读，攻略中有查看链接</span>
        </button>
      </div>
    </div>
  );
}
