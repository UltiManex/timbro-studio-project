
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
import { mockProjects } from '@/lib/mock-data';
import { suggestSoundEffects } from '@/ai/flows/suggest-sound-effects';
import { toast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'timbro-projects';


export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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
  const updateProjects = (updatedProjects: Project[]): boolean => {
    try {
      const projectsToStore = updatedProjects.map(({ audioDataUri, ...rest }) => rest);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projectsToStore));
      setProjects(updatedProjects);
      return true;
    } catch (error) {
      console.error("Failed to update projects in localStorage:", error);
      toast({
        title: "Storage Error",
        description: "Could not save project changes. Your browser's storage might be full or permissions are denied.",
        variant: "destructive"
      });
      return false;
    }
  };

  const processingProjectIds = useMemo(() => {
    return projects
      .filter(p => p.status === 'Processing')
      .map(p => p.id)
      .join(',');
  }, [projects]);


  // This effect simulates a background worker queue for AI processing.
  // It now only triggers when the list of processing projects changes.
  useEffect(() => {
    const projectsToProcess = projects.filter(
      p => p.status === 'Processing'
    );

    if (projectsToProcess.length > 0) {
      projectsToProcess.forEach(async (project) => {
        
        const newProjectAudioStore = (window as any).newProjectAudioStore || {};
        const audioDataUri = newProjectAudioStore[project.id];
        
        try {
          let aiSuggestions: SoundEffectInstance[] = [];
          let transcript = project.transcript || '';
          
          if (!audioDataUri) {
             throw new Error(`Project ${project.id} is marked for processing, but its audio data is not available. Please re-upload.`);
          }

          const aiResponse = await suggestSoundEffects({
            audioDataUri: audioDataUri,
            selectedTone: project.selectedTone,
            audioDuration: project.duration || 60,
          });

          transcript = aiResponse.transcript;

          if (project.defaultEffectPlacement === 'ai-optimized') {
            aiSuggestions = (aiResponse.soundEffectSuggestions || []).map(suggestion => ({
              ...suggestion,
              id: `ai_inst_${Date.now()}_${Math.random()}`
            }));
          }
          
          const currentProjects = projectsRef.current;
          if (!currentProjects.some(p => p.id === project.id)) {
            console.log(`Project ${project.id} was deleted during processing. Aborting update.`);
            delete newProjectAudioStore[project.id];
            return;
          }

          const projectWithAudio = { ...project, status: 'Ready for Review' as const, effects: aiSuggestions, transcript: transcript, audioDataUri: audioDataUri };

          const updatedProjects = currentProjects.map(p =>
            p.id === project.id
              ? projectWithAudio
              : p
          );
          updateProjects(updatedProjects);
          
          delete newProjectAudioStore[project.id];

        } catch (e) {
          console.error(`AI processing failed for project ${project.id}:`, e);
          
           const currentProjects = projectsRef.current;
           if (!currentProjects.some(p => p.id === project.id)) {
             console.log(`Project ${project.id} was deleted during processing. Aborting error update.`);
            if (newProjectAudioStore[project.id]) {
                delete newProjectAudioStore[project.id];
            }
             return;
           }

          const updatedProjects = currentProjects.map(p =>
            p.id === project.id
              ? { ...p, status: 'Error' as const }
              : p
          );
          updateProjects(updatedProjects);
          if (newProjectAudioStore[project.id]) {
            delete newProjectAudioStore[project.id];
          }
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processingProjectIds]);

  const handleDeleteProject = (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;
    
    const updatedProjectsList = projects.filter(p => p.id !== projectId);
    const success = updateProjects(updatedProjectsList);

    if (success) {
      toast({
          title: "Project Deleted",
          description: `"${projectToDelete.name}" has been removed.`,
      });
    }
    // Failure toast is handled within updateProjects
  };

  const handleProjectClick = (project: Project) => {
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
        <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border rounded-lg bg-card">
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
