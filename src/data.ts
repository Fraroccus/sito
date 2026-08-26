/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Percorso, Collaboration, VideoInterviewData } from './types';

export const DEFAULT_VIDEO_INTERVIEW: VideoInterviewData = {
  title: "Intervista a StoryTime • Radio Canale Italia",
  subtitle: "Divulgazione scientifica, Gamification nella didattica e Intelligenza Artificiale",
  description: "Francesco Rocco, formatore e divulgatore, ospite negli studi di StoryTime (Radio Canale Italia - Bologna) con Damiano. Un confronto su come avvicinare giovani e adulti alla scienza e alle STEM, l'efficacia della gamification, il contrasto a fake news e clickbait, e il valore dell'IA Generativa nella preparazione di lezioni e materiali didattici.",
  videoUrl: "https://www.youtube.com/watch?v=yEveLtaHpHQ",
  eventDate: "Studi di Bologna",
  organizer: "StoryTime • Radio Canale Italia",
  posterImage: "https://i.ytimg.com/vi/yEveLtaHpHQ/hqdefault.jpg"
};

export function normalizeVideoData(video: VideoInterviewData | null | undefined): VideoInterviewData {
  if (!video || typeof video !== 'object') {
    return DEFAULT_VIDEO_INTERVIEW;
  }
  let title = video.title || DEFAULT_VIDEO_INTERVIEW.title;
  if (!title.trim() || title === "StoryTime • Radio Canale Italia: Intervista a Francesco Rocco" || title.includes("Intervista a Francesco Rocco")) {
    title = "Intervista a StoryTime • Radio Canale Italia";
  }
  let videoUrl = video.videoUrl;
  if (!videoUrl || !videoUrl.trim() || videoUrl.startsWith('blob:') || videoUrl.startsWith('data:') || videoUrl.includes('drive.google.com')) {
    videoUrl = DEFAULT_VIDEO_INTERVIEW.videoUrl;
  }
  return {
    ...DEFAULT_VIDEO_INTERVIEW,
    ...video,
    title,
    videoUrl,
  };
}


export const GRADIENT_PRESETS = [
  {
    name: 'Teal & Emerald (Scuole)',
    css: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
    bgClass: 'from-teal-600 to-emerald-500',
    textClass: 'text-teal-500'
  },
  {
    name: 'Violet & Rose (PMI)',
    css: 'linear-gradient(135deg, #6366f1 0%, #f43f5e 100%)',
    bgClass: 'from-indigo-600 to-rose-500',
    textClass: 'text-indigo-500'
  },
  {
    name: 'Orange & Amber (Privati)',
    css: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
    bgClass: 'from-orange-500 to-amber-500',
    textClass: 'text-orange-500'
  },
  {
    name: 'Fuchsia & Indigo (Freelance)',
    css: 'linear-gradient(135deg, #d946ef 0%, #4f46e5 100%)',
    bgClass: 'from-fuchsia-500 to-indigo-600',
    textClass: 'text-fuchsia-500'
  }
];

export const INITIAL_PERCORSI: Percorso[] = [];

export const DEFAULT_COLLABORATIONS: Collaboration[] = [];
