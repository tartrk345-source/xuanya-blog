/**
 * 旅行攻略数据存储 — 从 Supabase JSONB 表读写
 *
 * 模式与 articleStore 一致：
 * - 内存缓存（60s TTL）
 * - 写操作立即更新缓存
 * - 分类查询（published only）
 */

import { supabase } from '../lib/supabase';
import type { TravelGuideData } from '../data/travelTypes';

// ============ 列表轻量类型 ============
export interface TravelGuideMeta {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  emoji: string;
  tags: string[];
  color: string;
  updatedAt: number;
}

// ============ 缓存 ============
let listCache: TravelGuideMeta[] = [];
let listCacheTime = 0;
const CACHE_TTL = 60_000;

/** 获取所有攻略列表（不含 data 大 JSON） */
export async function getTravelList(): Promise<TravelGuideMeta[]> {
  const now = Date.now();
  if (listCache.length > 0 && now - listCacheTime < CACHE_TTL) return listCache;

  const { data, error } = await supabase
    .from('travel_guides')
    .select('id, title, subtitle, date, emoji, tags, color, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[Supabase] 加载旅行列表失败', error);
    return listCache;
  }

  listCache = (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    date: row.date,
    emoji: row.emoji,
    tags: row.tags ?? [],
    color: row.color,
    updatedAt: row.updated_at,
  }));
  listCacheTime = now;
  return listCache;
}

/** 获取单个攻略完整数据 */
export async function getTravelById(id: string): Promise<TravelGuideData | null> {
  const { data, error } = await supabase
    .from('travel_guides')
    .select('data')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.warn('[Supabase] 加载攻略失败', id, error);
    return null;
  }

  return data.data as TravelGuideData;
}

/** 保存/更新攻略（upsert） */
export async function saveTravelGuide(input: {
  id: string;
  data: TravelGuideData;
  title: string;
  subtitle: string;
  date: string;
  emoji: string;
  tags: string[];
  color: string;
}): Promise<void> {
  const now = Date.now();
  const { error } = await supabase
    .from('travel_guides')
    .upsert({
      id: input.id,
      data: input.data,
      title: input.title,
      subtitle: input.subtitle,
      date: input.date,
      emoji: input.emoji,
      tags: input.tags,
      color: input.color,
      updated_at: now,
    }, { onConflict: 'id' });

  if (error) {
    console.error('[Supabase] 保存攻略失败', error);
    throw new Error('保存攻略失败');
  }

  // 立即更新缓存
  listCacheTime = 0; // 强制下次重新拉取
}

/** 删除攻略 */
export async function deleteTravelGuide(id: string): Promise<void> {
  const { error } = await supabase
    .from('travel_guides')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] 删除攻略失败', error);
    throw new Error('删除攻略失败');
  }

  listCache = listCache.filter(t => t.id !== id);
}
