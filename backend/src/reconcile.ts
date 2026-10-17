import { pool } from './db';
import { emailQueue, buildJob } from './queue';
import { config } from './config';

export async function reconcile() {
  const { rows } = await pool.query(
    `SELECT id, user_id, hourly_limit, scheduled_at FROM emails WHERE status IN ('scheduled','sending')`,
  );
  let requeued = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const existing = await Promise.all(chunk.map((r) => emailQueue.getJob(r.id)));
    const missing = chunk.filter((_, j) => !existing[j]);
    if (missing.length) {
      await emailQueue.addBulk(
        missing.map((r) => buildJob(r.id, r.user_id, r.hourly_limit ?? config.hourlyLimit, new Date(r.scheduled_at))),
      );
      requeued += missing.length;
    }
  }
  console.log(`[reconcile] checked ${rows.length} pending emails, re-enqueued ${requeued}`);
}
