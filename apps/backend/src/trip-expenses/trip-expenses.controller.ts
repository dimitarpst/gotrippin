import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TripExpensesService } from './trip-expenses.service';
import {
  CreateTripExpenseSchema,
  UpdateTripExpenseSchema,
} from '@gotrippin/core';

@ApiTags('Trip expenses')
@Controller('trips/:tripId/expenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TripExpensesController {
  constructor(private readonly tripExpensesService: TripExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List trip expenses' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiQuery({ name: 'location_id', required: false })
  @ApiQuery({ name: 'activity_id', required: false })
  @ApiResponse({ status: 200, description: 'Expense rows' })
  @ApiResponse({ status: 403, description: 'Not a trip member' })
  async list(
    @Param('tripId') tripId: string,
    @Query('location_id') locationId: string | undefined,
    @Query('activity_id') activityId: string | undefined,
    @Request() req: { user: { id: string } },
  ) {
    const userId = req.user.id;
    return this.tripExpensesService.listExpenses(tripId, userId, {
      locationId: locationId || undefined,
      activityId: activityId || undefined,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create an expense' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Invalid body' })
  async create(
    @Param('tripId') tripId: string,
    @Body() body: unknown,
    @Request() req: { user: { id: string } },
  ) {
    const parsed = CreateTripExpenseSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid expense data',
        errors: parsed.error.flatten(),
      });
    }
    return this.tripExpensesService.createExpense(
      tripId,
      req.user.id,
      parsed.data,
    );
  }

  @Get(':expenseId')
  @ApiOperation({ summary: 'Get one expense' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'expenseId', description: 'Expense ID' })
  async getOne(
    @Param('tripId') tripId: string,
    @Param('expenseId') expenseId: string,
    @Request() req: { user: { id: string } },
  ) {
    const row = await this.tripExpensesService.getExpense(expenseId, req.user.id);
    if (row.trip_id !== tripId) {
      throw new NotFoundException('Expense not found');
    }
    return row;
  }

  @Patch(':expenseId')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'expenseId', description: 'Expense ID' })
  async update(
    @Param('tripId') tripId: string,
    @Param('expenseId') expenseId: string,
    @Body() body: unknown,
    @Request() req: { user: { id: string } },
  ) {
    const parsed = UpdateTripExpenseSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid expense data',
        errors: parsed.error.flatten(),
      });
    }
    return this.tripExpensesService.updateExpense(
      tripId,
      expenseId,
      req.user.id,
      parsed.data,
    );
  }

  @Delete(':expenseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'expenseId', description: 'Expense ID' })
  async remove(
    @Param('tripId') tripId: string,
    @Param('expenseId') expenseId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.tripExpensesService.deleteExpense(
      tripId,
      expenseId,
      req.user.id,
    );
  }
}
