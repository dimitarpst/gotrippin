import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
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
  ApiBody,
} from "@nestjs/swagger";
import { TripsService } from "./trips.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateTripDto } from "./dto/create-trip.dto";
import { UpdateTripDto } from "./dto/update-trip.dto";
import { AddMemberDto } from "./dto/add-member.dto";

@ApiTags("trips")
@Controller("trips")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TripsController {
  constructor(private readonly tripsService: TripsService) { }

  @Get()
  @ApiOperation({ summary: "Get current user trips" })
  @ApiResponse({ status: 200, description: "Trips retrieved successfully" })
  async getMyTrips(@Req() request: any) {
    const userId = request.user.id;
    return this.tripsService.getTrips(userId);
  }

  @Get('share/:shareCode/detail')
  @ApiOperation({ summary: 'Get full trip detail (trip + locations + timeline + weather) for detail screen' })
  @ApiParam({ name: 'shareCode', description: 'Trip share code' })
  @ApiResponse({ status: 200, description: 'Trip detail; sub-resources may be null with *_error set' })
  @ApiResponse({ status: 403, description: 'Trip not found or access denied' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async getTripDetailByShareCode(@Param('shareCode') shareCode: string, @Req() request: any) {
    const userId = request.user.id;
    return this.tripsService.getTripDetailByShareCode(shareCode, userId);
  }

  @Get('share/:shareCode')
  @ApiOperation({ summary: 'Get trip by share code' })
  @ApiParam({ name: 'shareCode', description: 'Trip share code' })
  @ApiResponse({ status: 200, description: 'Trip retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Trip not found or access denied' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async getTripByShareCode(@Param('shareCode') shareCode: string, @Req() request: any) {
    const userId = request.user.id;
    return this.tripsService.getTripByShareCode(shareCode, userId);
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

  @Patch(":id/cover-dominant-color")
  @ApiOperation({ summary: "Update trip cover photo dominant color (persist client-extracted value)" })
  @ApiParam({ name: "id", description: "Trip ID" })
  @ApiResponse({ status: 200, description: "Dominant color updated" })
  @ApiResponse({ status: 400, description: "Trip has no cover photo" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Trip not found" })
  async updateCoverDominantColor(
    @Param("id") id: string,
    @Req() request: any,
    @Body() body: { dominant_color: string },
  ) {
    const userId = request.user.id;
    if (!body?.dominant_color || typeof body.dominant_color !== "string") {
      throw new BadRequestException("dominant_color is required");
    }
    return this.tripsService.updateCoverDominantColor(id, userId, body.dominant_color);
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

  @Get(":id/members")
  @ApiOperation({ summary: "Get all members of a trip" })
  @ApiParam({ name: "id", description: "Trip ID" })
  @ApiResponse({ status: 200, description: "Trip members retrieved successfully" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Trip not found" })
  async getTripMembers(@Param("id") id: string, @Req() request: any) {
    const userId = request.user.id;
    return this.tripsService.getTripMembers(id, userId);
  }

  @Post(":id/members")
  @ApiOperation({ summary: "Add a member to a trip" })
  @ApiParam({ name: "id", description: "Trip ID" })
  @ApiBody({ type: AddMemberDto })
  @ApiResponse({ status: 201, description: "Member added successfully" })
  @ApiResponse({ status: 400, description: "Invalid user ID" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Trip not found" })
  async addTripMember(
    @Param("id") id: string,
    @Body() body: AddMemberDto,
    @Req() request: any
  ) {
    const currentUserId = request.user.id;
    return this.tripsService.addMember(id, currentUserId, body.user_id);
  }

  @Delete(":id/members/:userId")
  @ApiOperation({ summary: "Remove a member from a trip" })
  @ApiParam({ name: "id", description: "Trip ID" })
  @ApiParam({ name: "userId", description: "User ID to remove" })
  @ApiResponse({ status: 200, description: "Member removed successfully" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Trip not found" })
  async removeTripMember(
    @Param("id") id: string,
    @Param("userId") userIdToRemove: string,
    @Req() request: any
  ) {
    const currentUserId = request.user.id;
    return this.tripsService.removeMember(id, currentUserId, userIdToRemove);
  }
}
