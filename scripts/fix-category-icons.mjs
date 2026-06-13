import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://twuvrrfzlynhehdxxtid.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MzUsImV4cCI6MjA5Njg1NDczNX0.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o',
  { auth: { persistSession: false } }
);

async function main() {
  // 更新脑机接口分类图标：🔬 → ⚡
  const { error: e1 } = await supabase
    .from('categories')
    .update({ icon: '⚡' })
    .eq('key', 'bci');
  if (e1) console.error('bci update failed:', e1.message);
  else console.log('bci icon: 🔬 → ⚡');

  // 更新国学玄学分类图标：🏯 → ☯️
  const { error: e2 } = await supabase
    .from('categories')
    .update({ icon: '☯️' })
    .eq('key', 'sinology');
  if (e2) console.error('sinology update failed:', e2.message);
  else console.log('sinology icon: 🏯 → ☯️');

  // 验证
  const { data, error } = await supabase
    .from('categories')
    .select('key, label, icon')
    .order('key');
  if (error) console.error('fetch failed:', error.message);
  else console.log('Current categories:', JSON.stringify(data, null, 2));
}

main();
