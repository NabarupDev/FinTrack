import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { FilterRecordDto } from './dto/filter-record.dto';
import { Prisma } from '@prisma/client';
import { FormattedRecord } from '../common/interfaces/formatted-record.interface';

/** Prisma select for the related user on each record */
const USER_SELECT = { select: { id: true, name: true, email: true } } as const;

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRecordDto, userId: number): Promise<FormattedRecord> {
    const record = await this.prisma.financialRecord.create({
      data: {
        amount: dto.amount,
        type: dto.type,
        category: dto.category.toLowerCase(),
        date: dto.date ? new Date(dto.date) : new Date(),
        notes: dto.notes,
        createdBy: userId,
      },
      include: { user: USER_SELECT },
    });
    return this.formatRecord(record);
  }

  async findAll(filters: FilterRecordDto): Promise<{
    data: FormattedRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
    } = filters;

    const where: Prisma.FinancialRecordWhereInput = {};

    if (type) where.type = type;
    if (category) where.category = { contains: category.toLowerCase() };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { category: { contains: search.toLowerCase() } },
        { notes: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.financialRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: { user: USER_SELECT },
      }),
      this.prisma.financialRecord.count({ where }),
    ]);

    return {
      data: data.map((record) => this.formatRecord(record)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<FormattedRecord> {
    const record = await this.prisma.financialRecord.findUnique({
      where: { id },
      include: { user: USER_SELECT },
    });
    if (!record) throw new NotFoundException('Record not found');
    return this.formatRecord(record);
  }

  async update(id: number, dto: UpdateRecordDto): Promise<FormattedRecord> {
    await this.findOne(id); // 404 check
    const record = await this.prisma.financialRecord.update({
      where: { id },
      data: {
        ...dto,
        category: dto.category?.toLowerCase(),
        date: dto.date ? new Date(dto.date) : undefined,
        amount: dto.amount,
      },
      include: { user: USER_SELECT },
    });
    return this.formatRecord(record);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.financialRecord.delete({ where: { id } });
  }

  /** Converts Prisma Decimal to plain number for JSON serialization */
  private formatRecord(record: {
    amount: number | { toString(): string };
    [key: string]: unknown;
  }): FormattedRecord {
    return {
      ...record,
      amount: parseFloat(record.amount.toString()),
    } as FormattedRecord;
  }
}
