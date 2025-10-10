
'use server';

/**
 * @fileOverview An AI agent that transcribes audio and suggests relevant sound effects based on the selected tone.
 * It can process an initial upload (data URI) or re-process an existing audio file (URL).
 *
 * - suggestSoundEffects - A function that handles the sound effect suggestion process.
 * - SuggestSoundEffectsInput - The input type for the suggestSoundEffects function.
 * - SuggestSoundEffectsOutput - The return type for the suggestSoundEffects function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
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
  reasoning: z.string().optional().describe('A brief explanation of why this effect was chosen for this moment.'),
});

const AnalysisSettingsSchema = z.object({
  tone: z
    .enum(['Comedic', 'Dramatic', 'Suspenseful', 'Inspirational', 'All'])
    .describe('The tone selected by the user to guide the sound effect suggestions.'),
  placement: z
    .enum(['ai-optimized', 'manual-only'])
    .describe('The placement strategy for sound effects.'),
});

const SuggestSoundEffectsInputSchema = z.object({
  audioDataUri: z
    .string()
    .optional()
    .describe("The audio file to be analyzed, as a data URI. Used for initial processing."),
  audioUrl: z
    .string()
al.url()
    .optional()
    .describe("A URL to the audio file. Used for re-processing."),
  analysisSettings: AnalysisSettingsSchema.describe('The settings for tone and effect placement.'),
  audioDuration: z.number().describe('The total duration of the audio in seconds.'),
}).refine(data => data.audioDataUri || data.audioUrl, {
  message: "Either audioDataUri or audioUrl must be provided.",
});

export type SuggestSoundEffectsInput = z.infer<typeof SuggestSoundEffectsInputSchema>;

const WordTimestampSchema = z.object({
  word: z.string(),
  start: z.number().describe("Start time of the word in seconds."),
  end: z.number().describe("End time of the word in seconds."),
});

const SuggestSoundEffectsOutputSchema = z.object({
  soundEffectSuggestions: z
    .array(SoundEffectSuggestionSchema)
    .describe('An array of sound effect suggestion objects, each with an effectId, timestamp, and volume.'),
  transcript: z.string().describe('The generated transcript of the audio content.'),
  // Adding the structured transcript to the output for more precise timeline rendering.
  structuredTranscript: z.array(WordTimestampSchema).optional().describe("A word-by-word timestamped transcript."),
});
export type SuggestSoundEffectsOutput = z.infer<typeof SuggestSoundEffectsOutputSchema>;

export async function suggestSoundEffects(input: SuggestSoundEffectsInput): Promise<SuggestSoundEffectsOutput> {
  return suggestSoundEffectsFlow(input);
}

const suggestSoundEffectsFlow = ai.defineFlow(
  {
    name: 'suggestSoundEffectsFlow',
    inputSchema: SuggestSoundEffectsInputSchema,
    outputSchema: SuggestSoundEffectsOutputSchema,
  },
  async (input) => {
    // If placement is manual, we can skip the AI and return immediately.
    if (input.analysisSettings.placement === 'manual-only') {
      const transcriptionPrompt = ai.definePrompt({
        name: 'transcriptionOnlyPrompt',
        input: {schema: z.object({
            audioDataUri: z.string().optional(),
            audioUrl: z.string().url().optional(),
        })},
        output: {schema: z.object({ transcript: z.string(), structuredTranscript: z.array(WordTimestampSchema).optional() })},
        prompt: `Transcribe the following audio file accurately. Provide both a full text transcript and a word-by-word timestamped transcript.
        Audio File to Analyze: {{#if audioDataUri}}{{media url=audioDataUri}}{{else}}{{media url=audioUrl}}{{/if}}
        Your response MUST be a single JSON object with two keys: "transcript" (a single string) and "structuredTranscript" (an array of {word, start, end} objects).`,
      });
      const { output } = await transcriptionPrompt({ audioDataUri: input.audioDataUri, audioUrl: input.audioUrl });
      return {
        transcript: output?.transcript || '',
        structuredTranscript: output?.structuredTranscript,
        soundEffectSuggestions: [],
      };
    }

    const availableEffects = await fetchSoundEffectsFromFirestore();
    
    // Exclude previewUrl from the data sent to the AI to save tokens.
    const promptInput = {
      ...input,
      availableEffects: availableEffects.map(({ previewUrl, ...rest }) => rest),
    };
    
    const basePromptInstructions = `You are an expert audio post-production assistant and sound designer. Your goal is to analyze an audio file with superhuman attention to detail, transcribe it with word-level timestamps, and then intelligently place sound effects to enhance the narrative based on the content and a desired tone.

Follow this multi-step process meticulously:

1.  **Timestamped Transcription**: First, create a complete and accurate text transcript of the provided audio file. You MUST also generate a word-by-word timestamped transcript, detailing the start and end time of every single word.

2.  **Scene and Event Analysis**: Read through the transcript you just generated. Identify key moments, emotional shifts, punchlines, actions, or phrases that would be enhanced by a sound effect. For each moment, understand the underlying **action** (e.g., "a door opens"), the **object** (e.g., "the door"), and the **mood** (e.g., "creepy, tense").

3.  **Intelligent SFX Mapping**: For each key moment you identify, select the most appropriate sound effect from the 'availableEffects' library. Your selection should be based on a deep understanding of the effect's metadata.
    *   Match the **action** and **object** to the effect's 'text_desc' and 'ontology_path'.
    *   Match the **mood** of the moment to the effect's 'mood' and 'tone' tags.
    *   Consider the 'duration_s' and 'tail_type' to ensure the sound fits in the available pause in the dialogue.

4.  **Placement and Justification**: Place the effect at the most impactful moment, usually at the beginning of a natural pause right after the descriptive word. For each suggestion, provide a brief 'reasoning' for your choice.`;

    const toneInstructions = input.analysisSettings.tone === 'All'
      ? `The user has selected "All" for the tone, giving you creative freedom. Use your expert judgment to select the best effect from the entire library that fits the moment, regardless of its assigned tone.`
      : `Your choice MUST be guided by the user's overall 'selectedTone' of '${input.analysisSettings.tone}'. Only use effects that have '${input.analysisSettings.tone}' in their 'tone' array.`;
    
    const finalPromptInstructions = `RULES:
- Your response MUST be a single JSON object with three keys: "transcript" (a single string), "structuredTranscript" (an array of {word, start, end} objects), and "soundEffectSuggestions" (an array of suggestion objects).
- The 'soundEffectSuggestions' array should contain your carefully chosen effects.
- You MUST only suggest effects from the provided 'availableEffects' library, using the correct 'id' for the 'effectId' field (e.g., "sfx_001").
- The 'timestamp' for each effect MUST be a number in seconds, must not exceed the 'audioDuration', and should be placed logically within the audio timeline.
- Provide a brief 'reasoning' for each suggestion.

Here is the information for your task:
- Audio File to Analyze: {{#if audioDataUri}}{{media url=audioDataUri}}{{else}}{{media url=audioUrl}}{{/if}}
- Selected Overall Tone: {{{analysisSettings.tone}}}
- Audio Duration: {{{audioDuration}}} seconds.
- Available Sound Effects Library (JSON):
{{{json availableEffects}}}

Now, based on your expert analysis, generate the JSON output.`;
    
    const promptText = [basePromptInstructions, toneInstructions, finalPromptInstructions].join('\n\n');

    const prompt = ai.definePrompt({
      name: 'suggestSoundEffectsPrompt',
      input: {schema: z.object({
        ...SuggestSoundEffectsInputSchema.shape,
         availableEffects: z.array(z.object({
          id: z.string(),
          name: z.string(),
          tags: z.array(z.string()),
          tone: z.array(z.string()),
          ontology_path: z.array(z.string()),
          text_desc: z.string(),
          mood: z.array(z.string()).optional(),
          duration_s: z.number(),
          onset_type: z.enum(['attack', 'swell', 'fade']).optional(),
          tail_type: z.enum(['short_decay', 'long_decay', 'abrupt']).optional(),
          loopable: z.boolean(),
        })).describe('A library of available sound effects the AI can choose from.'),
      })},
      output: {schema: SuggestSoundEffectsOutputSchema},
      prompt: promptText,
    });

    const {output} = await prompt(promptInput);
    
    // Post-processing step: Filter out suggestions with invalid timestamps
    if (output?.soundEffectSuggestions) {
      output.soundEffectSuggestions = output.soundEffectSuggestions.filter(sfx => sfx.timestamp < input.audioDuration);
    }
    
    return output!;
  }
);
