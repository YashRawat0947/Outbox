import nodemailer, { Transporter } from 'nodemailer';
import { pool } from './db';
import { config } from './config';
import { Sender } from './types';

const transports = new Map<number, Transporter>();

export async function ensureSenders() {
  const { rows } = await pool.query('SELECT count(*)::int AS c FROM senders');
  for (let i = rows[0].c; i < config.senderAccounts; i++) {
    const acc = await nodemailer.createTestAccount();
    await pool.query(
      `INSERT INTO senders (email, smtp_host, smtp_port, smtp_user, smtp_pass) VALUES ($1,$2,$3,$4,$5)`,
      [acc.user, acc.smtp.host, acc.smtp.port, acc.user, acc.pass],
    );
    console.log(`[mailer] created Ethereal sender ${acc.user}`);
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

export async function sendMail(sender: Sender, mail: { id: string; to_email: string; subject: string; body: string }) {
  const info = await transportFor(sender).sendMail({
    from: `"ReachInbox" <${sender.email}>`,
    to: mail.to_email,
    subject: mail.subject,
    html: mail.body,
    messageId: `<${mail.id}@reachinbox.local>`,
  });
  return { messageId: info.messageId, previewUrl: (nodemailer.getTestMessageUrl(info) as string) || null };
}
