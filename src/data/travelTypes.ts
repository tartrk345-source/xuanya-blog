// ============================================================
// 西北+青海环线 14日行程 · 数据定义
// ============================================================
// 📝 编辑指南：
//   - 每个 day 是一个对象，修改内容只需改对应字段
//   - timeline: 时间线条目 [{time, icon, content, note?, stars?}]
//   - sections: 内容区块（alert/table/list/cost/links/photo/warning/heading/paragraph/subToggle/hotel/sectionLabel/blockquote）
//   - stars: 0-5，表示推荐等级
//   - status: "locked" | "pending" | "warn"
//   - 修改后需 build + deploy（见 SKILL.md）
// ============================================================

export type StatusType = 'locked' | 'pending' | 'warn';

export interface TimelineItem {
  time: string;
  icon?: string;
  content: string;
  note?: string;
  stars?: number; // 0-5
}

export interface SectionLabel {
  type: 'sectionLabel';
  color: 'blue' | 'amber' | 'green';
  text: string;
}

export interface AlertSection {
  type: 'alert';
  color: 'blue' | 'amber' | 'red' | 'green';
  title: string;
  content: string; // 支持 HTML/Markdown 加粗等
}

export interface TableSection {
  type: 'table';
  headers: string[];
  rows: string[][]; // 每个 cell 支持 **加粗**
  highlight?: { row: number; col?: number; color?: 'amber' | 'blue' }; // 高亮行
}

export interface ListSection {
  type: 'list';
  items: string[];
}

export interface HeadingSection {
  type: 'heading';
  text: string;
}

export interface ParagraphSection {
  type: 'paragraph';
  text: string;
}

export interface PhotoGuideSection {
  type: 'photo';
  items: { place: string; camera: string; tip: string }[];
}

export interface WarningSection {
  type: 'warning';
  items: string[];
}

export interface CostSection {
  type: 'cost';
  tags: { label: string; color: 'green' | 'amber' | 'blue' }[];
  total: string;
}

export interface LinkSection {
  type: 'links';
  items: { icon: string; text: string; url?: string; note?: string }[];
  /** 原始链接文本（items 未完整解析时使用） */
  raw?: string;
}

export interface SubToggleSection {
  type: 'subToggle';
  title: string;
  sections: ContentSection[];
}

export interface HotelSection {
  type: 'hotel';
  name: string;
  detail: string;
}

export interface BlockquoteSection {
  type: 'blockquote';
  text: string;
}

export interface PreSection {
  type: 'pre';
  text: string;
}

export type ContentSection =
  | SectionLabel
  | AlertSection
  | TableSection
  | ListSection
  | HeadingSection
  | ParagraphSection
  | PhotoGuideSection
  | WarningSection
  | CostSection
  | LinkSection
  | SubToggleSection
  | HotelSection
  | BlockquoteSection
  | PreSection;

export interface DayData {
  num: string;
  title: string;
  date: string;
  status?: StatusType;
  /** 补充标题信息（如 "(备选)"） */
  titleNote?: string;
  timeline?: TimelineItem[];
  sections: ContentSection[];
}

export interface PackingCategory {
  emoji: string;
  label: string;
  color: 'red' | 'amber' | 'green';
  items: string[];
}

export interface TravelGuideData {
  meta: {
    title: string;
    subtitle: string;
    stats: { num: string; label: string }[];
    route: string[];
    lastUpdate: string;
    footer: string;
  };
  packing: {
    categories: PackingCategory[];
    tip: string;
  };
  days: DayData[];
  booked: {
    headers: string[];
    rows: { cells: string[]; status?: StatusType }[];
  };
  todo: {
    done: string[];
    pending: string[];
  };
}
