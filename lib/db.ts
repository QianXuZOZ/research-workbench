import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as { workbenchSqlite?: Database.Database; workbenchMigrated?: boolean };

const databasePath = path.resolve(process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "workbench.db"));
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

export const sqlite = globalForDb.workbenchSqlite ?? new Database(databasePath);
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("busy_timeout = 5000");

if (!globalForDb.workbenchMigrated) {
  sqlite.exec("CREATE TABLE IF NOT EXISTS app_migrations (tag TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL)");
  const migrationDir = path.join(process.cwd(), "drizzle");
  const migrations = fs.readdirSync(migrationDir).filter((name) => name.endsWith(".sql")).sort();
  for (const filename of migrations) {
    const tag = filename.replace(/\.sql$/, "");
    const sql = fs.readFileSync(path.join(migrationDir, filename), "utf8");
    sqlite.transaction(() => {
      const applied = sqlite.prepare("SELECT 1 FROM app_migrations WHERE tag = ?").get(tag);
      if (!applied) {
        sqlite.exec(sql);
        sqlite.prepare("INSERT INTO app_migrations (tag, applied_at) VALUES (?, ?)").run(tag, new Date().toISOString());
      }
    }).immediate();
  }
  globalForDb.workbenchMigrated = true;
}

if (process.env.NODE_ENV !== "production") globalForDb.workbenchSqlite = sqlite;

export const db = drizzle(sqlite, { schema });
export const databaseFile = databasePath;
