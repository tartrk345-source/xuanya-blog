/**
 * 迁移脚本：志趣分类从「主题式 6 分类」切换到「读者视角 3 分类」（方案 B）
 *
 *   临床视角 clinical   ← psychiatry, bci
 *   自助工具 self-help  ← positive-psychology, aromatherapy
 *   个人叙事 narrative  ← sinology, misc
 *
 * 步骤：
 *   1. upsert 三个新分类
 *   2. 逐个旧 key 重映射 articles.category
 *   3. 删除六个旧分类
 *   4. 校验输出
 *
 * 用法：node scripts/migrate-categories-planb.mjs
 * 可重复执行（幂等）。零依赖，使用原生 fetch。
 */

const SUPABASE_URL = process.env.SUPABASE_BASE || 'https://twuvrrfzlynhehdxxtid.supabase.co';
// 反代场景下匿名 key 原样透传即可
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXZycmZ6bHluaGVoZHh4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzg3MzUsImV4cCI6MjA5Njg1NDczNX0.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o';

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

/** 反代模式下走 ?p= 形式；直连时用标准路径 */
const IS_PROXY = SUPABASE_URL.endsWith('/api/supabase');

function urlFor(path) {
  const i = path.indexOf('?');
  const p = i === -1 ? path : path.slice(0, i);
  const q = i === -1 ? '' : path.slice(i + 1);
  const full = '/rest/v1/' + p;
  if (!IS_PROXY) return `${SUPABASE_URL}${full}${q ? '?' + q : ''}`;
  return `${SUPABASE_URL}?p=${encodeURIComponent(full)}${q ? '&' + q : ''}`;
}

async function rest(method, path, body) {
  const res = await fetch(urlFor(path), {
    method,
    headers: HEADERS,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    throw new Error(`${method} ${path} → HTTP ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

const NEW_CATEGORIES = [
  { key: 'clinical', label: '临床视角', icon: '🩺', description: '写给同行，也写给想深挖的你——dTMS 研究科普、临床指南解读、神经调控与脑科学前沿。' },
  { key: 'self-help', label: '自助工具', icon: '🌿', description: '把诊室里的方法带到生活里——芳香疗法、积极心理练习、量表与自评工具。' },
  { key: 'narrative', label: '个人叙事', icon: '📖', description: '博謇的故事与手记——成长、感悟，以及古老智慧的现代观照。' },
];

const REMAP = {
  'psychiatry': 'clinical',
  'bci': 'clinical',
  'positive-psychology': 'self-help',
  'aromatherapy': 'self-help',
  'sinology': 'narrative',
  'misc': 'narrative',
};

const OLD_KEYS = Object.keys(REMAP);

async function main() {
  console.log('=== 志趣分类迁移（方案 B：读者视角 3 分类）===\n');

  // 0. 迁移前状态
  const catsBefore = await rest('GET', 'categories?select=key,label');
  console.log('迁移前分类:', catsBefore.map(c => `${c.label}(${c.key})`).join('、') || '(空)');

  // 1. upsert 新分类
  await rest('POST', 'categories?on_conflict=key', NEW_CATEGORIES);
  console.log('\n✅ 新分类已写入:', NEW_CATEGORIES.map(c => c.label).join('、'));

  // 2. 重映射文章分类
  console.log('\n--- 文章重映射 ---');
  let total = 0;
  for (const [oldKey, newKey] of Object.entries(REMAP)) {
    const updated = await rest(
      'PATCH',
      `articles?category=eq.${encodeURIComponent(oldKey)}&select=id,title`,
      { category: newKey }
    );
    total += updated?.length ?? 0;
    console.log(`${oldKey} → ${newKey}: ${updated?.length ?? 0} 篇`);
    if (updated?.length) updated.forEach(a => console.log(`   · ${a.title}`));
  }
  console.log(`共重映射 ${total} 篇`);

  // 3. 删除旧分类
  const q = OLD_KEYS.map(k => `key.eq.${k}`).join(',');
  await rest('DELETE', `categories?or=(${q})`);
  console.log('\n✅ 旧分类已删除:', OLD_KEYS.join('、'));

  // 4. 校验
  const catsAfter = await rest('GET', 'categories?select=key,label,icon&order=key');
  const artsAfter = await rest('GET', 'articles?select=title,category');
  console.log('\n--- 校验 ---');
  console.log('当前分类:', catsAfter.map(c => `${c.icon} ${c.label}(${c.key})`).join('、'));
  const dist = {};
  for (const a of artsAfter ?? []) dist[a.category || '(无)'] = (dist[a.category || '(无)'] || 0) + 1;
  console.log('文章分布:', JSON.stringify(dist));
  const orphan = (artsAfter ?? []).filter(a => !catsAfter.some(c => c.key === a.category));
  if (orphan.length) {
    console.warn('⚠ 以下文章分类不在新分类中:', orphan.map(a => a.title).join('、'));
    process.exit(1);
  }
  console.log('✅ 无孤儿分类，迁移完成');
}

main().catch(e => {
  console.error('❌ 迁移失败:', e.message);
  process.exit(1);
});
