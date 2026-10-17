import 'dotenv/config';

const num = (k: string, d: number) => Number(process.env[k] ?? d);

export const config = {
  port: num('PORT', 4000),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/reachinbox',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  esUrl: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  slack: {
    clientId: process.env.SLACK_CLIENT_ID ?? '',
    clientSecret: process.env.SLACK_CLIENT_SECRET ?? '',
    redirectUri: process.env.SLACK_REDIRECT_URI ?? '',
  },
  senderAccounts: num('SENDER_ACCOUNTS', 3),
  concurrency: num('WORKER_CONCURRENCY', 5),
  minDelayMs: num('MIN_DELAY_BETWEEN_EMAILS_MS', 2000),
  hourlyLimit: num('MAX_EMAILS_PER_HOUR_PER_SENDER', 200),
  maxAttempts: num('MAX_ATTEMPTS', 3),
};
