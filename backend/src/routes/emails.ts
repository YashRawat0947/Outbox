import { Router } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { pool } from '../db';
import { requireAuth } from '../auth';
import { emailQueue, buildJob } from '../queue';
import { config } from '../config';
import { searchEmails, syncMany } from '../search';

const router = Router();
router.use(requireAuth);

const scheduleSchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  recipients: z.array(z.string().email()).min(1).max(20000),
  startTime: z.string().datetime({ offset: true }).optional(), // default: now
  delaySeconds: z.number().min(0).default(2), // gap between consecutive emails
  hourlyLimit: z.number().int().min(1).optional(), // per-sender override
});

router.post('/schedule', async (req, res) => {
  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const { subject, body, recipients, startTime, delaySeconds, hourlyLimit } = parsed.data;

  const start = startTime ? new Date(startTime).getTime() : Date.now();
  const limit = hourlyLimit ?? config.hourlyLimit;
  const unique = [...new Set(recipients.map((r) => r.trim().toLowerCase()))];

  const ids = unique.map(() => randomUUID());
  const times = unique.map((_, i) => new Date(start + i * delaySeconds * 1000));

  // 1) Persist first (source of truth). If anything after this fails, startup reconcile re-enqueues.
  await pool.query(
    `INSERT INTO emails (id, user_id, to_email, subject, body, scheduled_at, hourly_limit)
     SELECT t.id, $1::uuid, t.email, $2, $3, t.at, $4::int
       FROM unnest($5::uuid[], $6::text[], $7::timestamptz[]) AS t(id, email, at)`,
    [req.userId, subject, body, limit, ids, unique, times],
  );

  // 2) Enqueue delayed jobs in bulk (chunked)
  for (let i = 0; i < ids.length; i += 1000) {
    await emailQueue.addBulk(
      ids.slice(i, i + 1000).map((id, j) => buildJob(id, req.userId!, limit, times[i + j])),
    );
  }

  // 3) Index for search (fire and forget)
  void syncMany(ids);

  res.status(201).json({ scheduled: ids.length, firstSendAt: times[0], lastSendAt: times[times.length - 1] });
});

const SELECT = `e.id, e.to_email AS "to", e.subject, e.body, e.status, e.scheduled_at AS "scheduledAt",
                e.sent_at AS "sentAt", e.preview_url AS "previewUrl", e.error, s.email AS "from"`;
const GROUPS: Record<string, string[]> = { scheduled: ['scheduled', 'sending'], sent: ['sent', 'failed'] };

router.get('/counts', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT count(*) FILTER (WHERE status IN ('scheduled','sending'))::int AS scheduled,
            count(*) FILTER (WHERE status IN ('sent','failed'))::int AS sent
       FROM emails WHERE user_id=$1`,
    [req.userId],
  );
  res.json(rows[0]);
});

router.get('/', async (req, res) => {
  const group = req.query.status === 'sent' ? GROUPS.sent : GROUPS.scheduled;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const order = group[0] === 'sent' ? 'e.sent_at DESC' : 'e.scheduled_at ASC';

  const [rows, total] = await Promise.all([
    pool.query(
      `SELECT ${SELECT} FROM emails e LEFT JOIN senders s ON s.id = e.sender_id
        WHERE e.user_id=$1 AND e.status = ANY($2) ORDER BY ${order} LIMIT $3 OFFSET $4`,
      [req.userId, group, limit, offset],
    ),
    pool.query(`SELECT count(*)::int AS c FROM emails WHERE user_id=$1 AND status = ANY($2)`, [req.userId, group]),
  ]);
  res.json({ items: rows.rows, total: total.rows[0].c });
});

router.get('/search', async (req, res) => {
  try {
    const items = await searchEmails(req.userId!, String(req.query.q ?? ''), req.query.status as string | undefined);
    res.json({ items });
  } catch {
    res.status(503).json({ error: 'Search unavailable' });
  }
});

export default router;
