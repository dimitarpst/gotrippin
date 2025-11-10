// Quick test script for @gotrippin/core validation
const { TripCreateDataSchema, ProfileUpdateDataSchema } = require('./packages/core/dist/index.js');

console.log('🧪 Testing @gotrippin/core validation...\n');

// Test 1: Valid trip data
const validTrip = {
  title: 'Summer in Paris',
  destination: 'Paris, France',
  start_date: '2025-07-01T10:00:00.000Z',
  end_date: '2025-07-15T10:00:00.000Z',
  description: 'Exploring the city of lights'
};

console.log('✅ Valid trip data:');
try {
  const result = TripCreateDataSchema.safeParse(validTrip);
  if (result.success) {
    console.log('   ✓ Validation passed');
  } else {
    console.log('   ❌ Validation failed:', result.error.message);
  }
} catch (error) {
  console.log('   ❌ Error:', error.message);
}

// Test 2: Invalid trip data (end before start)
const invalidTrip = {
  title: 'Bad Trip',
  start_date: '2025-07-15T10:00:00.000Z',
  end_date: '2025-07-01T10:00:00.000Z' // Before start!
};

console.log('\n❌ Invalid trip data (end before start):');
try {
  const result = TripCreateDataSchema.safeParse(invalidTrip);
  if (result.success) {
    console.log('   ❌ Should have failed but passed');
  } else {
    console.log('   ✓ Correctly failed validation');
    console.log('   Error:', result.error.issues[0].message);
  }
} catch (error) {
  console.log('   ❌ Error:', error.message);
}

// Test 3: Valid profile data
const validProfile = {
  display_name: 'John Doe',
  avatar_color: '#ff6b6b',
  preferred_lng: 'en'
};

console.log('\n✅ Valid profile data:');
try {
  const result = ProfileUpdateDataSchema.safeParse(validProfile);
  if (result.success) {
    console.log('   ✓ Validation passed');
  } else {
    console.log('   ❌ Validation failed:', result.error.message);
  }
} catch (error) {
  console.log('   ❌ Error:', error.message);
}

// Test 4: Invalid profile data (bad color)
const invalidProfile = {
  display_name: 'Jane Doe',
  avatar_color: 'red', // Not hex format
  preferred_lng: 'bg'
};

console.log('\n❌ Invalid profile data (bad color):');
try {
  const result = ProfileUpdateDataSchema.safeParse(invalidProfile);
  if (result.success) {
    console.log('   ❌ Should have failed but passed');
  } else {
    console.log('   ✓ Correctly failed validation');
    console.log('   Error:', result.error.issues[0].message);
  }
} catch (error) {
  console.log('   ❌ Error:', error.message);
}

console.log('\n🎉 Core validation test complete!');
