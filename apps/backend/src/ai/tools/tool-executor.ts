import { Injectable, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { TripsService } from '../../trips/trips.service';
import { TripLocationsService } from '../../trip-locations/trip-locations.service';

const CreateTripDraftSchema = z.object({
  title: z.string().max(200).optional(),
  destination: z.string().max(200).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

const UpdateTripSchema = z.object({
  trip_id: z.string().uuid(),
  title: z.string().max(200).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

const AddLocationSchema = z.object({
  trip_id: z.string().uuid(),
  location_name: z.string().min(1).max(200),
  order_index: z.number().int().positive().optional(),
  arrival_date: z.string().optional(),
  departure_date: z.string().optional(),
});

const GetRouteSchema = z.object({
  trip_id: z.string().uuid(),
});

const ReorderLocationsSchema = z.object({
  trip_id: z.string().uuid(),
  location_ids: z.array(z.string().uuid()).min(1),
});

@Injectable()
export class ToolExecutor {
  constructor(
    private readonly tripsService: TripsService,
    private readonly tripLocationsService: TripLocationsService,
  ) {}

  async execute(
    toolName: string,
    args: unknown,
    userId: string,
  ): Promise<unknown> {
    try {
      switch (toolName) {
        case 'createTripDraft': {
          const parsed = CreateTripDraftSchema.parse(args);
          const trip = await this.tripsService.createTrip(userId, {
            title: parsed.title,
            destination: parsed.destination,
            start_date: parsed.start_date,
            end_date: parsed.end_date,
          });
          return {
            trip_id: trip.id,
            share_code: trip.share_code,
            title: trip.title,
            destination: trip.destination,
            start_date: trip.start_date,
            end_date: trip.end_date,
          };
        }
        case 'updateTrip': {
          const parsed = UpdateTripSchema.parse(args);
          await this.tripsService.updateTrip(parsed.trip_id, userId, {
            title: parsed.title,
            start_date: parsed.start_date,
            end_date: parsed.end_date,
          });
          const trips = await this.tripsService.getTrips(userId);
          const trip = trips.find((t) => t.id === parsed.trip_id);
          return { success: true, trip };
        }
        case 'addLocation': {
          const parsed = AddLocationSchema.parse(args);
          const loc = await this.tripLocationsService.addLocation(
            parsed.trip_id,
            userId,
            {
              location_name: parsed.location_name,
              order_index: parsed.order_index,
              arrival_date: parsed.arrival_date,
              departure_date: parsed.departure_date,
            },
          );
          return {
            location_id: loc.id,
            location_name: loc.location_name,
            order_index: loc.order_index,
          };
        }
        case 'getRoute': {
          const parsed = GetRouteSchema.parse(args);
          const route = await this.tripLocationsService.getRoute(
            parsed.trip_id,
            userId,
          );
          return route.map((r) => ({
            id: r.id,
            location_name: r.location_name,
            order_index: r.order_index,
            arrival_date: r.arrival_date,
            departure_date: r.departure_date,
          }));
        }
        case 'reorderLocations': {
          const parsed = ReorderLocationsSchema.parse(args);
          await this.tripLocationsService.reorderLocations(
            parsed.trip_id,
            userId,
            { location_ids: parsed.location_ids },
          );
          return { success: true };
        }
        case 'getUserTrips': {
          const trips = await this.tripsService.getTrips(userId);
          return trips.map((t) => ({
            id: t.id,
            share_code: t.share_code,
            title: t.title,
            destination: t.destination,
            start_date: t.start_date,
            end_date: t.end_date,
          }));
        }
        default:
          throw new BadRequestException(`Unknown tool: ${toolName}`);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new BadRequestException({
          message: 'Invalid tool arguments',
          errors: err.flatten(),
        });
      }
      throw err;
    }
  }
}
