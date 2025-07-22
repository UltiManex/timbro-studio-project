
import type { Project } from '@/lib/types';

export const mockProjects: Project[] = [
  { id: 'proj_1', name: 'My First Podcast Episode', date: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'Ready for Review', audioFileName: 'episode_01_raw.mp3', duration: 1830, selectedTone: 'Comedic', defaultEffectPlacement: 'ai-optimized', effects: [], transcript: "Welcome to the show." },
  { id: 'proj_2', name: 'Tech Talk Weekly', date: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'Completed', audioFileName: 'techtalk_final_v2.mp3', duration: 2400, selectedTone: 'Inspirational', finalAudioUrl: '#', effects: [], transcript: "Let's talk about tech." },
  { id: 'proj_3', name: 'Interview with Jane Doe', date: new Date(Date.now() - 86400000 * 1).toISOString(), status: 'Processing', audioFileName: 'interview_jane_raw.wav', duration: 3600, selectedTone: 'Dramatic', defaultEffectPlacement: 'ai-optimized', effects: [], transcript: "A dramatic interview." },
  { id: 'proj_4', name: 'Quick Update', date: new Date(Date.now() - 86400000 * 10).toISOString(), status: 'Error', audioFileName: 'update_audio.m4a', duration: 300, selectedTone: 'Suspenseful', defaultEffectPlacement: 'manual-only', effects: [], transcript: "A quick update for everyone." },
];

export const mockTranscript = "Welcome to the Timbro podcast editor. In this episode, we'll discuss the future of AI in audio production. (Funny moment here!) It's a rapidly evolving field, with new tools and techniques emerging constantly. (Dramatic reveal here!) The potential for creators is immense, empowering them to achieve professional-quality results with greater ease. But with great power comes great responsibility. (Suspense builds...) We must ensure these tools are used ethically and to enhance creativity, not replace it. (Uplifting conclusion starts) Ultimately, Timbro aims to be your creative co-pilot on this exciting journey.";
