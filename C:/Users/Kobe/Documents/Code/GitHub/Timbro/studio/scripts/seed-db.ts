// scripts/seed-db.ts
import { db } from '../src/lib/firebase-admin';
import { mockProjects } from '../src/lib/mock-data';
import type { Project } from '../src/lib/types';

async function seedFirestore() {
  console.log('Starting to seed Firestore...');
  const projectsCollection = db.collection('projects');

  try {
    // Basic check to see if we should seed. If there are any documents, we skip.
    const snapshot = await projectsCollection.limit(1).get();
    if (!snapshot.empty) {
      console.log('Projects collection already contains data. Skipping seed.');
      return;
    }

    console.log(`Seeding ${mockProjects.length} projects...`);
    const batch = db.batch();

    mockProjects.forEach((project: Project) => {
      const { id, ...projectData } = project;
      // In a real app, you might not want to use a predictable ID from mock data,
      // but for seeding, it's convenient. We'll use the mock ID as the document ID.
      const docRef = projectsCollection.doc(id);
      batch.set(docRef, projectData);
    });

    await batch.commit();
    console.log('Successfully seeded projects collection.');
  } catch (error) {
    console.error('Error seeding Firestore:', error);
    process.exit(1);
  }
}

seedFirestore();
