import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { logger } from './config/logger.js';
import { registerSocketHandlers } from './realtime/socket.js';
import { ensureDemoData } from './seed/demoData.js';

await connectDb();
if (env.SEED_DEMO_DATA) {
  await ensureDemoData();
  logger.info('Demo data seeded');
}

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: env.CLIENT_ORIGIN, credentials: true }
});

app.set('io', io);
registerSocketHandlers(io);

server.listen(env.PORT, () => {
  logger.info(`CouponSphere API listening on ${env.PORT}`);
});
