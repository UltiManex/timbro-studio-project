'use server';

/**
 * @fileOverview An AI agent that transcribes audio and suggests relevant sound effects based on the selected tone.
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
  audioDataUri: z
    .string()
    .describe("The audio file to be analyzed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
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
  transcript: z.string().describe('The generated transcript of the audio content.'),
});
export type SuggestSoundEffectsOutput = z.infer<typeof SuggestSoundEffectsOutputSchema>;

export async function suggestSoundEffects(input: SuggestSoundEffectsInput): Promise<SuggestSoundEffectsOutput> {
  return suggestSoundEffectsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSoundEffectsPrompt',
  input: {schema: SuggestSoundEffectsInputSchema},
  output: {schema: SuggestSoundEffectsOutputSchema},
  prompt: `You are an expert audio post-production assistant and sound designer. Your task is to first transcribe an audio file and then suggest sound effects to enhance it based on the generated transcript and a desired tone.

Your task has two parts:
1.  **Transcribe the Audio**: Listen to the provided audio file and generate an accurate text transcript.
2.  **Suggest Sound Effects**: Based on the transcript you just generated, identify key moments that could be enhanced by a sound effect. Place these effects at appropriate timestamps.

RULES:
- Your response MUST be a single JSON object with two keys: "transcript" and "soundEffectSuggestions".
- You MUST only suggest effects from the provided 'availableEffects' library.
- You MUST use the correct 'id' for the 'effectId' field (e.g., "sfx_001").
- The 'timestamp' for each effect MUST be a number in seconds and MUST NOT exceed the 'audioDuration'.
- Analyze the transcribed content and the user's 'selectedTone' to make relevant choices. For example, for a 'Comedic' tone, use funny effects like "Comical Boing" or "Sad Trombone". For a 'Dramatic' tone, use "Dramatic Swell".
- Distribute the sound effects throughout the audio timeline naturally. Do not place them all at the beginning.

Here is the information for your task:
- Audio File to Analyze: {{media url=audioDataUri}}
- Selected Tone: {{{selectedTone}}}
- Audio Duration: {{{audioDuration}}} seconds.

- Available Sound Effects Library (JSON):
{{{json availableEffects}}}

Based on all this information, generate the JSON output containing the full transcript and the list of sound effect suggestions.
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
