'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadAudioModal } from '@/components/modals/upload-audio-modal';
import type { Project } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'timbro-projects';

// This is a temporary, in-memory store for audio data of newly created projects.
// In a real app, this would be handled by a global state manager (like Zustand or Redux)
// or by uploading the file to a server immediately.
const newProjectAudioStore: { [projectId: string]: string } = {};

// We need to export this store so the dashboard can access it.
// This is not ideal but works for this level of app complexity.
// A better solution is a shared state management library (Zustand, Redux).
if (typeof window !== 'undefined') {
  (window as any).newProjectAudioStore = newProjectAudioStore;
}


export default function NewProjectPage() {
  const [isModalOpen, setIsModalOpen] = useState(true); // Open modal by default
  const router = useRouter();

  const handleProjectCreated = (project: Project) => {
    try {
      // Get existing projects from storage
      const storedProjectsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const storedProjects = storedProjectsRaw ? JSON.parse(storedProjectsRaw) : [];
      
      // Place the audio data in the temporary in-memory store
      // so the dashboard can pick it up for processing.
      if (project.audioDataUri) {
         if (typeof window !== 'undefined') {
            (window as any).newProjectAudioStore[project.id] = project.audioDataUri;
         }
      }

      // IMPORTANT: Do not save the large audioDataUri to localStorage to avoid exceeding storage limits.
      const { audioDataUri, ...projectToStore } = project;

      // Add new project (without audio data) to the start of the list
      const updatedProjects = [projectToStore, ...storedProjects];

      // Save back to storage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects));

       toast({
        title: "Project Created!",
        description: `'${project.name}' is now being processed. Check the dashboard for status.`,
      });

    } catch (error) {
      console.error("Failed to save project to localStorage", error);
       toast({
        title: "Error saving project",
        description: "Could not save the new project to your browser's storage.",
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
