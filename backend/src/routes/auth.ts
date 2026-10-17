import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { config } from '../config';
import { pool } from '../db';
import { requireAuth, signToken } from '../auth';

const router = Router();
const google = new OAuth2Client(config.googleClientId);

// Frontend uses Google Identity Services and posts the ID token ("credential") here.
router.post('/google', async (req, res) => {
  const parsed = z.object({ credential: z.string().min(10) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'credential required' });
  try {
    const ticket = await google.verifyIdToken({ idToken: parsed.data.credential, audience: config.googleClientId });
    const p = ticket.getPayload();
    if (!p?.sub || !p.email) return res.status(401).json({ error: 'Invalid Google token' });
    const { rows } = await pool.query(
      `INSERT INTO users (google_id, email, name, avatar) VALUES ($1,$2,$3,$4)
       ON CONFLICT (google_id) DO UPDATE SET email=EXCLUDED.email, name=EXCLUDED.name, avatar=EXCLUDED.avatar
       RETURNING id, email, name, avatar`,
      [p.sub, p.email, p.name ?? null, p.picture ?? null],
    );
    res.json({ token: signToken(rows[0].id), user: rows[0] });
  } catch {
    res.status(401).json({ error: 'Google verification failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, email, name, avatar, (slack_token IS NOT NULL) AS slack_connected FROM users WHERE id=$1`,
    [req.userId],
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

export default router;
