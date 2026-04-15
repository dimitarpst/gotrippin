import type { OpenRouterTool } from '../openrouter.client';

export const AI_TOOLS: OpenRouterTool[] = [
  {
    type: 'function',
    function: {
      name: 'createTripDraft',
      description:
        'Create a new trip draft. Use when the user wants to start planning a trip. Returns trip_id and share_code—then use addLocation (and getRoute) in sequence to build the route on that trip.',
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
        'Add one stop to the saved trip route (call once per stop in order). The server resolves coordinates (Open-Meteo geocoding). Use trip_id from createTripDraft or context; prefer names like "Plovdiv, Bulgaria". After adding stops, call getRoute to confirm order.',
      parameters: {
        type: 'object',
        properties: {
          trip_id: { type: 'string', description: 'Trip UUID' },
          location_name: {
            type: 'string',
            description: 'Human-readable place (e.g. "Plovdiv, Bulgaria"). Avoid bare city-only names when ambiguous.',
          },
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
      description:
        'Read the current ordered stops for a trip. Call after addLocation (or reorderLocations) to verify the route matches what the user asked for.',
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
  {
    type: 'function',
    function: {
      name: 'searchCoverImage',
      description:
        'Search Unsplash for potential trip cover images. Use only when the user asks for new/different photos. Do NOT call this when the user is choosing from images you already showed (e.g. "the second one") — use selectCoverImage with the pending_cover_images list from context instead.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search term, e.g. "sunset beach Bali"',
          },
          page: {
            type: 'number',
            description: 'Page number (1-based)',
          },
          per_page: {
            type: 'number',
            description: 'Results per page (max ~30)',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'selectCoverImage',
      description:
        'Set the cover image for a trip using an Unsplash photo. Use when the user picks one of the images from the pending_cover_images list (e.g. "the second one", "number 3"). Use the exact object from that list — do not invent or re-fetch; the IDs must match what was shown.',
      parameters: {
        type: 'object',
        properties: {
          trip_id: { type: 'string', description: 'Trip UUID' },
          unsplash_photo_id: {
            type: 'string',
            description: 'Unsplash photo id',
          },
          download_location: {
            type: 'string',
            description: 'Unsplash download_location URL for tracking downloads',
          },
          image_url: {
            type: 'string',
            description: 'Display URL for the selected image',
          },
          photographer_name: {
            type: 'string',
            description: 'Name of the photographer for attribution',
          },
          photographer_url: {
            type: 'string',
            description: 'Profile URL of the photographer',
          },
          blur_hash: {
            type: ['string', 'null'],
            description: 'Blurhash placeholder value (optional)',
          },
          dominant_color: {
            type: ['string', 'null'],
            description: 'Dominant color of the image (optional)',
          },
        },
        required: [
          'trip_id',
          'unsplash_photo_id',
          'download_location',
          'image_url',
          'photographer_name',
          'photographer_url',
        ],
        additionalProperties: false,
      },
    },
  },
];
