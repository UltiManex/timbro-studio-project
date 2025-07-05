'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadAudioModal } from '@/components/modals/upload-audio-modal';
import type { Project } from '@/lib/types';
import { mockProjects } from '@/lib/mock-data';

export default function NewProjectPage() {
  const [isModalOpen, setIsModalOpen] = useState(true); // Open modal by default
  const router = useRouter();

  const handleProjectCreated = (project: Project) => {
    // In a real app, this would be a database write. Here, we'll add it to our mock array.
    mockProjects.unshift(project); // Add to the beginning of the array

    // We can also dispatch a custom event to notify other components (like the dashboard)
    // that a new project has been created, so they can update their state.
    // This avoids complex prop drilling for our prototype.
    const event = new CustomEvent('projectCreated', { detail: project });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    // If modal is closed without creating a project, redirect to dashboard
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
