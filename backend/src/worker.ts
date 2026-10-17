import { DelayedError, Job, Worker } from 'bullmq';
import { config } from './config';
import { redis } from './redis';
import { QUEUE_NAME } from './queue';
import { JobData } from './types';
import { listSenders, sendMail } from './mailer';
import { acquireSender, releaseHour } from './rateLimiter';
import { bumpScheduledAt, claimEmail, getEmailStatus, markFailed, markRetry, markSent } from './emailStore';
import { notifyRateLimit } from './slack';
import { syncEmail } from './search';

async function process_(job: Job<JobData>, token?: string) {
  const { emailId, userId, hourlyLimit } = job.data;

  const status = await getEmailStatus(emailId);
  if (!status || status === 'sent' || status === 'failed') return;

  const senders = await listSenders();
  const limit = hourlyLimit ?? config.hourlyLimit;
  const acq = await acquireSender(senders, limit);

  for (const s of acq.limited) void notifyRateLimit(userId, s, limit);

  if (!acq.ok) {
    if (acq.reason === 'hourly') await bumpScheduledAt(emailId, acq.retryAt);
    await job.moveToDelayed(acq.retryAt, token);
    throw new DelayedError();
  }

  const email = await claimEmail(emailId, acq.sender.id);
  if (!email) {
    await releaseHour(acq.hourKey);
    return;
  }

  try {
    const { messageId, previewUrl } = await sendMail(acq.sender, email);
    await markSent(emailId, messageId, previewUrl);
    await syncEmail(emailId);
    console.log(`[worker] sent ${emailId} -> ${email.to_email} via ${acq.sender.email}`);
  } catch (err) {
    await markRetry(emailId, (err as Error).message); 
    throw err;
  }
}

const worker = new Worker<JobData>(QUEUE_NAME, process_, {
  connection: redis,
  concurrency: config.concurrency,
});

worker.on('failed', async (job, err) => {
  if (!job || err instanceof DelayedError) return;
  if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await markFailed(job.data.emailId, err.message);
    await syncEmail(job.data.emailId);
    console.error(`[worker] permanently failed ${job.data.emailId}: ${err.message}`);
  }
});

worker.on('ready', () =>
  console.log(
    `[worker] ready | concurrency=${config.concurrency} minDelay=${config.minDelayMs}ms hourlyLimit=${config.hourlyLimit}/sender`,
  ),
);

const shutdown = async () => {
  await worker.close(); 
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
