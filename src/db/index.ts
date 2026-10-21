import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { SCHEMA_SQL } from "./bootstrap";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

type QueryFn = (...args: unknown[]) => Promise<unknown>;

const globalForDb = globalThis as typeof globalThis & {
  __raPool?: Pool;
  __raSchemaReady?: Promise<void> | null;
};

/**
 * Every query first waits for the idempotent schema bootstrap, so no page can
 * ever hit a database that is missing a table — not even the very first
 * request of a fresh deployment. The bootstrap runs once per process; if it
 * fails (e.g. the database is briefly unreachable) the next query retries it.
 */
function createPool(url: string): Pool {
  const pool = new Pool({ connectionString: url, max: 5 });
  const rawQuery = pool.query.bind(pool) as unknown as QueryFn;

  const ensureSchema = (): Promise<void> => {
    let ready = globalForDb.__raSchemaReady;
    if (!ready) {
      ready = rawQuery(SCHEMA_SQL).then(
        () => undefined,
        (error: unknown) => {
          globalForDb.__raSchemaReady = null;
          throw error;
        },
      );
      globalForDb.__raSchemaReady = ready;
    }
    return ready;
  };

  (pool as unknown as { query: QueryFn }).query = (...args: unknown[]) =>
    ensureSchema().then(() => rawQuery(...args));

  return pool;
}

export const pool = globalForDb.__raPool ?? createPool(databaseUrl);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__raPool = pool;
}

export const db = drizzle(pool);
