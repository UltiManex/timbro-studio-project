'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter }sfrom 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { mockProjects } from '@/app/(app)/dashboard/page'; // Using mock data for now
import type { Project, SoundEffect, SoundEffectInstance, Tone } from '@/lib/types';
import { AVAILABLE_TONES, EDITOR_NUDGE_INCREMENT_MS } from '@/lib/constants';
import { Play, Pause, Rewind, FastForward, Save, Upload, Trash2, Search, ChevronLeft, ChevronRight, Volume2, Settings2, Waves, ListFilter, Download } from 'lucide-react';
import { ToneIcon } from '@/components/icons';
import { Slider } from '@/components/ui/slider';

// Mock sound effect library
const mockSoundEffectsLibrary: SoundEffect[] = [
  { id: 'sfx_001', name: 'Comical Boing', tags: ['boing', 'jump', 'funny'], tone: ['Comedic'], previewUrl: '#' },
  { id: 'sfx_002', name: 'Dramatic Swell', tags: ['swell', 'tension', 'reveal'], tone: ['Dramatic', 'Suspenseful'], previewUrl: '#' },
  { id: 'sfx_003', name: 'Suspenseful Drone', tags: ['drone', 'creepy', 'tense'], tone: ['Suspenseful'], previewUrl: '#' },
  { id: 'sfx_004', name: 'Uplifting Chime', tags: ['chime', 'positive', 'success'], tone: ['Inspirational'], previewUrl: '#' },
  { id: 'sfx_005', name: 'Sad Trombone', tags: ['fail', 'wah-wah', 'funny'], tone: ['Comedic'], previewUrl: '#' },
  { id: 'sfx_006', name: 'Heartbeat', tags: ['heart', 'pulse', 'tense'], tone: ['Suspenseful', 'Dramatic'], previewUrl: '#' },
  { id: 'sfx_007', name: 'Record Scratch', tags: ['stop', 'interrupt', 'funny'], tone: ['Comedic'], previewUrl: '#' },
  { id: 'sfx_008', name: 'Inspiring Piano Chord', tags: ['piano', 'hopeful', 'positive'], tone: ['Inspirational'], previewUrl: '#' },
];

// Mock AI suggestions
const mockAISuggestions: SoundEffectInstance[] = [
  { id: 'ai_inst_1', effectId: 'sfx_001', timestamp: 5, volume: 0.8 }, // 5 seconds
  { id: 'ai_inst_2', effectId: 'sfx_002', timestamp: 12.5, volume: 1.0 }, // 12.5 seconds
  { id: 'ai_inst_3', effectId: 'sfx_006', timestamp: 22, volume: 0.7 }, // 22 seconds
];

const mockTranscript = "Welcome to the Timbro podcast editor. In this episode, we'll discuss the future of AI in audio production. (Funny moment here!) It's a rapidly evolving field, with new tools and techniques emerging constantly. (Dramatic reveal here!) The potential for creators is immense, empowering them to achieve professional-quality results with greater ease. But with great power comes great responsibility. (Suspense builds...) We must ensure these tools are used ethically and to enhance creativity, not replace it. (Uplifting conclusion starts) Ultimately, Timbro aims to be your creative co-pilot on this exciting journey.";

export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [effects, setEffects] = useState<SoundEffectInstance[]>([]);
  const [selectedEffectInstance, setSelectedEffectInstance] = useState<SoundEffectInstance | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTone, setFilterTone] = useState<Tone | 'All'>('All');
  const [isExporting, setIsExporting] = useState(false);
  
  const audioDuration = project?.duration || 60; // Default to 60s if no duration

  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const foundProject = mockProjects.find(p => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
      // Simulate loading AI suggestions after a short delay
      setTimeout(() => {
        setEffects(mockAISuggestions.map(sfx => ({...sfx, isUserAdded: false})));
      }, 500);
    } else {
      toast({ title: "Project not found", variant: "destructive" });
      router.push('/dashboard');
    }
  }, [projectId, router]);

  // Simulate audio playback
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

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const clickedTime = audioDuration * percentage;
    
    // Check if clicked on an existing marker
    const markerHit = effects.find(ef => {
      const markerPos = (ef.timestamp / audioDuration) * rect.width;
      return Math.abs(clickX - markerPos) < 8; // 8px hit radius
    });

    if (markerHit) {
      setSelectedEffectInstance(markerHit);
    } else {
      // Add new effect mode
      setSelectedEffectInstance({
        id: `new_${Date.now()}`,
        effectId: '', // User will pick this
        timestamp: clickedTime,
        isUserAdded: true,
      });
    }
  };
  
  const getHighlightedWordIndex = () => {
    // This is a very simplified mock. Real implementation needs word timestamps.
    const words = mockTranscript.split(' ');
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
  
  const handleAddOrUpdateEffect = (effectId?: string) => {
    if (!selectedEffectInstance) return;
    
    let finalEffectId = selectedEffectInstance.effectId;
    if (selectedEffectInstance.isUserAdded && effectId) { // For new effects being added
      finalEffectId = effectId;
    } else if (!selectedEffectInstance.isUserAdded && effectId) { // For swapping existing effects
      finalEffectId = effectId;
    }
    
    if (!finalEffectId) {
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
    // Keep inspector open for existing effects, close for newly added one (or based on UX preference)
    if (selectedEffectInstance.isUserAdded && !effects.find(ef => ef.id === newEffect.id)) {
      setSelectedEffectInstance(null); 
    } else {
      setSelectedEffectInstance(newEffect); // keep inspector open with updated effect
    }
  };
  
  const handleExport = async () => {
    setIsExporting(true);
    toast({ title: "Export Started", description: "Your audio is being mixed. You'll be notified upon completion." });
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 5000)); 
    setProject(prev => prev ? ({...prev, status: 'Completed', finalAudioUrl: '#mock-download-link' }) : null); // Update project status locally
    // In a real app, this would trigger a backend process, and status updates would come via polling or websockets.
    // Email notification EXP-02 is a backend task.
    setIsExporting(false);
    toast({ title: "Export Complete!", description: "Your audio is ready for download from the dashboard." });
    router.push('/dashboard');
  };

  if (!project) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> Loading project...</div>;
  }

  const filteredLibrary = mockSoundEffectsLibrary.filter(sfx => 
    (sfx.name.toLowerCase().includes(searchTerm.toLowerCase()) || sfx.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (filterTone === 'All' || sfx.tone.includes(filterTone))
  );
  
  const currentEffectDetails = selectedEffectInstance ? mockSoundEffectsLibrary.find(libSfx => libSfx.id === selectedEffectInstance.effectId) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.28))] overflow-hidden"> {/* Adjust height based on header */}
      {/* Header Bar */}
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

      {/* Main Editor Layout (Waveform + Transcript above, Inspector + Library below) */}
      <div className="flex-1 grid md:grid-cols-3 gap-4 p-4 overflow-hidden">
        {/* Left Column: Waveform & Transcript */}
        <div className="md:col-span-2 flex flex-col gap-4 overflow-hidden">
          {/* Waveform Display & Controls */}
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
                 {/* Mock waveform bars */}
                {Array.from({ length: 50 }).map((_, i) => (
                  <div key={i} className="w-1 bg-primary/30 rounded-full" style={{ height: `${Math.random() * 80 + 10}%`, marginRight: '2px' }}></div>
                ))}
                {/* Current time indicator */}
                <div className="absolute top-0 bottom-0 bg-primary w-0.5" style={{ left: `${(currentTime / audioDuration) * 100}%` }}></div>
                {/* Effect markers */}
                {effects.map(ef => {
                  const effectDetails = mockSoundEffectsLibrary.find(libSfx => libSfx.id === ef.effectId);
                  const toneForIcon = ef.isUserAdded ? 'User' : (effectDetails?.tone[0] || project.selectedTone);
                  return (
                    <div 
                      key={ef.id} 
                      className={`absolute -top-1 transform -translate-x-1/2 p-1 rounded-full cursor-pointer transition-all
                        ${selectedEffectInstance?.id === ef.id ? 'bg-primary scale-125 z-10' : 'bg-accent hover:bg-primary/80'}`}
                      style={{ left: `${(ef.timestamp / audioDuration) * 100}%` }}
                      onClick={(e) => { e.stopPropagation(); setSelectedEffectInstance(ef); }}
                      title={effectDetails?.name || (ef.isUserAdded ? 'New Effect' : 'Unknown Effect')}
                    >
                      <ToneIcon tone={toneForIcon} className="h-4 w-4 text-white" />
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

          {/* Transcript Display */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader><CardTitle className="text-lg">Transcript</CardTitle></CardHeader>
            <CardContent className="h-full pb-6">
              <ScrollArea className="h-[calc(100%-0rem)] pr-4"> {/* Adjust height for parent padding */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {mockTranscript.split(' ').map((word, index) => (
                    <span key={index} className={index === getHighlightedWordIndex() ? 'bg-primary/30 rounded' : ''}>
                      {word}{' '}
                    </span>
                  ))}
                </p>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Inspector Panel & Sound Library */}
        <div className="md:col-span-1 flex flex-col gap-4 overflow-hidden">
          {/* Inspector Panel */}
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
                       const updatedEffect = { ...selectedEffectInstance, volume: val[0] / 100 };
                       setSelectedEffectInstance(updatedEffect);
                       setEffects(effects.map(ef => ef.id === updatedEffect.id ? updatedEffect : ef));
                    }}
                  />
                  {currentEffectDetails && !selectedEffectInstance.isUserAdded && (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => toast({title: `Previewing ${currentEffectDetails.name}`})}>
                        <Play className="mr-2 h-4 w-4"/> Preview Effect
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={handleDeleteEffect} className="w-full">
                    <Trash2 className="mr-2 h-4 w-4"/>Delete Effect
                  </Button>
                  {selectedEffectInstance.isUserAdded && !currentEffectDetails &&
                    <Button size="sm" onClick={() => handleAddOrUpdateEffect()} className="w-full" disabled={!selectedEffectInstance.effectId}>
                      Add Selected Effect
                    </Button>
                  }
                  {/* Swap options for existing effects */}
                  {!selectedEffectInstance.isUserAdded && currentEffectDetails && (
                     <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-1">Swap Effect:</p>
                        {/* Show a few related effects - very simplified */}
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

          {/* Sound Library */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Sound Library</CardTitle>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search effects..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Select value={filterTone} onValueChange={(value) => setFilterTone(value as Tone | 'All')}>
                  <SelectTrigger className="w-[150px]" aria-label="Filter by tone">
                     <ListFilter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by Tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Tones</SelectItem>
                    {AVAILABLE_TONES.map(tone => (
                      <SelectItem key={tone} value={tone}><ToneIcon tone={tone} className="mr-2 h-4 w-4 inline"/> {tone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-full pb-6">
              <ScrollArea className="h-[calc(100%-2rem)] pr-2"> {/* Adjust height */}
                {filteredLibrary.length > 0 ? (
                  <ul className="space-y-1">
                    {filteredLibrary.map(sfx => (
                      <li key={sfx.id}>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-left h-auto py-2"
                          onClick={() => {
                            if (selectedEffectInstance?.isUserAdded) {
                              // If in "Add New Effect" mode, select this sound for the new effect.
                              const updatedInstance = {...selectedEffectInstance, effectId: sfx.id};
                              setSelectedEffectInstance(updatedInstance);
                              // Optionally auto-add, or wait for explicit "Add" button in inspector
                              // handleAddOrUpdateEffect(sfx.id); 
                            } else {
                               toast({title: `Previewing: ${sfx.name}`}); // Or actually play preview
                            }
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex-col">
                               <span className="font-medium text-sm">{sfx.name}</span>
                               <div className="flex gap-1 mt-0.5">
                                {sfx.tone.map(t => <ToneIcon key={t} tone={t} className="h-3 w-3"/>)}
                               </div>
                            </div>
                            <Volume2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </div>
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No sound effects match your criteria.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
