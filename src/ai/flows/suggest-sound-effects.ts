
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
import { db } from '@/lib/firebase-admin';

async function fetchSoundEffectsFromFirestore(): Promise<SoundEffect[]> {
  const sfxCollection = db.collection('sound_effects');
  const snapshot = await sfxCollection.get();
  if (snapshot.empty) {
    return [];
  }
  const effects: SoundEffect[] = [];
  snapshot.forEach(doc => {
    effects.push(doc.data() as SoundEffect);
  });
  return effects;
}

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
  input: {schema: z.object({
    ...SuggestSoundEffectsInputSchema.shape,
     availableEffects: z.array(z.object({ // Add availableEffects back for the prompt context only
      id: z.string(),
      name: z.string(),
      tags: z.array(z.string()),
      tone: z.array(z.string()),
    })).describe('A library of available sound effects the AI can choose from.'),
  })},
  output: {schema: SuggestSoundEffectsOutputSchema},
  prompt: `You are an expert audio post-production assistant and sound designer. Your goal is to analyze an audio file, transcribe it, and then intelligently place sound effects to enhance the narrative based on the content and a desired tone.

Follow this multi-step process:
1.  **Transcribe the Audio**: First, create a complete and accurate text transcript of the provided audio file.
2.  **Analyze the Transcript**: Read through the transcript you just generated. Identify key moments, emotional shifts, punchlines, actions, or phrases that would be enhanced by a sound effect. For example, look for jokes, moments of tension, dramatic pauses, or inspiring statements.
3.  **Map Moments to Sound Effects**: For each key moment you identify, select the most appropriate sound effect from the 'availableEffects' library. Your choice should be guided by the moment's context and the user's overall 'selectedTone'. For example, if the tone is 'Comedic' and the transcript has a punchline, a "Comical Boing" would be a good choice. If the tone is 'Dramatic' and there's a major reveal, "Dramatic Swell" would be fitting.
4.  **Determine Timestamp**: Place each chosen sound effect at the precise timestamp where the corresponding moment occurs in the audio.

RULES:
- Your response MUST be a single JSON object with two keys: "transcript" and "soundEffectSuggestions".
- The 'transcript' key must contain the full, accurate transcription of the audio.
- The 'soundEffectSuggestions' array should contain your carefully chosen effects.
- You MUST only suggest effects from the provided 'availableEffects' library, using the correct 'id' for the 'effectId' field (e.g., "sfx_001").
- The 'timestamp' for each effect MUST be a number in seconds and MUST NOT exceed the 'audioDuration'. Do not place all effects at the start; they should be distributed logically throughout the audio timeline according to your analysis.

Here is the information for your task:
- Audio File to Analyze: {{media url=audioDataUri}}
- Selected Overall Tone: {{{selectedTone}}}
- Audio Duration: {{{audioDuration}}} seconds.
- Available Sound Effects Library (JSON):
{{{json availableEffects}}}

Now, based on your expert analysis, generate the JSON output containing the full transcript and the list of intelligent sound effect suggestions.
`,
});

const suggestSoundEffectsFlow = ai.defineFlow(
  {
    name: 'suggestSoundEffectsFlow',
    inputSchema: SuggestSoundEffectsInputSchema,
    outputSchema: SuggestSoundEffectsOutputSchema,
  },
  async input => {
    // Fetch the sound effects library from Firestore within the flow
    const availableEffects = await fetchSoundEffectsFromFirestore();
    
    // Augment the original input with the fetched effects for the prompt
    const promptInput = {
      ...input,
      availableEffects: availableEffects.map(({ previewUrl, ...rest }) => rest),
    };

    const {output} = await prompt(promptInput);
    return output!;
  }
);
