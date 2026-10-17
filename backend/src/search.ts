import { Client } from '@elastic/elasticsearch';
import { config } from './config';
import { pool } from './db';

export const es = new Client({ node: config.esUrl });
const INDEX = 'emails';

export async function ensureIndex() {
  try {
    const exists = await es.indices.exists({ index: INDEX });
    if (!exists) {
      await es.indices.create({
        index: INDEX,
        mappings: {
          properties: {
            user_id: { type: 'keyword' },
            status: { type: 'keyword' },
            to_email: { type: 'text' },
            subject: { type: 'text' },
            body: { type: 'text' },
            scheduled_at: { type: 'date' },
            sent_at: { type: 'date' },
          },
        },
      });
    }
  } catch (e) {
    console.warn('[search] Elasticsearch unavailable, search disabled:', (e as Error).message);
  }
}

/** Re-read the row from Postgres and upsert into ES. Never throws. */
export async function syncEmail(id: string) {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, to_email, subject, body, status, scheduled_at, sent_at FROM emails WHERE id=$1`,
      [id],
    );
    if (rows[0]) await es.index({ index: INDEX, id, document: rows[0] });
  } catch (e) {
    console.warn('[search] index failed:', (e as Error).message);
  }
}

export async function syncMany(ids: string[]) {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, to_email, subject, body, status, scheduled_at, sent_at FROM emails WHERE id = ANY($1::uuid[])`,
      [ids],
    );
    if (!rows.length) return;
    const operations = rows.flatMap((r) => [{ index: { _index: INDEX, _id: r.id } }, r]);
    await es.bulk({ operations, refresh: false });
  } catch (e) {
    console.warn('[search] bulk index failed:', (e as Error).message);
  }
}

export async function searchEmails(userId: string, q: string, status?: string, size = 50) {
  const filter: object[] = [{ term: { user_id: userId } }];
  if (status === 'scheduled') filter.push({ terms: { status: ['scheduled', 'sending'] } });
  if (status === 'sent') filter.push({ terms: { status: ['sent', 'failed'] } });

  const res = await es.search({
    index: INDEX,
    size,
    query: {
      bool: {
        filter,
        must: q
          ? [{ multi_match: { query: q, fields: ['subject^2', 'to_email', 'body'], fuzziness: 'AUTO' } }]
          : [{ match_all: {} }],
      },
    },
  });
  return res.hits.hits.map((h) => h._source);
}
