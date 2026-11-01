/**
 * Supabase 同源反代（Vercel Edge Function）
 *
 * 浏览器 → https://www.x2ya.com/api/supabase/rest/v1/... → Supabase
 *
 * 优点：
 *  - 同源请求：无 CORS、无第三方域名，国内访客随主站一起加载
 *  - 出网走 Vercel 边缘，不受国内对 supabase.co 的 DNS 污染影响
 */

export const config = { runtime: 'edge' };

const UPSTREAM = 'https://twuvrrfzlynhehdxxtid.supabase.co';

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // /api/supabase/rest/v1/articles → /rest/v1/articles
  const path = url.pathname.replace(/^\/api\/supabase/, '') || '/';
  const target = UPSTREAM + path + url.search;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body:
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : request.body,
    redirect: 'manual',
  });

  const res = new Response(upstream.body, upstream);
  res.headers.delete('set-cookie');
  // 反代响应不缓存，避免数据更新后读到旧内容
  res.headers.set('cache-control', 'no-store');
  return res;
}
