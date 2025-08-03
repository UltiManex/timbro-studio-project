
'use server';

/**
 * @fileOverview An audio mixing AI flow. Downloads a main audio track and multiple sound effects,
 * then uses FFmpeg to overlay the effects at specified timestamps and volumes.
 * The final mixed audio is uploaded to Firebase Storage.
 *
 * - mixAudio - A function that handles the entire audio mixing and uploading process.
 * - MixAudioInput - The input type for the mixAudio function.
 * - MixAudioOutput - The return type for the mixAudio function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getSoundEffects } from '@/lib/actions/sfx';
import type { SoundEffect, SoundEffectInstance } from '@/lib/types';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath);

// Helper function to download a file from a URL to a temporary path
async function downloadFile(url: string, dest: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(dest, Buffer.from(arrayBuffer));
}

// Define Zod schemas for the flow's input and output
const MixAudioInputSchema = z.object({
  projectId: z.string().describe('The unique identifier for the project.'),
  mainAudioUrl: z.string().url().describe('The public URL of the main audio track.'),
  effects: z.array(z.object({
    effectId: z.string(),
    timestamp: z.number(),
    volume: z.number().optional().default(1.0),
  })).describe('An array of sound effect instances to be mixed.'),
});
export type MixAudioInput = z.infer<typeof MixAudioInputSchema>;

const MixAudioOutputSchema = z.object({
  finalAudioUrl: z.string().url().describe('The public URL of the final mixed audio file.'),
});
export type MixAudioOutput = z.infer<typeof MixAudioOutputSchema>;

// Exported function that clients will call
export async function mixAudio(input: MixAudioInput): Promise<MixAudioOutput> {
  return mixAudioFlow(input);
}

// The main Genkit flow definition
const mixAudioFlow = ai.defineFlow(
  {
    name: 'mixAudioFlow',
    inputSchema: MixAudioInputSchema,
    outputSchema: MixAudioOutputSchema,
  },
  async (input) => {
    const { projectId, mainAudioUrl, effects } = input;

    // 1. Create a temporary directory for our audio files
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `timbro-mix-${projectId}-`));
    
    try {
      console.log(`[${projectId}] Starting audio mix. Temp dir: ${tempDir}`);

      // 2. Download the main audio track
      const mainAudioPath = path.join(tempDir, 'main.mp3'); // Assume mp3 for simplicity
      console.log(`[${projectId}] Downloading main audio from ${mainAudioUrl}`);
      await downloadFile(mainAudioUrl, mainAudioPath);
      console.log(`[${projectId}] Main audio downloaded to ${mainAudioPath}`);
      
      // 3. Get the full sound effect library details (including URLs)
      const sfxLibrary = await getSoundEffects();
      const sfxMap = new Map(sfxLibrary.map(sfx => [sfx.id, sfx]));

      // 4. Download all required sound effects in parallel
      const effectDownloads = effects.map(async (effectInstance) => {
        const sfxDetails = sfxMap.get(effectInstance.effectId);
        if (!sfxDetails) {
          console.warn(`[${projectId}] Sound effect with ID ${effectInstance.effectId} not found in library. Skipping.`);
          return null;
        }
        const effectPath = path.join(tempDir, `${sfxDetails.id}.mp3`);
        await downloadFile(sfxDetails.previewUrl, effectPath);
        return { ...effectInstance, path: effectPath };
      });
      
      const downloadedEffects = (await Promise.all(effectDownloads)).filter(Boolean) as (SoundEffectInstance & { path: string })[];
      console.log(`[${projectId}] Downloaded ${downloadedEffects.length} sound effects.`);

      // 5. Build the FFmpeg command
      const outputPath = path.join(tempDir, 'output.mp3');
      const command = ffmpeg(mainAudioPath);

      // Add each effect as an input to the command
      downloadedEffects.forEach(effect => {
        command.input(effect.path);
      });
      
      // Construct the complex filter for overlaying audio
      // Format: [1:a]adelay=1000|1000[a1]; [0:a][a1]amix=inputs=2
      // This means: take input 1 ([1:a]), delay it by 'timestamp' ms, output to stream [a1].
      // Then, take input 0 ([0:a]) and stream [a1] and mix them.
      // We chain these mixes together.
      const effectFilters = downloadedEffects.map((effect, index) => {
          const streamIn = index + 1; // 0 is main audio, 1+ are effects
          const streamOut = `sfx${index}`;
          const delayMs = effect.timestamp * 1000;
          return `[${streamIn}:a]adelay=${delayMs}|${delayMs},volume=${effect.volume}[${streamOut}]`;
      });
      
      const mixInputs = ['[0:a]', ...downloadedEffects.map((_, i) => `[sfx${i}]`)].join('');
      const complexFilter = [
        ...effectFilters,
        `${mixInputs}amix=inputs=${effects.length + 1}[out]`
      ].join('; ');

      console.log(`[${projectId}] Using FFmpeg filter: ${complexFilter}`);
      
      command.complexFilter(complexFilter, 'out');
      command.outputOptions('-c:a', 'libmp3lame', '-q:a', '2'); // Standard MP3 quality

      // 6. Run FFmpeg and wait for it to complete
      await new Promise<void>((resolve, reject) => {
        command
          .on('start', (cmd) => console.log(`[${projectId}] FFmpeg started:`, cmd))
          .on('error', (err) => {
            console.error(`[${projectId}] FFmpeg error:`, err);
            reject(err);
          })
          .on('end', () => {
            console.log(`[${projectId}] FFmpeg processing finished.`);
            resolve();
          })
          .save(outputPath);
      });

      // 7. Upload the final mixed file to Firebase Storage
      const outputBuffer = await fs.readFile(outputPath);
      const finalStoragePath = `exports/${projectId}/final-mix.mp3`;
      const storageRef = ref(storage!, finalStoragePath);
      
      console.log(`[${projectId}] Uploading final mix to ${finalStoragePath}`);
      const uploadResult = await uploadBytes(storageRef, outputBuffer, { contentType: 'audio/mpeg' });
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log(`[${projectId}] Upload complete. Final URL: ${downloadURL}`);

      // 8. Return the public URL
      return { finalAudioUrl: downloadURL };

    } catch (error) {
      console.error(`[${projectId}] An error occurred in the mixAudioFlow:`, error);
      throw new Error(`Failed to mix audio for project ${projectId}.`);
    } finally {
      // 9. Clean up the temporary directory
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`[${projectId}] Cleaned up temporary directory.`);
    }
  }
);
