import { Tone, DefaultEffectPlacement } from './types';

export const AVAILABLE_TONES: Tone[] = ['Comedic', 'Dramatic', 'Suspenseful', 'Inspirational'];

export const AVAILABLE_EFFECT_PLACEMENTS: { value: DefaultEffectPlacement; label: string; description?: string }[] = [
  { value: 'ai-optimized', label: 'AI-Optimized (Recommended)', description: "Let Timbro's AI place initial effects for you to review." },
  { value: 'manual-only', label: 'Manual Only (Advanced)', description: "Start with a clean slate and add all effects yourself." },
];

export const MAX_AUDIO_FILE_SIZE_MB = 200;
export const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp3', 'audio/x-wav'];

export const TRIAL_DAYS = 7;
export const TRIAL_PROCESSING_MINUTES = 30;

export const MOCK_AUDIO_SAMPLE_DATA_URI = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTG92ZXMgb2YgU0RETCAvIEVT residencial"; // Placeholder

export const EDITOR_NUDGE_INCREMENT_MS = 100;
