import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRecordDto, userId: number) {
    return this.prisma.financialRecord.create({
      data: {
        amount: dto.amount,
        type: dto.type,
        category: dto.category,
        date: dto.date ? new Date(dto.date) : new Date(),
        notes: dto.notes,
        createdBy: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.financialRecord.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.financialRecord.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!record) throw new NotFoundException('Record not found');
    return record;
  }

  async update(id: number, dto: UpdateRecordDto) {
    await this.findOne(id); // throws if not found

    return this.prisma.financialRecord.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // throws if not found

    return this.prisma.financialRecord.delete({
      where: { id },
    });
  }
}
