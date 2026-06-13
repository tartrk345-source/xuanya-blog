import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twuvrrfzlynhehdxxtid.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MzUsImV4cCI6MjA5Njg1NDczNX0.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const defaults = [
  { key: 'psychiatry', label: '精神心理', icon: '🧠', description: '精神分裂症、抑郁障碍、dTMS神经调控——深耕临床一线，以实证回应困惑。' },
  { key: 'bci', label: '脑机接口', icon: '🧬', description: '神经调控与工程技术的交叉地带，探索精神科治疗的下一站。' },
  { key: 'positive-psychology', label: '积极心理', icon: '🌿', description: '积极心理治疗、心理韧性与幸福感研究——从疗愈疾病到滋养幸福的视角转换。' },
  { key: 'sinology', label: '国学玄学', icon: '🏯', description: '国学经典、传统智慧——以理性之眼观照古老学问，在古今之间寻找共鸣。' },
  { key: 'aromatherapy', label: '芳香疗法', icon: '🌸', description: '精油的科学应用与临床推广——让自然疗愈力触达更多人。' },
  { key: 'misc', label: '万象', icon: '✨', description: '其余热爱——它们散落在生活的缝隙里，静默发光。' },
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
