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

const SuggestSoundEffectsInputSchema = z.object({
  audioTranscription: z
    .string()
    .describe('The transcription of the audio content to be analyzed.'),
  selectedTone: z
    .enum(['Comedic', 'Dramatic', 'Suspenseful', 'Inspirational'])
    .describe('The tone selected by the user to guide the sound effect suggestions.'),
});
export type SuggestSoundEffectsInput = z.infer<typeof SuggestSoundEffectsInputSchema>;

const SuggestSoundEffectsOutputSchema = z.object({
  soundEffectSuggestions: z
    .array(z.string())
    .describe('An array of sound effect suggestions relevant to the audio content and selected tone.'),
});
export type SuggestSoundEffectsOutput = z.infer<typeof SuggestSoundEffectsOutputSchema>;

export async function suggestSoundEffects(input: SuggestSoundEffectsInput): Promise<SuggestSoundEffectsOutput> {
  return suggestSoundEffectsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSoundEffectsPrompt',
  input: {schema: SuggestSoundEffectsInputSchema},
  output: {schema: SuggestSoundEffectsOutputSchema},
  prompt: `You are an AI assistant specialized in suggesting sound effects for podcasts based on the content and desired tone.

  Analyze the following audio transcription and suggest sound effects that would enhance the listening experience, matching the selected tone.

  Transcription: {{{audioTranscription}}}
  Selected Tone: {{{selectedTone}}}

  Provide a list of sound effect suggestions that are relevant and appropriate for the content and tone.
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
