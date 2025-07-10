
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/dashboard/project-card';
import { OnboardingModal } from '@/components/modals/onboarding-modal';
import type { Project, SoundEffectInstance } from '@/lib/types';
import { PlusCircle, LayoutGrid, List, Database, Loader2 } from 'lucide-react';
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
import algoliasearch from 'algoliasearch';
import { toast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'timbro-projects';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [processingProjects, setProcessingProjects] = useState<Set<string>>(new Set());
  const [isIndexing, setIsIndexing] = useState(false);

  const searchParams = useSearchParams();

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

  const handleIndexData = async () => {
    setIsIndexing(true);
    toast({ title: 'Starting Algolia Indexing...', description: 'Please wait while we update the sound library.' });

    const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
    const adminKey = process.env.NEXT_PUBLIC_ALGOLIA_ADMIN_API_KEY;
    const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME;

    if (!appId || !adminKey || !indexName) {
      toast({
        title: 'Algolia Keys Missing',
        description: 'Please ensure NEXT_PUBLIC_ALGOLIA_APP_ID, NEXT_PUBLIC_ALGOLIA_ADMIN_API_KEY, and NEXT_PUBLIC_ALGOLIA_INDEX_NAME are in your .env file.',
        variant: 'destructive',
      });
      setIsIndexing(false);
      return;
    }

    try {
      const client = algoliasearch(appId, adminKey);
      const index = client.initIndex(indexName);

      const records = mockSoundEffectsLibrary.map((effect) => ({
        ...effect,
        objectID: effect.id,
      }));

      await index.clearObjects();
      await index.saveObjects(records);
      await index.setSettings({
        searchableAttributes: ['name', 'tags'],
        attributesForFaceting: ['filterOnly(tone)'],
      });

      toast({
        title: 'Indexing Complete!',
        description: `Successfully uploaded ${records.length} sound effects to Algolia.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error during Algolia indexing:', error);
      toast({
        title: 'Indexing Failed',
        description: 'There was an error connecting to Algolia. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsIndexing(false);
    }
  };

  // Helper function to update projects in both state and localStorage
  const updateProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects));
    } catch (error) {
      console.error("Failed to update projects in localStorage:", error);
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

        try {
          let aiSuggestions: SoundEffectInstance[] = [];
          let transcript = project.transcript || '';
          
          if (!project.audioDataUri) {
            throw new Error("Project is missing audio data for AI processing.");
          }

          const aiResponse = await suggestSoundEffects({
            audioDataUri: project.audioDataUri,
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

          // Update the project in the main state and localStorage
          const updatedProjects = projects.map(p =>
            p.id === project.id
              ? { ...p, status: 'Ready for Review', effects: aiSuggestions, transcript: transcript } // Keep data URI for editor
              : p
          );
          updateProjects(updatedProjects);

        } catch (e) {
          console.error(`AI processing failed for project ${project.id}:`, e);
          // Update the project to an 'Error' state
          const updatedProjects = projects.map(p =>
            p.id === project.id
              ? { ...p, status: 'Error', audioDataUri: undefined } // Clear data URI on error
              : p
          );
          updateProjects(updatedProjects);
        }
      });
    }
  }, [projects, processingProjects]);

  const handleDeleteProject = (projectId: string) => {
    const updatedProjectsList = projects.filter(p => p.id !== projectId);
    updateProjects(updatedProjectsList);
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
        <div className="flex items-center gap-2">
           <Button onClick={handleIndexData} disabled={isIndexing} variant="outline">
            {isIndexing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Database className="mr-2 h-5 w-5" />}
            Index Data in Algolia
          </Button>
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
            <ProjectCard key={project.id} project={project} onDelete={handleDeleteProject} />
          ))}
        </div>
      )}

      <OnboardingModal isOpen={isOnboardingModalOpen} onOpenChange={setIsOnboardingModalOpen} />
    </>
  );
}
