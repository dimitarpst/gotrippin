/**
 * React hooks for trip management
 * Handles fetching, creating, updating, and deleting trips with proper state management
 */

import { useState, useEffect, useCallback } from 'react';
import type { Trip, TripCreateData, TripUpdateData } from '@gotrippin/core';
import {
  fetchTrips,
  fetchTripById,
  fetchTripByShareCode,
  createTrip,
  updateTrip,
  deleteTrip,
  ApiError,
} from '@/lib/api/trips';
import { useAuth } from '@/contexts/AuthContext';

interface UseTripsResult {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch all trips for the current user
 */
export function useTrips(): UseTripsResult {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading, accessToken } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user && !authLoading) {
      setLoading(false);
      setError('Authentication required');
      return;
    }

    if (authLoading || !accessToken) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchTrips(accessToken);
      setTrips(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch trips');
      }
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    trips,
    loading: loading || authLoading,
    error,
    refetch: fetchData,
  };
}

interface UseTripResult {
  trip: Trip | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch a single trip by share code
 */
export function useTrip(shareCode: string | null): UseTripResult {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading, accessToken } = useAuth();

  const fetchData = useCallback(async () => {
    if (!shareCode) {
      setLoading(false);
      return;
    }

    // Don't fetch if user is not authenticated or auth is still loading
    if (!user && !authLoading) {
      setLoading(false);
      setError('Authentication required');
      return;
    }

    if (authLoading || !accessToken) {
      return; // Still loading auth, don't fetch yet
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchTripByShareCode(shareCode, accessToken);
      setTrip(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch trip');
      }
      console.error('Error fetching trip:', err);
    } finally {
      setLoading(false);
    }
  }, [shareCode, user, authLoading, accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    trip,
    loading: loading || authLoading,
    error,
    refetch: fetchData,
  };
}

interface UseCreateTripResult {
  create: (data: TripCreateData) => Promise<Trip | null>;
  creating: boolean;
  error: string | null;
  validationErrors: Record<string, string> | null;
}

/**
 * Hook to create a new trip
 */
export function useCreateTrip(): UseCreateTripResult {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null);
  const { accessToken } = useAuth();

  const create = useCallback(async (data: TripCreateData): Promise<Trip | null> => {
    try {
      if (!accessToken) {
        throw new ApiError('Authentication required', 401);
      }
      setCreating(true);
      setError(null);
      setValidationErrors(null);

      const newTrip = await createTrip(data, accessToken);
      return newTrip;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);

        // Handle validation errors
        if (err.errors?.validationErrors) {
          const errors: Record<string, string> = {};
          err.errors.validationErrors.forEach((error: { field: string; message: string }) => {
            errors[error.field] = error.message;
          });
          setValidationErrors(errors);
        }
      } else {
        setError('Failed to create trip');
      }
      console.error('Error creating trip:', err);
      return null;
    } finally {
      setCreating(false);
    }
  }, [accessToken]);

  return {
    create,
    creating,
    error,
    validationErrors,
  };
}

interface UseUpdateTripResult {
  update: (id: string, data: TripUpdateData) => Promise<Trip | null>;
  updating: boolean;
  error: string | null;
  validationErrors: Record<string, string> | null;
}

/**
 * Hook to update an existing trip
 */
export function useUpdateTrip(): UseUpdateTripResult {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null);
  const { accessToken } = useAuth();

  const update = useCallback(async (
    id: string,
    data: TripUpdateData
  ): Promise<Trip | null> => {
    try {
      setUpdating(true);
      setError(null);
      setValidationErrors(null);

      if (!accessToken) {
        throw new ApiError('Authentication required', 401);
      }

      const updatedTrip = await updateTrip(id, data, accessToken);
      return updatedTrip;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);

        // Handle validation errors
        if (err.errors?.validationErrors) {
          const errors: Record<string, string> = {};
          err.errors.validationErrors.forEach((error: { field: string; message: string }) => {
            errors[error.field] = error.message;
          });
          setValidationErrors(errors);
        }
      } else {
        setError('Failed to update trip');
      }
      console.error('Error updating trip:', err);
      return null;
    } finally {
      setUpdating(false);
    }
  }, [accessToken]);

  return {
    update,
    updating,
    error,
    validationErrors,
  };
}

interface UseDeleteTripResult {
  deleteTrip: (id: string) => Promise<boolean>;
  deleting: boolean;
  error: string | null;
}

/**
 * Hook to delete a trip
 */
export function useDeleteTrip(): UseDeleteTripResult {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const deleteTripFn = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (!accessToken) {
        throw new ApiError('Authentication required', 401);
      }
      setDeleting(true);
      setError(null);

      await deleteTrip(id, accessToken);
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete trip');
      }
      console.error('Error deleting trip:', err);
      return false;
    } finally {
      setDeleting(false);
    }
  }, [accessToken]);

  return {
    deleteTrip: deleteTripFn,
    deleting,
    error,
  };
}

