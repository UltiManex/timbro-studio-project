'use client';

import { useState, useCallback, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AVAILABLE_TONES, MAX_AUDIO_FILE_SIZE_BYTES, MAX_AUDIO_FILE_SIZE_MB, ALLOWED_AUDIO_TYPES, AVAILABLE_EFFECT_PLACEMENTS } from '@/lib/constants';
import type { Tone, DefaultEffectPlacement, SoundEffectInstance } from '@/lib/types';
import { UploadCloud, FileAudio, X, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TrustBadgeIcon, ToneIcon } from '@/components/icons';
import { suggestSoundEffects } from '@/ai/flows/suggest-sound-effects';
import { mockSoundEffectsLibrary, mockTranscript } from '@/lib/mock-data';

const projectSchema = z.object({
  projectName: z.string().min(3, { message: 'Project name must be at least 3 characters.' }),
  selectedTone: z.enum(AVAILABLE_TONES as [Tone, ...Tone[]], { required_error: 'Please select a tone.' }),
  audioFile: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, 'Please select an audio file.')
    .refine(files => files?.[0]?.size <= MAX_AUDIO_FILE_SIZE_BYTES, `File size must be ${MAX_AUDIO_FILE_SIZE_MB}MB or less.`)
    .refine(files => ALLOWED_AUDIO_TYPES.includes(files?.[0]?.type), 'Invalid file type. Please upload MP3, WAV, or M4A.'),
  defaultEffectPlacement: z.enum(AVAILABLE_EFFECT_PLACEMENTS.map(p => p.value) as [DefaultEffectPlacement, ...DefaultEffectPlacement[]], { required_error: 'Please select a default effect placement strategy.' }),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface UploadAudioModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProjectCreated: (project: any) => void; // Adjust 'any' to your Project type
}

export function UploadAudioModal({ isOpen, onOpenChange, onProjectCreated }: UploadAudioModalProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectName: '',
      defaultEffectPlacement: AVAILABLE_EFFECT_PLACEMENTS[0].value, // Default to AI-Optimized
    },
  });
  
  const audioFile = form.watch('audioFile');

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      form.setValue('audioFile', files, { shouldValidate: true });
      if (!form.getValues('projectName') && files[0]?.name) {
        form.setValue('projectName', files[0].name.replace(/\.[^/.]+$/, "")); // Prefill project name
      }
    }
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFileChange(event.dataTransfer.files);
      event.dataTransfer.clearData();
    }
  }, [form]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  }, []);
  
  const onSubmit = async (data: ProjectFormValues) => {
    setIsUploading(true);

    let aiSuggestions: SoundEffectInstance[] = [];
    
    // Only run AI if the user wants it
    if (data.defaultEffectPlacement === 'ai-optimized') {
      try {
        // In a real app, you would get duration and transcript from the uploaded audio file.
        // We use mock data here for simplicity.
        const audioDuration = 60; // Mock duration
        const transcript = mockTranscript; 
        
        const aiResponse = await suggestSoundEffects({
          audioTranscription: transcript,
          selectedTone: data.selectedTone,
          availableEffects: mockSoundEffectsLibrary.map(({ previewUrl, ...rest }) => rest), // Exclude previewUrl for the prompt
          audioDuration: audioDuration,
        });

        // Add a unique instance ID to each suggestion
        aiSuggestions = aiResponse.soundEffectSuggestions.map(suggestion => ({
          ...suggestion,
          id: `ai_inst_${Date.now()}_${Math.random()}`
        }));

      } catch (e) {
        console.error("AI suggestion failed:", e);
        toast({
          title: "AI Analysis Failed",
          description: "Could not generate sound effect suggestions. You can still create the project and add effects manually.",
          variant: "destructive"
        });
      }
    }
    
    // This part runs regardless of AI success or failure
    const newProject = {
      id: `proj_${Date.now()}`,
      name: data.projectName,
      date: new Date().toISOString(),
      status: 'Ready for Review' as const, // It's ready for review even if AI fails (with 0 suggestions)
      audioFileName: data.audioFile[0].name,
      audioFileSize: data.audioFile[0].size,
      selectedTone: data.selectedTone,
      defaultEffectPlacement: data.defaultEffectPlacement,
      effects: aiSuggestions,
      duration: 60, // Mock duration
      transcript: mockTranscript,
    };

    onProjectCreated(newProject); 
    setIsUploading(false);
    onOpenChange(false); 
    form.reset();
    toast({
      title: "Project Created!",
      description: `${data.projectName} is now ready for review.`,
    });
    router.push('/dashboard'); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isUploading) { onOpenChange(open); if (!open) form.reset(); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">Create New Project</DialogTitle>
          <DialogDescription>Upload your audio file and configure analysis settings.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
          <div>
            <Label htmlFor="projectName">Project Name</Label>
            <Input id="projectName" {...form.register('projectName')} className="mt-1" placeholder="e.g., Podcast Episode 10" />
            {form.formState.errors.projectName && <p className="text-sm text-destructive mt-1">{form.formState.errors.projectName.message}</p>}
          </div>

          <div>
            <Label htmlFor="audioFile">Audio File</Label>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`mt-1 flex justify-center items-center w-full h-40 px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors
                ${dragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/70'}
                ${form.formState.errors.audioFile ? 'border-destructive' : ''}`}
            >
              <div className="space-y-1 text-center">
                <UploadCloud className={`mx-auto h-10 w-10 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex text-sm text-muted-foreground">
                  <Label
                    htmlFor="audioFile-input"
                    className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                  >
                    <span>Upload a file</span>
                    <input 
                      id="audioFile-input" 
                      type="file" 
                      className="sr-only" 
                      accept={ALLOWED_AUDIO_TYPES.join(',')}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileChange(e.target.files)}
                    />
                  </Label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-muted-foreground">MP3, WAV, M4A up to {MAX_AUDIO_FILE_SIZE_MB}MB</p>
              </div>
            </div>
            {audioFile?.[0] && (
              <div className="mt-2 p-2 border rounded-md bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileAudio className="h-5 w-5 text-primary" />
                  <span className="text-sm truncate max-w-[200px]">{audioFile[0].name}</span>
                  <span className="text-xs text-muted-foreground">({(audioFile[0].size / 1024 / 1024).toFixed(2)}MB)</span>
                </div>
                <Button variant="ghost" size="icon" type="button" onClick={() => form.resetField('audioFile')} className="h-6 w-6">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {form.formState.errors.audioFile && <p className="text-sm text-destructive mt-1">{form.formState.errors.audioFile.message as string}</p>}
          </div>

          <div>
            <Controller
              control={form.control}
              name="selectedTone"
              render={({ field }) => (
                <>
                  <Label htmlFor="selectedTone">Analysis Tone</Label>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="selectedTone" className="w-full mt-1">
                      <SelectValue placeholder="Choose AI analysis tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_TONES.map((tone) => (
                        <SelectItem key={tone} value={tone}>
                           <div className="flex items-center">
                            <ToneIcon tone={tone as Tone} className="mr-2 h-5 w-5" />
                            {tone}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            />
             {form.formState.errors.selectedTone && <p className="text-sm text-destructive mt-1">{form.formState.errors.selectedTone.message}</p>}
          </div>
          
          <div>
            <Controller
              control={form.control}
              name="defaultEffectPlacement"
              render={({ field }) => (
                <>
                  <Label>Default Effect Placement</Label>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="mt-1 space-y-2"
                  >
                    {AVAILABLE_EFFECT_PLACEMENTS.map((placement) => (
                      <div key={placement.value} className="flex items-start space-x-2 p-2 border rounded-md hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value={placement.value} id={placement.value} className="mt-1"/>
                        <div className="flex-1">
                           <Label htmlFor={placement.value} className="font-medium cursor-pointer">{placement.label}</Label>
                           {placement.description && <p className="text-xs text-muted-foreground">{placement.description}</p>}
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </>
              )}
            />
            {form.formState.errors.defaultEffectPlacement && <p className="text-sm text-destructive mt-1">{form.formState.errors.defaultEffectPlacement.message}</p>}
          </div>


          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 border border-green-200 bg-green-50 dark:bg-green-900/30 dark:border-green-700/50 rounded-md">
            <TrustBadgeIcon className="h-8 w-8 text-green-600 dark:text-green-400 shrink-0" />
            <span>Your files are private and secure. We respect your content and privacy.</span>
          </div>

          {isUploading && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">Contacting AI assistant...</p>
            </div>
          )}

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isUploading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isUploading || !form.formState.isValid}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Analyze Audio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
