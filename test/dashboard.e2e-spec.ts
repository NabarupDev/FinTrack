import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './setup';
import {
  ApiResponse,
  AuthResponseData,
  DashboardTotalResponse,
  DashboardExpenseResponse,
  DashboardBalanceResponse,
  CategorySummary,
  RecentTransactionsResponse,
  MonthlyTrendItem,
  getResponseData,
  isDashboardBalanceResponse,
  isMonthlyTrendArray,
} from './types';

describe('Dashboard', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Dashboard Viewer',
        email: `dash_${Date.now()}@test.com`,
        password: 'test1234',
      });

    const body = res.body as ApiResponse<AuthResponseData>;
    const data = getResponseData(body, 'POST /api/auth/register');
    token = data.token;
  }, 30000);

  afterAll(() => app.close());

  it('GET /api/dashboard/total-income — returns number', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard/total-income')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = res.body as ApiResponse<DashboardTotalResponse>;
    const data = getResponseData(body, 'GET /api/dashboard/total-income');
    expect(typeof data.totalIncome).toBe('number');
  });

  it('GET /api/dashboard/total-expense — returns number', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard/total-expense')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = res.body as ApiResponse<DashboardExpenseResponse>;
    const data = getResponseData(body, 'GET /api/dashboard/total-expense');
    expect(typeof data.totalExpense).toBe('number');
  });

  it('GET /api/dashboard/net-balance — math is correct', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard/net-balance')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = res.body as ApiResponse<DashboardBalanceResponse>;
    const data = getResponseData(body, 'GET /api/dashboard/net-balance');

    if (!isDashboardBalanceResponse(data)) {
      throw new Error('Invalid dashboard balance response structure');
    }

    expect(data.netBalance).toBe(data.totalIncome - data.totalExpense);
  });

  it('GET /api/dashboard/category-summary — returns key-value map', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard/category-summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = res.body as ApiResponse<CategorySummary>;
    const data = getResponseData(body, 'GET /api/dashboard/category-summary');

    expect(typeof data).toBe('object');
    Object.values(data).forEach((val) => {
      expect(typeof val).toBe('number');
    });
  });

  it('GET /api/dashboard/recent-transactions — returns ≤ 10 records', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard/recent-transactions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = res.body as ApiResponse<RecentTransactionsResponse>;
    const data = getResponseData(
      body,
      'GET /api/dashboard/recent-transactions',
    );

    expect(data.data).toEqual(expect.any(Array));
    expect(data.data.length).toBeLessThanOrEqual(10);

    if (data.data.length > 0) {
      const record = data.data[0];
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('amount');
      expect(record).toHaveProperty('type');
      expect(record).toHaveProperty('user');
    }
  });

  it('GET /api/dashboard/monthly-trend — returns YYYY-MM format', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard/monthly-trend')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = res.body as ApiResponse<MonthlyTrendItem[]>;
    const data = getResponseData(body, 'GET /api/dashboard/monthly-trend');

    if (!isMonthlyTrendArray(data)) {
      throw new Error('Invalid monthly trend response structure');
    }

    expect(data).toEqual(expect.any(Array));
    if (data.length > 0) {
      expect(data[0].month).toMatch(/^\d{4}-\d{2}$/);
      expect(data[0]).toHaveProperty('income');
      expect(data[0]).toHaveProperty('expense');
    }
  });

  it('rejects unauthenticated access with 401', async () => {
    await request(app.getHttpServer())
      .get('/api/dashboard/total-income')
      .expect(401);
  });
});
