import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { WebClient } from '@slack/web-api';
import { config } from '../config';
import { pool } from '../db';
import { requireAuth } from '../auth';

const router = Router();

// 1) Frontend calls this (authenticated), then sets window.location = url
router.get('/url', requireAuth, (req, res) => {
  if (!config.slack.clientId) return res.status(500).json({ error: 'Slack not configured' });
  const state = jwt.sign({ uid: req.userId }, config.jwtSecret, { expiresIn: '10m' });
  const params = new URLSearchParams({
    client_id: config.slack.clientId,
    scope: 'chat:write,chat:write.public,incoming-webhook',
    redirect_uri: config.slack.redirectUri,
    state,
  });
  res.json({ url: `https://slack.com/oauth/v2/authorize?${params}` });
});

// 2) Slack redirects here
router.get('/callback', async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  try {
    const { uid } = jwt.verify(state ?? '', config.jwtSecret) as { uid: string };
    const r = await new WebClient().oauth.v2.access({
      client_id: config.slack.clientId,
      client_secret: config.slack.clientSecret,
      code: code ?? '',
      redirect_uri: config.slack.redirectUri,
    });
    await pool.query(`UPDATE users SET slack_token=$2, slack_channel=$3, slack_team=$4 WHERE id=$1`, [
      uid,
      r.access_token,
      r.incoming_webhook?.channel_id ?? null,
      r.team?.name ?? null,
    ]);
    res.redirect(`${config.frontendUrl}/?slack=connected`);
  } catch (e) {
    console.error('[slack] oauth failed', (e as Error).message);
    res.redirect(`${config.frontendUrl}/?slack=error`);
  }
});

router.get('/status', requireAuth, async (req, res) => {
  const { rows } = await pool.query(`SELECT slack_token IS NOT NULL AS connected, slack_team FROM users WHERE id=$1`, [
    req.userId,
  ]);
  res.json({ connected: !!rows[0]?.connected, team: rows[0]?.slack_team ?? null });
});

router.delete('/', requireAuth, async (req, res) => {
  await pool.query(`UPDATE users SET slack_token=NULL, slack_channel=NULL, slack_team=NULL WHERE id=$1`, [req.userId]);
  res.json({ ok: true });
});

export default router;
