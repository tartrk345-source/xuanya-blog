/**
 * 轻量 REST API 客户端 — 替代 @supabase/supabase-js（节省 ~160KB）
 *
 * 直接用 fetch 调用 Supabase PostgREST API。
 * QueryBuilder 实现了 thenable 接口，可被 await 直接执行。
 */

const BASE_URL = 'https://twuvrrfzlynhehdxxtid.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MzUsImV4cCI6MjA5Njg1NDczNX0.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o';

// ----------------------------------------------------------------
class QueryBuilder {
  private table: string;
  private params = new URLSearchParams();
  private method = 'GET';
  private body: string | null = null;
  private extra: Record<string, string> = {};

  constructor(table: string) { this.table = table; }

  // thenable — 使 await supabase.from('x').select('*') 直接工作
  then<T>(onFulfill: (v: any) => T, onReject: (e: any) => T) {
    return this._exec().then(onFulfill, onReject);
  }
  catch<T>(onReject: (e: any) => T) {
    return this._exec().catch(onReject);
  }

  select(cols: string, opts?: { count?: string; head?: boolean }) {
    this.method = opts?.head ? 'HEAD' : 'GET';
    this.params.set('select', cols);
    if (opts?.count === 'exact') this.extra['Prefer'] = 'count=exact';
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.params.append('order', `${col}.${opts?.ascending === false ? 'desc' : 'asc'}.nullslast`);
    return this;
  }

  eq(col: string, val: any) { this.params.append(col, `eq.${val}`); return this; }
  neq(col: string, val: any) { this.params.append(col, `neq.${val}`); return this; }

  insert(rows: any) {
    this.method = 'POST';
    this.body = JSON.stringify(rows);
    this.extra['Prefer'] = 'return=representation';
    return this;
  }

  upsert(row: any, opts: { onConflict: string }) {
    this.method = 'POST';
    this.body = JSON.stringify(row);
    this.params.set('on_conflict', opts.onConflict);
    this.extra['Prefer'] = 'return=representation';
    return this;
  }

  update(data: any) {
    this.method = 'PATCH';
    this.body = JSON.stringify(data);
    this.extra['Prefer'] = 'return=representation';
    return this;
  }

  delete() { this.method = 'DELETE'; return this; }

  private async _exec() {
    const qs = this.params.toString();
    const url = qs ? `${BASE_URL}/rest/v1/${this.table}?${qs}` : `${BASE_URL}/rest/v1/${this.table}`;
    try {
      const h: Record<string,string> = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, ...this.extra };
      if (this.body) h['Content-Type'] = 'application/json';
      const res = await fetch(url, { method: this.method, headers: h, body: this.body });
      const cr = res.headers.get('content-range');
      const count = cr ? parseInt(cr.split('/')[1], 10) : undefined;
      if (this.method === 'HEAD' || res.status === 204) {
        if (!res.ok) throw new Error(`${res.status}`);
        return { data: null, error: null, count: count ?? 0 };
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return { data: null, error: { message: `${res.status}: ${txt}` } };
      }
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('json') ? await res.json() : null;
      return count !== undefined ? { data, error: null, count } : { data, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message || 'Network error' } };
    }
  }
}

// ----------------------------------------------------------------
class StorageBucket {
  private bucket: string;
  constructor(bucket: string) { this.bucket = bucket; }

  async upload(path: string, file: File, opts?: { cacheControl?: string; contentType?: string; upsert?: boolean }) {
    try {
      const h: Record<string,string> = {
        apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': opts?.contentType || file.type || 'application/octet-stream',
      };
      if (opts?.cacheControl) h['Cache-Control'] = `max-age=${opts.cacheControl}`;
      if (opts?.upsert !== false) h['x-upsert'] = 'true';
      const res = await fetch(`${BASE_URL}/storage/v1/object/${this.bucket}/${path}`, { method: 'POST', headers: h, body: await file.arrayBuffer() });
      if (!res.ok) return { data: null, error: { message: `${res.status}` } };
      return { data: { path }, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message || 'Upload failed' } };
    }
  }

  getPublicUrl(path: string) {
    return { data: { publicUrl: `${BASE_URL}/storage/v1/object/public/${this.bucket}/${path}` } };
  }
}

// ----------------------------------------------------------------
export interface LightClient {
  from: (table: string) => QueryBuilder;
  storage: { from: (bucket: string) => StorageBucket };
}

export function createClient(_url: string, _key: string, _opts?: any): LightClient {
  return {
    from: (table: string) => new QueryBuilder(table),
    storage: { from: (bucket: string) => new StorageBucket(bucket) },
  };
}
