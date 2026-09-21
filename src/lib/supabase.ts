/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Percorso, Collaboration, Progetto } from '../types';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

function isValidConfig(url: string, key: string): boolean {
  if (!url || !key) return false;
  if (url === 'your_supabase_project_url' || key === 'your_supabase_anon_key') return false;
  if (url.includes('your_supabase_project_url') || url.includes('placeholder')) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = isValidConfig(rawUrl, rawKey);

// Resilient temporary backoff (max 5s) instead of permanent shutoff
let lastOfflineTime = 0;

function isTemporarilyOffline(): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (Date.now() - lastOfflineTime < 5000) return true;
  return false;
}

function markOffline() {
  lastOfflineTime = Date.now();
}

export const supabase: SupabaseClient | null = isSupabaseConfigured 
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

// Helper to run query with generous timeout
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000): Promise<T> {
  let timeoutHandle: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error('Supabase request timeout'));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (err) {
    clearTimeout(timeoutHandle);
    throw err;
  }
}

/**
 * Fetch percorsi from Supabase database with robust ordering support
 */
export async function fetchPercorsiFromSupabase(): Promise<Percorso[] | null> {
  if (!supabase || isTemporarilyOffline()) return null;
  try {
    const query = supabase
      .from('percorsi')
      .select('*')
      .order('created_at', { ascending: true });

    const { data, error } = await withTimeout(Promise.resolve(query), 6000);

    if (!error && data && data.length > 0) {
      return (data as any[]).sort((a, b) => {
        if (typeof a.position === 'number' && typeof b.position === 'number') {
          return a.position - b.position;
        }
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      }) as Percorso[];
    }

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
        markOffline();
        return null;
      }
      const simpleQuery = supabase.from('percorsi').select('*');
      const { data: simpleData } = await withTimeout(Promise.resolve(simpleQuery), 5000);
      return (simpleData as Percorso[]) || null;
    }

    return (data as Percorso[]) || null;
  } catch (err: any) {
    markOffline();
    return null;
  }
}

/**
 * Fetch collaborations from Supabase database with robust ordering support
 */
export async function fetchCollaborationsFromSupabase(): Promise<Collaboration[] | null> {
  if (!supabase || isTemporarilyOffline()) return null;
  try {
    const query = supabase
      .from('collaborations')
      .select('*')
      .order('created_at', { ascending: true });

    const { data, error } = await withTimeout(Promise.resolve(query), 6000);

    if (!error && data && data.length > 0) {
      return (data as any[]).sort((a, b) => {
        if (typeof a.position === 'number' && typeof b.position === 'number') {
          return a.position - b.position;
        }
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      }) as Collaboration[];
    }

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
        markOffline();
        return null;
      }
      const simpleQuery = supabase.from('collaborations').select('*');
      const { data: simpleData } = await withTimeout(Promise.resolve(simpleQuery), 5000);
      return (simpleData as Collaboration[]) || null;
    }

    return (data as Collaboration[]) || null;
  } catch (err: any) {
    markOffline();
    return null;
  }
}

/**
 * Fetch progetti from Supabase database with fallback if table does not exist
 */
export async function fetchProgettiFromSupabase(): Promise<Progetto[] | null> {
  if (!supabase || isTemporarilyOffline()) return null;
  try {
    const query = supabase
      .from('progetti')
      .select('*')
      .order('created_at', { ascending: true });

    const { data, error } = await withTimeout(Promise.resolve(query), 6000);

    if (!error && data && data.length > 0) {
      return (data as any[]).sort((a, b) => {
        if (typeof a.position === 'number' && typeof b.position === 'number') {
          return a.position - b.position;
        }
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      }) as Progetto[];
    }

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Could not find the table') || msg.includes('does not exist')) {
        return null;
      }
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
        markOffline();
        return null;
      }
      const simpleQuery = supabase.from('progetti').select('*');
      const { data: simpleData } = await withTimeout(Promise.resolve(simpleQuery), 5000);
      return (simpleData as Progetto[]) || null;
    }

    return (data as Progetto[]) || null;
  } catch (err: any) {
    markOffline();
    return null;
  }
}

/**
 * Save / sync percorsi to Supabase
 */
export async function syncPercorsiToSupabase(percorsi: Percorso[]) {
  if (!supabase || isTemporarilyOffline() || percorsi.length === 0) return;
  try {
    const baseTime = Date.now() - (percorsi.length * 1000);
    const payloadStandard = percorsi.map((p, idx) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      duration: p.duration,
      category: p.category,
      image: p.image || '',
      gradientIndex: p.gradientIndex ?? (idx % 6),
      topics: p.topics || [],
      isExample: p.isExample || false,
      created_at: p.created_at || new Date(baseTime + idx * 1000).toISOString(),
    }));

    const upsertPromise = supabase
      .from('percorsi')
      .upsert(payloadStandard, { onConflict: 'id' });

    const { error } = await withTimeout(Promise.resolve(upsertPromise), 8000);

    if (error) {
      console.warn('Avviso sync percorsi Supabase:', error.message);
    }
  } catch (err: any) {
    console.warn('Avviso sync percorsi:', err.message);
  }
}

/**
 * Save / sync collaborations to Supabase
 * Note: Remote schema has (id, name, role, logoText, logoUrl, websiteUrl, created_at).
 * 'position' is deliberately omitted from payload to prevent PGRST204 errors.
 */
export async function syncCollaborationsToSupabase(collaborations: Collaboration[]) {
  if (!supabase || isTemporarilyOffline() || collaborations.length === 0) return;
  try {
    const baseTime = Date.now() - (collaborations.length * 1000);
    const payload = collaborations.map((c, idx) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      logoText: c.logoText || '',
      logoUrl: c.logoUrl || '',
      websiteUrl: c.websiteUrl || '',
      created_at: c.created_at || new Date(baseTime + idx * 1000).toISOString(),
    }));

    const upsertPromise = supabase
      .from('collaborations')
      .upsert(payload, { onConflict: 'id' });

    const { error } = await withTimeout(Promise.resolve(upsertPromise), 8000);

    if (error) {
      console.warn('Avviso sync collaborations Supabase:', error.message);
    }
  } catch (err: any) {
    console.warn('Avviso sync collaborations:', err.message);
  }
}

/**
 * Save / sync progetti to Supabase
 * Remote schema has (id, title, category, description, image, tags, period, client, position, created_at).
 * 'gradientIndex', 'linkUrl', 'linkText', 'githubUrl' are kept in fallback if not in schema.
 */
export async function syncProgettiToSupabase(progetti: Progetto[]) {
  if (!supabase || isTemporarilyOffline() || progetti.length === 0) return;
  try {
    const baseTime = Date.now() - (progetti.length * 1000);

    // Payload conforming to verified Supabase columns
    const payloadStandard = progetti.map((p, idx) => ({
      id: p.id,
      title: p.title,
      category: p.category || '',
      description: p.description || '',
      image: p.image || '',
      tags: p.tags || [],
      period: p.period || '',
      client: p.client || '',
      position: idx,
      created_at: p.created_at || new Date(baseTime + idx * 1000).toISOString(),
    }));

    const upsertPromise = supabase
      .from('progetti')
      .upsert(payloadStandard, { onConflict: 'id' });

    const { error } = await withTimeout(Promise.resolve(upsertPromise), 8000);

    if (error) {
      const msg = error.message || '';
      if (msg.includes('violates row-level security policy') || (error as any).code === '42501') {
        console.warn('Avviso RLS Supabase su tabella "progetti": row-level security attiva. I dati sono protetti e memorizzati in locale e sul server.');
      } else {
        console.warn('Avviso sync progetti Supabase:', msg);
      }
    }
  } catch (err: any) {
    console.warn('Avviso sync progetti:', err.message);
  }
}

/**
 * Delete a percorso from Supabase
 */
export async function deletePercorsoFromSupabase(id: string) {
  if (!supabase || isTemporarilyOffline()) return;
  try {
    const query = supabase.from('percorsi').delete().eq('id', id);
    await withTimeout(Promise.resolve(query), 5000);
  } catch (err: any) {
    console.warn('Avviso eliminazione percorso Supabase:', err.message);
  }
}

/**
 * Delete a collaboration from Supabase
 */
export async function deleteCollaborationFromSupabase(id: string) {
  if (!supabase || isTemporarilyOffline()) return;
  try {
    const query = supabase.from('collaborations').delete().eq('id', id);
    await withTimeout(Promise.resolve(query), 5000);
  } catch (err: any) {
    console.warn('Avviso eliminazione collaborazione Supabase:', err.message);
  }
}

/**
 * Delete a progetto from Supabase
 */
export async function deleteProgettoFromSupabase(id: string) {
  if (!supabase || isTemporarilyOffline()) return;
  try {
    const query = supabase.from('progetti').delete().eq('id', id);
    await withTimeout(Promise.resolve(query), 5000);
  } catch (err: any) {
    console.warn('Avviso eliminazione progetto Supabase:', err.message);
  }
}
