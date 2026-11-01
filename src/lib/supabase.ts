import { createClient, type LightClient } from './api';
import { SUPABASE_BASE, SUPABASE_ANON_KEY } from './config';

export const supabase: LightClient = createClient(SUPABASE_BASE, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
