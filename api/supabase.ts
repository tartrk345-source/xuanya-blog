/**
 * Supabase 同源反代（Vercel Node Function）
 *
 * 浏览器 → https://www.x2ya.com/api/supabase?p=/rest/v1/articles&select=*  →  Supabase
 *
 * 为什么用查询参数而不是子路径：
 *   Vercel 普通 Functions 不支持 Next.js 风格的 catch-all 文件名（api/[...path].ts），
 *   因此把真实上游路径放在 ?p= 里，函数入口固定为 /api/supabase。
 *
 * 为什么用 Node 运行时而不是 Edge：
 *   Edge 运行时访问外部上游时返回 "internal error"，Node 运行时稳定。
 */

const UPSTREAM = 'https://twuvrrfzlynhehdxxtid.supabase.co';

const PASS_HEADERS = [
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

function readRaw(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: any, res: any) {
  try {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const url = new URL(req.url || '/', `${proto}://${req.headers.host}`);

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

    const headers: Record<string, string> = {};
    for (const k of PASS_HEADERS) {
      const v = req.headers[k];
      if (v) headers[k] = Array.isArray(v) ? v.join(',') : String(v);
    }

    const method = (req.method || 'GET').toUpperCase();
    let body: any;
    if (method !== 'GET' && method !== 'HEAD') {
      if (req.body !== undefined && req.body !== null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        body = JSON.stringify(req.body);
      } else if (req.body !== undefined && req.body !== null) {
        body = req.body;
      } else {
        body = await readRaw(req);
      }
    }

    const upstream = await fetch(target, { method, headers, body, redirect: 'manual' });

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      // 交给 Node 重新压缩/计算长度，避免与 undici 解压后的响应体不匹配
      if (k === 'set-cookie' || k === 'content-encoding' || k === 'content-length' || k === 'transfer-encoding') return;
      res.setHeader(key, value);
    });
    res.setHeader('cache-control', 'no-store');

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (e: any) {
    res.status(502).json({
      error: 'proxy_failed',
      message: e?.message ?? String(e),
    });
  }
}
