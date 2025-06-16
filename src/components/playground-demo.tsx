'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analyzeAudioSample, AnalyzeAudioSampleInput, AnalyzeAudioSampleOutput } from '@/ai/flows/playground-demo';
import { AVAILABLE_TONES, MOCK_AUDIO_SAMPLE_DATA_URI } from '@/lib/constants';
import type { Tone } from '@/lib/types';
import { Loader2, PlayCircle, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { MagicWandIcon, ToneIcon } from './icons';

export function PlaygroundDemo() {
  const [selectedTone, setSelectedTone] = useState<Tone>(AVAILABLE_TONES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeAudioSampleOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcessSample = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // In a real scenario, you'd have actual audio data.
      // For this demo, we use a placeholder data URI as required by the AI flow.
      const input: AnalyzeAudioSampleInput = {
        audioSampleDataUri: MOCK_AUDIO_SAMPLE_DATA_URI,
        tone: selectedTone,
      };
      //const result = await analyzeAudioSample(input);
      // Mocking AI result for faster UI development & to avoid actual API calls in demo
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      const result: AnalyzeAudioSampleOutput = {
        analysisResult: `Analysis for ${selectedTone} tone:\n- At 0:05, a subtle 'whoosh' could emphasize the narrative shift.\n- Around 0:12, a comedic 'boing' sound would fit the funny moment perfectly.\n- Consider a gentle background music starting 0:20 to enhance the ${selectedTone.toLowerCase()} atmosphere.`
      };
      setAnalysisResult(result);
    } catch (e) {
      console.error("Error processing sample:", e);
      setError("Failed to process audio sample. Please try again.");
      toast({
        title: "Processing Error",
        description: "Failed to process audio sample. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="playground" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">Try Timbro Instantly</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Experience the Magic</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Select a tone, hit "Process," and see how Timbro can transform a sample audio clip. No signup required!
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-1 md:gap-12 lg:grid-cols-2 mt-12">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Playground Controls</CardTitle>
              <CardDescription>Choose a tone and process the sample audio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tone-select">Select Tone</Label>
                <Select value={selectedTone} onValueChange={(value) => setSelectedTone(value as Tone)}>
                  <SelectTrigger id="tone-select" className="w-full">
                    <SelectValue placeholder="Select a tone" />
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
              </div>
              <Button onClick={handleProcessSample} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MagicWandIcon className="mr-2 h-4 w-4" />
                )}
                Process Sample Audio
              </Button>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              This demo uses a pre-loaded audio sample. Sign up to use your own audio.
            </CardFooter>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>AI-Powered Results</CardTitle>
              <CardDescription>See how Timbro enriches the audio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 min-h-[200px]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Before Timbro</h4>
                  <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Original audio sample.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">After Timbro ✨</h4>
                  <div className="aspect-video bg-primary/10 rounded-md flex items-center justify-center border border-primary/50">
                    <Volume2 className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-sm text-primary mt-1">Enhanced with AI effects.</p>
                </div>
              </div>
              
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Analyzing audio...</p>
                </div>
              )}
              {error && <p className="text-destructive text-sm">{error}</p>}
              {analysisResult && (
                <div className="mt-4 p-3 bg-background rounded-md border">
                  <h5 className="font-semibold mb-1 text-sm">AI Analysis & Suggestions:</h5>
                  <pre className="whitespace-pre-wrap text-xs text-foreground/80">
                    {analysisResult.analysisResult}
                  </pre>
                </div>
              )}
            </CardContent>
             <CardFooter className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground">
                Impressed? Unlock the full power of Timbro for your own podcasts.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/signup">Sign Up for Free Trial</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
