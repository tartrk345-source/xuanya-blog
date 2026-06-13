import { createClient } from '@supabase/supabase-js';

const s = createClient(
  'https://twuvrrfzlynhehdxxtid.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MzUsImV4cCI6MjA5Njg1NDczNX0.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o',
  { auth: { persistSession: false } }
);

const { data, error } = await s
  .from('articles')
  .select('id,title,category,status,created_at')
  .order('created_at', { ascending: false });

if (error) console.error('Error:', error.message);
else {
  console.log(`共 ${data.length} 篇文章:`);
  data.forEach(a => console.log(`  - [${a.category}] ${a.title} (${a.status})`));
}
