# ReachInbox Backend

## Run
```bash
docker compose up -d          # Postgres, Redis (AOF on), Elasticsearch
cp .env.example .env          # fill GOOGLE_CLIENT_ID, JWT_SECRET, Slack keys
npm install
npm run dev:all               # API + worker (or `npm run dev` and `npm run dev:worker` in 2 terminals)
```
- Bull Board: http://localhost:4000/admin/queues
- Ethereal: sender accounts are auto-created on first boot (`SENDER_ACCOUNTS`) and stored in the `senders` table.
  Each sent email stores a preview URL (`previewUrl`) you can open to see the message.

## API
| Method | Path | Notes |
|---|---|---|
| POST | /api/auth/google | `{credential}` Google ID token -> `{token,user}` |
| GET | /api/auth/me | Bearer token |
| POST | /api/emails/schedule | `{subject, body, recipients[], startTime?, delaySeconds?, hourlyLimit?}` |
| GET | /api/emails?status=scheduled\|sent&limit&offset | dashboard tables |
| GET | /api/emails/search?q=&status= | Elasticsearch |
| GET | /api/slack/url | returns Slack OAuth URL |
| GET | /api/slack/callback | Slack redirect target |
| GET | /api/slack/status | `{connected}` |

## How it works
- **Scheduling:** email i of a batch gets `scheduled_at = start + i*delay`. A row is written to Postgres, then a BullMQ delayed job (`jobId = emailId`) is added. No cron.
- **Restart persistence:** jobs live in Redis (AOF) and rows in Postgres. On API boot `reconcile()` re-enqueues anything pending in the DB that is missing in Redis.
- **Idempotency:** (1) BullMQ `jobId` = email id; (2) atomic SQL claim `scheduled -> sending`; (3) already `sent` emails are skipped.
- **Rate limiting (Redis, not in-memory):**
  - Hourly cap per sender: `INCR rl:hour:<sender>:<hour>`; over limit -> `DECR` and job moved to next hour via `moveToDelayed` (never dropped).
  - Min delay per sender: `SET rl:throttle:<sender> NX PX 2000`.
  - Round-robin across senders; falls through to the next sender first.
- **Concurrency:** `WORKER_CONCURRENCY` (default 5). 1000+ same-time emails just queue and drain at the throttled rate.
- **Slack:** token stored per user; alert sent once per sender per hour when the cap is hit; silently skipped if not connected.

## Choices / assumptions
- Min delay = 2s per sender; hourly limit = 200 per sender (env configurable; request can override hourly limit).
- Google login uses the ID-token flow (Google Identity Services button on frontend), verified server-side.
- Small crash window: if the process dies after SMTP accepts but before DB `sent`, the email is re-claimable after 5 min (at-least-once in that rare case).
- Slack OAuth needs an HTTPS redirect URL (use ngrok locally).
- Elasticsearch is best-effort; Postgres stays the source of truth.
