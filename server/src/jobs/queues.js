import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export const notificationQueue = new Queue('notifications', { connection: redis });
export const analyticsQueue = new Queue('analytics-events', { connection: redis });
export const webhookQueue = new Queue('webhooks', { connection: redis });

