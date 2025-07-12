// scripts/index-algolia.ts
import algoliasearch from 'algoliasearch';
import { config } from 'dotenv';
import { db } from '../src/lib/firebase-admin';
import type { SoundEffect } from '../src/lib/types';

// Load environment variables from .env file
config();

async function fetchSoundEffectsFromFirestore(): Promise<SoundEffect[]> {
  console.log('Fetching sound effects from Firestore...');
  const sfxCollection = db.collection('sound_effects');
  const snapshot = await sfxCollection.get();

  if (snapshot.empty) {
    console.log('No sound effects found in Firestore. Please seed the database first by running `npm run firestore:seed:sfx`.');
    return [];
  }

  const effects: SoundEffect[] = [];
  snapshot.forEach(doc => {
    effects.push(doc.data() as SoundEffect);
  });
  console.log(`Fetched ${effects.length} sound effects.`);
  return effects;
}

async function indexData() {
  const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const algoliaAdminApiKey = process.env.ALGOLIA_ADMIN_API_KEY;
  const algoliaIndexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME;

  if (!algoliaAppId || !algoliaAdminApiKey || !algoliaIndexName) {
    console.error(
      'Algolia environment variables are not set. Please check your .env file.'
    );
    process.exit(1);
  }

  try {
    const soundEffects = await fetchSoundEffectsFromFirestore();
    if (soundEffects.length === 0) {
      console.log('No sound effects to index. Exiting.');
      return;
    }

    // Initialize Algolia client
    const client = algoliasearch(algoliaAppId, algoliaAdminApiKey);
    const index = client.initIndex(algoliaIndexName);

    // Prepare data for Algolia by adding objectID
    const records = soundEffects.map((effect) => ({
      ...effect,
      objectID: effect.id, // Use existing ID as objectID
    }));

    // Clear existing objects in the index
    console.log(`Clearing existing objects from index: ${algoliaIndexName}...`);
    await index.clearObjects();
    console.log('Index cleared.');

    // Save the new objects to the index
    console.log(`Uploading ${records.length} records to Algolia...`);
    const { objectIDs } = await index.saveObjects(records);
    console.log(
      `Successfully uploaded ${objectIDs.length} records to index: ${algoliaIndexName}`
    );

    // Configure search facets (attributes for filtering)
    console.log('Configuring index settings...');
    await index.setSettings({
      // Attributes to use for searching
      searchableAttributes: [
        'name',
        'tags',
        'unordered(name)',
        'unordered(tags)',
      ],
      // Attributes for filtering (facets)
      attributesForFaceting: ['filterOnly(tone)'],
    });
    console.log('Index settings configured successfully.');
  } catch (error) {
    console.error('Error during Algolia indexing:', error);
    process.exit(1);
  }
}

indexData();
