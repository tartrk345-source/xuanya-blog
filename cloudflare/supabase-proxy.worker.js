/**
 * Supabase 反代 Worker（方案 A · v2）
 *
 * v2 修复：去掉手动 Host 头改写（会触发上游 530 Origin DNS error），
 * 改用标准 fetch 转发：URL 即上游地址，Host 由 fetch 自动生成。
 * 转发前剥离 CF 注入的跟踪头，避免污染上游。
 */

const UPSTREAM = 'https://twuvrrfzlynhehdxxtid.supabase.co';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const upstreamUrl = UPSTREAM + url.pathname + url.search;

    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ipcountry');
    headers.delete('cf-ray');
    headers.delete('cf-visitor');
    headers.delete('x-forwarded-for');
    headers.delete('x-forwarded-proto');
    headers.delete('x-real-ip');

    const upstreamRes = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    });

    const res = new Response(upstreamRes.body, upstreamRes);
    // 交由 Supabase 的 CORS 头生效；Worker 自身域名无需额外头
    res.headers.delete('set-cookie');
    return res;
  },
};
