import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const [totalIncome, totalExpense, recordCount] = await Promise.all([
      this.prisma.financialRecord.aggregate({
        _sum: { amount: true },
        where: { type: 'INCOME' },
      }),
      this.prisma.financialRecord.aggregate({
        _sum: { amount: true },
        where: { type: 'EXPENSE' },
      }),
      this.prisma.financialRecord.count(),
    ]);

    const income = totalIncome._sum.amount ?? 0;
    const expense = totalExpense._sum.amount ?? 0;

    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
      recordCount,
    };
  }

  async getTotalIncome() {
    const result = await this.prisma.financialRecord.aggregate({
      _sum: { amount: true },
      where: { type: 'INCOME' },
    });
    return { totalIncome: result._sum.amount ?? 0 };
  }

  async getTotalExpense() {
    const result = await this.prisma.financialRecord.aggregate({
      _sum: { amount: true },
      where: { type: 'EXPENSE' },
    });
    return { totalExpense: result._sum.amount ?? 0 };
  }

  async getByCategory() {
    const results = await this.prisma.financialRecord.groupBy({
      by: ['category', 'type'],
      _sum: { amount: true },
      _count: true,
    });

    return results.map((r) => ({
      category: r.category,
      type: r.type,
      total: r._sum.amount ?? 0,
      count: r._count,
    }));
  }

  async getRecentRecords(limit = 10) {
    return this.prisma.financialRecord.findMany({
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
  }
}
