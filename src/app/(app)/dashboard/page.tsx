
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/dashboard/project-card';
import { OnboardingModal } from '@/components/modals/onboarding-modal';
import type { Project, SoundEffectInstance } from '@/lib/types';
import { PlusCircle, LayoutGrid, List, Database } from 'lucide-react';
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
import { toast } from '@/hooks/use-toast';
import algoliasearch from 'algoliasearch/lite';

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
      console.log('DashboardPage: Read from localStorage:', storedProjectsRaw); // DEBUG LOG
      if (storedProjectsRaw) {
        const parsedProjects = JSON.parse(storedProjectsRaw);
        console.log('DashboardPage: Parsed projects:', parsedProjects); // DEBUG LOG
        setProjects(parsedProjects);
      } else {
        // First time load, seed with mock data from the file
        console.log('DashboardPage: No projects in localStorage, seeding with mock data.'); // DEBUG LOG
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
    setProjects(updatedProjects);
    try {
      console.log('DashboardPage: Updating projects in localStorage (e.g., on delete/update).'); // DEBUG LOG
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects));
    } catch (error) {
      console.error("Failed to update projects in localStorage:", error);
    }
  };
  
  const handleIndexAlgolia = async () => {
    setIsIndexing(true);
    toast({ title: 'Algolia Indexing Started', description: 'Populating the sound effect library...' });
  
    // WARNING: This requires exposing the Admin API key on the client, which is NOT SAFE FOR PRODUCTION.
    // This is acceptable only for this temporary, local-only solution.
    // In a real app, this would be a secure backend function.
    const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
    const algoliaAdminApiKey = process.env.NEXT_PUBLIC_ALGOLIA_ADMIN_API_KEY; // Corrected to use NEXT_PUBLIC_
    const algoliaIndexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME;
    
    if (!algoliaAppId || !algoliaAdminApiKey || !algoliaIndexName) {
        toast({ title: 'Algolia Keys Missing', description: 'Please add Algolia keys to your .env file.', variant: 'destructive' });
        setIsIndexing(false);
        return;
    }
    
    try {
      // Initialize the full client here, as we need admin rights for indexing.
      // This is different from the search-only client used in the editor.
      const client = algoliasearch(algoliaAppId, algoliaAdminApiKey);
      const index = client.initIndex(algoliaIndexName);
      
      const records = mockSoundEffectsLibrary.map((effect) => ({
          ...effect,
          objectID: effect.id,
      }));
  
      // 1. Clear the index
      // The `clearObjects` method returns a task object. We need to wait for the task to complete.
      await index.clearObjects().wait();
  
      // 2. Add new records
      // The `saveObjects` method also returns a task object.
      await index.saveObjects(records).wait();
  
      // 3. Set index settings
      // The `setSettings` method also returns a task object.
      await index.setSettings({
          searchableAttributes: ['name', 'tags', 'unordered(name)', 'unordered(tags)'],
          attributesForFaceting: ['filterOnly(tone)'],
      }).wait();
  
      toast({ title: 'Indexing Complete!', description: 'Your sound library is ready to be searched.' });
    } catch (error) {
        console.error('Error during client-side Algolia indexing:', error);
        toast({ title: 'Indexing Failed', description: 'Could not populate Algolia. Check console for details.', variant: 'destructive' });
    } finally {
        setIsIndexing(false);
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
          {/* Temporary button for Algolia indexing */}
          <Button variant="outline" onClick={handleIndexAlgolia} disabled={isIndexing}>
            <Database className="mr-2 h-4 w-4" />
            {isIndexing ? 'Indexing...' : 'Index Data in Algolia'}
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
