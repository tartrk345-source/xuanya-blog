-- Phase 3 修复：RLS 策略诊断与修复
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 1. 先检查当前状态
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'articles';

-- 2. 查看现有的 policies
SELECT policyname, cmd, qual, with_check, roles
FROM pg_policies
WHERE tablename = 'articles';

-- 3. 如果上面显示 RLS 已启用且策略有问题，执行以下修复：
--    删除旧策略并重新创建（更宽松的读取权限）

-- 删除旧的 articles 策略（如果存在）
DROP POLICY IF EXISTS "Published articles are readable by all" ON articles;
DROP POLICY IF EXISTS "Authenticated users can read all articles" ON articles;
DROP POLICY IF EXISTS "Authenticated users can manage articles" ON articles;

-- 重新创建：允许所有人读取已发布文章
CREATE POLICY "Enable read access for all users"
  ON articles FOR SELECT
  USING (true);

-- 允许所有人插入（因为前端用 anon key 写入）
CREATE POLICY "Enable insert for all users"
  ON articles FOR INSERT
  WITH CHECK (true);

-- 允许所有人更新
CREATE POLICY "Enable update for all users"
  ON articles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 允许所有人删除
CREATE POLICY "Enable delete for all users"
  ON articles FOR DELETE
  USING (true);

-- 4. pageviews 表也确认一下策略
DROP POLICY IF EXISTS "Pageviews are readable by all" ON pageviews;
DROP POLICY IF EXISTS "Anyone can insert pageviews" ON pageviews;

CREATE POLICY "Pageviews read for all"
  ON pageviews FOR SELECT
  USING (true);

CREATE POLICY "Pageviews insert for all"
  ON pageviews FOR INSERT
  WITH CHECK (true);
