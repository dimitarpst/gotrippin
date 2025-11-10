/**
 * Example component showing how to use shared trip schemas
 * in a React form with validation
 * 
 * This is a REFERENCE FILE - not used in the app yet
 */

'use client';

import { useState } from 'react';
import { useTripCreateValidation } from '@/hooks/useFormValidation';
import type { TripCreateData } from '@gotrippin/core';

export function TripFormExample() {
  const [formData, setFormData] = useState<TripCreateData>({
    title: '',
    destination: '',
    start_date: '',
    end_date: '',
    description: '',
  });

  const { validate, errors, hasErrors, getFieldError } = useTripCreateValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data using shared Zod schema
    if (!validate(formData)) {
      console.error('Validation failed:', errors);
      return;
    }

    // If validation passes, submit to API
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create trip');
      }

      const result = await response.json();
      console.log('Trip created:', result);
      
      // Reset form
      setFormData({
        title: '',
        destination: '',
        start_date: '',
        end_date: '',
        description: '',
      });
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Trip Title
        </label>
        <input
          type="text"
          id="title"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border px-3 py-2"
          placeholder="Summer Vacation 2025"
        />
        {getFieldError('title') && (
          <p className="mt-1 text-sm text-red-500">{getFieldError('title')}</p>
        )}
      </div>

      <div>
        <label htmlFor="destination" className="block text-sm font-medium">
          Destination
        </label>
        <input
          type="text"
          id="destination"
          value={formData.destination || ''}
          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          className="mt-1 block w-full rounded-md border px-3 py-2"
          placeholder="Paris, France"
        />
        {getFieldError('destination') && (
          <p className="mt-1 text-sm text-red-500">{getFieldError('destination')}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium">
            Start Date
          </label>
          <input
            type="datetime-local"
            id="start_date"
            value={formData.start_date ? formData.start_date.slice(0, 16) : ''}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
          {getFieldError('start_date') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('start_date')}</p>
          )}
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium">
            End Date
          </label>
          <input
            type="datetime-local"
            id="end_date"
            value={formData.end_date ? formData.end_date.slice(0, 16) : ''}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
          {getFieldError('end_date') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('end_date')}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full rounded-md border px-3 py-2"
          rows={4}
          placeholder="Tell us about your trip..."
        />
        {getFieldError('description') && (
          <p className="mt-1 text-sm text-red-500">{getFieldError('description')}</p>
        )}
      </div>

      {hasErrors && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">Please fix the errors above</p>
          <ul className="mt-2 list-disc pl-5 text-xs text-red-700">
            {errors.map((error, idx) => (
              <li key={idx}>
                {error.field}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="submit"
        className="rounded-md bg-coral-500 px-4 py-2 text-white hover:bg-coral-600"
      >
        Create Trip
      </button>
    </form>
  );
}


