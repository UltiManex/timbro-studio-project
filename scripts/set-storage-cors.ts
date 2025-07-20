
// scripts/set-storage-cors.ts
import { Storage } from '@google-cloud/storage';
import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env file
config();

async function setCorsConfiguration() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId || !bucketName) {
    console.error(
      'Firebase Project ID or Storage Bucket is not set. Please check your .env file.'
    );
    process.exit(1);
  }

  // Path to your cors.json file
  const corsConfigurationPath = path.join(__dirname, '..', 'cors.json');

  if (!fs.existsSync(corsConfigurationPath)) {
    console.error(`cors.json file not found at ${corsConfigurationPath}`);
    process.exit(1);
  }

  // Read the CORS configuration from the file
  const corsConfiguration = JSON.parse(fs.readFileSync(corsConfigurationPath, 'utf8'));

  // Creates a client
  const storage = new Storage({
    projectId: projectId,
  });

  try {
    // Sets the CORS configuration for the bucket
    await storage.bucket(bucketName).setCorsConfiguration(corsConfiguration);

    console.log(`CORS configuration updated for bucket ${bucketName}`);
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
    process.exit(1);
  }
}

setCorsConfiguration();
