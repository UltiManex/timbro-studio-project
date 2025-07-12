
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/dashboard/project-card';
import { OnboardingModal } from '@/components/modals/onboarding-modal';
import type { Project, SoundEffectInstance } from '@/lib/types';
import { PlusCircle, LayoutGrid, List } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { mockProjects, mockSoundEffectsLibrary } from '@/lib/mock-data';
import { suggestSoundEffects } from '@/ai/flows/suggest-sound-effects';

const LOCAL_STORAGE_KEY = 'timbro-projects';


export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [processingProjects, setProcessingProjects] = useState<Set<string>>(new Set());
  
  // Use a ref to hold the latest projects array to prevent stale closures in useEffect
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const searchParams = useSearchParams();
  const router = useRouter();

  // Load projects from localStorage on initial render
  useEffect(() => {
    try {
      const storedProjectsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedProjectsRaw) {
        const parsedProjects = JSON.parse(storedProjectsRaw);
        setProjects(parsedProjects);
      } else {
        // First time load, seed with mock data from the file
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockProjects));
        setProjects(mockProjects);
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      // Fallback to mock projects if localStorage is unavailable
      setProjects(mockProjects);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get('onboarding') === 'true') {
      setIsOnboardingModalOpen(true);
    }
  }, [searchParams]);

  // Helper function to update projects in both state and localStorage
  const updateProjects = (updatedProjects: Project[]) => {
    // First, update the React state with the full project data (including audioDataUri if present)
    setProjects(updatedProjects);
    try {
      // Then, create a version for localStorage that EXCLUDES audioDataUri
      const projectsToStore = updatedProjects.map(({ audioDataUri, ...rest }) => rest);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projectsToStore));
    } catch (error)      console.error("Failed to update projects in localStorage:", error);
    }
  };
  
  // This effect simulates a background worker queue for AI processing.
  useEffect(() => {
    const projectsToProcess = projects.filter(
      p => p.status === 'Processing' && !processingProjects.has(p.id)
    );

    if (projectsToProcess.length > 0) {
      projectsToProcess.forEach(async (project) => {
        // Flag this project as being processed to avoid duplicate runs
        setProcessingProjects(prev => new Set(prev).add(project.id));
        
        // Retrieve the audio data URI from the global in-memory store
        const newProjectAudioStore = (window as any).newProjectAudioStore || {};
        const audioDataUri = newProjectAudioStore[project.id];
        
        try {
          let aiSuggestions: SoundEffectInstance[] = [];
          let transcript = project.transcript || '';
          
          if (!audioDataUri) {
             // If data is not found, mark as error. This can happen on page reload.
             throw new Error(`Project ${project.id} is marked for processing, but its audio data is not available. Please re-upload.`);
          }

          const aiResponse = await suggestSoundEffects({
            audioDataUri: audioDataUri,
            selectedTone: project.selectedTone,
            availableEffects: mockSoundEffectsLibrary.map(({ previewUrl, ...rest }) => rest),
            audioDuration: project.duration || 60,
          });

          transcript = aiResponse.transcript;

          if (project.defaultEffectPlacement === 'ai-optimized') {
            aiSuggestions = (aiResponse.soundEffectSuggestions || []).map(suggestion => ({
              ...suggestion,
              id: `ai_inst_${Date.now()}_${Math.random()}`
            }));
          }
          
          // Before updating state, check if the project still exists (wasn't deleted while processing)
          const currentProjects = projectsRef.current;
          if (!currentProjects.some(p => p.id === project.id)) {
            console.log(`Project ${project.id} was deleted during processing. Aborting update.`);
            // Clean up the in-memory store anyway
            delete newProjectAudioStore[project.id];
            return;
          }

          // Create a new version of the project that includes the audioDataUri for the editor
          const projectWithAudio = { ...project, status: 'Ready for Review' as const, effects: aiSuggestions, transcript: transcript, audioDataUri: audioDataUri };

          // Update the project in the main state and localStorage
          const updatedProjects = currentProjects.map(p =>
            p.id === project.id
              ? projectWithAudio
              : p
          );
          updateProjects(updatedProjects);
          
          // Clean up the in-memory store
          delete newProjectAudioStore[project.id];

        } catch (e) {
          console.error(`AI processing failed for project ${project.id}:`, e);
          
           // Before updating state, check if the project still exists
           const currentProjects = projectsRef.current;
           if (!currentProjects.some(p => p.id === project.id)) {
             console.log(`Project ${project.id} was deleted during processing. Aborting error update.`);
             // Clean up the in-memory store anyway
            if (newProjectAudioStore[project.id]) {
                delete newProjectAudioStore[project.id];
            }
             return;
           }

          // Update the project to an 'Error' state
          const updatedProjects = currentProjects.map(p =>
            p.id === project.id
              ? { ...p, status: 'Error' as const }
              : p
          );
          updateProjects(updatedProjects);
           // Clean up the in-memory store
          if (newProjectAudioStore[project.id]) {
            delete newProjectAudioStore[project.id];
          }
        } finally {
            // Unflag the project from being processed regardless of outcome
            setProcessingProjects(prev => {
                const newSet = new Set(prev);
                newSet.delete(project.id);
                return newSet;
            });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const handleDeleteProject = (projectId: string) => {
    // Stop this project from being processed if it's in the queue
    setProcessingProjects(prev => {
      const newSet = new Set(prev);
      newSet.delete(projectId);
      return newSet;
    });
    
    // Remove from the main projects list and update localStorage
    const updatedProjectsList = projects.filter(p => p.id !== projectId);
    updateProjects(updatedProjectsList);
    // Add toast notification here
  };

  const handleProjectClick = (project: Project) => {
    // When a project card is clicked, we store the full project object
    // (including the potentially available audioDataUri from the state)
    // in session storage before navigating. The editor page will then
    // prioritize loading from session storage.
    try {
      sessionStorage.setItem(`timbro-active-project-${project.id}`, JSON.stringify(project));
    } catch (e) {
      console.error("Could not save project to session storage", e);
    }
    router.push(`/projects/${project.id}/edit`);
  };

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.audioFileName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
          <p className="text-muted-foreground">Manage your audio projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/projects/new">
              <PlusCircle className="mr-2 h-5 w-5" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
        <Input 
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Sort By</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort Projects</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Date Created (Newest)</DropdownMenuItem>
              <DropdownMenuItem>Date Created (Oldest)</DropdownMenuItem>
              <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
              <DropdownMenuItem>Status</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            <span className="sr-only">Toggle view mode</span>
          </Button>
        </div>
      </div>

      {filteredProjects.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold">No projects found for "{searchTerm}"</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or create a new project.</p>
        </div>
      )}

      {filteredProjects.length === 0 && !searchTerm && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <h3 className="text-xl font-semibold">No Projects Yet</h3>
          <p className="text-muted-foreground mt-2">Get started by creating your first audio project.</p>
          <Button asChild className="mt-4">
            <Link href="/projects/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Project
            </Link>
          </Button>
        </div>
      )}
      
      {filteredProjects.length > 0 && (
         <div className={cn(
            "gap-6",
            viewMode === 'grid' ? "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col"
          )}>
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} onDelete={handleDeleteProject} onProjectClick={handleProjectClick}/>
          ))}
        </div>
      )}

      <OnboardingModal isOpen={isOnboardingModalOpen} onOpenChange={setIsOnboardingModalOpen} />
    </>
  );
}
