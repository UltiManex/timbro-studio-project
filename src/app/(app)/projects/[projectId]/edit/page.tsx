
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import type { Project, SoundEffect, SoundEffectInstance, Tone } from '@/lib/types';
import { AVAILABLE_TONES, EDITOR_NUDGE_INCREMENT_MS } from '@/lib/constants';
import { Play, Pause, Rewind, FastForward, Save, Trash2, ChevronLeft, ChevronRight, Volume2, Settings2, Waves, ListFilter, Download, Loader2 } from 'lucide-react';
import { ToneIcon } from '@/components/icons';
import { Slider } from '@/components/ui/slider';
import { InstantSearch, SearchBox, Hits, Configure, useInstantSearch } from 'react-instantsearch-hooks-web';
import algoliasearch from 'algoliasearch/lite';
import { cn } from '@/lib/utils';
import { generateWaveform } from '@/lib/waveform';
import { getSoundEffects } from '@/lib/actions/sfx';
import { mixAudio } from '@/ai/flows/mix-audio';

const LOCAL_STORAGE_KEY = 'timbro-projects';

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const algoliaSearchApiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
const algoliaIndexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || ''; 

const isAlgoliaConfigured = algoliaAppId && algoliaSearchApiKey && algoliaIndexName;
const searchClient = isAlgoliaConfigured ? algoliasearch(algoliaAppId, algoliaSearchApiKey) : null;

// A more realistic approximation for transcript highlighting
const APPROX_WORDS_PER_SECOND = 2.5; // Corresponds to 150 WPM

interface AlgoliaSoundEffectHit extends SoundEffect {
  objectID: string;
  _highlightResult?: any;
}

interface SoundEffectHitComponentProps {
  hit: AlgoliaSoundEffectHit;
  onSelect: (effect: SoundEffect) => void;
  onPreview: (previewUrl: string, effectName: string) => void;
}


function SoundEffectHitItem({ hit, onSelect, onPreview }: SoundEffectHitComponentProps) {
  return (
    <div
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        "w-full justify-start text-left h-auto py-2 cursor-pointer"
      )}
      onClick={() => onSelect(hit)}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex-col">
          <span className="font-medium text-sm">{hit.name}</span>
          <div className="flex gap-1 mt-0.5">
            {hit.tone.map(t => <ToneIcon key={t} tone={t as Tone} className="h-3 w-3" />)}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onPreview(hit.previewUrl, hit.name); }}>
          <Volume2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
        </Button>
      </div>
    </div>
  );
}

function NoResultsBoundary({ children, fallback }: { children: React.ReactNode, fallback: React.ReactNode }) {
  const { results } = useInstantSearch();
  if (!results.__isArtificial && results.nbHits === 0) {
    return fallback;
  }
  return <>{children}</>;
}


export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [soundLibrary, setSoundLibrary] = useState<SoundEffect[]>([]);
  const [selectedEffectInstance, setSelectedEffectInstance] = useState<SoundEffectInstance | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [filterTone, setFilterTone] = useState<Tone | 'All'>('All');
  const [isExporting, setIsExporting] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);
  
  const audioDuration = project?.duration || 0; 
  const effects = project?.effects || [];

  const waveformRef = useRef<HTMLDivElement>(null);
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const playedEffectsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let foundProject: Project | null = null;
    
    // 1. Try to load from session storage first (for immediate navigation from dashboard)
    try {
        const sessionProjectRaw = sessionStorage.getItem(`timbro-active-project-${projectId}`);
        if (sessionProjectRaw) {
            foundProject = JSON.parse(sessionProjectRaw);
            // Clean up immediately after use
            sessionStorage.removeItem(`timbro-active-project-${projectId}`);
        }
    } catch(e) { console.error("Could not read project from session storage", e); }
    
    // 2. If not in session, fall back to local storage
    if (!foundProject) {
        try {
            const storedProjectsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
            const allProjects = storedProjectsRaw ? JSON.parse(storedProjectsRaw) : [];
            foundProject = allProjects.find((p: Project) => p.id === projectId) || null;
        } catch (error) {
            console.error("Failed to load project from localStorage:", error);
        }
    }

    if (foundProject) {
        // Now, check for the audio source (either the dataURI from session or the persistent URL)
        const audioSource = foundProject.audioDataUri || foundProject.audioUrl;
        
        if (!audioSource) {
            toast({
                title: "Audio Data Missing",
                description: "The audio for this project could not be found. Please return to the dashboard and try again.",
                variant: "destructive",
                duration: 10000,
            });
        }
        setProject(foundProject);
        if (audioSource) {
            generateWaveform(audioSource).then(setWaveform);
        }
    } else {
        toast({ title: "Project not found", variant: "destructive" });
        router.push('/dashboard');
    }

    // Fetch sound library from the server action
    const fetchLibrary = async () => {
        try {
            const effects = await getSoundEffects();
            setSoundLibrary(effects);
        } catch (error) {
            console.error("Failed to fetch sound effect library:", error);
            toast({
                title: "Could Not Load Library",
                description: "The sound effect library could not be loaded. Some features may not work correctly.",
                variant: "destructive",
            });
        }
    };
    fetchLibrary();
}, [projectId, router]);


  // Centralized function to update project state and save to localStorage
  const updateProject = (updatedProjectData: Partial<Project>) => {
    if (!project) return;
    
    // Create the updated project object for React state
    const updatedProjectForState = { ...project, ...updatedProjectData };
    setProject(updatedProjectForState);

    try {
      const storedProjectsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const allProjects = storedProjectsRaw ? JSON.parse(storedProjectsRaw) : [];
      const projectIndex = allProjects.findIndex((p: Project) => p.id === projectId);

      if (projectIndex !== -1) {
        // Create a version for localStorage that EXCLUDES audioDataUri
        const { audioDataUri, ...projectForStorage } = updatedProjectForState;
        allProjects[projectIndex] = projectForStorage;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allProjects));
      }
    } catch (error) {
      console.error("Failed to save project to localStorage:", error);
      toast({ title: "Error Saving Project", variant: "destructive" });
    }
  };

  const handlePlayPause = () => {
    if (mainAudioRef.current) {
      if (isPlaying) {
        mainAudioRef.current.pause();
      } else {
        mainAudioRef.current.play().catch(e => console.error("Error playing main audio:", e));
      }
    }
  };

  const handleSeek = (time: number) => {
    if (mainAudioRef.current) {
      mainAudioRef.current.currentTime = time;
      setCurrentTime(time);
      playedEffectsRef.current.clear(); // Reset played effects on seek
    }
  };
  
  const handleTimeUpdate = () => {
    if (!mainAudioRef.current || !project?.effects) return;

    const newTime = mainAudioRef.current.currentTime;
    setCurrentTime(newTime);
    
    // Play sound effects in real-time
    project.effects.forEach(effectInstance => {
      // Check if the effect should play and hasn't been played in this cycle
      if (
        !playedEffectsRef.current.has(effectInstance.id) &&
        newTime >= effectInstance.timestamp &&
        newTime < effectInstance.timestamp + 0.5 // A small window to trigger
      ) {
        const effectDetails = soundLibrary.find(e => e.id === effectInstance.effectId);
        if (effectDetails && effectDetails.previewUrl) {
          const sfx = new Audio(effectDetails.previewUrl);
          sfx.volume = effectInstance.volume ?? 1.0;
          sfx.play().catch(e => console.error("SFX playback error:", e));
          playedEffectsRef.current.add(effectInstance.id);
        }
      }
    });
  };

  const handlePreviewEffect = (previewUrl: string, effectName: string) => {
    if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
    }
    
    // Robustness check for the previewUrl
    if (!previewUrl || typeof previewUrl !== 'string' || previewUrl.trim() === '' || previewUrl.startsWith('#') || previewUrl === 'undefined') {
        console.warn(`Attempted to play preview with invalid URL: '${previewUrl}' for effect: '${effectName}'`);
        toast({
            title: "No Preview Available",
            description: `The preview for '${effectName}' is not set up correctly.`,
            variant: "destructive",
        });
        return;
    }

    if (previewAudioRef.current) {
        previewAudioRef.current.src = previewUrl;
        previewAudioRef.current.load();
        const playPromise = previewAudioRef.current.play();

        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error(`Error playing preview for "${effectName}" (URL: ${previewUrl}):`, error);
                if (previewAudioRef.current?.error) {
                    console.error('Audio Element Error Code:', previewAudioRef.current.error.code);
                    console.error('Audio Element Error Message:', previewAudioRef.current.error.message);
                }
                toast({
                    title: "Playback Error",
                    description: `Could not play '${effectName}'. The file might be corrupt or in an unsupported format.`,
                    variant: "destructive",
                });
            });
        }
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || audioDuration === 0) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const clickedTime = audioDuration * percentage;
    handleSeek(clickedTime);
    
    const markerHit = effects.find(ef => {
      const markerPos = (ef.timestamp / audioDuration) * rect.width;
      return Math.abs(clickX - markerPos) < 8; 
    });

    if (markerHit) {
      setSelectedEffectInstance(markerHit);
    } else {
      const newEffect = {
        id: `new_${Date.now()}`,
        effectId: '', // Awaiting selection
        timestamp: clickedTime,
        isUserAdded: true,
        volume: 1.0, 
      };
      updateProject({ effects: [...effects, newEffect] });
      setSelectedEffectInstance(newEffect);
      toast({ title: "New effect marker added", description: "Select a sound from the library to assign it." });
    }
  };
  
  const getHighlightedWordIndex = () => {
    if (!project?.transcript) return -1;
    const words = project.transcript.split(' ');
    const estimatedIndex = Math.floor(currentTime * APPROX_WORDS_PER_SECOND);
    // Ensure index doesn't go out of bounds
    if (estimatedIndex >= words.length) {
      return words.length - 1;
    }
    return estimatedIndex;
  };

  const updateSelectedEffect = (propsToUpdate: Partial<SoundEffectInstance>) => {
    if (!selectedEffectInstance) return;

    const updatedEffect = { ...selectedEffectInstance, ...propsToUpdate };
    setSelectedEffectInstance(updatedEffect);

    const newEffects = effects.map(ef => ef.id === updatedEffect.id ? updatedEffect : ef);
    updateProject({ effects: newEffects });
  };

  const handleNudge = (direction: 'left' | 'right') => {
    if (!selectedEffectInstance) return;
    const newTimestamp = selectedEffectInstance.timestamp + (direction === 'left' ? -EDITOR_NUDGE_INCREMENT_MS / 1000 : EDITOR_NUDGE_INCREMENT_MS / 1000);
    updateSelectedEffect({ timestamp: Math.max(0, Math.min(audioDuration, newTimestamp)) });
  };
  
  const handleVolumeChange = (volume: number) => {
    updateSelectedEffect({ volume });
  };

  const handleDeleteEffect = () => {
    if (!selectedEffectInstance) return;
    const newEffects = effects.filter(ef => ef.id !== selectedEffectInstance.id);
    updateProject({ effects: newEffects });
    setSelectedEffectInstance(null);
    toast({ title: "Effect removed" });
  };
  
  const handleSelectSoundForInstance = (effect: SoundEffect) => {
    console.log("handleSelectSoundForInstance called. Effect object:", effect);
    console.log("Current selected marker on timeline:", selectedEffectInstance);

    if (!selectedEffectInstance) {
        toast({ title: "No Marker Selected", description: "Click on the waveform to add a marker first.", variant: "destructive" });
        return;
    }
    
    const effectId = effect.id || (effect as any).objectID;

    if (!effectId) {
       console.error("The selected sound effect is missing an ID.", effect);
       toast({ title: "Error", description: "The selected sound effect is invalid and is missing an ID.", variant: "destructive" });
       return;
    }

    updateSelectedEffect({ effectId: effectId });
    toast({ title: `Assigned '${effect.name || "effect"}' to the marker.` });
  };
  
  const handleSaveProject = () => {
    if (!project) return;
    updateProject(project); // This just forces a save, though it happens automatically.
    toast({ title: "Project Saved!", description: "Your changes have been saved successfully." });
  };

  const handleExport = async () => {
    if (!project || !project.audioUrl) {
        toast({ title: "Cannot Export", description: "Project data is incomplete or the initial audio has not been uploaded yet.", variant: "destructive" });
        return;
    }
     if (!project.effects || project.effects.some(e => !e.effectId)) {
        toast({ title: "Cannot Export", description: "One or more effect markers on the timeline have not been assigned a sound. Please assign a sound to all markers before exporting.", variant: "destructive" });
        return;
    }


    setIsExporting(true);
    toast({ title: "Export Started", description: "Your audio is being mixed on our servers. This may take a few moments." });

    try {
        const result = await mixAudio({
            projectId: project.id,
            mainAudioUrl: project.audioUrl,
            effects: project.effects.map(({ id, isUserAdded, ...rest }) => rest),
        });

        if (result.finalAudioUrl) {
            updateProject({ status: 'Completed', finalAudioUrl: result.finalAudioUrl });
            toast({ title: "Export Complete!", description: "Your audio is ready. You will be redirected to the dashboard.", duration: 8000 });
            router.push('/dashboard');
        } else {
            throw new Error("The mixing process did not return a final URL.");
        }
    } catch (error: any) {
        console.error("Export failed:", error);
        toast({ 
            title: "Export Failed", 
            description: error.message || "An unexpected error occurred during mixing.", 
            variant: "destructive",
            duration: 10000,
        });
        updateProject({ status: 'Error' });
    } finally {
        setIsExporting(false);
    }
};

  // Set the audio source when the project data is available
  useEffect(() => {
    const audioSource = project?.audioDataUri || project?.audioUrl;
    if (audioSource && mainAudioRef.current) {
        if (mainAudioRef.current.src !== audioSource) {
            mainAudioRef.current.src = audioSource;
            mainAudioRef.current.load();
        }
    }
  }, [project?.audioDataUri, project?.audioUrl]);


  if (!project) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Loading project...</div>;
  }
  
  const currentEffectDetails = selectedEffectInstance ? soundLibrary.find(libSfx => libSfx.id === selectedEffectInstance.effectId) : null;
  const audioSource = project.audioDataUri || project.audioUrl;

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.28))] overflow-hidden">
      <audio 
        ref={mainAudioRef}
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => {
          setIsPlaying(true);
          playedEffectsRef.current.clear();
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onSeeked={() => playedEffectsRef.current.clear()}
        onLoadedMetadata={() => {
           if (mainAudioRef.current) {
             const newDuration = mainAudioRef.current.duration;
             if (isFinite(newDuration) && project.duration !== newDuration) {
               updateProject({ duration: newDuration });
             }
           }
        }}
        className="hidden"
       />
      <audio ref={previewAudioRef} className="hidden" />

      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div>
          <h1 className="text-xl font-semibold font-headline">{project.name}</h1>
          <p className="text-sm text-muted-foreground">Editing project...</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveProject}><Save className="mr-2 h-4 w-4" />Save Project</Button>
          <Button size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export Audio
          </Button>
        </div>
      </div>

      <div className="flex-1 grid md:grid-cols-3 gap-4 p-4 overflow-hidden">
        <div className="md:col-span-2 flex flex-col gap-4 overflow-hidden">
          <Card className="flex-shrink-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center"><Waves className="mr-2 h-5 w-5 text-primary"/>Waveform</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleSeek(Math.max(0, currentTime - 5))}><Rewind className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={handlePlayPause}>{isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</Button>
                <Button variant="ghost" size="icon" onClick={() => handleSeek(Math.min(audioDuration, currentTime + 5))}><FastForward className="h-4 w-4" /></Button>
                <div className="text-sm text-muted-foreground w-24 text-center">
                  {currentTime.toFixed(1)}s / {audioDuration.toFixed(1)}s
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={waveformRef} onClick={handleWaveformClick} className="h-32 bg-muted rounded-md relative cursor-crosshair flex items-center overflow-hidden" aria-label="Audio waveform, click to add or select effect">
                 <div className="flex items-end h-full w-full gap-px">
                    {waveform.length > 0 ? waveform.map((amp, i) => (
                      <div key={i} className="flex-grow bg-primary/50 rounded-full" style={{ height: `${amp * 100}%` }}></div>
                    )) : (
                       <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                         {audioSource ? 'Generating waveform...' : 'No audio loaded'}
                       </div>
                    )}
                </div>
                {/* Playhead */}
                {audioDuration > 0 && (
                  <div className="absolute top-0 bottom-0 bg-primary w-0.5" style={{ left: `${(currentTime / audioDuration) * 100}%` }}></div>
                )}
                {/* Effect Markers */}
                {effects.map(ef => {
                  const effectDetailsMarker = soundLibrary.find(libSfx => libSfx.id === ef.effectId);
                  const toneForIcon = ef.isUserAdded ? 'User' : (effectDetailsMarker?.tone[0] || project.selectedTone);
                  return (
                    <div 
                      key={ef.id} 
                      className={`absolute -top-1 transform -translate-x-1/2 p-1 rounded-full cursor-pointer transition-all
                        ${selectedEffectInstance?.id === ef.id ? 'bg-primary scale-125 z-10' : 'bg-accent hover:bg-primary/80'}`}
                      style={{ left: audioDuration > 0 ? `${(ef.timestamp / audioDuration) * 100}%` : '0%' }}
                      onClick={(e) => { e.stopPropagation(); setSelectedEffectInstance(ef); }}
                      title={effectDetailsMarker?.name || (ef.isUserAdded ? 'New Effect' : 'Unknown Effect')}
                    >
                      <ToneIcon tone={toneForIcon as Tone | 'User'} className="h-4 w-4 text-white" />
                    </div>
                  );
                })}
              </div>
              <Slider
                value={[currentTime]}
                max={audioDuration}
                step={0.1}
                onValueChange={(value) => handleSeek(value[0])}
                className="mt-2"
                aria-label="Audio playback position"
              />
            </CardContent>
          </Card>

          <Card className="flex-1 overflow-hidden">
            <CardHeader><CardTitle className="text-lg">Transcript</CardTitle></CardHeader>
            <CardContent className="h-full pb-6">
              <ScrollArea className="h-[calc(100%-0rem)] pr-4"> {/* Adjust height as needed */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {project.transcript?.split(' ').map((word, index) => (
                    <span key={index} className={index === getHighlightedWordIndex() ? 'bg-primary/30 rounded' : ''}>
                      {word}{' '}
                    </span>
                  ))}
                </p>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 flex flex-col gap-4 overflow-hidden">
          <Card className="flex-shrink-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Settings2 className="mr-2 h-5 w-5 text-primary"/>
                Inspector
              </CardTitle>
              <CardDescription>
                {selectedEffectInstance ? (currentEffectDetails?.name || (selectedEffectInstance.effectId ? 'Effect Details' : 'Add New Effect')) : 'Select an effect or click waveform to add.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedEffectInstance ? (
                <>
                  <p className="text-sm"><strong>Time:</strong> {selectedEffectInstance.timestamp.toFixed(2)}s</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleNudge('left')}><ChevronLeft className="h-4 w-4"/> Nudge Left</Button>
                    <Button variant="outline" size="sm" onClick={() => handleNudge('right')}>Nudge Right <ChevronRight className="h-4 w-4"/></Button>
                  </div>
                  <Label htmlFor="volume">Volume</Label>
                  <Slider 
                    id="volume" 
                    defaultValue={[selectedEffectInstance.volume !== undefined ? selectedEffectInstance.volume * 100 : 100]} 
                    max={100} step={1} 
                    className="my-1"
                    onValueChange={(val) => handleVolumeChange(val[0] / 100) }
                  />
                  {currentEffectDetails && (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handlePreviewEffect(currentEffectDetails.previewUrl, currentEffectDetails.name)}>
                        <Play className="mr-2 h-4 w-4"/> Preview Effect
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={handleDeleteEffect} className="w-full">
                    <Trash2 className="mr-2 h-4 w-4"/>Delete Effect
                  </Button>
                  
                  {/* Swap functionality */}
                  {currentEffectDetails && (
                     <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-1">Quick Swap:</p>
                        {soundLibrary.filter(sfx => sfx.id !== currentEffectDetails.id && sfx.tone.some(t => currentEffectDetails.tone.includes(t))).slice(0,2).map(swapSfx => (
                           <Button key={swapSfx.id} variant="outline" size="sm" className="w-full mb-1 text-xs" onClick={() => handleSelectSoundForInstance(swapSfx)}>
                             Swap to: {swapSfx.name}
                           </Button>
                        ))}
                     </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No effect selected.</p>
              )}
            </CardContent>
          </Card>
          
          {/* Sound Library with Algolia */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            {isAlgoliaConfigured && searchClient ? (
              <InstantSearch
                searchClient={searchClient}
                indexName={algoliaIndexName}
                insights={false} 
              >
                <CardHeader>
                  <CardTitle className="text-lg">Sound Library</CardTitle>
                  <CardDescription>Select a marker, then choose a sound.</CardDescription>
                  <div className="flex gap-2 pt-2">
                    <div className="relative flex-grow">
                      <SearchBox
                        placeholder="Search effects..."
                        classNames={{
                          root: 'relative',
                          form: 'h-full',
                          input: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-8', // Added pl-8 for icon
                          submitIcon: 'absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground',
                          resetIcon: 'absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer',
                          loadingIndicator: 'absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground',
                        }}
                      />
                    </div>
                    <Select value={filterTone} onValueChange={(value) => setFilterTone(value as Tone | 'All')}>
                      <SelectTrigger className="w-[150px]" aria-label="Filter by tone">
                         <ListFilter className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Filter by Tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Tones</SelectItem>
                        {AVAILABLE_TONES.map(tone => (
                          <SelectItem key={tone} value={tone}><ToneIcon tone={tone as Tone} className="mr-2 h-4 w-4 inline"/> {tone}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Configure filters={filterTone === 'All' ? undefined : `tone:"${filterTone}"`} />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto pb-6">
                  <ScrollArea className="h-full pr-2">
                    <ul className="space-y-1">
                      <NoResultsBoundary fallback={<p className="text-center text-sm text-muted-foreground p-4">No effects found.</p>}>
                        <Hits<AlgoliaSoundEffectHit>
                          hitComponent={(props) =>
                            <SoundEffectHitItem
                              hit={props.hit}
                              onSelect={handleSelectSoundForInstance}
                              onPreview={handlePreviewEffect}
                            />
                          }
                        />
                      </NoResultsBoundary>
                    </ul>
                  </ScrollArea>
                </CardContent>
              </InstantSearch>
            ) : (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <CardHeader>
                        <CardTitle>Sound Library Disabled</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">
                            Please set up an Algolia account and add your keys to the <code>.env</code> file to enable the sound library.
                        </p>
                        <p className="text-xs mt-2 text-muted-foreground">
                          You'll need <code>NEXT_PUBLIC_ALGOLIA_APP_ID</code>, <code>NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY</code>, and <code>NEXT_PUBLIC_ALGOLIA_INDEX_NAME</code>.
                        </p>
                        <p className="text-xs mt-2 text-muted-foreground">
                          After adding the keys, run `npm run algolia:index`.
                        </p>
                    </CardContent>
                </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
