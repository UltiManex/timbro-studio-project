// scripts/seed-sfx.ts
import { db } from '../src/lib/firebase-admin';
import { mockSoundEffectsLibrary } from '../src/lib/mock-data'; // We'll read from here one last time
import type { SoundEffect } from '../src/lib/types';

async function seedSoundEffects() {
  console.log('Starting to seed sound_effects collection in Firestore...');
  const sfxCollection = db.collection('sound_effects');

  try {
    const snapshot = await sfxCollection.limit(1).get();
    if (!snapshot.empty) {
      console.log('sound_effects collection already contains data. Skipping seed.');
      return;
    }

    console.log(`Seeding ${mockSoundEffectsLibrary.length} sound effects...`);
    const batch = db.batch();

    mockSoundEffectsLibrary.forEach((sfx: SoundEffect) => {
      // Use the mock ID as the document ID for consistency
      const docRef = sfxCollection.doc(sfx.id); 
      batch.set(docRef, sfx);
    });

    await batch.commit();
    console.log('Successfully seeded sound_effects collection.');
  } catch (error) {
    console.error('Error seeding Firestore sound_effects:', error);
    process.exit(1);
  }
}

seedSoundEffects();
