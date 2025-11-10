# @gotrippin/core

Shared types, schemas, and utilities for the Go Trippin' monorepo.

## 📦 What's Inside

- **Zod Schemas**: Runtime validation schemas for profiles and trips
- **TypeScript Types**: Type-safe interfaces derived from schemas
- **Shared Utilities**: Common types and interfaces used across frontend and backend

## 🚀 Usage

### In Backend (NestJS)

```typescript
import { TripCreateDataSchema, TripUpdateDataSchema, type Trip } from '@gotrippin/core';

// Validate incoming request data
const result = TripCreateDataSchema.safeParse(body);
if (!result.success) {
  throw new BadRequestException(result.error);
}
```

### In Frontend (Next.js)

```typescript
import { ProfileUpdateDataSchema, type Profile } from '@gotrippin/core';

// Validate form data before submission
const result = ProfileUpdateDataSchema.safeParse(formData);
if (!result.success) {
  // Handle validation errors
  console.error(result.error.flatten());
}
```

## 📚 Available Schemas

### Profile Schemas
- `ProfileSchema` - Full profile object
- `CreateProfileSchema` - For new profile creation
- `UpdateProfileSchema` - For updating profiles
- `ProfileUpdateDataSchema` - API request without ID

### Trip Schemas
- `TripSchema` - Full trip object with validation
- `CreateTripSchema` - For new trip creation
- `UpdateTripSchema` - For updating trips
- `TripUpdateDataSchema` - API request without ID/user_id
- `TripCreateDataSchema` - API request for creation

## 🔧 Development

```bash
# Build the package
npm run build

# Watch mode for development
npm run dev
```

## 🎯 Design Principles

1. **Single Source of Truth**: All data structures defined once
2. **Type Safety**: Automatic TypeScript types from Zod schemas
3. **Runtime Validation**: Ensure data integrity at runtime
4. **Consistency**: Same types used across frontend and backend


