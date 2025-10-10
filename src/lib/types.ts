

export type Tone = 'Comedic' | 'Dramatic' | 'Suspenseful' | 'Inspirational' | 'All' | 'User';

export type DefaultEffectPlacement = 'ai-optimized' | 'manual-only';

export interface Project {
  id: string;
  name: string;
  date: string; // ISO string
  status: 'Processing' | 'Ready for Review' | 'Completed' | 'Error';
  audioFileName?: string;
  audioFileSize?: number; // in bytes
  audioDataUri?: string; // A TEMPORARY base64 data URI, used for processing and then discarded.
  audioUrl?: string; // The PERMANENT URL for the audio file in Firebase Storage.
  duration?: number; // in seconds
  transcript?: string; // or a more structured transcript type
  effects?: SoundEffectInstance[];
  selectedTone: Tone;
  defaultEffectPlacement?: DefaultEffectPlacement;
  fullMixAudioUrl?: string; 
  effectsOnlyAudioUrl?: string;
}

export interface SoundEffect {
  id: string;
  name: string;
  tags: string[];
  tone: ('Comedic' | 'Dramatic' | 'Suspenseful' | 'Inspirational')[];
  previewUrl: string;

  // New fields for enhanced AI reasoning
  ontology_path: string[]; // e.g., ["Human", "Speech", "Gasp"]
  text_desc: string; // A rich description for the AI.
  mood?: string[]; // e.g., ["tense", "surprising", "lighthearted"]
  intensity_db?: number; // Estimated perceived loudness in dB.
  duration_s: number; // Average duration in seconds.
  onset_type?: 'attack' | 'swell' | 'fade'; // How the sound begins.
  tail_type?: 'short_decay' | 'long_decay' | 'abrupt'; // How the sound ends.
  loopable: boolean;
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

    