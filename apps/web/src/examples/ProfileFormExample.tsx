/**
 * Example component showing how to use shared schemas
 * in a React form with validation
 * 
 * This is a REFERENCE FILE - not used in the app yet
 */

'use client';

import { useState } from 'react';
import { useProfileValidation } from '@/hooks/useFormValidation';
import type { ProfileUpdateData } from '@gotrippin/core';

export function ProfileFormExample() {
  const [formData, setFormData] = useState<ProfileUpdateData>({
    display_name: '',
    avatar_color: '#ff6b6b',
    preferred_lng: 'en',
  });

  const { validate, errors, hasErrors, getFieldError } = useProfileValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data using shared Zod schema
    if (!validate(formData)) {
      console.error('Validation failed:', errors);
      return;
    }

    // If validation passes, submit to API
    try {
      const response = await fetch('/api/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="display_name" className="block text-sm font-medium">
          Display Name
        </label>
        <input
          type="text"
          id="display_name"
          value={formData.display_name || ''}
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
        {getFieldError('display_name') && (
          <p className="mt-1 text-sm text-red-500">{getFieldError('display_name')}</p>
        )}
      </div>

      <div>
        <label htmlFor="avatar_color" className="block text-sm font-medium">
          Avatar Color
        </label>
        <input
          type="color"
          id="avatar_color"
          value={formData.avatar_color || '#ff6b6b'}
          onChange={(e) => setFormData({ ...formData, avatar_color: e.target.value })}
          className="mt-1 block w-full"
        />
        {getFieldError('avatar_color') && (
          <p className="mt-1 text-sm text-red-500">{getFieldError('avatar_color')}</p>
        )}
      </div>

      <div>
        <label htmlFor="preferred_lng" className="block text-sm font-medium">
          Language
        </label>
        <select
          id="preferred_lng"
          value={formData.preferred_lng || 'en'}
          onChange={(e) => setFormData({ ...formData, preferred_lng: e.target.value as 'en' | 'bg' })}
          className="mt-1 block w-full rounded-md border px-3 py-2"
        >
          <option value="en">English</option>
          <option value="bg">Bulgarian</option>
        </select>
        {getFieldError('preferred_lng') && (
          <p className="mt-1 text-sm text-red-500">{getFieldError('preferred_lng')}</p>
        )}
      </div>

      {hasErrors && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">Please fix the errors above</p>
        </div>
      )}

      <button
        type="submit"
        className="rounded-md bg-coral-500 px-4 py-2 text-white hover:bg-coral-600"
      >
        Update Profile
      </button>
    </form>
  );
}


