import nodemailer, { Transporter } from 'nodemailer';
import { pool } from './db';
import { config } from './config';
import { Sender } from './types';

const transports = new Map<number, Transporter>();

// Any fixed number works. It only has to be the same in every process.
const SENDER_LOCK_KEY = 424242;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function ensureSenders() {
  // A dedicated connection is needed so the lock and unlock use the same session.
  const client = await pool.connect();
  try {
    // Only one process at a time may create senders. Others wait here.
    await client.query('SELECT pg_advisory_lock($1)', [SENDER_LOCK_KEY]);

    // Guarantees the same email can never be stored twice.
    await client.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS senders_email_key ON senders (email)',
    );

    const maxAttempts = config.senderAccounts * 5;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const { rows } = await client.query('SELECT count(*)::int AS c FROM senders');
      if (rows[0].c >= config.senderAccounts) return; // all senders exist

      attempts++;
      const acc = await nodemailer.createTestAccount();

      const result = await client.query(
        `INSERT INTO senders (email, smtp_host, smtp_port, smtp_user, smtp_pass)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        [acc.user, acc.smtp.host, acc.smtp.port, acc.user, acc.pass],
      );

      if (result.rowCount) {
        console.log(`[mailer] created Ethereal sender ${acc.user}`);
        await sleep(1500); // space out calls to Ethereal
      } else {
        console.warn(`[mailer] Ethereal returned a duplicate (${acc.user}), retrying...`);
        await sleep(3000);
      }
    }

    const { rows } = await client.query('SELECT count(*)::int AS c FROM senders');
    console.warn(
      `[mailer] only ${rows[0].c}/${config.senderAccounts} distinct senders could be created. ` +
        'Continuing with the senders available.',
    );
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [SENDER_LOCK_KEY]);
    client.release();
  }
}

export async function listSenders(): Promise<Sender[]> {
  const { rows } = await pool.query('SELECT * FROM senders ORDER BY id');
  return rows;
}

function transportFor(s: Sender) {
  let t = transports.get(s.id);
  if (!t) {
    t = nodemailer.createTransport({
      host: s.smtp_host,
      port: s.smtp_port,
      secure: false,
      auth: { user: s.smtp_user, pass: s.smtp_pass },
    });
    transports.set(s.id, t);
  }
  return t;
}

export async function sendMail(
  sender: Sender,
  mail: { id: string; to_email: string; subject: string; body: string },
) {
  const info = await transportFor(sender).sendMail({
    from: `"ReachInbox" <${sender.email}>`,
    to: mail.to_email,
    subject: mail.subject,
    html: mail.body,
    messageId: `<${mail.id}@reachinbox.local>`,
  });
  return {
    messageId: info.messageId,
    previewUrl: (nodemailer.getTestMessageUrl(info) as string) || null,
  };
}