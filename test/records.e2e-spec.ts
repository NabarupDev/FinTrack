import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './setup';
import {
  ApiResponse,
  AuthResponseData,
  RecordData,
  PaginatedRecords,
  getResponseData,
  isPaginatedRecords,
} from './types';

describe('Records CRUD', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let adminEmail: string;
  let createdRecordId: number;

  beforeAll(async () => {
    app = await createTestApp();

    adminEmail = `records_admin_${Date.now()}@test.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Records Admin',
        email: adminEmail,
        password: 'admin1234',
        role: 'ADMIN',
      });

    const body = res.body as ApiResponse<AuthResponseData>;
    const data = getResponseData(body, 'POST /api/auth/register');
    adminToken = data.token;
  }, 30000);

  afterAll(() => app.close());

  it('POST /api/records — creates a record', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 1500.5,
        type: 'INCOME',
        category: 'freelance',
        date: '2026-04-01',
        notes: 'E2E test record',
      })
      .expect(201);

    const body = res.body as ApiResponse<RecordData>;
    const data = getResponseData(body, 'POST /api/records');

    expect(data).toMatchObject({
      amount: 1500.5,
      type: 'INCOME',
      category: 'freelance',
      notes: 'E2E test record',
    });
    expect(data.user).toBeDefined();
    expect(data.user?.id).toEqual(expect.any(Number));
    expect(data.user?.name).toBe('Records Admin');
    expect(data.user?.email).toBe(adminEmail);
    createdRecordId = data.id;
  });

  it('POST /api/records — rejects invalid data with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: -5, type: 'INVALID', category: '' })
      .expect(400);

    const body = res.body as ApiResponse<unknown>;
    expect(body.error?.code).toBe('BAD_REQUEST');
  });

  it('GET /api/records — returns paginated list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as ApiResponse<PaginatedRecords>;
    const data = getResponseData(body, 'GET /api/records');

    if (!isPaginatedRecords(data)) {
      throw new Error('Invalid paginated records response structure');
    }

    expect(Array.isArray(data.data)).toBe(true);
    expect(typeof data.total).toBe('number');
    expect(typeof data.page).toBe('number');
    expect(typeof data.limit).toBe('number');
    expect(typeof data.totalPages).toBe('number');
  });

  it('GET /api/records?type=INCOME — filters by type', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/records?type=INCOME')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as ApiResponse<PaginatedRecords>;
    const data = getResponseData(body, 'GET /api/records?type=INCOME');

    if (!isPaginatedRecords(data)) {
      throw new Error('Invalid paginated records response structure');
    }

    data.data.forEach((r) => expect(r.type).toBe('INCOME'));
  });

  it('GET /api/records?page=1&limit=2 — paginates correctly', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/records?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as ApiResponse<PaginatedRecords>;
    const data = getResponseData(body, 'GET /api/records?page=1&limit=2');

    if (!isPaginatedRecords(data)) {
      throw new Error('Invalid paginated records response structure');
    }

    expect(data.page).toBe(1);
    expect(data.limit).toBe(2);
    expect(data.data.length).toBeLessThanOrEqual(2);
  });

  it('GET /api/records/:id — returns single record with user', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = res.body as ApiResponse<RecordData>;
    const data = getResponseData(body, `GET /api/records/${createdRecordId}`);

    expect(data.id).toBe(createdRecordId);
    expect(data.user).toBeDefined();
  });

  it('GET /api/records/99999 — returns 404', async () => {
    await request(app.getHttpServer())
      .get('/api/records/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('PATCH /api/records/:id — updates record', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 2000, notes: 'Updated' })
      .expect(200);

    const body = res.body as ApiResponse<RecordData>;
    const data = getResponseData(body, `PATCH /api/records/${createdRecordId}`);

    expect(data.amount).toBe(2000);
    expect(data.notes).toBe('Updated');
  });

  it('DELETE /api/records/:id — deletes, confirms 404 after', async () => {
    await request(app.getHttpServer())
      .delete(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
