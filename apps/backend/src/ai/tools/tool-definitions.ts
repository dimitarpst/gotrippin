import type { OpenRouterTool } from '../openrouter.client';

export const AI_TOOLS: OpenRouterTool[] = [
  {
    type: 'function',
    function: {
      name: 'createTripDraft',
      description:
        'Create a new trip draft. Use when the user wants to start planning a trip. Returns trip_id and share_code.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Trip title (e.g. "Spain Adventure")' },
          destination: { type: 'string', description: 'Main destination or region' },
          start_date: { type: 'string', description: 'Start date in ISO 8601 format (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date in ISO 8601 format (YYYY-MM-DD)' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateTrip',
      description: 'Update an existing trip (title, dates, etc.).',
      parameters: {
        type: 'object',
        properties: {
          trip_id: { type: 'string', description: 'Trip UUID' },
          title: { type: 'string', description: 'New trip title' },
          start_date: { type: 'string', description: 'Start date ISO 8601' },
          end_date: { type: 'string', description: 'End date ISO 8601' },
        },
        required: ['trip_id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addLocation',
      description:
        'Add a location/stop to a trip route. Use for each destination the user wants to visit.',
      parameters: {
        type: 'object',
        properties: {
          trip_id: { type: 'string', description: 'Trip UUID' },
          location_name: { type: 'string', description: 'Location name (e.g. "Madrid, Spain")' },
          order_index: { type: 'number', description: 'Position in route (1-based)' },
          arrival_date: { type: 'string', description: 'Arrival date ISO 8601' },
          departure_date: { type: 'string', description: 'Departure date ISO 8601' },
        },
        required: ['trip_id', 'location_name'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getRoute',
      description: 'Get the current route (ordered locations) for a trip.',
      parameters: {
        type: 'object',
        properties: {
          trip_id: { type: 'string', description: 'Trip UUID' },
        },
        required: ['trip_id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reorderLocations',
      description: 'Reorder locations in a trip route. Pass location IDs in the desired order.',
      parameters: {
        type: 'object',
        properties: {
          trip_id: { type: 'string', description: 'Trip UUID' },
          location_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Location UUIDs in desired order',
          },
        },
        required: ['trip_id', 'location_ids'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getUserTrips',
      description: 'List the user\'s trips. Use to find trip_id or share_code when the user asks about their trips.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
];
