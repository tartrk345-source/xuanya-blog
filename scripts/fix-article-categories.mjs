import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://twuvrrfzlynhehdxxtid.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MzUsImV4cCI6MjA5Njg1NDczNX0.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o',
  { auth: { persistSession: false } }
);

// 修复文章 category
console.log('修复文章 category...\n');

const fixes = [
  { title: '降低启动成本',  correctCategory: 'psychiatry' },
  { title: '天赋、觉醒',  correctCategory: 'positive-psychology' },
  { title: '研究摘要',    correctCategory: 'psychiatry' },
];

for (const fix of fixes) {
  // 先找到文章 ID
  const { data: articles, error: findErr } = await supabase
    .from('articles')
    .select('id, title, category')
    .ilike('title', `%${fix.title}%`);

  if (findErr) { console.error(`查找失败: ${fix.title}`, findErr.message); continue; }
  if (!articles || articles.length === 0) { console.log(`未找到: ${fix.title}`); continue; }

  const article = articles[0];
  if (article.category === fix.correctCategory) {
    console.log(`✅ 无需修改: ${article.title} (${article.category})`);
    continue;
  }

  const { error: updateErr } = await supabase
    .from('articles')
    .update({ category: fix.correctCategory })
    .eq('id', article.id);

  if (updateErr) {
    console.error(`❌ 更新失败: ${article.title}`, updateErr.message);
  } else {
    console.log(`✅ 已修复: ${article.title}: ${article.category} → ${fix.correctCategory}`);
  }
}

console.log('\n验证结果:');
const { data: result, error: vErr } = await supabase
  .from('articles')
  .select('title, category')
  .order('created_at', { ascending: false });

if (vErr) console.error('验证失败:', vErr.message);
else result.forEach(a => console.log(`  - ${a.title}: ${a.category}`));
