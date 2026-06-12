import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://twuvrrfzlynhehdxxtid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh0aWQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4MTI3ODczNSwiZXhwIjoyMDk2ODU0NzM1fQ.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }, // 不需要用户登录
});
