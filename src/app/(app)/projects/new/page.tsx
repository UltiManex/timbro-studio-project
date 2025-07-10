
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadAudioModal } from '@/components/modals/upload-audio-modal';
import type { Project } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid'; // To get file extension

const LOCAL_STORAGE_KEY = 'timbro-projects';

// Initialize the global store if it doesn't exist.
if (typeof window !== 'undefined' && !(window as any).newProjectAudioStore) {
  (window as any).newProjectAudioStore = {};
}

const getFileExtension = (filename: string) => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

export default function NewProjectPage() {
  const [isModalOpen, setIsModalOpen] = useState(true); // Open modal by default
  const router = useRouter();

  const handleProjectCreated = async (project: Omit<Project, 'audioUrl'>, audioFile: File) => {
     // --- FIX START: Save project to local storage BEFORE the upload attempt ---
    
    // 1. Get existing projects from storage
    const storedProjectsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const storedProjects = storedProjectsRaw ? JSON.parse(storedProjectsRaw) : [];
    
    // 2. Place the temporary audio data URI for immediate AI processing
    if (project.audioDataUri) {
       if (typeof window !== 'undefined') {
          (window as any).newProjectAudioStore[project.id] = project.audioDataUri;
       }
    }

    // 3. Create the project object for storage, initially without the final audioUrl
    const projectToStore: Project = {
      ...project,
      audioUrl: '', // This will be updated after upload
      audioDataUri: undefined, // Remove the temporary data URI before saving
    };

    // 4. Add new project to the start of the list and save immediately
    const updatedProjects = [projectToStore, ...storedProjects];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects));

    toast({
      title: "Project Created!",
      description: `'${project.name}' is now being processed. Check the dashboard for status.`,
    });

    // --- UPLOAD LOGIC (Now runs after saving, can fail gracefully) ---
    try {
      if (!storage) {
        throw new Error("Firebase Storage is not configured. Please check your .env file.");
      }
      
      const fileExtension = getFileExtension(audioFile.name) || 'mp3';
      
      // Upload the audio file to Firebase Storage with a standardized name
      const storageRef = ref(storage, `uploads/${project.id}/audio.${fileExtension}`);
      const uploadResult = await uploadBytes(storageRef, audioFile);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Now, find the project we just saved and update it with the final downloadURL
      const finalProjects = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]') as Project[];
      const projectIndex = finalProjects.findIndex(p => p.id === project.id);
      
      if (projectIndex !== -1) {
        finalProjects[projectIndex].audioUrl = downloadURL;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalProjects));
      }

    } catch (error: any) {
      console.error("Failed to upload file to Firebase:", error);
       toast({
        title: "Upload Failed",
        description: error.message || "Could not upload the audio file.",
        variant: "destructive"
      });
      // Also update the project status to 'Error' in local storage
      const finalProjects = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]') as Project[];
      const projectIndex = finalProjects.findIndex(p => p.id === project.id);
      if (projectIndex !== -1) {
        finalProjects[projectIndex].status = 'Error';
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalProjects));
      }
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
