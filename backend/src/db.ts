import { Pool } from 'pg';
import { config } from './config';

export const pool = new Pool({ connectionString: config.databaseUrl });

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      avatar TEXT,
      slack_token TEXT,
      slack_channel TEXT,
      slack_team TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS senders (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      smtp_host TEXT NOT NULL,
      smtp_port INT NOT NULL,
      smtp_user TEXT NOT NULL,
      smtp_pass TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS emails (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ NOT NULL,
      -- scheduled | sending | sent | failed
      status TEXT NOT NULL DEFAULT 'scheduled',
      hourly_limit INT,
      sender_id INT REFERENCES senders(id),
      attempts INT NOT NULL DEFAULT 0,
      claimed_at TIMESTAMPTZ,
      sent_at TIMESTAMPTZ,
      message_id TEXT,
      preview_url TEXT,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS emails_user_status_idx ON emails(user_id, status);
  `);
}
