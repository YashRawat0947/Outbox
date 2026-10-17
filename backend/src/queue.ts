import { Queue } from 'bullmq';
import { redis } from './redis';
import { config } from './config';
import { JobData } from './types';

export const QUEUE_NAME = 'emails';

export const emailQueue = new Queue<JobData>(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: config.maxAttempts,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 5000 },
    removeOnFail: { count: 5000 },
  },
});

export function buildJob(emailId: string, userId: string, hourlyLimit: number, scheduledAt: Date) {
  return {
    name: 'send',
    data: { emailId, userId, hourlyLimit } as JobData,
    opts: { jobId: emailId, delay: Math.max(0, scheduledAt.getTime() - Date.now()) },
  };
}
