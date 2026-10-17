import { redis } from './redis';
import { config } from './config';
import { Sender } from './types';

const HOUR = 3_600_000;
const bucket = (t = Date.now()) => Math.floor(t / HOUR);

export type Acquire =
  | { ok: true; sender: Sender; hourKey: string; limited: Sender[] }
  | { ok: false; retryAt: number; reason: 'hourly' | 'throttle'; limited: Sender[] };

export async function acquireSender(senders: Sender[], hourlyLimit: number): Promise<Acquire> {
  const n = senders.length;
  const start = (await redis.incr('rl:rr')) % n;
  const b = bucket();
  const limited: Sender[] = [];
  let earliestThrottle = Infinity;

  for (let i = 0; i < n; i++) {
    const s = senders[(start + i) % n];
    const hourKey = `rl:hour:${s.id}:${b}`;

    const count = await redis.incr(hourKey);
    if (count === 1) await redis.expire(hourKey, 2 * 3600);
    if (count > hourlyLimit) {
      await redis.decr(hourKey);
      limited.push(s);
      continue;
    }

    const ok = await redis.set(`rl:throttle:${s.id}`, '1', 'PX', config.minDelayMs, 'NX');
    if (ok === 'OK') return { ok: true, sender: s, hourKey, limited };

    await redis.decr(hourKey);
    const ttl = await redis.pttl(`rl:throttle:${s.id}`);
    earliestThrottle = Math.min(earliestThrottle, Date.now() + Math.max(ttl, 50));
  }

  if (earliestThrottle !== Infinity) {
    return { ok: false, retryAt: earliestThrottle, reason: 'throttle', limited };
  }

  const nextHour = (b + 1) * HOUR + Math.floor(Math.random() * 30_000);
  return { ok: false, retryAt: nextHour, reason: 'hourly', limited };
}

export const releaseHour = (hourKey: string) => redis.decr(hourKey);


export async function firstLimitNotice(senderId: number) {
  const ok = await redis.set(`slack:notified:${senderId}:${bucket()}`, '1', 'EX', 2 * 3600, 'NX');
  return ok === 'OK';
}
