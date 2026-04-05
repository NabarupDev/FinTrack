import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FormattedRecord } from '../common/interfaces/formatted-record.interface';

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // ─── 1. Total Income ───────────────────────────────────────────────
  async getTotalIncome(): Promise<{ totalIncome: number }> {
    const result = await this.prisma.financialRecord.aggregate({
      where: { type: 'INCOME' },
      _sum: { amount: true },
    });
    return {
      totalIncome: parseFloat(result._sum.amount?.toString() ?? '0'),
    };
  }

  // ─── 2. Total Expense ──────────────────────────────────────────────
  async getTotalExpense(): Promise<{ totalExpense: number }> {
    const result = await this.prisma.financialRecord.aggregate({
      where: { type: 'EXPENSE' },
      _sum: { amount: true },
    });
    return {
      totalExpense: parseFloat(result._sum.amount?.toString() ?? '0'),
    };
  }

  // ─── 3. Net Balance ────────────────────────────────────────────────
  async getNetBalance(): Promise<{
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  }> {
    const [income, expense] = await this.prisma.$transaction([
      this.prisma.financialRecord.aggregate({
        where: { type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.financialRecord.aggregate({
        where: { type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = parseFloat(income._sum.amount?.toString() ?? '0');
    const totalExpense = parseFloat(expense._sum.amount?.toString() ?? '0');

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }

  // ─── 4. Category Summary ───────────────────────────────────────────
  async getCategorySummary(): Promise<Record<string, number>> {
    const result = await this.prisma.financialRecord.groupBy({
      by: ['category'],
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    // Transform [{ category: 'food', _sum: { amount: 1200 } }]
    // into { food: 1200, rent: 15000, ... }
    const summary: Record<string, number> = {};
    result.forEach((item) => {
      summary[item.category] = parseFloat(item._sum.amount?.toString() ?? '0');
    });

    return summary;
  }

  // ─── 5. Recent Transactions ────────────────────────────────────────
  async getRecentTransactions(): Promise<{ data: FormattedRecord[] }> {
    const records = await this.prisma.financialRecord.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return {
      data: records.map((r) => ({
        ...r,
        amount: parseFloat(r.amount.toString()),
      })) as FormattedRecord[],
    };
  }

  // ─── 6. Monthly Trend (last 12 months) ────────────────────────────
  async getMonthlyTrend(): Promise<MonthlyTrend[]> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    // Prisma groupBy does not support grouping by month directly.
    // Use raw SQL for MySQL date_format grouping.
    const rows: Array<{ month: string; type: string; total: string }> =
      await this.prisma.$queryRaw`
        SELECT
          DATE_FORMAT(date, '%Y-%m') AS month,
          type,
          SUM(amount)               AS total
        FROM FinancialRecord
        WHERE date >= ${twelveMonthsAgo}
        GROUP BY DATE_FORMAT(date, '%Y-%m'), type
        ORDER BY month ASC
      `;

    // Merge income + expense into one object per month
    const monthMap: Record<string, MonthlyTrend> = {};

    rows.forEach((row) => {
      if (!monthMap[row.month]) {
        monthMap[row.month] = { month: row.month, income: 0, expense: 0 };
      }
      const amount = parseFloat(row.total);
      if (row.type === 'INCOME') monthMap[row.month].income = amount;
      if (row.type === 'EXPENSE') monthMap[row.month].expense = amount;
    });

    return Object.values(monthMap);
  }
}
