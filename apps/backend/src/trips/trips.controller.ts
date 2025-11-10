import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { TripsService } from "./trips.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateTripDto } from "./dto/create-trip.dto";
import { UpdateTripDto } from "./dto/update-trip.dto";

@ApiTags("trips")
@Controller("trips")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @ApiOperation({ summary: "Get current user trips" })
  @ApiResponse({ status: 200, description: "Trips retrieved successfully" })
  async getMyTrips(@Req() request: any) {
    const userId = request.user.id;
    return this.tripsService.getTrips(userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get specific trip by ID" })
  @ApiParam({ name: "id", description: "Trip ID" })
  @ApiResponse({ status: 200, description: "Trip retrieved successfully" })
  @ApiResponse({ status: 403, description: "Trip not found or access denied" })
  @ApiResponse({ status: 404, description: "Trip not found" })
  async getTripById(@Param("id") id: string, @Req() request: any) {
    const userId = request.user.id;
    return this.tripsService.getTripById(id, userId);
  }

  @Post()
  @ApiOperation({ summary: "Create new trip" })
  @ApiResponse({ status: 201, description: "Trip created successfully" })
  @ApiResponse({ status: 400, description: "Invalid trip data" })
  async createTrip(@Req() request: any, @Body() data: CreateTripDto) {
    // Validate using shared Zod schema
    const result = CreateTripDto.safeParse(data);
    if (!result.success) {
      throw new BadRequestException({
        message: "Invalid trip data",
        errors: result.error.flatten(),
      });
    }

    const userId = request.user.id;
    return this.tripsService.createTrip(userId, result.data);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update trip" })
  @ApiParam({ name: "id", description: "Trip ID" })
  @ApiResponse({ status: 200, description: "Trip updated successfully" })
  @ApiResponse({ status: 400, description: "Invalid trip data" })
  @ApiResponse({ status: 403, description: "Trip not found or access denied" })
  @ApiResponse({ status: 404, description: "Trip not found" })
  async updateTrip(
    @Param("id") id: string,
    @Req() request: any,
    @Body() data: UpdateTripDto
  ) {
    // Validate using shared Zod schema
    const result = UpdateTripDto.safeParse(data);
    if (!result.success) {
      throw new BadRequestException({
        message: "Invalid trip data",
        errors: result.error.flatten(),
      });
    }

    const userId = request.user.id;
    return this.tripsService.updateTrip(id, userId, result.data);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete trip" })
  @ApiParam({ name: "id", description: "Trip ID" })
  @ApiResponse({ status: 200, description: "Trip deleted successfully" })
  @ApiResponse({ status: 403, description: "Trip not found or access denied" })
  @ApiResponse({ status: 404, description: "Trip not found" })
  async deleteTrip(@Param("id") id: string, @Req() request: any) {
    const userId = request.user.id;
    return this.tripsService.deleteTrip(id, userId);
  }
}
