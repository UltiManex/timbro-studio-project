
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/dashboard/project-card';
import { OnboardingModal } from '@/components/modals/onboarding-modal';
import type { Project } from '@/lib/types';
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
import type { SoundEffectInstance } from '@/lib/types';


export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [processingProjects, setProcessingProjects] = useState<Set<string>>(new Set());

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('onboarding') === 'true') {
      setIsOnboardingModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleProjectCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      setProjects(prevProjects => [customEvent.detail, ...prevProjects]);
    };

    window.addEventListener('projectCreated', handleProjectCreated);

    return () => {
      window.removeEventListener('projectCreated', handleProjectCreated);
    };
  }, []);
  
  // This effect simulates a background worker queue for AI processing.
  useEffect(() => {
    const projectsToProcess = projects.filter(
      p => p.status === 'Processing' && !processingProjects.has(p.id)
    );

    if (projectsToProcess.length > 0) {
      projectsToProcess.forEach(async (project) => {
        // Flag this project as being processed to avoid duplicate runs
        setProcessingProjects(prev => new Set(prev).add(project.id));

        try {
          let aiSuggestions: SoundEffectInstance[] = [];
          
          if (project.defaultEffectPlacement === 'ai-optimized') {
            const aiResponse = await suggestSoundEffects({
              audioTranscription: project.transcript || '',
              selectedTone: project.selectedTone,
              availableEffects: mockSoundEffectsLibrary.map(({ previewUrl, ...rest }) => rest),
              audioDuration: project.duration || 60,
            });
            aiSuggestions = aiResponse.soundEffectSuggestions.map(suggestion => ({
              ...suggestion,
              id: `ai_inst_${Date.now()}_${Math.random()}`
            }));
          }

          // Update the project in the main state
          setProjects(prevProjects => prevProjects.map(p =>
            p.id === project.id
              ? { ...p, status: 'Ready for Review', effects: aiSuggestions }
              : p
          ));

        } catch (e) {
          console.error(`AI processing failed for project ${project.id}:`, e);
          // Update the project to an 'Error' state
          setProjects(prevProjects => prevProjects.map(p =>
            p.id === project.id
              ? { ...p, status: 'Error' }
              : p
          ));
        }
      });
    }
  }, [projects, processingProjects]);

  const handleDeleteProject = (projectId: string) => {
    setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
    // Add toast notification here
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
        <Button asChild>
          <Link href="/projects/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            New Project
          </Link>
        </Button>
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
            <ProjectCard key={project.id} project={project} onDelete={handleDeleteProject} />
          ))}
        </div>
      )}

      <OnboardingModal isOpen={isOnboardingModalOpen} onOpenChange={setIsOnboardingModalOpen} />
    </>
  );
}
