
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadAudioModal } from '@/components/modals/upload-audio-modal';
import type { Project } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const LOCAL_STORAGE_KEY = 'timbro-projects';

// Initialize the global store if it doesn't exist.
if (typeof window !== 'undefined' && !(window as any).newProjectAudioStore) {
  (window as any).newProjectAudioStore = {};
}

export default function NewProjectPage() {
  const [isModalOpen, setIsModalOpen] = useState(true); // Open modal by default
  const router = useRouter();

  const handleProjectCreated = async (project: Project, audioFile: File) => {
    try {
      if (!storage) {
        throw new Error("Firebase Storage is not configured. Please check your .env.local file.");
      }
      // 1. Upload the audio file to Firebase Storage
      const storageRef = ref(storage, `uploads/${project.id}/${audioFile.name}`);
      await uploadBytes(storageRef, audioFile);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. Get existing projects from storage
      const storedProjectsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const storedProjects = storedProjectsRaw ? JSON.parse(storedProjectsRaw) : [];
      
      // 3. Place the temporary audio data URI for immediate processing
      if (project.audioDataUri) {
         if (typeof window !== 'undefined') {
            (window as any).newProjectAudioStore[project.id] = project.audioDataUri;
         }
      }

      // 4. Create the final project object for storage
      const projectToStore: Project = {
        ...project,
        audioUrl: downloadURL, // Add the permanent URL
        audioDataUri: undefined, // Remove the temporary data URI
      };

      // Add new project to the start of the list
      const updatedProjects = [projectToStore, ...storedProjects];

      // Save back to storage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects));

       toast({
        title: "Project Created!",
        description: `'${project.name}' is now being processed. Check the dashboard for status.`,
      });

    } catch (error: any) {
      console.error("Failed to create project:", error);
       toast({
        title: "Error creating project",
        description: error.message || "Could not save the new project.",
        variant: "destructive"
      });
    }
    
    // Trigger navigation by closing the modal
    setIsModalOpen(false);
  };

  useEffect(() => {
    // If modal is closed, it means we either created a project or cancelled.
    // In either case, we should redirect to the dashboard.
    if (!isModalOpen) {
      router.replace('/dashboard');
    }
  }, [isModalOpen, router]);

  return (
    // The page content itself can be minimal as the modal takes over.
    // You might want a loading state or some placeholder content here.
    <div className="flex flex-1 items-center justify-center">
      <UploadAudioModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onProjectCreated={handleProjectCreated} 
      />
      {/* Fallback content if modal isn't fully covering or for screen readers */}
      <p className="sr-only">Create a new project by uploading your audio file.</p>
    </div>
  );
}
