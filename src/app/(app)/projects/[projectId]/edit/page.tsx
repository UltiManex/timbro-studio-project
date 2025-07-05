
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import type { Project, SoundEffect, SoundEffectInstance, Tone } from '@/lib/types';
import { AVAILABLE_TONES, EDITOR_NUDGE_INCREMENT_MS } from '@/lib/constants';
import { mockProjects, mockSoundEffectsLibrary } from '@/lib/mock-data';
import { Play, Pause, Rewind, FastForward, Save, Trash2, ChevronLeft, ChevronRight, Volume2, Settings2, Waves, ListFilter, Download, Loader2 } from 'lucide-react';
import { ToneIcon } from '@/components/icons';
import { Slider } from '@/components/ui/slider';
import { InstantSearch, SearchBox, Hits, Configure, Hit } from 'react-instantsearch-hooks-web';
import algoliasearch from 'algoliasearch/lite';

const LOCAL_STORAGE_KEY = 'timbro-projects';

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const algoliaSearchApiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
const algoliaIndexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'sound_effects';

const searchClient = algoliasearch(algoliaAppId, algoliaSearchApiKey);

interface AlgoliaSoundEffectHit extends SoundEffect {
  objectID: string;
  _highlightResult?: any;
}

interface SoundEffectHitComponentProps {
  hit: Hit<AlgoliaSoundEffectHit>;
  selectedEffectInstance: SoundEffectInstance | null;
  setSelectedEffectInstance: React.Dispatch<React.SetStateAction<SoundEffectInstance | null>>;
  onPreview: (previewUrl: string, effectName: string) => void;
}


function SoundEffectHitItem({ hit, selectedEffectInstance, setSelectedEffectInstance, onPreview }: SoundEffectHitComponentProps) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-left h-auto py-2"
      onClick={() => {
        if (selectedEffectInstance?.isUserAdded) {
          const updatedInstance = { ...selectedEffectInstance, effectId: hit.id };
          setSelectedEffectInstance(updatedInstance);
        } else {
          onPreview(hit.previewUrl, hit.name);
        }
      }}
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
    </Button>
  );
}


export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [effects, setEffects] = useState<SoundEffectInstance[]>([]);
  const [selectedEffectInstance, setSelectedEffectInstance] = useState<SoundEffectInstance | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [filterTone, setFilterTone] = useState<Tone | 'All'>('All');
  const [isExporting, setIsExporting] = useState(false);
  
  const audioDuration = project?.duration || 60; 

  const waveformRef = useRef<HTMLDivElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const storedProjectsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const allProjects = storedProjectsRaw ? JSON.parse(storedProjectsRaw) : [];
      
      const foundProject = allProjects.find((p: Project) => p.id === projectId);

      if (foundProject) {
        setProject(foundProject);
        setEffects(foundProject.effects?.map((ef: SoundEffectInstance) => ({ ...ef, isUserAdded: false })) || []);
      } else {
        toast({ title: "Project not found", variant: "destructive" });
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Failed to load project from localStorage:", error);
      toast({ title: "Error loading project", variant: "destructive" });
      router.push('/dashboard');
    }
  }, [projectId, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prevTime => {
          if (prevTime >= audioDuration) {
            setIsPlaying(false);
            return audioDuration;
          }
          return prevTime + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, audioDuration]);

  const handlePreviewEffect = (previewUrl: string, effectName: string) => {
    // 1. Stop any currently playing audio first.
    if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
    }

    // 2. Validate the new URL.
    if (!previewUrl || previewUrl.trim() === '' || previewUrl.startsWith('#') || previewUrl === 'undefined') {
        toast({
            title: "No Preview Available",
            description: `Preview for ${effectName} is not set up or URL is invalid.`,
            variant: "destructive",
        });
        return; // Exit early
    }

    // 3. If the URL is valid, try to play it.
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
                    description: `Could not play ${effectName}. Check console.`,
                    variant: "destructive",
                });
            });
        }
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const clickedTime = audioDuration * percentage;
    
    const markerHit = effects.find(ef => {
      const markerPos = (ef.timestamp / audioDuration) * rect.width;
      return Math.abs(clickX - markerPos) < 8; 
    });

    if (markerHit) {
      setSelectedEffectInstance(markerHit);
    } else {
      setSelectedEffectInstance({
        id: `new_${Date.now()}`,
        effectId: '', 
        timestamp: clickedTime,
        isUserAdded: true,
        volume: 1.0, 
      });
    }
  };
  
  const getHighlightedWordIndex = () => {
    if (!project?.transcript) return -1;
    const words = project.transcript.split(' ');
    const wordsPerSecond = words.length / audioDuration;
    return Math.floor(currentTime * wordsPerSecond);
  };

  const handleNudge = (direction: 'left' | 'right') => {
    if (!selectedEffectInstance) return;
    const newTimestamp = selectedEffectInstance.timestamp + (direction === 'left' ? -EDITOR_NUDGE_INCREMENT_MS / 1000 : EDITOR_NUDGE_INCREMENT_MS / 1000);
    const updatedTimestamp = Math.max(0, Math.min(audioDuration, newTimestamp));
    
    const updatedEffect = { ...selectedEffectInstance, timestamp: updatedTimestamp };
    setSelectedEffectInstance(updatedEffect);
    setEffects(effects.map(ef => ef.id === updatedEffect.id ? updatedEffect : ef));
  };

  const handleDeleteEffect = () => {
    if (!selectedEffectInstance) return;
    setEffects(effects.filter(ef => ef.id !== selectedEffectInstance.id));
    setSelectedEffectInstance(null);
    toast({ title: "Effect removed" });
  };
  
  const handleAddOrUpdateEffect = (effectIdToUse?: string) => {
    if (!selectedEffectInstance) return;
    
    let finalEffectId = selectedEffectInstance.effectId;
    if (selectedEffectInstance.isUserAdded && effectIdToUse) { 
      finalEffectId = effectIdToUse;
    } else if (!selectedEffectInstance.isUserAdded && effectIdToUse) { 
      finalEffectId = effectIdToUse;
    }
    
    if (!finalEffectId && selectedEffectInstance.isUserAdded) { 
        toast({title: "No Sound Effect Selected", description: "Please choose a sound effect from the library.", variant: "destructive"});
        return;
    }
    
    const newEffect = { ...selectedEffectInstance, effectId: finalEffectId };
    
    if (effects.find(ef => ef.id === newEffect.id)) {
      setEffects(effects.map(ef => ef.id === newEffect.id ? newEffect : ef));
    } else {
      setEffects([...effects, newEffect]);
    }
    toast({ title: selectedEffectInstance.isUserAdded && !effects.find(ef => ef.id === newEffect.id) ? "Effect Added" : "Effect Updated" });
    
    if (selectedEffectInstance.isUserAdded && !effects.find(ef => ef.id === newEffect.id)) { 
      setSelectedEffectInstance(null); 
    } else { 
      setSelectedEffectInstance(newEffect); 
    }
  };
  
  const handleExport = async () => {
    setIsExporting(true);
    toast({ title: "Export Started", description: "Your audio is being mixed. You'll be notified upon completion." });
    await new Promise(resolve => setTimeout(resolve, 5000)); 
    setProject(prev => prev ? ({...prev, status: 'Completed', finalAudioUrl: '#mock-download-link' }) : null); 
    setIsExporting(false);
    toast({ title: "Export Complete!", description: "Your audio is ready for download from the dashboard." });
    router.push('/dashboard');
  };

  if (!project) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Loading project...</div>;
  }
  
  const currentEffectDetails = selectedEffectInstance ? mockSoundEffectsLibrary.find(libSfx => libSfx.id === selectedEffectInstance.effectId) : null;

  if (!algoliaAppId || !algoliaSearchApiKey) {
     return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.28))] p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>Algolia Configuration Missing</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Please ensure <code>NEXT_PUBLIC_ALGOLIA_APP_ID</code> and <code>NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY</code> are set in your <code>.env</code> file.
                    </p>
                </CardContent>
            </Card>
        </div>
     );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.28))] overflow-hidden">
      {/* 
        The audio element is hidden. It's controlled programmatically.
        We only need one instance of it.
      */}
      <audio ref={previewAudioRef} className="hidden" />
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div>
          <h1 className="text-xl font-semibold font-headline">{project.name}</h1>
          <p className="text-sm text-muted-foreground">Editing project...</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Save className="mr-2 h-4 w-4" />Save Draft</Button>
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
                <Button variant="ghost" size="icon" onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}><Rewind className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</Button>
                <Button variant="ghost" size="icon" onClick={() => setCurrentTime(Math.min(audioDuration, currentTime + 5))}><FastForward className="h-4 w-4" /></Button>
                <div className="text-sm text-muted-foreground w-20 text-center">
                  {currentTime.toFixed(1)}s / {audioDuration.toFixed(1)}s
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={waveformRef} onClick={handleWaveformClick} className="h-32 bg-muted rounded-md relative cursor-crosshair flex items-center" aria-label="Audio waveform, click to add or select effect">
                {/* This is a placeholder for waveform visualization */}
                {Array.from({ length: 50 }).map((_, i) => (
                  <div key={i} className="w-1 bg-primary/30 rounded-full" style={{ height: `${Math.random() * 80 + 10}%`, marginRight: '2px' }}></div>
                ))}
                {/* Playhead */}
                <div className="absolute top-0 bottom-0 bg-primary w-0.5" style={{ left: `${(currentTime / audioDuration) * 100}%` }}></div>
                {/* Effect Markers */}
                {effects.map(ef => {
                  const effectDetailsMarker = mockSoundEffectsLibrary.find(libSfx => libSfx.id === ef.effectId);
                  const toneForIcon = ef.isUserAdded ? 'User' : (effectDetailsMarker?.tone[0] || project.selectedTone);
                  return (
                    <div 
                      key={ef.id} 
                      className={`absolute -top-1 transform -translate-x-1/2 p-1 rounded-full cursor-pointer transition-all
                        ${selectedEffectInstance?.id === ef.id ? 'bg-primary scale-125 z-10' : 'bg-accent hover:bg-primary/80'}`}
                      style={{ left: `${(ef.timestamp / audioDuration) * 100}%` }}
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
                onValueChange={(value) => setCurrentTime(value[0])}
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
                {selectedEffectInstance ? (currentEffectDetails?.name || (selectedEffectInstance.isUserAdded ? 'Add New Effect' : 'Effect Details')) : 'Select an effect or click waveform to add.'}
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
                    onValueChange={(val) => {
                       // Debounce or update on drag end for performance if needed
                       const updatedEffect = { ...selectedEffectInstance, volume: val[0] / 100 };
                       setSelectedEffectInstance(updatedEffect);
                       // Update the main effects array
                       setEffects(effects.map(ef => ef.id === updatedEffect.id ? updatedEffect : ef));
                    }}
                  />
                  {currentEffectDetails && ( // Only show if it's an existing effect from library
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handlePreviewEffect(currentEffectDetails.previewUrl, currentEffectDetails.name)}>
                        <Play className="mr-2 h-4 w-4"/> Preview Effect
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={handleDeleteEffect} className="w-full">
                    <Trash2 className="mr-2 h-4 w-4"/>Delete Effect
                  </Button>
                  {selectedEffectInstance.isUserAdded && 
                    <Button size="sm" onClick={() => handleAddOrUpdateEffect()} className="w-full" disabled={!selectedEffectInstance.effectId}>
                      Add Selected Effect
                    </Button>
                  }
                  {/* Swap functionality example, could be more sophisticated */}
                  {!selectedEffectInstance.isUserAdded && currentEffectDetails && (
                     <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-1">Swap Effect:</p>
                        {mockSoundEffectsLibrary.filter(sfx => sfx.id !== currentEffectDetails.id && sfx.tone.some(t => currentEffectDetails.tone.includes(t))).slice(0,2).map(swapSfx => (
                           <Button key={swapSfx.id} variant="outline" size="sm" className="w-full mb-1 text-xs" onClick={() => handleAddOrUpdateEffect(swapSfx.id)}>
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
          <InstantSearch
            searchClient={searchClient}
            indexName={algoliaIndexName}
            insights={false} // Consider enabling insights in production if you use Algolia analytics
          >
            <Card className="flex-1 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Sound Library</CardTitle>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-grow">
                    <SearchBox
                      placeholder="Search effects..."
                      classNames={{
                        root: 'relative',
                        form: 'h-full',
                        input: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-8', // Added pl-8 for icon
                        submitIcon: 'absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground',
                        resetIcon: 'absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer',
                        loadingIndicator: 'absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground', // Example
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
              <CardContent className="h-full pb-6">
                <ScrollArea className="h-[calc(100%-2rem)] pr-2"> {/* Adjust height based on header/footer */}
                  <ul className="space-y-1">
                    <Hits<AlgoliaSoundEffectHit> 
                      hitComponent={(props) => 
                        <SoundEffectHitItem 
                          {...props} 
                          selectedEffectInstance={selectedEffectInstance} 
                          setSelectedEffectInstance={setSelectedEffectInstance}
                          onPreview={handlePreviewEffect}
                        />
                      } 
                    />
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </InstantSearch>
        </div>
      </div>
    </div>
  );
}

    