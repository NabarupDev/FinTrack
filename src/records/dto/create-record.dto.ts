import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RecordType } from '../../common/enums/record-type.enum';

export class CreateRecordDto {
  @ApiProperty({ example: 5000.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: RecordType })
  @IsEnum(RecordType)
  type: RecordType;

  @ApiProperty({ example: 'salary' })
  @IsString()
  @MinLength(1)
  category: string;

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: 'April salary payment' })
  @IsString()
  @IsOptional()
  notes?: string;
}
