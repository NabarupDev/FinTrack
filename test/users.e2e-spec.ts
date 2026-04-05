import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './setup';
import {
  ApiResponse,
  AuthResponseData,
  UserData,
  PaginatedUsers,
  getResponseData,
  isPaginatedUsers,
} from './types';

describe('Users CRUD (Admin)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let createdUserId: number;

  beforeAll(async () => {
    app = await createTestApp();

    // Register an admin for this test suite
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Users Admin',
        email: `users_admin_${Date.now()}@test.com`,
        password: 'admin1234',
        role: 'ADMIN',
      });

    const body = res.body as ApiResponse<AuthResponseData>;
    const data = getResponseData(body, 'POST /api/auth/register');
    adminToken = data.token;
  }, 30000);

  afterAll(() => app.close());

  it('POST /api/users — creates a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Created User',
        email: `created_${Date.now()}@test.com`,
        password: 'created1234',
        role: 'ANALYST',
      })
      .expect(201);

    const body = res.body as ApiResponse<UserData>;
    const data = getResponseData(body, 'POST /api/users');

    expect(data).toMatchObject({
      name: 'Created User',
      role: 'ANALYST',
      status: 'ACTIVE',
    });
    expect(data.password).toBeUndefined();
    createdUserId = data.id;
  });

  it('GET /api/users — lists users with total count', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as ApiResponse<PaginatedUsers>;
    const data = getResponseData(body, 'GET /api/users');

    if (!isPaginatedUsers(data)) {
      throw new Error('Invalid paginated users response structure');
    }

    expect(data.data).toEqual(expect.any(Array));
    expect(data.total).toBeGreaterThan(0);
  });

  it('GET /api/users?role=ANALYST — filters by role', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users?role=ANALYST')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as ApiResponse<PaginatedUsers>;
    const data = getResponseData(body, 'GET /api/users?role=ANALYST');

    if (!isPaginatedUsers(data)) {
      throw new Error('Invalid paginated users response structure');
    }

    data.data.forEach((u) => expect(u.role).toBe('ANALYST'));
  });

  it('GET /api/users/:id — returns a single user', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as ApiResponse<UserData>;
    const data = getResponseData(body, `GET /api/users/${createdUserId}`);

    expect(data.id).toBe(createdUserId);
  });

  it('GET /api/users/99999 — returns 404', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    const body = res.body as ApiResponse<unknown>;
    expect(body.error?.code).toBe('NOT_FOUND');
  });

  it('PATCH /api/users/:id — updates user name', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated User' })
      .expect(200);

    const body = res.body as ApiResponse<UserData>;
    const data = getResponseData(body, `PATCH /api/users/${createdUserId}`);

    expect(data.name).toBe('Updated User');
  });

  it('PATCH /api/users/:id/status — deactivates user', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/users/${createdUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'INACTIVE' })
      .expect(200);

    const body = res.body as ApiResponse<UserData>;
    const data = getResponseData(
      body,
      `PATCH /api/users/${createdUserId}/status`,
    );

    expect(data.status).toBe('INACTIVE');
  });

  it('DELETE /api/users/:id — deletes user, confirms 404 after', async () => {
    await request(app.getHttpServer())
      .delete(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
