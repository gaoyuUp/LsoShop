import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { __lsoPool?: mysql.Pool };

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("缺少环境变量 DATABASE_URL");
  const pool = mysql.createPool({
    uri: url,
    connectionLimit: 10,
    charset: "utf8mb4",
    // 全链路统一用 UTC：驱动按 UTC 解析 / 写入，数据库会话也强制 UTC，
    // 避免 DATETIME 默认值（CURRENT_TIMESTAMP）使用服务器本地时区造成 8 小时偏差。
    timezone: "Z",
    dateStrings: false,
  });
  pool.on("connection", (conn) => {
    conn.query("SET time_zone = '+00:00'");
  });
  return pool;
}

const pool = globalForDb.__lsoPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.__lsoPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
export { schema };
