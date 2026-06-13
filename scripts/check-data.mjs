import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://twuvrrfzlynhehdxxtid.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MzUsImV4cCI6MjA5Njg1NDczNX0.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o',
  { auth: { persistSession: false } }
);

console.log('=== articles 表 ===');
const { data: arts, error: e1 } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
if (e1) console.error('❌', e1.message);
else { console.log(`共 ${arts.length} 篇:`); arts.forEach(a => console.log(`  [${a.category}] ${a.title} (${a.status})`)); }

console.log('\n=== categories 表 ===');
const { data: cats, error: e2 } = await supabase.from('categories').select('*');
if (e2) console.error('❌', e2.message);
else { console.log(`共 ${cats.length} 个（按读取顺序）:`); cats.forEach(c => console.log(`  ${c.icon} ${c.label} (key=${c.key})`)); }
