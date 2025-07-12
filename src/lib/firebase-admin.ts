// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// Ensure you have a service account key file and the GOOGLE_APPLICATION_CREDENTIALS
// environment variable is set. For App Hosting, this is often handled automatically.
// If running locally, you might need to set it up manually.

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // The credential can be automatically discovered from the environment.
      // Alternatively, you can explicitly provide it:
      // credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
