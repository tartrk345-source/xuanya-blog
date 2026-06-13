import { supabase } from '../lib/supabase';

const TABLE_NAME = 'pageviews';

/** 记录一次页面访问（幂等：同一 IP 同一天同一文章只计一次） */
export async function recordPageView(articleId: string): Promise<void> {
  try {
    // 先查今天是否已有记录
    const today = new Date().toISOString().slice(0, 10);
    const clientIp = await getClientFingerprint();

    const { data: rows } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('article_id', articleId)
      .eq('view_date', today)
      .eq('client_hash', clientIp);

    if (!rows || rows.length === 0) {
      await supabase.from(TABLE_NAME).insert({
        article_id: articleId,
        view_date: today,
        client_hash: clientIp,
      });
    }
  } catch {
    // 静默失败，不影响阅读
  }
}

/** 获取文章的浏览量 */
export async function getPageViews(articleId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('article_id', articleId);

    return count ?? 0;
  } catch {
    return 0;
  }
}

/** 简单的客户端指纹（基于 user-agent + screen + language） */
async function getClientFingerprint(): Promise<string> {
  const raw = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    navigator.language,
    navigator.hardwareConcurrency || '',
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}
