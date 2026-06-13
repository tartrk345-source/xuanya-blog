import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twuvrrfzlynhehdxxtid.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MzUsImV4cCI6MjA5Njg1NDczNX0.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const { data, error } = await supabase
  .from('articles')
  .select('*')
  .order('created_at', { ascending: false });

if (error) {
  console.error('读取失败:', error.message);
  process.exit(1);
}

console.log(`共 ${data.length} 篇文章:`);
data.forEach(row => {
  console.log(`  - [${row.category}] ${row.title} (status: ${row.status})`);
});

if (data.length > 0) {
  console.log('\n第一条原始数据:', JSON.stringify(data[0], null, 2));
}
