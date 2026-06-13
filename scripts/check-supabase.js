const { createClient } = require('@supabase/supabase-js');

// 从 src/lib/supabase.ts 读取同样的配置
const SUPABASE_URL = 'https://twuvrrfzlynhehdxxtid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh0aWQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4MTI3ODczNSwiZXhwIjoyMDk2ODU0NzM1fQ.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

async function main() {
  // 检查 articles 表
  const { data: articles, error: err1 } = await supabase
    .from('articles')
    .select('id, title, category, published')
    .order('created_at', { ascending: false });

  if (err1) {
    console.error('读取 articles 失败:', err1.message);
    return;
  }

  console.log('=== articles 表当前数据 ===');
  console.log(JSON.stringify(articles, null, 2));
  console.log(`共 ${articles.length} 篇文章`);

  // 检查 categories 表
  const { data: cats, error: err2 } = await supabase
    .from('categories')
    .select('key, label');

  if (err2) {
    console.error('读取 categories 失败:', err2.message);
    return;
  }

  console.log('\n=== categories 表当前数据 ===');
  console.log(JSON.stringify(cats, null, 2));
}

main();
