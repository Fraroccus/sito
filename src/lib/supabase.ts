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
 * Fetch percorsi from Supabase database with robust ordering support
 */
export async function fetchPercorsiFromSupabase(): Promise<Percorso[] | null> {
  if (!supabase || isSupabaseTemporarilyOffline) return null;
  try {
    // 1. Try fetching ordered by position first
    const query = supabase
      .from('percorsi')
      .select('*')
      .order('position', { ascending: true, nullsFirst: false });

    const { data, error } = await withTimeout(Promise.resolve(query), 3500);

    if (!error && data && data.length > 0) {
      const hasNumbers = data.some((item: any) => typeof item.position === 'number' && !isNaN(item.position));
      if (hasNumbers) {
        return (data as any[]).sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999)) as Percorso[];
      }
      return (data as any[]).sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      }) as Percorso[];
    }

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
        isSupabaseTemporarilyOffline = true;
        return null;
      }

      // Fallback: order by created_at ascending
      const fallbackQuery = supabase
        .from('percorsi')
        .select('*')
        .order('created_at', { ascending: true });
      const { data: fallbackData, error: fallbackError } = await withTimeout(Promise.resolve(fallbackQuery), 3000);
      if (fallbackError) {
        const simpleQuery = supabase.from('percorsi').select('*');
        const { data: simpleData } = await withTimeout(Promise.resolve(simpleQuery), 3000);
        return simpleData as Percorso[];
      }
      return fallbackData as Percorso[];
    }

    return (data as Percorso[]) || null;
  } catch (err: any) {
    isSupabaseTemporarilyOffline = true;
    return null;
  }
}

/**
 * Fetch collaborations from Supabase database with robust ordering support
 */
export async function fetchCollaborationsFromSupabase(): Promise<Collaboration[] | null> {
  if (!supabase || isSupabaseTemporarilyOffline) return null;
  try {
    const query = supabase
      .from('collaborations')
      .select('*')
      .order('position', { ascending: true, nullsFirst: false });

    const { data, error } = await withTimeout(Promise.resolve(query), 3500);

    if (!error && data && data.length > 0) {
      const hasNumbers = data.some((item: any) => typeof item.position === 'number' && !isNaN(item.position));
      if (hasNumbers) {
        return (data as any[]).sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999)) as Collaboration[];
      }
      return (data as any[]).sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      }) as Collaboration[];
    }

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch failed')) {
        isSupabaseTemporarilyOffline = true;
        return null;
      }

      const fallbackQuery = supabase
        .from('collaborations')
        .select('*')
        .order('created_at', { ascending: true });
      const { data: fallbackData, error: fallbackError } = await withTimeout(Promise.resolve(fallbackQuery), 3000);
      if (fallbackError) {
        const simpleQuery = supabase.from('collaborations').select('*');
        const { data: simpleData } = await withTimeout(Promise.resolve(simpleQuery), 3000);
        return simpleData as Collaboration[];
      }
      return fallbackData as Collaboration[];
    }

    return (data as Collaboration[]) || null;
  } catch (err: any) {
    isSupabaseTemporarilyOffline = true;
    return null;
  }
}

/**
 * Save / sync percorsi to Supabase with deterministic order preservation
 */
export async function syncPercorsiToSupabase(percorsi: Percorso[]) {
  if (!supabase || isSupabaseTemporarilyOffline) return;
  try {
    // Deterministic timestamp sequence so order is maintained even on timestamp sorting
    const baseTime = Date.now() - (percorsi.length * 1000);
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
      created_at: new Date(baseTime + idx * 1000).toISOString(),
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
          created_at: new Date(baseTime + idx * 1000).toISOString(),
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
    const baseTime = Date.now() - (collaborations.length * 1000);
    const payloadFull = collaborations.map((c, idx) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      logoText: c.logoText || '',
      logoUrl: c.logoUrl || '',
      websiteUrl: c.websiteUrl || '',
      position: idx,
      created_at: new Date(baseTime + idx * 1000).toISOString(),
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
        const payloadStandard = collaborations.map((c, idx) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          logoText: c.logoText || '',
          logoUrl: c.logoUrl || '',
          websiteUrl: c.websiteUrl || '',
          created_at: new Date(baseTime + idx * 1000).toISOString(),
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
