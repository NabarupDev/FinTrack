import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
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

  @Get('summary')
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiResponse({ status: 200, description: 'Financial summary' })
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('total-income')
  @ApiOperation({ summary: 'Get total income' })
  @ApiResponse({ status: 200, description: 'Total income' })
  getTotalIncome() {
    return this.dashboardService.getTotalIncome();
  }

  @Get('total-expense')
  @ApiOperation({ summary: 'Get total expense' })
  @ApiResponse({ status: 200, description: 'Total expense' })
  getTotalExpense() {
    return this.dashboardService.getTotalExpense();
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Get totals grouped by category' })
  @ApiResponse({ status: 200, description: 'Totals by category' })
  getByCategory() {
    return this.dashboardService.getByCategory();
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent records' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recent records' })
  getRecentRecords(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.dashboardService.getRecentRecords(limit);
  }
}
