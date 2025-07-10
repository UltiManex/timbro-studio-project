
import type { Project, SoundEffect, SoundEffectInstance, Tone } from '@/lib/types';

export const mockProjects: Project[] = [
  { id: 'proj_1', name: 'My First Podcast Episode', date: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'Ready for Review', audioFileName: 'episode_01_raw.mp3', duration: 1830, selectedTone: 'Comedic', defaultEffectPlacement: 'ai-optimized', effects: [], transcript: "Welcome to the show." },
  { id: 'proj_2', name: 'Tech Talk Weekly', date: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'Completed', audioFileName: 'techtalk_final_v2.mp3', duration: 2400, selectedTone: 'Inspirational', finalAudioUrl: '/sounds/placeholder-podcast.mp3', effects: [], transcript: "Let's talk about tech." }, // Using a local placeholder
  { id: 'proj_3', name: 'Interview with Jane Doe', date: new Date(Date.now() - 86400000 * 1).toISOString(), status: 'Processing', audioFileName: 'interview_jane_raw.wav', duration: 3600, selectedTone: 'Dramatic', defaultEffectPlacement: 'ai-optimized', effects: [], transcript: "A dramatic interview." },
  { id: 'proj_4', name: 'Quick Update', date: new Date(Date.now() - 86400000 * 10).toISOString(), status: 'Error', audioFileName: 'update_audio.m4a', duration: 300, selectedTone: 'Suspenseful', defaultEffectPlacement: 'manual-only', effects: [], transcript: "A quick update for everyone." },
];

// Ensure these MP3 files exist in your `public/sounds/` directory.
export const mockSoundEffectsLibrary: SoundEffect[] = [
  { id: 'sfx_001', name: 'Comical Boing', tags: ['boing', 'jump', 'funny'], tone: ['Comedic'], previewUrl: '/sounds/comical-boing.mp3' },
  { id: 'sfx_002', name: 'Dramatic Swell', tags: ['swell', 'tension', 'reveal'], tone: ['Dramatic', 'Suspenseful'], previewUrl: '/sounds/dramatic-swell.mp3' },
  { id: 'sfx_003', name: 'Suspenseful Drone', tags: ['drone', 'creepy', 'tense'], tone: ['Suspenseful'], previewUrl: '/sounds/suspenseful-drone.mp3' },
  { id: 'sfx_004', name: 'Uplifting Chime', tags: ['chime', 'positive', 'success'], tone: ['Inspirational'], previewUrl: '/sounds/uplifting-chime.mp3' },
  { id: 'sfx_005', name: 'Sad Trombone', tags: ['fail', 'wah-wah', 'funny'], tone: ['Comedic'], previewUrl: '/sounds/sad-trombone.mp3' },
  { id: 'sfx_006', name: 'Heartbeat', tags: ['heart', 'pulse', 'tense'], tone: ['Suspenseful', 'Dramatic'], previewUrl: '/sounds/heartbeat.mp3' },
  { id: 'sfx_007', name: 'Record Scratch', tags: ['stop', 'interrupt', 'funny'], tone: ['Comedic'], previewUrl: '/sounds/record-scratch.mp3' },
  { id: 'sfx_008', name: 'Inspiring Piano Chord', tags: ['piano', 'hopeful', 'positive'], tone: ['Inspirational'], previewUrl: '/sounds/inspiring-chord.mp3' },
  { id: 'sfx_009', name: 'Interface Click', tags: ['ui', 'click', 'button'], tone: ['Comedic', 'Dramatic', 'Suspenseful', 'Inspirational'], previewUrl: '/sounds/interface-click.mp3' },
  { id: 'sfx_010', name: 'Magic Wand Sparkle', tags: ['magic', 'sparkle', 'fantasy'], tone: ['Inspirational', 'Comedic'], previewUrl: '/sounds/magic-wand-sparkle.mp3' },
];

export const mockAISuggestions: SoundEffectInstance[] = [
  { id: 'ai_inst_1', effectId: 'sfx_001', timestamp: 5, volume: 0.8 }, 
  { id: 'ai_inst_2', effectId: 'sfx_002', timestamp: 12.5, volume: 1.0 }, 
  { id: 'ai_inst_3', effectId: 'sfx_006', timestamp: 22, volume: 0.7 }, 
];

export const mockTranscript = "Welcome to the Timbro podcast editor. In this episode, we'll discuss the future of AI in audio production. (Funny moment here!) It's a rapidly evolving field, with new tools and techniques emerging constantly. (Dramatic reveal here!) The potential for creators is immense, empowering them to achieve professional-quality results with greater ease. But with great power comes great responsibility. (Suspense builds...) We must ensure these tools are used ethically and to enhance creativity, not replace it. (Uplifting conclusion starts) Ultimately, Timbro aims to be your creative co-pilot on this exciting journey.";
