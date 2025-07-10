
/**
 * Decodes audio data from a data URI into an AudioBuffer.
 */
async function decodeAudioData(dataUri: string): Promise<AudioBuffer> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Convert data URI to ArrayBuffer
  const response = await fetch(dataUri);
  const arrayBuffer = await response.arrayBuffer();

  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(arrayBuffer, resolve, reject);
  });
}

/**
 * Generates an array of normalized amplitude values (0-1) for waveform visualization.
 * @param dataUri The base64 data URI of the audio file.
 * @param samples The number of samples to generate for the waveform. Defaults to 200.
 * @returns A promise that resolves to an array of numbers representing the waveform.
 */
export async function generateWaveform(dataUri: string, samples: number = 200): Promise<number[]> {
  try {
    const audioBuffer = await decodeAudioData(dataUri);
    const rawData = audioBuffer.getChannelData(0); // Get data from the first channel
    const blockSize = Math.floor(rawData.length / samples);
    const waveformData: number[] = [];

    let maxAmp = 0;
    for (let i = 0; i < rawData.length; i++) {
        maxAmp = Math.max(maxAmp, Math.abs(rawData[i]));
    }
    
    // Fallback if maxAmp is 0 to avoid division by zero
    if (maxAmp === 0) {
      return new Array(samples).fill(0);
    }

    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j]);
      }
      // Calculate the average amplitude for the block and normalize it
      const average = sum / blockSize;
      waveformData.push(average / maxAmp);
    }

    return waveformData;
  } catch (error) {
    console.error("Error generating waveform:", error);
    // Return a flat line as a fallback on error
    return new Array(samples).fill(0.1); 
  }
}
