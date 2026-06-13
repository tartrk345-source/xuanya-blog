-- Phase 3 数据库迁移：访问统计 + RLS 安全策略
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 1. 创建 pageviews 表（访问统计）
CREATE TABLE IF NOT EXISTS pageviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, view_date, client_hash)
);

-- 2. pageviews 索引
CREATE INDEX IF NOT EXISTS idx_pageviews_article ON pageviews(article_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_date ON pageviews(view_date);

-- 3. RLS 策略：articles 表
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 所有人可以读已发布文章
CREATE POLICY "Published articles are readable by all"
  ON articles FOR SELECT
  USING (status = 'published');

-- 认证用户可以读所有文章（包括草稿）
CREATE POLICY "Authenticated users can read all articles"
  ON articles FOR SELECT
  USING (auth.role() = 'authenticated');

-- 认证用户可以增删改文章
CREATE POLICY "Authenticated users can manage articles"
  ON articles FOR ALL
  USING (auth.role() = 'authenticated');

-- 4. RLS 策略：pageviews 表
ALTER TABLE pageviews ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看浏览量（SELECT）
CREATE POLICY "Pageviews are readable by all"
  ON pageviews FOR SELECT
  USING (true);

-- 所有人可以插入浏览记录（匿名用户也可以计数）
CREATE POLICY "Anyone can insert pageviews"
  ON pageviews FOR INSERT
  WITH CHECK (true);

-- 5. pageviews 清理（可选：30天前的数据自动清理）
-- CREATE POLICY "Auto cleanup old pageviews"
--   ON pageviews FOR DELETE
--   USING (view_date < CURRENT_DATE - INTERVAL '30 days');
