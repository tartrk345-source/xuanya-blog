/**
 * 游记 CRUD — 基于 Supabase REST API (轻量客户端)
 */
import { supabase } from './supabase';
import type {
  TravelJournal,
  JournalTemplate,
  ActualTimelineEntry,
  ExpenseEntry,
  TimelineItem,
  DayData,
} from '../data/travelTypes';

const TABLE = 'travel_journals';

// ============================================================
// Read
// ============================================================

/** 获取某攻略某天的游记 */
export async function getJournal(
  guideSlug: string,
  dayNumber: number,
): Promise<TravelJournal | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('guide_slug', guideSlug)
    .eq('day_number', dayNumber)
    .single<TravelJournal>();

  if (error || !data) return null;
  return data;
}

/** 获取某攻略所有天的游记列表（公开的） */
export async function getJournalsByGuide(
  guideSlug: string,
  onlyPublic = true,
): Promise<TravelJournal[]> {
  let q = supabase.from(TABLE).select('*').eq('guide_slug', guideSlug);
  if (onlyPublic) {
    q = q.eq('visibility', 'public');
  }
  q = q.order('day_number');
  const { data, error } = await q;
  if (error || !data) return [];
  return data as TravelJournal[];
}

/** 批量获取某攻略的多天游记状态（仅 id/day_number/visibility） */
export async function getJournalStatuses(
  guideSlug: string,
): Promise<{ day_number: number; visibility: string }[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('day_number,visibility')
    .eq('guide_slug', guideSlug)
    .order('day_number');

  if (error || !data) return [];
  return data as { day_number: number; visibility: string }[];
}

// ============================================================
// Write
// ============================================================

/** 创建或更新游记（upsert by guide_slug + day_number） */
export async function saveJournal(
  journal: TravelJournal,
): Promise<TravelJournal | null> {
  const payload = {
    ...journal,
    updated_at: new Date().toISOString(),
  };

  // 如果没有 id，先尝试 upsert by guide_slug + day_number
  if (!journal.id) {
    // 检查是否已存在
    const existing = await getJournal(journal.guide_slug, journal.day_number);
    if (existing?.id) {
      // 更新已有
      const { data, error } = await supabase
        .from(TABLE)
        .update(payload)
        .eq('id', existing.id)
        .single<TravelJournal>();

      if (error) {
        console.error('[journals] update failed:', error);
        return null;
      }
      return data ?? null;
    }
  }

  // 插入新记录
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .single<TravelJournal>();

  if (error) {
    console.error('[journals] insert failed:', error);
    return null;
  }
  return data ?? null;
}

/** 删除游记 */
export async function deleteJournal(id: string): Promise<boolean> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return !error;
}

// ============================================================
// Template generation
// ============================================================

/** 关键节点关键词过滤：保留景点、演出、住宿、餐饮，过滤纯交通 */
const KEY_NODE_KEYWORDS = [
  '🎬', '🏛️', '🎭', '🏨', '📍', '📸', '🏜️', '🎒', '🚂',
  '博物馆', '遗址', '影视城', '演出', '乐集', '民宿', '酒店',
  '电影', '参观', '打卡', '到达', '出发', '入住', '退房',
];

const SKIP_KEYWORDS = [
  '打车', '步行', '🚶', '🚗', '🚕', '坐车', '约', '分钟',
  '候车', '买水', '补给', '存包', '取行李', '啃干粮',
  '门口等', '占位', '去地下通道',
];

function isKeyNode(content: string): boolean {
  const lower = content.toLowerCase();
  // 如果匹配跳过关键词，直接过滤
  if (SKIP_KEYWORDS.some(k => lower.includes(k))) return false;
  // 如果匹配关键节点关键词，保留
  if (KEY_NODE_KEYWORDS.some(k => lower.includes(k))) return true;
  // 默认：包含明确地点/活动名称的保留
  return content.includes('**') || content.length > 15;
}

/** 从时间表的行数组中提取关键节点 */
function extractKeyTimeline(rows: string[][]): ActualTimelineEntry[] {
  return rows
    .filter(row => isKeyNode(row[1] || ''))
    .map(row => ({
      planned: `${row[0]} ${(row[1] || '').replace(/\*\*/g, '')}`,
      actual_time: '',
      note: '',
    }));
}

/** 从费用 section 提取花费条目 */
function extractExpenses(tags: { label: string; color: string }[]): ExpenseEntry[] {
  if (!tags || tags.length === 0) return [];
  return tags.map(tag => ({
    item: tag.label,
    planned: '',
    actual: '',
  }));
}

/** 从 DayData 生成游记模板 */
export function generateJournalTemplate(
  guideSlug: string,
  day: DayData,
): JournalTemplate {
  const timeline: ActualTimelineEntry[] = [];
  const expenses: ExpenseEntry[] = [];

  for (const section of day.sections) {
    if (section.type === 'table') {
      timeline.push(...extractKeyTimeline(section.rows));
    }
    if (section.type === 'cost') {
      expenses.push(...extractExpenses(section.tags));
    }
  }

  return {
    guide_slug: guideSlug,
    day_number: parseInt(day.num, 10),
    day_title: day.title,
    day_date: day.date,
    actual_timeline: timeline,
    expenses,
  };
}
