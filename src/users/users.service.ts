import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import * as bcrypt from 'bcryptjs';

/** Shared Prisma select — returns user fields without password or updatedAt */
const SELECT_SAFE_USER = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

type SafeUser = Prisma.UserGetPayload<{ select: typeof SELECT_SAFE_USER }>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: { ...dto, email: dto.email.toLowerCase(), password: hashed },
      select: SELECT_SAFE_USER,
    });
  }

  async findAll(
    role?: string,
    status?: string,
  ): Promise<{ data: SafeUser[]; total: number }> {
    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role as Prisma.EnumRoleFilter['equals'];
    if (status) where.status = status as Prisma.EnumStatusFilter['equals'];

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, select: SELECT_SAFE_USER }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: number): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SELECT_SAFE_USER,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<SafeUser> {
    await this.findOne(id); // throws 404 if not found

    if (dto.email) {
      const taken = await this.prisma.user.findFirst({
        where: { email: dto.email.toLowerCase(), NOT: { id } },
      });
      if (taken) throw new ConflictException('Email already in use');
    }

    return this.prisma.user.update({
      where: { id },
      data: { ...dto, email: dto.email?.toLowerCase() },
      select: SELECT_SAFE_USER,
    });
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<SafeUser> {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      select: SELECT_SAFE_USER,
    });
  }

  async remove(id: number, requestingUserId: number): Promise<void> {
    if (id === requestingUserId) {
      throw new BadRequestException('Cannot delete your own account');
    }
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
  }
}
