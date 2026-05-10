import request from 'supertest';
import { createApp } from '../app.js';

test('health endpoint responds', async () => {
  const app = createApp();
  const res = await request(app).get('/api/v1/health');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('ok');
});

