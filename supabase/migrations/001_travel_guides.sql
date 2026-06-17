-- 旅行攻略在线编辑器 · Supabase 表
-- 在 Supabase SQL Editor 中执行此 SQL

CREATE TABLE IF NOT EXISTS travel_guides (
  id        TEXT PRIMARY KEY,              -- e.g. 'northwest-2026'
  data      JSONB NOT NULL,                -- TravelGuideData 完整 JSON
  title     TEXT NOT NULL DEFAULT '',       -- 冗余字段，方便列表查询
  subtitle  TEXT NOT NULL DEFAULT '',
  date      TEXT NOT NULL DEFAULT '',
  emoji     TEXT NOT NULL DEFAULT '🏜️',
  tags      TEXT[] NOT NULL DEFAULT '{}',
  color     TEXT NOT NULL DEFAULT '#c88a3d',
  updated_at BIGINT NOT NULL DEFAULT 0     -- Unix 毫秒时间戳
);

-- RLS: 允许所有用户读取（公开数据）
ALTER TABLE travel_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON travel_guides
  FOR SELECT USING (true);

-- 写入仅允许通过 anon key（admin 页面使用，密码在前端验证）
-- 生产环境建议使用 service_role key + Edge Function
CREATE POLICY "Allow insert/update via anon" ON travel_guides
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update via anon" ON travel_guides
  FOR UPDATE USING (true);

-- 种子数据：写入当前西北攻略
INSERT INTO travel_guides (id, data, title, subtitle, date, emoji, tags, color, updated_at) VALUES
('northwest-2026',
 '{"meta":{"title":"西北+青海环线","subtitle":"单人出行（6/17–6/19）· 4人北疆自驾（6/20–6/28）· solo 青海（6/29–6/30）· 2026 年 6 月","stats":[{"num":"14","label":"天（6/17–6/30）"},{"num":"5","label":"省/自治区"},{"num":"约 ¥9,800","label":"预估总花费（含酒店+租车人均）"},{"num":"4人","label":"6/20–6/27"}],"route":["深圳","银川","嘉峪关","乌鲁木齐","S101","安集海","奎屯","温泉","赛里木湖","伊宁","特克斯","夏塔","喀拉峻","唐布拉","独库公路","乌市","西宁","青海湖","返深"],"lastUpdate":"2026-06-16","footer":"以上信息基于公开资料整理"},"packing":{"tip":"薄羽绒可压缩，冲锋衣穿身上登机","categories":[]},"days":[],"booked":{"headers":[],"rows":[]},"todo":{"done":[],"pending":[]}}',
 '西北+青海环线',
 '14日穿越银川·河西走廊·北疆·伊犁·独库公路·青海湖',
 '2026.06.17 – 06.30',
 '🏜️',
 ARRAY['甘肃','新疆','青海','自驾'],
 '#c88a3d',
 0)
ON CONFLICT (id) DO NOTHING;
