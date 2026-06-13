import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://twuvrrfzlynhehdxxtid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MzUsImV4cCI6MjA5Njg1NDczNX0.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// 查 articles 表结构
const { data, error } = await supabase
  .from('articles')
  .select('*')
  .limit(0);

if (error) {
  console.error('Error:', error.message);
} else {
  console.log('articles 表可访问，数据:', data);
}

// 查 categories 表
const { data: catData, error: catError } = await supabase
  .from('categories')
  .select('*');

if (catError) {
  console.error('categories Error:', catError.message);
} else {
  console.log('\ncategories 表数据:', JSON.stringify(catData, null, 2));
}
