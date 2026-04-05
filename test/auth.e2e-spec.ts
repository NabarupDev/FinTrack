import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './setup';
import { ApiResponse, AuthResponseData, getResponseData } from './types';

describe('Auth', () => {
  let app: INestApplication<App>;
  const email = `auth_${Date.now()}@test.com`;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
  }, 30000);

  afterAll(() => app.close());

  describe('POST /api/auth/register', () => {
    it('creates a VIEWER and returns token + user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Test User', email, password: 'test1234' })
        .expect(201);

      const body = res.body as ApiResponse<AuthResponseData>;
      expect(body.success).toBe(true);

      const data = getResponseData(body, 'POST /api/auth/register');
      expect(data.token).toBeDefined();
      expect(data.user).toMatchObject({
        name: 'Test User',
        email,
        role: 'VIEWER',
        status: 'ACTIVE',
      });
      // SafeUser must NOT expose password
      expect(data.user.password).toBeUndefined();

      token = data.token;
    });

    it('rejects duplicate email with 409', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Dup', email, password: 'test1234' })
        .expect(409);

      const body = res.body as ApiResponse<unknown>;
      expect(body).toMatchObject({
        success: false,
        error: { code: 'CONFLICT', message: 'Email already registered' },
      });
    });

    it('rejects missing fields with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'A' })
        .expect(400);

      const body = res.body as ApiResponse<unknown>;
      expect(body.error?.code).toBe('BAD_REQUEST');
    });

    it('rejects unknown fields (whitelist)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test',
          email: 'wl@test.com',
          password: 'test1234',
          hackerField: 'nope',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns token + user with updatedAt', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'test1234' })
        .expect(200);

      const body = res.body as ApiResponse<AuthResponseData>;
      expect(body.success).toBe(true);

      const data = getResponseData(body, 'POST /api/auth/login');
      expect(data.token).toBeDefined();
      expect(data.user).toHaveProperty('updatedAt');
      expect(data.user.password).toBeUndefined();
    });

    it('rejects wrong password with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'wrong' })
        .expect(401);

      const body = res.body as ApiResponse<unknown>;
      expect(body.error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      });
    });

    it('rejects non-existent email with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@x.com', password: 'test' })
        .expect(401);
    });
  });

  describe('Guards', () => {
    it('rejects unauthenticated request with 401', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(401);
    });

    it('rejects VIEWER accessing admin routes with 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      const body = res.body as ApiResponse<unknown>;
      expect(body.error?.code).toBe('FORBIDDEN');
    });
  });
});
