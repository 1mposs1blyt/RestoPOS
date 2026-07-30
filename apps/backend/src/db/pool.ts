import pg from "pg";
import type { PoolClient, QueryResultRow } from "pg";
import { config } from "../config";

const { Pool } = pg;

/** Единый пул соединений. Источник истины всей системы — эта БД (инвариант №3). */
export const pool = new Pool({ connectionString: config.databaseUrl });

/** Короткий помощник: выполнить запрос и вернуть строки. */
export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await pool.query<T>(text, params as unknown[]);
  return res.rows;
}

/** Транзакция. Списание склада при оплате обязано идти одной транзакцией с payment. */
export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
