/**
 * 种子数据脚本：将本地 northwest2026.ts 数据写入 Supabase travel_guides 表
 * 
 * 用法：在项目根目录运行
 *   npx tsx supabase/seed-travel.ts
 * 
 * 前提：已在 Supabase SQL Editor 执行 migrations/001_travel_guides.sql 建表
 */

import { supabase } from '../src/lib/supabase';
import { northwest2026 } from '../src/data/northwest2026';

async function seed() {
  const now = Date.now();
  
  console.log('📤 上传西北攻略数据到 Supabase...');

  const { error } = await supabase
    .from('travel_guides')
    .upsert({
      id: 'northwest-2026',
      data: northwest2026,
      title: northwest2026.meta.title,
      subtitle: northwest2026.meta.subtitle,
      date: '2026.06.17 – 06.30',
      emoji: '🏜️',
      tags: ['甘肃', '新疆', '青海', '自驾'],
      color: '#c88a3d',
      updated_at: now,
    }, { onConflict: 'id' });

  if (error) {
    console.error('❌ 种子数据写入失败:', error);
    process.exit(1);
  }

  console.log('✅ 种子数据写入成功！');
  console.log(`   ID: northwest-2026`);
  console.log(`   标题: ${northwest2026.meta.title}`);
  console.log(`   天数: ${northwest2026.days.length}天`);
  console.log(`   总费用: ${northwest2026.meta.stats[2]?.num}`);
}

seed();
