-- ============================================================
-- 游记系统：travel_journals 表 + journal_photos Storage bucket
-- ============================================================

-- 1. 游记表
CREATE TABLE IF NOT EXISTS travel_journals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_slug      TEXT NOT NULL,
  day_number      INTEGER NOT NULL,
  content         TEXT DEFAULT '',
  photos          JSONB DEFAULT '[]',
  actual_timeline JSONB DEFAULT '[]',
  expenses        JSONB DEFAULT '[]',
  mood            TEXT DEFAULT '',
  mood_note       TEXT DEFAULT '',
  weather         TEXT DEFAULT '',
  location        TEXT DEFAULT '',
  visibility      TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 唯一约束：每个攻略每天只有一篇游记
CREATE UNIQUE INDEX IF NOT EXISTS idx_journals_guide_day
  ON travel_journals(guide_slug, day_number);

-- 2. RLS 策略
ALTER TABLE travel_journals ENABLE ROW LEVEL SECURITY;

-- 所有人可读公开游记
DROP POLICY IF EXISTS "Public read journals" ON travel_journals;
CREATE POLICY "Public read journals" ON travel_journals
  FOR SELECT
  USING (visibility = 'public');

-- 匿名用户可写入（管理页面通过 supabase anon key 操作，先不做登录）
DROP POLICY IF EXISTS "Anon full access" ON travel_journals;
CREATE POLICY "Anon full access" ON travel_journals
  USING (true)
  WITH CHECK (true);

-- 3. 照片存储 bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'journal_photos',
  'journal_photos',
  true,
  52428800,  -- 50MB
  '{image/png,image/jpeg,image/gif,image/webp,image/heic,image/heif}'
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS
DROP POLICY IF EXISTS "Public read photos" ON storage.objects;
CREATE POLICY "Public read photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'journal_photos');

DROP POLICY IF EXISTS "Anon upload photos" ON storage.objects;
CREATE POLICY "Anon upload photos" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'journal_photos');

DROP POLICY IF EXISTS "Anon update photos" ON storage.objects;
CREATE POLICY "Anon update photos" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'journal_photos');

DROP POLICY IF EXISTS "Anon delete photos" ON storage.objects;
CREATE POLICY "Anon delete photos" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'journal_photos');
