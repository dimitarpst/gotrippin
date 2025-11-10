/**
 * React hooks for trip management
 * Handles fetching, creating, updating, and deleting trips with proper state management
 */

import { useState, useEffect, useCallback } from 'react';
import type { Trip, TripCreateData, TripUpdateData } from '@gotrippin/core';
import {
  fetchTrips,
  fetchTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  ApiError,
} from '@/lib/api/trips';

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTrips();
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    trips,
    loading,
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
 * Hook to fetch a single trip by ID
 */
export function useTrip(id: string | null): UseTripResult {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchTripById(id);
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
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    trip,
    loading,
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

  const create = useCallback(async (data: TripCreateData): Promise<Trip | null> => {
    try {
      setCreating(true);
      setError(null);
      setValidationErrors(null);
      
      const newTrip = await createTrip(data);
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
  }, []);

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

  const update = useCallback(async (
    id: string,
    data: TripUpdateData
  ): Promise<Trip | null> => {
    try {
      setUpdating(true);
      setError(null);
      setValidationErrors(null);
      
      const updatedTrip = await updateTrip(id, data);
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
  }, []);

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

  const deleteTripFn = useCallback(async (id: string): Promise<boolean> => {
    try {
      setDeleting(true);
      setError(null);
      
      await deleteTrip(id);
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
  }, []);

  return {
    deleteTrip: deleteTripFn,
    deleting,
    error,
  };
}

