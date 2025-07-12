
'use server';

import { db } from '@/lib/firebase-admin';
import type { SoundEffect } from '@/lib/types';

export async function getSoundEffects(): Promise<SoundEffect[]> {
  try {
    const sfxCollection = db.collection('sound_effects');
    const snapshot = await sfxCollection.get();

    if (snapshot.empty) {
      console.warn('Sound effects collection is empty in Firestore.');
      return [];
    }

    const effects: SoundEffect[] = [];
    snapshot.forEach(doc => {
      effects.push(doc.data() as SoundEffect);
    });
    
    return effects;
  } catch (error) {
    console.error("Error fetching sound effects from Firestore:", error);
    // In a real app, you might want more robust error handling,
    // but for now, returning an empty array is a safe fallback.
    return [];
  }
}
