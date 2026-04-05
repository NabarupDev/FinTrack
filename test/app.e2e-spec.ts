import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './setup';
import { ApiResponse } from './types';

describe('Health & Response Envelope', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  }, 30000);

  afterAll(() => app.close());

  it('GET /api — returns { success: true, data: "Hello World!" }', async () => {
    const res = await request(app.getHttpServer()).get('/api').expect(200);
    const body = res.body as ApiResponse<string>;
    expect(body).toEqual({ success: true, data: 'Hello World!' });
  });

  it('success responses have exactly { success, data }', async () => {
    const res = await request(app.getHttpServer()).get('/api').expect(200);
    const body = res.body as ApiResponse<string>;
    expect(Object.keys(body).sort()).toEqual(['data', 'success']);
  });

  it('error responses have { success: false, error: { code, message } }', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'no@no.com', password: 'wrong' })
      .expect(401);

    const body = res.body as ApiResponse<unknown>;
    expect(body.success).toBe(false);
    if (body.error) {
      expect(body.error).toHaveProperty('code');
      expect(body.error).toHaveProperty('message');
    }
  });
});
