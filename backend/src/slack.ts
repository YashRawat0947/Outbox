import { WebClient } from '@slack/web-api';
import { pool } from './db';
import { firstLimitNotice } from './rateLimiter';
import { Sender } from './types';

export async function notifyRateLimit(userId: string, sender: Sender, limit: number) {
  try {
    if (!(await firstLimitNotice(sender.id))) return;
    const { rows } = await pool.query(`SELECT slack_token, slack_channel FROM users WHERE id=$1`, [userId]);
    const u = rows[0];
    if (!u?.slack_token || !u?.slack_channel) return;
    await new WebClient(u.slack_token).chat.postMessage({
      channel: u.slack_channel,
      text: `:warning: Sender *${sender.email}* hit its hourly limit (${limit}/hr). Remaining emails were pushed to the next hour.`,
    });
  } catch (e) {
    console.warn('[slack] notify failed:', (e as Error).message);
  }
}
