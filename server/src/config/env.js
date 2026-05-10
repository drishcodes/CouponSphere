import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 5000),
  MONGO_URI: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/couponsphere',
  REDIS_URL: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN?.includes(',') 
    ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim()) 
    : (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL ?? '15m',
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL ?? '7d',
  FRAUD_SERVICE_URL: process.env.FRAUD_SERVICE_URL ?? 'http://localhost:8081',
  MEMORY_DB: process.env.MEMORY_DB === 'true',
  SEED_DEMO_DATA: process.env.SEED_DEMO_DATA === 'true'
};
