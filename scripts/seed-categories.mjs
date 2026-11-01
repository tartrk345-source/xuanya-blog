import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twuvrrfzlynhehdxxtid.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MzUsImV4cCI6MjA5Njg1NDczNX0.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const defaults = [
  { key: 'clinical', label: '临床视角', icon: '🩺', description: '写给同行，也写给想深挖的你——dTMS 研究科普、临床指南解读、神经调控与脑科学前沿。' },
  { key: 'self-help', label: '自助工具', icon: '🌿', description: '把诊室里的方法带到生活里——芳香疗法、积极心理练习、量表与自评工具。' },
  { key: 'narrative', label: '个人叙事', icon: '📖', description: '博謇的故事与手记——成长、感悟，以及古老智慧的现代观照。' },
];

console.log('正在插入默认分类...');
const { data, error } = await supabase
  .from('categories')
  .insert(defaults)
  .select();

if (error) {
  console.error('❌ 插入失败:', error.message);
  console.error('错误详情:', error);
  process.exit(1);
}

console.log(`✅ 插入成功！共 ${data.length} 个分类:`);
data.forEach((row, i) => {
  console.log(`  ${i+1}. ${row.icon} ${row.label} (key: ${row.key})`);
});
