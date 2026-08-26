/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = "Personale ATA" | "Scuola primaria" | "Scuola secondaria di I grado" | "Scuola secondaria di II grado" | "Formazione docenti" | 'PMI' | 'Privati' | 'CODING' | 'ROBOTICA' | 'ALTRO';

export interface Percorso {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: Category;
  image: string; // URL of the cover image
  gradientIndex?: number; // Optional index for abstract gradient background presets
  topics?: string[]; // Key topics/modules covered in the training
  requiresKit?: boolean; // Notice: "La scuola deve già essere in possesso del kit"
  isExample?: boolean; // To label the initial example
  created_at?: string;
}

export interface Collaboration {
  id: string;
  name: string;
  role: string;
  logoText: string; // Fallback text representation if logoUrl is absent
  logoUrl?: string; // Optional URL for partner logo image
  websiteUrl?: string; // Optional URL to the partner's official website
  created_at?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  category: Category | 'Generale';
  message: string;
}

export interface VideoInterviewData {
  title: string;
  subtitle: string;
  description: string;
  videoUrl: string;
  eventDate?: string;
  organizer?: string;
  posterImage?: string;
}

