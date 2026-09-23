import { sqlite, databaseFile } from "../lib/db";

sqlite.pragma("optimize");
console.log(JSON.stringify({ level: "info", event: "database_migrated", database: databaseFile, time: new Date().toISOString() }));
