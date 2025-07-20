// scripts/seed-sfx.ts
import { db } from '../src/lib/firebase-admin';
import { mockSoundEffectsLibrary } from '../src/lib/mock-data';
import type { SoundEffect } from '../src/lib/types';

async function deleteCollection(collectionRef: FirebaseFirestore.CollectionReference, batchSize: number) {
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve(true);
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}


async function seedSoundEffects() {
  console.log('Starting to reset and re-seed sound_effects collection...');
  const sfxCollection = db.collection('sound_effects');

  try {
    // Delete all existing documents in the collection
    console.log('Deleting existing sound effects...');
    await deleteCollection(sfxCollection, 50);
    console.log('Existing sound effects deleted successfully.');

    // Seed with new data
    console.log(`Seeding ${mockSoundEffectsLibrary.length} new sound effects...`);
    const batch = db.batch();

    mockSoundEffectsLibrary.forEach((sfx: SoundEffect) => {
      // Use the mock ID as the document ID for consistency
      const docRef = sfxCollection.doc(sfx.id); 
      batch.set(docRef, sfx);
    });

    await batch.commit();
    console.log('Successfully seeded sound_effects collection.');
  } catch (error) {
    console.error('Error resetting Firestore sound_effects:', error);
    process.exit(1);
  }
}

seedSoundEffects();
