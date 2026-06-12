/**
 * localStorage 文章存储层
 *
 * 所有文章的 CRUD 操作，数据持久化于浏览器 localStorage。
 * 首次访问时自动初始化种子数据。
 */

import type { Article, ArticleInput } from '../types/article';
import { generateId } from '../utils/helpers';

const STORAGE_KEY = 'xuanya-blog-articles';

/** 种子数据：首次使用时自动创建，内容来自 ima 知识库 */
const SEED_ARTICLES: Article[] = [
  {
    id: 'seed-1',
    title: '降低启动成本：关于拖延、习惯与抑郁的一点思考',
    content: `最近一直在和拖延作斗争。\n\n每天睡前都会幻想第二天早起，泡一杯最喜欢的茶，闻一闻芳香，锻炼一下身体，听点音乐。但第二天醒来，这些事一件也做不成。\n\n## 启动成本\n\n后来我意识到，问题在于"启动成本"。\n\n对我而言，最容易做到的事是看小说——手机就在手上，点开 App 就行，启动成本为零。但泡茶呢？要准备杯子，杯子可能脏了要洗，要烧水，要取茶叶，要等茶泡好——每一步都是门槛。\n\n芳香疗法也一样：挑精油、洗熏香机、加水、通电、等它慢慢弥漫。听起来简单，实际门槛比想象中高得多。\n\n## 过程成本\n\n更糟糕的是，有些事情不仅启动成本高，过程本身也是痛苦的。\n\n锻炼让我觉得"后面要洗澡、身上会很脏"；写论文的过程本身就难熬。相比喝茶、看小说——过程是快乐的，只是启动难——锻炼和论文的"过程成本"让人更难迈出第一步。\n\n## 习惯的力量\n\n或许降低启动成本的一个办法是习惯。如果每天自动完成一件事，就不需要思考"要不要启动"了，手上自然而然就做了。\n\n## 抑郁的视角\n\n这让我想到抑郁症患者。你明知道做一些事就能好起来，但他们做不到。不是因为不努力，而是处于低谷时，连启动做对自己好的事的能力都没有了。只能看着自己越来越差，甚至到不喝水的地步。\n\n> 这是我作为医生的同理心来源——不仅是理解理论，更是理解"做不到"本身的重量。`,
    emoji: '💡',
    status: 'published',
    category: 'psychiatry' as const,
    createdAt: 1758710816918,
    updatedAt: 1758710816918,
  },
  {
    id: 'seed-2',
    title: '天赋、觉醒与多支点生活',
    content: `台风天被困在家里，低气压让整个人浑浑噩噩。刷到一个抖音视频，讲的是一个有调香天赋的男孩的故事。\n\n## 关于天赋\n\n男孩天生嗅觉灵敏，能分辨最细微的气味，随便调配就超越了老师几十年的经验。这让我忍不住想：**我的天赋到底在哪？**\n\n与生俱来的天赋，我大概已经挖掘得差不多了——与人连结的能力，进行深层思辨交流的能力。但我更期待后天觉醒出来的天赋。什么样的人生经历，能让我沉淀出一种独特的、超越他人努力的天赋？\n\n这有点像《神话版三国》里的设定：文臣能将毕生所学凝练成"天赋"，拥有天赋者才有资格进入顶尖行列。\n\n## 多支点生活\n\n其实一直以来，我都在尝试参与很多领域的活动，认识不同样子的人。这并非刻意为之，而是自然而然形成的模式。\n\n> 我始终相信，生命中应该有多个支点，它们共同支撑起一个丰富而立体的你。\n\n## 桂林的记忆\n\n前几天的桂林之行，有几个片段印象深刻。\n\n一位老师带我们做"叩穴操"——双手合十，用拇指叩击百会穴、大椎穴、胸口、两肋、丹田。这让我想到积极心理治疗如何通过身体的唤醒促进心理的改变。动作与想法的结合，有时候比单纯的认知干预更有力量。\n\n另一个环节是"打招呼"——用手、用头、用肩膀、用膝盖、用全身。一圈下来，人与人之间的距离立刻就消失了。\n\n最后，关于临终关怀的"四道"——道歉、道爱、道谢、道别。这是太沉重的话题，暂时还不敢触碰。希望等年岁再长一些，有勇气去面对。`,
    emoji: '🌟',
    status: 'published',
    category: 'positive-psychology' as const,
    createdAt: 1756134620348,
    updatedAt: 1756134620348,
  },
  {
    id: 'seed-3',
    title: '研究摘要：dTMS 靶向 ACC 治疗精神分裂症的疗效与安全性',
    content: `这是我的硕士论文摘要，发表于此作为学术记录。\n\n## 背景\n\n中国精神分裂症终身患病率 6.55‰。一线抗精神病药物治疗平均有效率仅 51.9%，且对阴性症状及认知功能改善不佳；ECT 治疗存在部分记忆力损害及认知副作用，临床应用受限。\n\n相较于传统 rTMS，深部经颅磁刺激（dTMS）的 H7 线圈可刺激皮层更深更广，能触及与精神分裂症症状相关的前扣带回皮层（ACC）等边缘系统结构，为调节精神分裂症患者的异常脑网络提供了新的技术路径。\n\n## 目的\n\n研究 dTMS 靶向刺激前扣带回皮层（ACC）作为增效治疗，探索对精神分裂症患者的临床疗效与安全性。\n\n## 方法\n\n采用随机、双盲、伪刺激对照的临床试验设计。研究纳入分析符合条件的患者，随机分配至 dTMS 真刺激组与伪刺激对照组，进行为期数周的干预，并采用标准化量表评估临床症状与认知功能变化。\n\n## 意义\n\n如果 dTMS 被证实对精神分裂症的阴性症状和认知功能有改善作用，将为难治性精神分裂症患者提供一种非药物、非侵入性的新型治疗选择。\n\n> 论文状态：已完成，待答辩。`,
    emoji: '🧠',
    status: 'published',
    category: 'psychiatry' as const,
    createdAt: 1779078619487,
    updatedAt: 1779078619487,
  },
];

/** 读取全部文章（自动迁移补全 category 字段） */
function loadAll(): Article[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveAll(SEED_ARTICLES);
      return SEED_ARTICLES;
    }
    const articles = JSON.parse(raw) as any[];

    // 数据迁移：为没有 category 的旧文章补全为 'misc'
    let patched = false;
    for (const a of articles) {
      if (!a.category) {
        a.category = 'misc';
        patched = true;
      }
    }
    if (patched) saveAll(articles);

    return articles as Article[];
  } catch {
    return [];
  }
}

/** 保存全部文章 */
function saveAll(articles: Article[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

/** 获取所有文章（按更新时间倒序） */
export function getAllArticles(): Article[] {
  return loadAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

/** 获取已发布文章（按更新时间倒序） */
export function getPublishedArticles(): Article[] {
  return loadAll()
    .filter((a) => a.status === 'published')
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** 根据 ID 获取单篇文章，找不到返回 undefined */
export function getArticleById(id: string): Article | undefined {
  return loadAll().find((a) => a.id === id);
}

/** 创建新文章 */
export function createArticle(input: ArticleInput): Article {
  const now = Date.now();
  const article: Article = {
    id: generateId(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  const articles = loadAll();
  articles.push(article);
  saveAll(articles);
  return article;
}

/** 更新文章 */
export function updateArticle(
  id: string,
  input: Partial<ArticleInput>
): Article | undefined {
  const articles = loadAll();
  const index = articles.findIndex((a) => a.id === id);
  if (index === -1) return undefined;

  articles[index] = {
    ...articles[index],
    ...input,
    updatedAt: Date.now(),
  };
  saveAll(articles);
  return articles[index];
}

/** 删除文章 */
export function deleteArticle(id: string): boolean {
  const articles = loadAll();
  const filtered = articles.filter((a) => a.id !== id);
  if (filtered.length === articles.length) return false;
  saveAll(filtered);
  return true;
}

/** 导出全部文章为原始数组（供备份下载） */
export function exportAllArticles(): Article[] {
  return loadAll();
}

/**
 * 导入文章（合并模式）
 * - 已有 ID 的文章跳过不覆盖
 * - 新 ID 的文章追加
 * 返回 { imported, skipped } 计数
 */
export function importArticles(
  incoming: Article[]
): { imported: number; skipped: number } {
  const existing = loadAll();
  const existingIds = new Set(existing.map((a) => a.id));

  let imported = 0;
  let skipped = 0;

  for (const article of incoming) {
    if (existingIds.has(article.id)) {
      skipped++;
    } else {
      existing.push(article);
      existingIds.add(article.id);
      imported++;
    }
  }

  saveAll(existing);
  return { imported, skipped };
}
