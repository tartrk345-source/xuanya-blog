-- Phase 2 数据模型迁移 SQL
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 1. 添加 tags 列（JSONB 数组）
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;

-- 2. 添加封面图列
ALTER TABLE articles ADD COLUMN IF NOT EXISTS cover_image text;

-- 3. 添加置顶标记
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- 4. 添加精选标记
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- 5. 添加系列名称
ALTER TABLE articles ADD COLUMN IF NOT EXISTS series text;

-- 验证
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'articles'
ORDER BY ordinal_position;
