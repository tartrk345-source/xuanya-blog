import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twuvrrfzlynhehdxxtid.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MzUsImV4cCI6MjA5Njg1NDczNX0.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('正在更新文章的 category...\n');

// 获取所有文章
const { data: articles, error: fetchError } = await supabase
  .from('articles')
  .select('id, title, category');

if (fetchError) {
  console.error('❌ 读取失败:', fetchError.message);
  process.exit(1);
}

console.log(`共 ${articles.length} 篇文章，当前 category 值:`);
articles.forEach(a => console.log(`  - ${a.title}: ${a.category}`));

// 更新映射
const mapping = {
  'science': 'psychiatry',   // 科研 → 精神心理
  'psych': 'psychiatry',      // 心理 → 精神心理
  'life': 'positive-psychology', // 生活 → 积极心理
};

console.log('\n开始更新...');
for (const article of articles) {
  const newCategory = mapping[article.category];
  if (!newCategory) {
    console.log(`  ⚠️  跳过 "${article.title}" (category="${article.category}" 无映射)`);
    continue;
  }

  const { error: updateError } = await supabase
    .from('articles')
    .update({ category: newCategory })
    .eq('id', article.id);

  if (updateError) {
    console.error(`  ❌ 更新失败: ${article.title}`, updateError.message);
  } else {
    console.log(`  ✅ ${article.title}: ${article.category} → ${newCategory}`);
  }
}

console.log('\n完成！验证结果:');
const { data: updated, error: verifyError } = await supabase
  .from('articles')
  .select('id, title, category');

if (verifyError) {
  console.error('验证失败:', verifyError.message);
} else {
  updated.forEach(a => {
    console.log(`  - ${a.title}: ${a.category}`);
  });
}
