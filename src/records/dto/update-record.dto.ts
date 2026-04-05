import {
  IsNumber,
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum RecordType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class UpdateRecordDto {
  @ApiPropertyOptional({ example: 1500.5 })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ enum: RecordType })
  @IsEnum(RecordType)
  @IsOptional()
  type?: RecordType;

  @ApiPropertyOptional({ example: 'Salary' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: '2026-04-05' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: 'Monthly salary payment' })
  @IsString()
  @IsOptional()
  notes?: string;
}
