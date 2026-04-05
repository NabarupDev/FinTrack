import {
  IsNumber,
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum RecordType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateRecordDto {
  @ApiProperty({ example: 1500.5 })
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: RecordType })
  @IsEnum(RecordType)
  type: RecordType;

  @ApiProperty({ example: 'Salary' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: '2026-04-05' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: 'Monthly salary payment' })
  @IsString()
  @IsOptional()
  notes?: string;
}
