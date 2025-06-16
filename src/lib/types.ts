export type Tone = 'Comedic' | 'Dramatic' | 'Suspenseful' | 'Inspirational';

export interface Project {
  id: string;
  name: string;
  date: string; // ISO string
  status: 'Processing' | 'Ready for Review' | 'Completed' | 'Error';
  audioFileName?: string;
  audioFileSize?: number; // in bytes
  duration?: number; // in seconds
  transcript?: string; // or a more structured transcript type
  effects?: SoundEffectInstance[];
  selectedTone: Tone;
  finalAudioUrl?: string; // URL to download the mixed audio
}

export interface SoundEffect {
  id: string;
  name: string;
  tags: string[];
  tone: Tone[]; // Can belong to multiple tones
  previewUrl: string; // URL to preview the sound effect
}

export interface SoundEffectInstance {
  id: string; // Unique instance ID
  effectId: string; // ID of the SoundEffect from the library
  timestamp: number; // in seconds, where the effect is placed
  volume?: number; // 0-1, defaults to 1
  isUserAdded?: boolean; // True if manually added by user
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  actionPath?: string; // Path to navigate to for completing the step
}
