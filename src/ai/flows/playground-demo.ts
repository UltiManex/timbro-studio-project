'use server';

/**
 * @fileOverview AI flow for the Playground demo. Analyzes a pre-loaded audio sample and applies sound effects based on a selected tone.
 *
 * - analyzeAudioSample - A function that analyzes the audio sample and suggests sound effects.
 * - AnalyzeAudioSampleInput - The input type for the analyzeAudioSample function.
 * - AnalyzeAudioSampleOutput - The return type for the analyzeAudioSample function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeAudioSampleInputSchema = z.object({
  audioSampleDataUri: z
    .string()
    .describe(
      "A pre-loaded audio sample as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  tone: z
    .enum(['Comedic', 'Dramatic', 'Suspenseful', 'Inspirational'])
    .describe('The desired tone for the sound effects.'),
});
export type AnalyzeAudioSampleInput = z.infer<typeof AnalyzeAudioSampleInputSchema>;

const AnalyzeAudioSampleOutputSchema = z.object({
  analysisResult: z
    .string()
    .describe('The AI analysis result including suggested sound effects.'),
});
export type AnalyzeAudioSampleOutput = z.infer<typeof AnalyzeAudioSampleOutputSchema>;

export async function analyzeAudioSample(input: AnalyzeAudioSampleInput): Promise<AnalyzeAudioSampleOutput> {
  return analyzeAudioSampleFlow(input);
}

const analyzeAudioSamplePrompt = ai.definePrompt({
  name: 'analyzeAudioSamplePrompt',
  input: {schema: AnalyzeAudioSampleInputSchema},
  output: {schema: AnalyzeAudioSampleOutputSchema},
  prompt: `You are an AI audio post-production assistant. Analyze the provided audio sample and suggest relevant sound effects based on the selected tone.

Audio Sample: {{media url=audioSampleDataUri}}
Tone: {{{tone}}}

Provide a detailed analysis of the audio sample, including specific timestamps and descriptions of where sound effects would enhance the content. Suggest specific sound effects that match the tone.

Format your output as a JSON object.`,
});

const analyzeAudioSampleFlow = ai.defineFlow(
  {
    name: 'analyzeAudioSampleFlow',
    inputSchema: AnalyzeAudioSampleInputSchema,
    outputSchema: AnalyzeAudioSampleOutputSchema,
  },
  async input => {
    const {output} = await analyzeAudioSamplePrompt(input);
    return output!;
  }
);
