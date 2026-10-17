import { pool } from './db';


export async function claimEmail(id: string, senderId: number) {
  const { rows } = await pool.query(
    `UPDATE emails
        SET status='sending', sender_id=$2, claimed_at=now(), attempts=attempts+1
      WHERE id=$1
        AND (status='scheduled' OR (status='sending' AND claimed_at < now() - interval '5 minutes'))
      RETURNING id, to_email, subject, body`,
    [id, senderId],
  );
  return rows[0] as { id: string; to_email: string; subject: string; body: string } | undefined;
}

export async function getEmailStatus(id: string) {
  const { rows } = await pool.query(`SELECT status FROM emails WHERE id=$1`, [id]);
  return rows[0]?.status as string | undefined;
}

export const markSent = (id: string, messageId: string, previewUrl: string | null) =>
  pool.query(
    `UPDATE emails SET status='sent', sent_at=now(), message_id=$2, preview_url=$3, error=NULL WHERE id=$1`,
    [id, messageId, previewUrl],
  );

export const markRetry = (id: string, error: string) =>
  pool.query(`UPDATE emails SET status='scheduled', error=$2 WHERE id=$1 AND status='sending'`, [id, error]);

export const markFailed = (id: string, error: string) =>
  pool.query(`UPDATE emails SET status='failed', sent_at=now(), error=$2 WHERE id=$1 AND status<>'sent'`, [id, error]);

export const bumpScheduledAt = (id: string, when: number) =>
  pool.query(`UPDATE emails SET scheduled_at=$2 WHERE id=$1 AND status='scheduled'`, [id, new Date(when)]);
