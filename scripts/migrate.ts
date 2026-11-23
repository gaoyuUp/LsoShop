/**
 * 执行数据库迁移：pnpm db:migrate
 * 线上部署时同样执行这一步即可建表 / 升级表结构。
 */
import { config } from "dotenv";
config({ path: ".env.production" });
config({ path: ".env.local" });
config();

import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  const dbName = url.pathname.replace(/^\//, "");
  // 数据库不存在时自动创建
  const root = new URL(url);
  root.pathname = "/";
  const bootstrap = await mysql.createConnection(root.toString());
  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await bootstrap.end();

  const conn = await mysql.createConnection({ uri: url.toString(), multipleStatements: true, timezone: "Z" });
  await conn.query("SET time_zone = '+00:00'");
  await migrate(drizzle(conn), { migrationsFolder: "./drizzle" });
  await conn.end();
  console.log(`✓ 数据库 ${dbName} 迁移完成`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
