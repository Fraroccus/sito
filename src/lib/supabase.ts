import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Percorso, Collaboration } from '../types';

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

let isSupabaseTemporarilyOffline = false;

export const supabase: SupabaseClient | null = isSupabaseConfigured 
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

// Helper to run query with a timeout
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 3000): Promise<T> {
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
 * Fetch percorsi from Supabase database
 */
export async function fetchPercorsiFromSupabase(): Promise<Percorso[] | null> {
  if (!supabase || isSupabaseTemporarilyOffline) return null;
  try {
    const query = supabase
      .from('percorsi')
      .select('*')
      .order('position', { ascending: true });

    const { data, error } = await withTimeout(Promise.resolve(query), 3500);

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
        isSupabaseTemporarilyOffline = true;
        return null;
      }

      if (msg.includes('position') || msg.includes('column') || msg.includes('42703')) {
        const fallbackQuery = supabase.from('percorsi').select('*');
        const { data: fallbackData, error: fallbackError } = await withTimeout(Promise.resolve(fallbackQuery), 3000);
        if (fallbackError) {
          return null;
        }
        return fallbackData as Percorso[];
      }

      return null;
    }
    return data as Percorso[];
  } catch (err: any) {
    isSupabaseTemporarilyOffline = true;
    return null;
  }
}

/**
 * Fetch collaborations from Supabase database
 */
export async function fetchCollaborationsFromSupabase(): Promise<Collaboration[] | null> {
  if (!supabase || isSupabaseTemporarilyOffline) return null;
  try {
    const query = supabase
      .from('collaborations')
      .select('*')
      .order('position', { ascending: true });

    const { data, error } = await withTimeout(Promise.resolve(query), 3500);

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
        isSupabaseTemporarilyOffline = true;
        return null;
      }

      if (msg.includes('position') || msg.includes('column') || msg.includes('42703')) {
        const fallbackQuery = supabase.from('collaborations').select('*');
        const { data: fallbackData, error: fallbackError } = await withTimeout(Promise.resolve(fallbackQuery), 3000);
        if (fallbackError) {
          return null;
        }
        return fallbackData as Collaboration[];
      }

      return null;
    }
    return data as Collaboration[];
  } catch (err: any) {
    isSupabaseTemporarilyOffline = true;
    return null;
  }
}

/**
 * Save / sync percorsi to Supabase
 */
export async function syncPercorsiToSupabase(percorsi: Percorso[]) {
  if (!supabase || isSupabaseTemporarilyOffline) return;
  try {
    const payloadFull = percorsi.map((p, idx) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      duration: p.duration,
      category: p.category,
      image: p.image || '',
      gradientIndex: p.gradientIndex ?? (idx % 6),
      topics: p.topics || [],
      isExample: p.isExample || false,
      position: idx,
      requiresKit: p.requiresKit || false,
    }));

    const upsertPromise = supabase
      .from('percorsi')
      .upsert(payloadFull, { onConflict: 'id' });

    const { error } = await withTimeout(Promise.resolve(upsertPromise), 4000);

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
        isSupabaseTemporarilyOffline = true;
        return;
      }

      // If position or requiresKit column doesn't exist in Supabase schema
      if (msg.includes('schema cache') || msg.includes('column') || msg.includes('42703')) {
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
        }));
        
        const fallbackPromise = supabase
          .from('percorsi')
          .upsert(payloadStandard, { onConflict: 'id' });

        await withTimeout(Promise.resolve(fallbackPromise), 3000);
      }
    }
  } catch (err: any) {
    isSupabaseTemporarilyOffline = true;
  }
}

/**
 * Save / sync collaborations to Supabase
 */
export async function syncCollaborationsToSupabase(collaborations: Collaboration[]) {
  if (!supabase || isSupabaseTemporarilyOffline) return;
  try {
    const payloadFull = collaborations.map((c, idx) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      logoText: c.logoText || '',
      logoUrl: c.logoUrl || '',
      websiteUrl: c.websiteUrl || '',
      position: idx,
    }));

    const upsertPromise = supabase
      .from('collaborations')
      .upsert(payloadFull, { onConflict: 'id' });

    const { error } = await withTimeout(Promise.resolve(upsertPromise), 4000);

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
        isSupabaseTemporarilyOffline = true;
        return;
      }

      // If position column doesn't exist in Supabase schema
      if (msg.includes('schema cache') || msg.includes('column') || msg.includes('42703')) {
        const payloadStandard = collaborations.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          logoText: c.logoText || '',
          logoUrl: c.logoUrl || '',
          websiteUrl: c.websiteUrl || '',
        }));

        const fallbackPromise = supabase
          .from('collaborations')
          .upsert(payloadStandard, { onConflict: 'id' });

        await withTimeout(Promise.resolve(fallbackPromise), 3000);
      }
    }
  } catch (err: any) {
    isSupabaseTemporarilyOffline = true;
  }
}

/**
 * Delete a percorso from Supabase
 */
export async function deletePercorsoFromSupabase(id: string) {
  if (!supabase || isSupabaseTemporarilyOffline) return;
  try {
    const query = supabase.from('percorsi').delete().eq('id', id);
    await withTimeout(Promise.resolve(query), 3000);
  } catch (err: any) {
    isSupabaseTemporarilyOffline = true;
  }
}

/**
 * Delete a collaboration from Supabase
 */
export async function deleteCollaborationFromSupabase(id: string) {
  if (!supabase || isSupabaseTemporarilyOffline) return;
  try {
    const query = supabase.from('collaborations').delete().eq('id', id);
    await withTimeout(Promise.resolve(query), 3000);
  } catch (err: any) {
    isSupabaseTemporarilyOffline = true;
  }
}
