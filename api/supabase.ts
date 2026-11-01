/**
 * Supabase 同源反代（Vercel Edge Function）
 *
 * 浏览器 → https://www.x2ya.com/api/supabase?p=/rest/v1/articles&select=*  →  Supabase
 *
 * 为什么用查询参数而不是子路径：
 *   Vercel 普通 Functions 不支持 Next.js 风格的 catch-all 文件名（api/[...path].ts），
 *   因此把真实上游路径放在 ?p= 里，函数入口固定为 /api/supabase。
 *
 * 优点：
 *  - 同源请求：无 CORS、无第三方域名，国内访客随主站一起加载
 *  - 出网走 Vercel 边缘，不受国内对 supabase.co 的 DNS 污染影响
 */

export const config = { runtime: 'edge' };

const UPSTREAM = 'https://twuvrrfzlynhehdxxtid.supabase.co';

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  let path = url.searchParams.get('p');
  if (!path) {
    // 兼容旧写法：/api/supabase/rest/v1/xxx
    path = url.pathname.replace(/^\/api\/supabase/, '') || '/rest/v1/';
  }
  if (!path.startsWith('/')) path = '/' + path;

  const params = new URLSearchParams(url.search);
  params.delete('p');
  const search = params.toString();

  const target = UPSTREAM + path + (search ? '?' + search : '');

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('cf-connecting-ip');
  headers.delete('x-forwarded-for');
  headers.delete('x-real-ip');

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
