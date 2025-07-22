// scripts/seed-sfx.ts
import { db } from '../src/lib/firebase-admin';
import type { SoundEffect } from '../src/lib/types';

// This data is now self-contained within the script that uses it.
const mockSoundEffectsLibrary: SoundEffect[] = [
    { id: 'sfx_001', name: 'Comical Boing', tags: ['boing', 'jump', 'funny'], tone: ['Comedic'], previewUrl: 'https://firebasestorage.googleapis.com/v0/b/timbro-instant-audio-drama.appspot.com/o/sound-effects%2Fcomical-boing.mp3?alt=media&token=e9bf5d79-0b89-4f7f-97a7-09f168c92a62' },
    { id: 'sfx_002', name: 'Dramatic Swell', tags: ['swell', 'tension', 'reveal'], tone: ['Dramatic', 'Suspenseful'], previewUrl: 'https://firebasestorage.googleapis.com/v0/b/timbro-instant-audio-drama.appspot.com/o/sound-effects%2Fdramatic-swell.mp3?alt=media&token=8540b07a-0118-450f-a0df-26a1f108f972' },
    { id: 'sfx_003', name: 'Suspenseful Drone', tags: ['drone', 'creepy', 'tense'], tone: ['Suspenseful'], previewUrl: 'https://firebasestorage.googleapis.com/v0/b/timbro-instant-audio-drama.appspot.com/o/sound-effects%2Fsuspenseful-drone.mp3?alt=media&token=428b493c-1b77-4c72-9a74-b4a0584288c3' },
    { id: 'sfx_004', name: 'Uplifting Chime', tags: ['chime', 'positive', 'success'], tone: ['Inspirational'], previewUrl: 'https://firebasestorage.googleapis.com/v0/b/timbro-instant-audio-drama.appspot.com/o/sound-effects%2Fuplifting-chime.mp3?alt=media&token=4a70624d-3b7c-4734-9b2f-90e87d10c1c8' },
    { id: 'sfx_005', name: 'Sad Trombone', tags: ['fail', 'wah-wah', 'funny'], tone: ['Comedic'], previewUrl: 'https://firebasestorage.googleapis.com/v0/b/timbro-instant-audio-drama.appspot.com/o/sound-effects%2Fsad-trombone.mp3?alt=media&token=b7313c01-f2f2-4573-8b7a-590ca64b281b' },
    { id: 'sfx_006', name: 'Heartbeat', tags: ['heart', 'pulse', 'tense'], tone: ['Suspenseful', 'Dramatic'], previewUrl: 'https://firebasestorage.googleapis.com/v0/b/timbro-instant-audio-drama.appspot.com/o/sound-effects%2Fheartbeat.mp3?alt=media&token=24c8b556-3a78-450d-85f8-80a5f061e860' },
    { id: 'sfx_007', name: 'Record Scratch', tags: ['stop', 'interrupt', 'funny'], tone: ['Comedic'], previewUrl: 'https://firebasestorage.googleapis.com/v0/b/timbro-instant-audio-drama.appspot.com/o/sound-effects%2Frecord-scratch.mp3?alt=media&token=e1a06952-a9b0-46cb-8419-5d2729a8888b' },
    { id: 'sfx_008', name: 'Inspiring Piano Chord', tags: ['piano', 'hopeful', 'positive'], tone: ['Inspirational'], previewUrl: 'https://firebasestorage.googleapis.com/v0/b/timbro-instant-audio-drama.appspot.com/o/sound-effects%2Finspiring-chord.mp3?alt=media&token=5a1d74e6-d8f9-49a8-a59c-0c845347e8a9' },
];

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
