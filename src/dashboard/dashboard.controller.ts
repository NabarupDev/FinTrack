import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.ANALYST, Role.VIEWER)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('total-income')
  @ApiOperation({ summary: 'Total income sum (All roles)' })
  @ApiResponse({
    status: 200,
    description: 'Total income',
    schema: { example: { totalIncome: 45000 } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTotalIncome() {
    return this.dashboardService.getTotalIncome();
  }

  @Get('total-expense')
  @ApiOperation({ summary: 'Total expense sum (All roles)' })
  @ApiResponse({
    status: 200,
    description: 'Total expense',
    schema: { example: { totalExpense: 32000 } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTotalExpense() {
    return this.dashboardService.getTotalExpense();
  }

  @Get('net-balance')
  @ApiOperation({ summary: 'Net balance summary (All roles)' })
  @ApiResponse({
    status: 200,
    description: 'Income, expense, and net balance',
    schema: {
      example: { totalIncome: 45000, totalExpense: 32000, netBalance: 13000 },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getNetBalance() {
    return this.dashboardService.getNetBalance();
  }

  @Get('category-summary')
  @ApiOperation({ summary: 'Totals by category (All roles)' })
  @ApiResponse({
    status: 200,
    description: 'Totals grouped by category',
    schema: {
      example: { salary: 45000, rent: 15000, food: 3200, transport: 800 },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCategorySummary() {
    return this.dashboardService.getCategorySummary();
  }

  @Get('recent-transactions')
  @ApiOperation({ summary: 'Last 10 transactions (All roles)' })
  @ApiResponse({ status: 200, description: 'Recent transactions list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getRecentTransactions() {
    return this.dashboardService.getRecentTransactions();
  }

  @Get('monthly-trend')
  @ApiOperation({
    summary: 'Monthly income vs expense - last 12 months (All roles)',
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly trend data',
    schema: {
      example: [
        { month: '2025-05', income: 10000, expense: 8000 },
        { month: '2025-06', income: 12000, expense: 7500 },
        { month: '2026-04', income: 15000, expense: 9000 },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMonthlyTrend() {
    return this.dashboardService.getMonthlyTrend();
  }
}
