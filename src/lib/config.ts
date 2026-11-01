/**
 * 数据源地址配置
 *
 * 生产（默认）：同源反代 /api/supabase —— 由 Vercel Edge Function 转发到 Supabase，
 *              浏览器不直接访问 supabase.co，国内访客可正常加载。
 * 覆盖：设 VITE_SUPABASE_BASE 环境变量可切换到其它地址（如 https://api.x2ya.com CF Worker 反代，
 *      或 https://<ref>.supabase.co 直连用于本地调试）。
 */

export const SUPABASE_BASE: string =
  (import.meta.env.VITE_SUPABASE_BASE as string | undefined) ?? '/api/supabase';

export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MzUsImV4cCI6MjA5Njg1NDczNX0.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o';

/** 真实 Supabase 上游地址，仅用于本地开发代理配置 */
export const SUPABASE_UPSTREAM =
  'https://twuvrrfzlynhehdxxtid.supabase.co';
