/**
 * Supabase 同源反代（Vercel Edge Function）
 *
 * 浏览器 → https://www.x2ya.com/api/supabase?p=/rest/v1/articles&select=*  →  Supabase
 *
 * 为什么用查询参数而不是子路径：
 *   Vercel 普通 Functions 不支持 Next.js 风格的 catch-all 文件名（api/[...path].ts），
 *   因此把真实上游路径放在 ?p= 里，函数入口固定为 /api/supabase。
 */

export const config = { runtime: 'edge' };

const UPSTREAM = 'https://twuvrrfzlynhehdxxtid.supabase.co';

export default async function handler(request: Request): Promise<Response> {
  try {
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

    const headers = new Headers();
    // 只转发与 Supabase 相关的请求头，避免边缘平台头干扰上游
    const pass = [
      'apikey',
      'authorization',
      'content-type',
      'accept',
      'prefer',
      'range',
      'x-upsert',
      'x-client-info',
      'cache-control',
    ];
    for (const k of pass) {
      const v = request.headers.get(k);
      if (v) headers.set(k, v);
    }

    let body: ArrayBuffer | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.arrayBuffer();
    }

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
    });

    const res = new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: upstream.headers,
    });
    res.headers.delete('set-cookie');
    // 反代响应不缓存，避免数据更新后读到旧内容
    res.headers.set('cache-control', 'no-store');
    return res;
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        error: 'proxy_failed',
        message: e?.message ?? String(e),
        stack: e?.stack ? String(e.stack).split('\n').slice(0, 3) : undefined,
      }),
      { status: 502, headers: { 'content-type': 'application/json' } }
    );
  }
}
