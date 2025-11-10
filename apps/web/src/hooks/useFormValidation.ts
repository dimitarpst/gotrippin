/**
 * Custom hook for form validation using Zod schemas
 * Example usage of @gotrippin/core in React components
 */

import { useState, useCallback } from 'react';
import { validateProfileUpdate, validateTripCreate, validateTripUpdate, type ValidationError } from '@/lib/validation';
import type { ProfileUpdateData, TripCreateData, TripUpdateData } from '@gotrippin/core';

type ValidatorType = 'profile' | 'tripCreate' | 'tripUpdate';

/**
 * Generic form validation hook
 */
export function useFormValidation<T = any>(validatorType: ValidatorType) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(
    (data: unknown): data is T => {
      setIsValidating(true);
      let result;

      switch (validatorType) {
        case 'profile':
          result = validateProfileUpdate(data);
          break;
        case 'tripCreate':
          result = validateTripCreate(data);
          break;
        case 'tripUpdate':
          result = validateTripUpdate(data);
          break;
        default:
          result = { success: false, errors: [{ field: 'unknown', message: 'Invalid validator type' }] };
      }

      setIsValidating(false);

      if (result.success) {
        setErrors([]);
        return true;
      } else {
        setErrors(result.errors);
        return false;
      }
    },
    [validatorType]
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      return errors.find((err) => err.field === fieldName)?.message;
    },
    [errors]
  );

  return {
    errors,
    isValidating,
    validate,
    clearErrors,
    getFieldError,
    hasErrors: errors.length > 0,
  };
}

/**
 * Specialized hooks for common use cases
 */
export function useProfileValidation() {
  return useFormValidation<ProfileUpdateData>('profile');
}

export function useTripCreateValidation() {
  return useFormValidation<TripCreateData>('tripCreate');
}

export function useTripUpdateValidation() {
  return useFormValidation<TripUpdateData>('tripUpdate');
}


