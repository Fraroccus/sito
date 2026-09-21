/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Collaborations from './components/Collaborations';
import Courses from './components/Courses';
import Progetti from './components/Progetti';
import ContactForm from './components/ContactForm';
import VideoInterview from './components/VideoInterview';
import AdminLoginModal from './components/AdminLoginModal';
import { Percorso, Collaboration, VideoInterviewData, Progetto } from './types';
import { INITIAL_PERCORSI, DEFAULT_COLLABORATIONS, DEFAULT_VIDEO_INTERVIEW, INITIAL_PROGETTI, normalizeVideoData } from './data';
import {
  isSupabaseConfigured,
  fetchPercorsiFromSupabase,
  fetchCollaborationsFromSupabase,
  fetchProgettiFromSupabase,
  syncPercorsiToSupabase,
  syncCollaborationsToSupabase,
  syncProgettiToSupabase,
  deletePercorsoFromSupabase,
  deleteCollaborationFromSupabase,
  deleteProgettoFromSupabase
} from './lib/supabase';
import { idbGet, idbSet } from './lib/storage';
import { ShieldCheck, LogOut, Code, Info, ArrowUp, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // State for administrative access
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Helper to check and filter out unwanted sample/placeholder courses
  const isExampleCourse = (p: Percorso) => {
    if (!p) return true;
    if (p.isExample) return true;
    if (p.id && (p.id.startsWith('percorso-esempio-') || p.id === 'percorso-1' || p.id === 'percorso-2' || p.id === 'percorso-3')) return true;
    if (p.title && p.title.toLowerCase().includes('(esempio')) return true;
    return false;
  };

  const filterRealPercorsi = (list: Percorso[]): Percorso[] => {
    if (!Array.isArray(list)) return [];
    return list.filter(p => !isExampleCourse(p));
  };

  const filterRealCollaborations = (list: Collaboration[]): Collaboration[] => {
    if (!Array.isArray(list)) return [];
    const mockIds = new Set(['collab-1', 'collab-2', 'collab-3', 'collab-4']);
    const nonMock = list.filter(c => !mockIds.has(c.id));
    return nonMock.length > 0 ? nonMock : list;
  };

  // Helper to check and filter out sample/placeholder projects
  const isExampleProgetto = (p: Progetto) => {
    if (!p) return true;
    if (p.isExample) return true;
    if (p.id && (p.id.startsWith('progetto-esempio-') || p.id === 'progetto-1' || p.id === 'progetto-2' || p.id === 'progetto-3' || p.id === 'progetto-4' || p.id === 'progetto-5')) return true;
    if (p.title && p.title.toLowerCase().includes('(esempio')) return true;
    return false;
  };

  const filterRealProgetti = (list: Progetto[]): Progetto[] => {
    if (!Array.isArray(list)) return [];
    const nonMock = list.filter(p => !isExampleProgetto(p));
    return nonMock.length > 0 ? nonMock : list;
  };

  // Load and store course data securely in local state with fallback
  const [percorsi, setPercorsi] = useState<Percorso[]>(() => {
    const saved = localStorage.getItem('francesco_rocco_percorsi');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = filterRealPercorsi(parsed);
          if (filtered.length > 0) return filtered;
        }
      } catch (e) {
        console.error('Failed to parse percorsi from localStorage', e);
      }
    }
    return filterRealPercorsi(INITIAL_PERCORSI);
  });

  // Load and store collaborations/partners data in local state with fallback
  const [collaborations, setCollaborations] = useState<Collaboration[]>(() => {
    const saved = localStorage.getItem('francesco_rocco_collaborations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = filterRealCollaborations(parsed);
          if (filtered.length > 0) return filtered;
        }
      } catch (e) {
        console.error('Failed to parse collaborations from localStorage', e);
      }
    }
    return filterRealCollaborations(DEFAULT_COLLABORATIONS);
  });

  // Load and store progetti data in local state with fallback
  const [progetti, setProgetti] = useState<Progetto[]>(() => {
    const saved = localStorage.getItem('francesco_rocco_progetti');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = filterRealProgetti(parsed);
          if (filtered.length > 0) return filtered;
        }
      } catch (e) {
        console.error('Failed to parse progetti from localStorage', e);
      }
    }
    return filterRealProgetti(INITIAL_PROGETTI);
  });

  // Load and store video interview data in local state with fallback
  const [videoInterview, setVideoInterview] = useState<VideoInterviewData>(() => {
    const saved = localStorage.getItem('francesco_rocco_video_interview');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return normalizeVideoData(parsed);
        }
      } catch (e) {
        console.error('Failed to parse video interview from localStorage', e);
      }
    }
    return DEFAULT_VIDEO_INTERVIEW;
  });

  // Keep refs up-to-date to avoid stale closures in sync calls
  const percorsiRef = React.useRef(percorsi);
  const collaborationsRef = React.useRef(collaborations);
  const progettiRef = React.useRef(progetti);
  const videoInterviewRef = React.useRef(videoInterview);

  React.useEffect(() => {
    percorsiRef.current = percorsi;
  }, [percorsi]);

  React.useEffect(() => {
    collaborationsRef.current = collaborations;
  }, [collaborations]);

  React.useEffect(() => {
    progettiRef.current = progetti;
  }, [progetti]);

  React.useEffect(() => {
    videoInterviewRef.current = videoInterview;
  }, [videoInterview]);

  // Sync state with server backend and Supabase
  const syncData = async (
    updatedPercorsi: Percorso[], 
    updatedCollabs: Collaboration[], 
    updatedVideo?: VideoInterviewData,
    updatedProgetti?: Progetto[]
  ) => {
    const currentVideo = updatedVideo || videoInterviewRef.current;
    const currentProgetti = updatedProgetti || progettiRef.current;
    const cleanPercorsi = filterRealPercorsi(updatedPercorsi);
    const cleanCollabs = filterRealCollaborations(updatedCollabs);
    const cleanProgetti = filterRealProgetti(currentProgetti);

    // 1. Immediately sync with Express local server (/api/data) - fast, reliable, zero lag
    const payload = JSON.stringify({ 
      percorsi: cleanPercorsi, 
      collaborations: cleanCollabs,
      progetti: cleanProgetti,
      videoInterview: currentVideo
    });

    const sendPayload = async (retriesLeft = 1): Promise<void> => {
      try {
        const res = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        });
        if (!res.ok && retriesLeft > 0) {
          setTimeout(() => sendPayload(retriesLeft - 1), 1000);
        }
      } catch (err) {
        if (retriesLeft > 0) {
          setTimeout(() => sendPayload(retriesLeft - 1), 1200);
        } else {
          console.warn('Sincronizzazione server in background non disponibile al momento, salvataggio locale attivo');
        }
      }
    };

    sendPayload();

    // 2. In parallel, sync with Supabase in background if configured (never blocks local persistence)
    if (isSupabaseConfigured) {
      Promise.allSettled([
        syncPercorsiToSupabase(cleanPercorsi),
        syncCollaborationsToSupabase(cleanCollabs),
        syncProgettiToSupabase(cleanProgetti)
      ]).catch(() => {});
    }
  };

const mergeProgetti = (remoteP: Progetto[], localP: Progetto[]): Progetto[] => {
  const cleanRemote = filterRealProgetti(remoteP || []);
  const cleanLocal = filterRealProgetti(localP || []);

  if (cleanRemote.length === 0) return cleanLocal;
  if (cleanLocal.length === 0) return cleanRemote;

  const remoteMap = new Map<string, Progetto>(cleanRemote.map(p => [p.id, p]));
  const result: Progetto[] = [];
  const processedIds = new Set<string>();

  for (const lp of cleanLocal) {
    const rp = remoteMap.get(lp.id);
    if (rp) {
      const localTime = lp.updated_at ? new Date(lp.updated_at).getTime() : 0;
      const remoteTime = (rp.updated_at || rp.created_at) ? new Date(rp.updated_at || rp.created_at!).getTime() : 0;

      if (localTime > remoteTime) {
        // Local edit is newer: local tags and details take precedence
        result.push({
          ...rp,
          ...lp,
          tags: Array.isArray(lp.tags) ? lp.tags : (rp.tags || []),
          image: lp.image || rp.image || '',
          gradientIndex: lp.gradientIndex ?? rp.gradientIndex ?? 0
        });
      } else {
        // Remote is newer or equal: preserve local tags/links if remote schema dropped them
        result.push({
          ...rp,
          tags: (Array.isArray(rp.tags) && rp.tags.length > 0) ? rp.tags : (lp.tags || []),
          image: rp.image || lp.image || '',
          gradientIndex: rp.gradientIndex ?? lp.gradientIndex ?? 0,
          linkUrl: rp.linkUrl || lp.linkUrl,
          linkText: rp.linkText || lp.linkText,
          githubUrl: rp.githubUrl || lp.githubUrl
        });
      }
    } else {
      result.push(lp);
    }
    processedIds.add(lp.id);
  }

  for (const rp of cleanRemote) {
    if (!processedIds.has(rp.id)) {
      result.push(rp);
    }
  }

  return filterRealProgetti(result);
};

// Helper to merge server and local cache data gracefully without losing images, tags, or custom ordering
const mergePercorsi = (remoteP: Percorso[], localP: Percorso[]): Percorso[] => {
  const cleanRemote = filterRealPercorsi(remoteP || []);
  const cleanLocal = filterRealPercorsi(localP || []);

  if (cleanRemote.length === 0) return cleanLocal;
  if (cleanLocal.length === 0) return cleanRemote;

  const remoteMap = new Map<string, Percorso>(cleanRemote.map(p => [p.id, p]));
  const result: Percorso[] = [];
  const processedIds = new Set<string>();

  for (const lp of cleanLocal) {
    const rp = remoteMap.get(lp.id);
    if (rp) {
      const localTime = lp.updated_at ? new Date(lp.updated_at).getTime() : 0;
      const remoteTime = (rp.updated_at || rp.created_at) ? new Date(rp.updated_at || rp.created_at!).getTime() : 0;

      if (localTime > remoteTime) {
        result.push({
          ...rp,
          ...lp,
          image: lp.image || rp.image || '',
          gradientIndex: lp.gradientIndex ?? rp.gradientIndex ?? 0
        });
      } else {
        result.push({
          ...rp,
          image: rp.image || lp.image || '',
          gradientIndex: rp.gradientIndex ?? lp.gradientIndex ?? 0,
          requiresKit: rp.requiresKit ?? lp.requiresKit
        });
      }
    } else {
      result.push(lp);
    }
    processedIds.add(lp.id);
  }

  for (const rp of cleanRemote) {
    if (!processedIds.has(rp.id)) {
      result.push(rp);
    }
  }

  return filterRealPercorsi(result);
};

const mergeCollaborations = (remoteC: Collaboration[], localC: Collaboration[]): Collaboration[] => {
  const cleanRemote = filterRealCollaborations(remoteC || []);
  const cleanLocal = filterRealCollaborations(localC || []);

  if (cleanRemote.length === 0) return cleanLocal;
  if (cleanLocal.length === 0) return cleanRemote;

  const remoteMap = new Map<string, Collaboration>(cleanRemote.map(c => [c.id, c]));
  const result: Collaboration[] = [];
  const processedIds = new Set<string>();

  for (const lc of cleanLocal) {
    const rc = remoteMap.get(lc.id);
    if (rc) {
      const localTime = lc.updated_at ? new Date(lc.updated_at).getTime() : 0;
      const remoteTime = (rc.updated_at || rc.created_at) ? new Date(rc.updated_at || rc.created_at!).getTime() : 0;

      if (localTime > remoteTime) {
        result.push({
          ...rc,
          ...lc,
          logoUrl: lc.logoUrl || rc.logoUrl || ''
        });
      } else {
        result.push({
          ...rc,
          logoUrl: rc.logoUrl || lc.logoUrl || '',
          websiteUrl: rc.websiteUrl || lc.websiteUrl
        });
      }
    } else {
      result.push(lc);
    }
    processedIds.add(lc.id);
  }

  for (const rc of cleanRemote) {
    if (!processedIds.has(rc.id)) {
      result.push(rc);
    }
  }

  return filterRealCollaborations(result);
};

  // Fetch initial data on mount (combines IndexedDB, localStorage, Supabase, and Express API in resilient 3-way merge)
  useEffect(() => {
    const fetchInitialData = async () => {
      // 1. Read local cache (IndexedDB first, fallback to localStorage)
      let localP: Percorso[] = [];
      let localC: Collaboration[] = [];
      let localProj: Progetto[] = [];

      try {
        const idbP = await idbGet<Percorso[]>('francesco_rocco_percorsi');
        if (Array.isArray(idbP) && idbP.length > 0) localP = filterRealPercorsi(idbP);
        const idbC = await idbGet<Collaboration[]>('francesco_rocco_collaborations');
        if (Array.isArray(idbC) && idbC.length > 0) localC = filterRealCollaborations(idbC);
        const idbProj = await idbGet<Progetto[]>('francesco_rocco_progetti');
        if (Array.isArray(idbProj) && idbProj.length > 0) localProj = filterRealProgetti(idbProj);
      } catch (e) {}

      if (localP.length === 0) {
        const savedPercorsiRaw = localStorage.getItem('francesco_rocco_percorsi');
        if (savedPercorsiRaw) {
          try { localP = filterRealPercorsi(JSON.parse(savedPercorsiRaw) || []); } catch(e) {}
        }
      }
      if (localC.length === 0) {
        const savedCollabsRaw = localStorage.getItem('francesco_rocco_collaborations');
        if (savedCollabsRaw) {
          try { localC = filterRealCollaborations(JSON.parse(savedCollabsRaw) || []); } catch(e) {}
        }
      }
      if (localProj.length === 0) {
        const savedProgettiRaw = localStorage.getItem('francesco_rocco_progetti');
        if (savedProgettiRaw) {
          try { localProj = filterRealProgetti(JSON.parse(savedProgettiRaw) || []); } catch(e) {}
        }
      }

      // Working sets initialized from local storage
      let currentP = localP.length > 0 ? localP : percorsiRef.current;
      let currentC = localC.length > 0 ? localC : collaborationsRef.current;
      let currentProj = localProj.length > 0 ? localProj : progettiRef.current;
      let currentVideo = videoInterviewRef.current;

      // 2. Fetch from Supabase if configured
      if (isSupabaseConfigured) {
        try {
          // Asynchronously purge obsolete sample entries from remote database if present
          deletePercorsoFromSupabase('percorso-esempio-1').catch(() => {});
          deletePercorsoFromSupabase('percorso-esempio-2').catch(() => {});
          deletePercorsoFromSupabase('percorso-esempio-3').catch(() => {});
          deleteCollaborationFromSupabase('collab-1').catch(() => {});
          deleteCollaborationFromSupabase('collab-2').catch(() => {});
          deleteCollaborationFromSupabase('collab-3').catch(() => {});
          deleteCollaborationFromSupabase('collab-4').catch(() => {});
          deleteProgettoFromSupabase('progetto-1').catch(() => {});
          deleteProgettoFromSupabase('progetto-2').catch(() => {});
          deleteProgettoFromSupabase('progetto-3').catch(() => {});
          deleteProgettoFromSupabase('progetto-4').catch(() => {});
          deleteProgettoFromSupabase('progetto-5').catch(() => {});

          const [supabasePercorsiRaw, supabaseCollabsRaw, supabaseProgettiRaw] = await Promise.all([
            fetchPercorsiFromSupabase(),
            fetchCollaborationsFromSupabase(),
            fetchProgettiFromSupabase()
          ]);

          const supabasePercorsi = filterRealPercorsi(supabasePercorsiRaw || []);
          const supabaseCollabs = filterRealCollaborations(supabaseCollabsRaw || []);
          const supabaseProgetti = filterRealProgetti(supabaseProgettiRaw || []);

          if (supabasePercorsi.length > 0) {
            currentP = mergePercorsi(supabasePercorsi, currentP);
          }
          if (supabaseCollabs.length > 0) {
            currentC = mergeCollaborations(supabaseCollabs, currentC);
          }
          if (supabaseProgetti.length > 0) {
            currentProj = mergeProgetti(supabaseProgetti, currentProj);
          }
        } catch (supabaseErr) {
          console.warn('Avviso recupero Supabase:', supabaseErr);
        }
      }

      // 3. Fetch from Express backend server (/api/data) - db.json
      try {
        const response = await fetch('/api/data');
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          const data = await response.json();
          if (Array.isArray(data.percorsi) && data.percorsi.length > 0) {
            currentP = mergePercorsi(data.percorsi, currentP);
          }
          if (Array.isArray(data.collaborations) && data.collaborations.length > 0) {
            currentC = mergeCollaborations(data.collaborations, currentC);
          }
          if (Array.isArray(data.progetti) && data.progetti.length > 0) {
            currentProj = mergeProgetti(data.progetti, currentProj);
          }
          if (data.videoInterview && typeof data.videoInterview === 'object') {
            currentVideo = normalizeVideoData(data.videoInterview);
          }
        }
      } catch (err) {
        console.warn('Avviso recupero backend /api/data:', err);
      }

      // 4. Update React state with fully consolidated data
      setPercorsi(currentP);
      percorsiRef.current = currentP;
      setCollaborations(currentC);
      collaborationsRef.current = currentC;
      setProgetti(currentProj);
      progettiRef.current = currentProj;
      setVideoInterview(currentVideo);
      videoInterviewRef.current = currentVideo;

      // 5. Persist consolidated state into local stores
      idbSet('francesco_rocco_percorsi', currentP).catch(() => {});
      idbSet('francesco_rocco_collaborations', currentC).catch(() => {});
      idbSet('francesco_rocco_progetti', currentProj).catch(() => {});
      try {
        localStorage.setItem('francesco_rocco_percorsi', JSON.stringify(currentP));
        localStorage.setItem('francesco_rocco_collaborations', JSON.stringify(currentC));
        localStorage.setItem('francesco_rocco_progetti', JSON.stringify(currentProj));
        localStorage.setItem('francesco_rocco_video_interview', JSON.stringify(currentVideo));
      } catch (e) {
        console.warn('LocalStorage pieno, dati salvati in IndexedDB:', e);
      }

      // Background sync back to Express server to keep db.json up-to-date
      syncData(currentP, currentC, currentVideo, currentProj);
    };

    fetchInitialData();
  }, []);

  // Watch scroll position for "Back to Top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save changes to localStorage, IndexedDB, Express, and Supabase
  const saveToStorage = (updatedPercorsi: Percorso[]) => {
    percorsiRef.current = updatedPercorsi;
    setPercorsi(updatedPercorsi);
    idbSet('francesco_rocco_percorsi', updatedPercorsi).catch(() => {});
    try {
      localStorage.setItem('francesco_rocco_percorsi', JSON.stringify(updatedPercorsi));
    } catch (e) {
      console.warn('LocalStorage pieno, dati salvati in IndexedDB e server:', e);
    }
    syncData(updatedPercorsi, collaborationsRef.current);
  };

  const handleAddCourse = (newCourse: Percorso) => {
    const courseWithTimestamp: Percorso = {
      ...newCourse,
      updated_at: new Date().toISOString()
    };
    const updated = [courseWithTimestamp, ...percorsi];
    saveToStorage(updated);
  };

  const handleUpdateCourse = (updatedCourse: Percorso) => {
    const updated = percorsi.map(item => 
      item.id === updatedCourse.id 
        ? { ...item, ...updatedCourse, updated_at: new Date().toISOString() } 
        : item
    );
    saveToStorage(updated);
  };

  const handleDeleteCourse = (id: string) => {
    const updated = percorsi.filter(item => item.id !== id);
    if (isSupabaseConfigured) {
      deletePercorsoFromSupabase(id);
    }
    saveToStorage(updated);
  };

  // Collaborations / Partners handlers
  const saveCollabsToStorage = (updatedCollabs: Collaboration[]) => {
    collaborationsRef.current = updatedCollabs;
    setCollaborations(updatedCollabs);
    idbSet('francesco_rocco_collaborations', updatedCollabs).catch(() => {});
    try {
      localStorage.setItem('francesco_rocco_collaborations', JSON.stringify(updatedCollabs));
    } catch (e) {
      console.warn('LocalStorage pieno, dati salvati in IndexedDB e server:', e);
    }
    syncData(percorsiRef.current, updatedCollabs);
  };

  const handleAddCollab = (newCollab: Collaboration) => {
    const collabWithTimestamp: Collaboration = {
      ...newCollab,
      updated_at: new Date().toISOString()
    };
    const updated = [...collaborations, collabWithTimestamp];
    saveCollabsToStorage(updated);
  };

  const handleUpdateCollab = (updatedCollab: Collaboration) => {
    const updated = collaborations.map(item => 
      item.id === updatedCollab.id 
        ? { ...item, ...updatedCollab, updated_at: new Date().toISOString() } 
        : item
    );
    saveCollabsToStorage(updated);
  };

  const handleDeleteCollab = (id: string) => {
    const updated = collaborations.filter(item => item.id !== id);
    if (isSupabaseConfigured) {
      deleteCollaborationFromSupabase(id);
    }
    saveCollabsToStorage(updated);
  };

  // Progetti handlers
  const saveProgettiToStorage = (updatedProgetti: Progetto[]) => {
    progettiRef.current = updatedProgetti;
    setProgetti(updatedProgetti);
    idbSet('francesco_rocco_progetti', updatedProgetti).catch(() => {});
    try {
      localStorage.setItem('francesco_rocco_progetti', JSON.stringify(updatedProgetti));
    } catch (e) {
      console.warn('LocalStorage pieno, dati salvati in IndexedDB e server:', e);
    }
    syncData(percorsiRef.current, collaborationsRef.current, videoInterviewRef.current, updatedProgetti);
  };

  const handleAddProgetto = (newProgetto: Progetto) => {
    const projectWithTimestamp: Progetto = {
      ...newProgetto,
      updated_at: new Date().toISOString()
    };
    const updated = [projectWithTimestamp, ...progetti];
    saveProgettiToStorage(updated);
  };

  const handleUpdateProgetto = (updatedProgetto: Progetto) => {
    const updated = progetti.map(item => 
      item.id === updatedProgetto.id 
        ? { ...item, ...updatedProgetto, updated_at: new Date().toISOString() } 
        : item
    );
    saveProgettiToStorage(updated);
  };

  const handleDeleteProgetto = (id: string) => {
    const updated = progetti.filter(item => item.id !== id);
    if (isSupabaseConfigured) {
      deleteProgettoFromSupabase(id);
    }
    saveProgettiToStorage(updated);
  };

  const handleUpdateVideoInterview = (updated: VideoInterviewData) => {
    videoInterviewRef.current = updated;
    setVideoInterview(updated);
    try {
      localStorage.setItem('francesco_rocco_video_interview', JSON.stringify(updated));
    } catch (e) {
      console.warn('Impossibile salvare la videointervista in localStorage:', e);
    }
    syncData(percorsiRef.current, collaborationsRef.current, updated, progettiRef.current);
  };

  // Local file backup download
  const handleExportBackup = () => {
    const dataStr = JSON.stringify({ percorsi, collaborations, progetti, videoInterview }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `backup_formatore_ai_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Local file backup load
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && (parsed.percorsi || parsed.collaborations || parsed.progetti || parsed.videoInterview)) {
            const importedPercorsi = parsed.percorsi || [];
            const importedCollabs = parsed.collaborations || [];
            const importedProgetti = parsed.progetti || [];
            const importedVideo = parsed.videoInterview || videoInterviewRef.current;
            
            setPercorsi(importedPercorsi);
            setCollaborations(importedCollabs);
            if (importedProgetti.length > 0) {
              setProgetti(importedProgetti);
              localStorage.setItem('francesco_rocco_progetti', JSON.stringify(importedProgetti));
            }
            setVideoInterview(importedVideo);
            
            localStorage.setItem('francesco_rocco_percorsi', JSON.stringify(importedPercorsi));
            localStorage.setItem('francesco_rocco_collaborations', JSON.stringify(importedCollabs));
            localStorage.setItem('francesco_rocco_video_interview', JSON.stringify(importedVideo));
            
            syncData(importedPercorsi, importedCollabs, importedVideo, importedProgetti.length > 0 ? importedProgetti : undefined);
            alert("Backup ripristinato con successo sia localmente che sul database!");
          } else {
            alert("Il file non sembra essere un formato di backup valido.");
          }
        } catch (error) {
          alert("Errore nel caricare il backup: " + error);
        }
      };
    }
  };

  const handleToggleAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdmin(true);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white antialiased font-sans flex flex-col justify-between">
      
      {/* Dynamic Header & Sticky Navbar */}
      <Navbar />

      {/* Admin Quick Panel Banner */}
      <AnimatePresence>
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-40 bg-slate-900 text-white border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 max-w-sm sm:max-w-md"
            id="admin-persistent-badge"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-500 rounded-xl text-slate-950 shrink-0">
                <ShieldCheck className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 space-y-0.5">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-emerald-400">
                  Modalità Editor Attiva
                </h4>
                <p className="font-sans text-[10px] text-slate-400 leading-tight">
                  Sei abilitato ad apportare modifiche persistenti salvate in tempo reale sul server.
                </p>
              </div>
              <button
                onClick={() => setIsAdmin(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 transition-colors cursor-pointer"
                title="Disconnetti modalità editor"
                id="admin-logout-badge-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Admin utilities: Backup / Restore */}
            <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                Strumenti Backup (Consigliati)
              </span>
              <div className="flex items-center gap-2">
                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer border border-slate-700/50"
                  title="Scarica backup completo in formato JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  Esporta
                </button>

                {/* Import Button */}
                <label
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer border border-slate-700/50"
                  title="Carica backup JSON precedentemente salvato"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ripristina</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Single Page Sections */}
      <main className="flex-1">
        {/* Section 1: Hero & Presentation */}
        <Hero 
          onExploreCourses={() => {
            const el = document.getElementById('percorsi');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }} 
          onContactClick={() => {
            const el = document.getElementById('contatti');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }} 
        />

        {/* Section 2: Dynamic Courses & Content manager */}
        <Courses 
          percorsi={percorsi}
          isAdmin={isAdmin}
          onAddCourse={handleAddCourse}
          onUpdateCourse={handleUpdateCourse}
          onDeleteCourse={handleDeleteCourse}
          onReorderCourses={saveToStorage}
        />

        {/* Section 3: Lead Generation & Contact form */}
        <ContactForm />

        {/* Section 4: Entities & Partners Spaceholders */}
        <Collaborations 
          collaborations={collaborations}
          isAdmin={isAdmin}
          onAddCollab={handleAddCollab}
          onUpdateCollab={handleUpdateCollab}
          onDeleteCollab={handleDeleteCollab}
          onReorderCollabs={saveCollabsToStorage}
        />

        {/* Section: Progetti Realizzati & Attività */}
        <Progetti 
          progetti={progetti}
          isAdmin={isAdmin}
          onAddProgetto={handleAddProgetto}
          onUpdateProgetto={handleUpdateProgetto}
          onDeleteProgetto={handleDeleteProgetto}
          onReorderProgetti={saveProgettiToStorage}
        />

        {/* Section 5: Video Interview Section (Google Drive 657MB player & media) */}
        <VideoInterview 
          data={videoInterview}
          isAdmin={isAdmin}
          onUpdate={handleUpdateVideoInterview}
        />
      </main>

      {/* Footer block */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Column 1: Monogram and mission */}
            <div className="md:col-span-5 space-y-4">
              <h3 className="font-sans font-bold text-lg text-white tracking-tight uppercase">
                Francesco Rocco
              </h3>
              <p className="font-sans text-xs text-slate-500 max-w-sm leading-relaxed">
                Formatore e consulente specializzato nell'accompagnare istituzioni scolastiche, PMI e professionisti nell'adozione pratica dell'Intelligenza Artificiale Generativa.
              </p>
              <div className="flex items-center gap-1.5 font-mono text-[9px] text-indigo-400 uppercase tracking-wider font-semibold">
                <Code className="w-3.5 h-3.5" />
                <span>Pratico. Concreto. Misurabile.</span>
              </div>
            </div>

            {/* Column 2: Quick scroll navigation */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
                Mappa del Sito
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                <button 
                  onClick={() => document.getElementById('presentazione')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-left hover:text-white transition-colors cursor-pointer"
                >
                  Presentazione
                </button>
                <button 
                  onClick={() => document.getElementById('collaborazioni')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-left hover:text-white transition-colors cursor-pointer"
                >
                  Collaborazioni
                </button>
                <button 
                  onClick={() => document.getElementById('progetti')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-left hover:text-white transition-colors cursor-pointer"
                >
                  Progetti
                </button>
                <button 
                  onClick={() => document.getElementById('percorsi')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-left hover:text-white transition-colors cursor-pointer"
                >
                  Percorsi Formativi
                </button>
                <button 
                  onClick={() => document.getElementById('video-intervista')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-left hover:text-white transition-colors cursor-pointer"
                >
                  Video Intervista
                </button>
                <button
                  onClick={handleToggleAdmin}
                  className="text-left text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                  id="footer-admin-trigger"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>{isAdmin ? 'Modalità Autore Attiva' : 'Pannello di Controllo'}</span>
                </button>
              </div>
            </div>

            {/* Column 3: Legal info */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
                Informazioni Legali
              </h4>
              <p className="font-sans text-xs text-slate-500 leading-relaxed">
                P.IVA 04286701208<br />
                Sede operativa: Bologna
              </p>
            </div>

          </div>

        </div>
      </footer>

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 left-6 z-40 p-3 bg-white hover:bg-indigo-600 text-slate-700 hover:text-white rounded-full border border-slate-200 hover:border-indigo-600 shadow-xl transition-all cursor-pointer"
            title="Torna in alto"
            id="back-to-top-btn"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Admin Password Authentication popup */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}
