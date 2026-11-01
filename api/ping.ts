export const config = { runtime: 'edge' };

export default function handler() {
  return new Response(JSON.stringify({ ok: true, runtime: 'edge', ts: Date.now() }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
