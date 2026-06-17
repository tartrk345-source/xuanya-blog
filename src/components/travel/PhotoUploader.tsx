/**
 * PhotoUploader — 拖拽/点击上传照片，即时预览
 */
import { useState, useRef, useCallback, type DragEvent } from 'react';
import type { JournalPhoto } from '../../data/travelTypes';

interface Props {
  photos: JournalPhoto[];
  onChange: (photos: JournalPhoto[]) => void;
  onUpload: (file: File) => Promise<string | null>;
  disabled?: boolean;
}

export default function PhotoUploader({ photos, onChange, onUpload, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled || uploading) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const url = await onUpload(file);
      if (url) {
        onChange([...photos, { url, caption: '' }]);
      }
    }
    setUploading(false);
  }, [disabled, uploading, onUpload, onChange, photos]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const removePhoto = (idx: number) => {
    const next = photos.filter((_, i) => i !== idx);
    onChange(next);
  };

  const updateCaption = (idx: number, caption: string) => {
    const next = photos.map((p, i) => (i === idx ? { ...p, caption } : p));
    onChange(next);
  };

  return (
    <div className="je-field">
      <label className="je-label">📸 照片</label>

      {/* 上传区域 */}
      <div
        className={`je-upload-zone ${dragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {uploading ? (
          <span>上传中…</span>
        ) : (
          <span>拖拽照片到此处，或点击上传</span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="je-hidden-input"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* 已上传照片列表 */}
      {photos.length > 0 && (
        <div className="je-photos-grid">
          {photos.map((photo, idx) => (
            <div key={idx} className="je-photo-item">
              <img
                src={photo.url}
                alt={photo.caption || `照片 ${idx + 1}`}
                className="je-photo-thumb"
              />
              <button
                className="je-photo-remove"
                onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}
                title="移除"
              >
                ✕
              </button>
              <input
                type="text"
                className="je-photo-caption"
                placeholder="照片描述…"
                value={photo.caption || ''}
                onChange={e => updateCaption(idx, e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
