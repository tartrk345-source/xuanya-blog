/**
 * Phase 2 数据库迁移脚本
 * 用法: node scripts/migrate-phase2.mjs
 * 需要环境变量 SUPABASE_DB_PASSWORD 或交互式输入密码
 */
import pg from 'pg';

const { Client } = pg;

// Supabase 项目配置
const PROJECT_REF = 'twuvrrfzlynhehdxxtid';
const DB_HOST = `aws-0-ap-southeast-1.pooler.supabase.com`;
const DB_PORT = 6543;
const DB_NAME = 'postgres';
const DB_USER = `postgres.${PROJECT_REF}`;

// SQL 迁移语句
const MIGRATIONS = [
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS cover_image text;`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS series text;`,
];

async function getPassword() {
  // 优先从环境变量读取
  if (process.env.SUPABASE_DB_PASSWORD) {
    return process.env.SUPABASE_DB_PASSWORD;
  }

  // 交互式输入
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('请输入 Supabase 数据库密码（在 Supabase Dashboard > Settings > Database 中查看）: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('');
  console.log('=== x2ya.com Phase 2 数据库迁移 ===');
  console.log('');

  const password = await getPassword();

  if (!password) {
    console.error('❌ 密码不能为空，退出。');
    process.exit(1);
  }

  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: password,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('正在连接数据库...');
    await client.connect();
    console.log('✅ 连接成功！');
    console.log('');

    for (const sql of MIGRATIONS) {
      // 提取列名用于显示
      const colMatch = sql.match(/ADD COLUMN IF NOT EXISTS (\w+)/);
      const colName = colMatch ? colMatch[1] : sql;
      process.stdout.write(`  添加列 ${colName} ... `);
      await client.query(sql);
      console.log('✅');
    }

    console.log('');
    console.log('🎉 迁移完成！所有 5 个新字段已添加到 articles 表。');
    console.log('');
    console.log('现在可以运行 npm run dev 启动项目了。');

  } catch (err) {
    console.error('');
    console.error('❌ 迁移失败:');
    console.error(err.message);
    console.error('');
    console.error('常见原因:');
    console.error('  1. 密码错误 → 去 Supabase Dashboard > Settings > Database 重置密码');
    console.error('  2. 网络问题 → 检查是否能访问 supabase.co');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
