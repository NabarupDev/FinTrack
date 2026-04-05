import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation (duplicate email, etc.)
        const field =
          (exception.meta?.target as string[])?.join(', ') ?? 'field';
        response.status(HttpStatus.CONFLICT).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: `${field} already exists`,
          },
        });
        break;
      }
      case 'P2025': {
        // Record not found (delete/update on non-existent record)
        response.status(HttpStatus.NOT_FOUND).json({
          success: false,
          error: {
            code: 'RECORD_NOT_FOUND',
            message: 'Record not found',
          },
        });
        break;
      }
      case 'P2003': {
        // Foreign key constraint failed
        response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'FOREIGN_KEY_ERROR',
            message: 'Related record not found',
          },
        });
        break;
      }
      default: {
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database error',
          },
        });
      }
    }
  }
}
