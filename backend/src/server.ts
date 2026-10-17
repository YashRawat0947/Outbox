import express from 'express';
import cors from 'cors';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { config } from './config';
import { initSchema } from './db';
import { ensureSenders } from './mailer';
import { ensureIndex } from './search';
import { reconcile } from './reconcile';
import { emailQueue } from './queue';
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import slackRoutes from './routes/slack';

async function main() {
  await initSchema();
  await ensureSenders();
  await ensureIndex();
  await reconcile();

  const app = express();
  app.use(cors({ origin: config.frontendUrl }));
  app.use(express.json({ limit: '10mb' }));

  const board = new ExpressAdapter();
  board.setBasePath('/admin/queues');
  createBullBoard({ queues: [new BullMQAdapter(emailQueue) as never], serverAdapter: board });
  app.use('/admin/queues', board.getRouter());

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/emails', emailRoutes);
  app.use('/api/slack', slackRoutes);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(config.port, () => console.log(`API on :${config.port}  |  Bull Board: /admin/queues`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
