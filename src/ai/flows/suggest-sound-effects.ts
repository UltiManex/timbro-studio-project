'use server';

/**
 * @fileOverview An AI agent that analyzes audio and suggests relevant sound effects based on the selected tone.
 *
 * - suggestSoundEffects - A function that handles the sound effect suggestion process.
 * - SuggestSoundEffectsInput - The input type for the suggestSoundEffects function.
 * - SuggestSoundEffectsOutput - The return type for the suggestSoundEffects function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { SoundEffect } from '@/lib/types';

const SoundEffectSuggestionSchema = z.object({
  effectId: z.string().describe('The ID of the suggested sound effect from the provided library (e.g., "sfx_001").'),
  timestamp: z.number().describe('The timestamp in seconds where the effect should be placed.'),
  volume: z.number().min(0).max(1).default(1.0).describe('The volume of the effect, from 0.0 to 1.0.'),
});

const SuggestSoundEffectsInputSchema = z.object({
  audioTranscription: z
    .string()
    .describe('The transcription of the audio content to be analyzed.'),
  selectedTone: z
    .enum(['Comedic', 'Dramatic', 'Suspenseful', 'Inspirational'])
    .describe('The tone selected by the user to guide the sound effect suggestions.'),
  availableEffects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    tags: z.array(z.string()),
    tone: z.array(z.string()),
  })).describe('A library of available sound effects the AI can choose from.'),
  audioDuration: z.number().describe('The total duration of the audio in seconds.'),
});
export type SuggestSoundEffectsInput = z.infer<typeof SuggestSoundEffectsInputSchema>;

const SuggestSoundEffectsOutputSchema = z.object({
  soundEffectSuggestions: z
    .array(SoundEffectSuggestionSchema)
    .describe('An array of sound effect suggestion objects, each with an effectId, timestamp, and volume.'),
});
export type SuggestSoundEffectsOutput = z.infer<typeof SuggestSoundEffectsOutputSchema>;

export async function suggestSoundEffects(input: SuggestSoundEffectsInput): Promise<SuggestSoundEffectsOutput> {
  return suggestSoundEffectsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSoundEffectsPrompt',
  input: {schema: SuggestSoundEffectsInputSchema},
  output: {schema: SuggestSoundEffectsOutputSchema},
  prompt: `You are an expert audio post-production assistant and sound designer. Your task is to analyze an audio transcript and suggest sound effects to enhance it based on a desired tone.

You will be given:
1. An audio transcription.
2. A selected tone.
3. The total audio duration in seconds.
4. A JSON library of available sound effects you can use. Each effect has an 'id', 'name', 'tags', and associated 'tone' list.

Your goal is to identify key moments in the transcript that could be enhanced by a sound effect. Place these effects at appropriate timestamps.

RULES:
- You MUST only suggest effects from the provided 'availableEffects' library.
- You MUST use the correct 'id' for the 'effectId' field (e.g., "sfx_001").
- The 'timestamp' for each effect MUST be a number in seconds and MUST NOT exceed the 'audioDuration'.
- Analyze the content and the user's 'selectedTone' to make relevant choices. For example, for a 'Comedic' tone, use funny effects like "Comical Boing" or "Sad Trombone". For a 'Dramatic' tone, use "Dramatic Swell".
- Distribute the sound effects throughout the audio timeline naturally. Do not place them all at the beginning.

Here is the information for your task:
- Selected Tone: {{{selectedTone}}}
- Audio Duration: {{{audioDuration}}} seconds.
- Audio Transcription:
{{{audioTranscription}}}

- Available Sound Effects Library (JSON):
{{{json availableEffects}}}

Based on all this information, generate a list of sound effect suggestions.
`,
});

const suggestSoundEffectsFlow = ai.defineFlow(
  {
    name: 'suggestSoundEffectsFlow',
    inputSchema: SuggestSoundEffectsInputSchema,
    outputSchema: SuggestSoundEffectsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
