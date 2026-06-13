import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twuvrrfzlynhehdxxtid.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MzUsImV4cCI6MjA5Njg1NDczNX0.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('开始测试 Supabase 读取...\n');

// 测试1：读取所有文章
console.log('=== 测试1：读取所有文章 ===');
const { data: allArticles, error: err1 } = await supabase
  .from('articles')
  .select('*')
  .order('created_at', { ascending: false });

if (err1) {
  console.error('❌ 读取失败:', err1.message);
} else {
  console.log(`✅ 读取成功！共 ${allArticles.length} 篇文章`);
  allArticles.forEach((row, i) => {
    console.log(`  ${i+1}. [${row.category}] ${row.title} (status: ${row.status})`);
  });
}

// 测试2：只读取已发布的文章
console.log('\n=== 测试2：只读取已发布的文章 ===');
const { data: published, error: err2 } = await supabase
  .from('articles')
  .select('*')
  .eq('status', 'published')
  .order('created_at', { ascending: false });

if (err2) {
  console.error('❌ 读取失败:', err2.message);
} else {
  console.log(`✅ 读取成功！共 ${published.length} 篇已发布文章`);
  published.forEach((row, i) => {
    console.log(`  ${i+1}. [${row.category}] ${row.title}`);
  });
}

// 测试3：检查字段类型
console.log('\n=== 测试3：检查字段类型 ===');
if (allArticles.length > 0) {
  const first = allArticles[0];
  console.log('第一条文章的字段类型:');
  console.log(`  id: ${typeof first.id} = ${first.id}`);
  console.log(`  title: ${typeof first.title} = ${first.title}`);
  console.log(`  category: ${typeof first.category} = ${first.category}`);
  console.log(`  status: ${typeof first.status} = ${first.status}`);
  console.log(`  created_at: ${typeof first.created_at} = ${first.created_at}`);
  console.log(`  updated_at: ${typeof first.updated_at} = ${first.updated_at}`);
  console.log(`  emoji: ${typeof first.emoji} = ${first.emoji}`);
}

// 测试4：读取分类
console.log('\n=== 测试4：读取分类 ===');
const { data: categories, error: err3 } = await supabase
  .from('categories')
  .select('*');

if (err3) {
  console.error('❌ 读取失败:', err3.message);
} else {
  console.log(`✅ 读取成功！共 ${categories.length} 个分类`);
  categories.forEach((row, i) => {
    console.log(`  ${i+1}. ${row.icon} ${row.label} (key: ${row.key})`);
  });
}
