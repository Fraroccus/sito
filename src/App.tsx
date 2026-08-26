/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Collaborations from './components/Collaborations';
import Courses from './components/Courses';
import ContactForm from './components/ContactForm';
import VideoInterview from './components/VideoInterview';
import AdminLoginModal from './components/AdminLoginModal';
import { Percorso, Collaboration, VideoInterviewData } from './types';
import { INITIAL_PERCORSI, DEFAULT_COLLABORATIONS, DEFAULT_VIDEO_INTERVIEW, normalizeVideoData } from './data';
import {
  isSupabaseConfigured,
  fetchPercorsiFromSupabase,
  fetchCollaborationsFromSupabase,
  syncPercorsiToSupabase,
  syncCollaborationsToSupabase,
  deletePercorsoFromSupabase,
  deleteCollaborationFromSupabase
} from './lib/supabase';
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
  const videoInterviewRef = React.useRef(videoInterview);

  React.useEffect(() => {
    percorsiRef.current = percorsi;
  }, [percorsi]);

  React.useEffect(() => {
    collaborationsRef.current = collaborations;
  }, [collaborations]);

  React.useEffect(() => {
    videoInterviewRef.current = videoInterview;
  }, [videoInterview]);

  // Sync state with server backend and Supabase
  const syncData = async (
    updatedPercorsi: Percorso[], 
    updatedCollabs: Collaboration[], 
    updatedVideo?: VideoInterviewData
  ) => {
    const currentVideo = updatedVideo || videoInterviewRef.current;
    const cleanPercorsi = filterRealPercorsi(updatedPercorsi);
    const cleanCollabs = filterRealCollaborations(updatedCollabs);

    // Sync with Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await syncPercorsiToSupabase(cleanPercorsi);
        await syncCollaborationsToSupabase(cleanCollabs);
      } catch (sbErr) {
        console.warn('Avviso sincronizzazione Supabase:', sbErr);
      }
    }

    // Sync with Express local server (/api/data) with retry and graceful fallback
    const payload = JSON.stringify({ 
      percorsi: cleanPercorsi, 
      collaborations: cleanCollabs,
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
  };

// Helper to merge server and local cache data gracefully without losing images or custom ordering
const mergePercorsi = (serverP: Percorso[], localP: Percorso[]): Percorso[] => {
  const cleanServerP = filterRealPercorsi(serverP || []);
  const cleanLocalP = filterRealPercorsi(localP || []);

  if (cleanServerP.length === 0) return cleanLocalP;
  if (cleanLocalP.length === 0) return cleanServerP;

  const serverMap = new Map<string, Percorso>(cleanServerP.map(p => [p.id, p]));
  const result: Percorso[] = [];
  const processedIds = new Set<string>();

  // 1. Iterate localP first to preserve user's custom sequence order from localStorage
  for (const lp of cleanLocalP) {
    const sp = serverMap.get(lp.id);
    if (sp) {
      result.push({
        ...sp,
        image: sp.image || lp.image || '',
        gradientIndex: sp.gradientIndex ?? lp.gradientIndex ?? 0
      });
    } else {
      result.push(lp);
    }
    processedIds.add(lp.id);
  }

  // 2. Append any new server percorsi created elsewhere
  for (const sp of cleanServerP) {
    if (!processedIds.has(sp.id)) {
      result.push(sp);
    }
  }

  return filterRealPercorsi(result);
};

const mergeCollaborations = (serverC: Collaboration[], localC: Collaboration[]): Collaboration[] => {
  const cleanServerC = filterRealCollaborations(serverC || []);
  const cleanLocalC = filterRealCollaborations(localC || []);

  if (cleanServerC.length === 0) return cleanLocalC;
  if (cleanLocalC.length === 0) return cleanServerC;

  const serverMap = new Map<string, Collaboration>(cleanServerC.map(c => [c.id, c]));
  const result: Collaboration[] = [];
  const processedIds = new Set<string>();

  // 1. Iterate localC first to preserve user's custom sequence order from localStorage
  for (const lc of cleanLocalC) {
    const sc = serverMap.get(lc.id);
    if (sc) {
      result.push({
        ...sc,
        logoUrl: sc.logoUrl || lc.logoUrl || ''
      });
    } else {
      result.push(lc);
    }
    processedIds.add(lc.id);
  }

  // 2. Append any new server collaborations created elsewhere
  for (const sc of cleanServerC) {
    if (!processedIds.has(sc.id)) {
      result.push(sc);
    }
  }

  return filterRealCollaborations(result);
};

  // Fetch initial data on mount (checks Supabase or Express API first)
  useEffect(() => {
    const fetchInitialData = async () => {
      // Read local cache first for smart merge
      const savedPercorsiRaw = localStorage.getItem('francesco_rocco_percorsi');
      const savedCollabsRaw = localStorage.getItem('francesco_rocco_collaborations');
      let localP: Percorso[] = [];
      let localC: Collaboration[] = [];
      if (savedPercorsiRaw) {
        try { localP = filterRealPercorsi(JSON.parse(savedPercorsiRaw) || []); } catch(e) {}
      }
      if (savedCollabsRaw) {
        try { localC = filterRealCollaborations(JSON.parse(savedCollabsRaw) || []); } catch(e) {}
      }

      // 1. Try Supabase first if configured
      let loadedFromSupabase = false;
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

          const supabasePercorsiRaw = await fetchPercorsiFromSupabase();
          const supabaseCollabsRaw = await fetchCollaborationsFromSupabase();
          const supabasePercorsi = filterRealPercorsi(supabasePercorsiRaw || []);
          const supabaseCollabs = filterRealCollaborations(supabaseCollabsRaw || []);

          if (supabasePercorsi && supabasePercorsi.length > 0) {
            const mergedP = mergePercorsi(supabasePercorsi, localP);
            setPercorsi(mergedP);
            percorsiRef.current = mergedP;
            loadedFromSupabase = true;
            try {
              localStorage.setItem('francesco_rocco_percorsi', JSON.stringify(mergedP));
            } catch (e) {
              try {
                const lightweightP = mergedP.map(p => ({ ...p, image: p.image && p.image.length > 2000 ? '' : p.image }));
                localStorage.setItem('francesco_rocco_percorsi', JSON.stringify(lightweightP));
              } catch (e2) {}
            }
          }
          if (supabaseCollabs && supabaseCollabs.length > 0) {
            const mergedC = mergeCollaborations(supabaseCollabs, localC);
            setCollaborations(mergedC);
            collaborationsRef.current = mergedC;
            loadedFromSupabase = true;
            try {
              localStorage.setItem('francesco_rocco_collaborations', JSON.stringify(mergedC));
            } catch (e) {
              try {
                const lightweightC = mergedC.map(c => ({ ...c, logoUrl: c.logoUrl && c.logoUrl.length > 2000 ? '' : c.logoUrl }));
                localStorage.setItem('francesco_rocco_collaborations', JSON.stringify(lightweightC));
              } catch (e2) {}
            }
          }

          if (loadedFromSupabase) {
            return;
          }
        } catch (supabaseErr) {
          console.warn('Avviso recupero Supabase, continuazione con storage locale:', supabaseErr);
        }
      }

      // 2. Try Express backend server (/api/data) - db.json is persistent and supports large base64 thumbnails
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const data = await response.json();
          let loadedFromBackend = false;

          const serverP = data.percorsi || [];
          const serverC = data.collaborations || [];

          if (serverP.length > 0 || localP.length > 0) {
            const mergedP = mergePercorsi(serverP, localP);
            setPercorsi(mergedP);
            percorsiRef.current = mergedP;
            loadedFromBackend = true;
            try {
              localStorage.setItem('francesco_rocco_percorsi', JSON.stringify(mergedP));
            } catch (e) {
              try {
                const lightweightP = mergedP.map(p => ({ ...p, image: p.image && p.image.length > 2000 ? '' : p.image }));
                localStorage.setItem('francesco_rocco_percorsi', JSON.stringify(lightweightP));
              } catch (e2) {}
            }
          }
          if (serverC.length > 0 || localC.length > 0) {
            const mergedC = mergeCollaborations(serverC, localC);
            setCollaborations(mergedC);
            collaborationsRef.current = mergedC;
            loadedFromBackend = true;
            try {
              localStorage.setItem('francesco_rocco_collaborations', JSON.stringify(mergedC));
            } catch (e) {
              try {
                const lightweightC = mergedC.map(c => ({ ...c, logoUrl: c.logoUrl && c.logoUrl.length > 2000 ? '' : c.logoUrl }));
                localStorage.setItem('francesco_rocco_collaborations', JSON.stringify(lightweightC));
              } catch (e2) {}
            }
          }

          if (data.videoInterview && typeof data.videoInterview === 'object') {
            const serverVideo = normalizeVideoData(data.videoInterview);
            setVideoInterview(serverVideo);
            videoInterviewRef.current = serverVideo;
            try {
              localStorage.setItem('francesco_rocco_video_interview', JSON.stringify(serverVideo));
            } catch (e) {}
          }

          if (loadedFromBackend) {
            // Only push back if local storage had additional entries not present on server
            const hasNewLocalP = localP.some(lp => !serverP.some((sp: Percorso) => sp.id === lp.id));
            const hasNewLocalC = localC.some(lc => !serverC.some((sc: Collaboration) => sc.id === lc.id));
            if (hasNewLocalP || hasNewLocalC) {
              syncData(percorsiRef.current, collaborationsRef.current, videoInterviewRef.current);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Avviso recupero backend iniziale, operatività con dati locali:', err);
      }

      // 3. Fallback to localStorage ONLY if backend/server returned no data or failed
      if (localP.length > 0) {
        setPercorsi(localP);
        percorsiRef.current = localP;
      }
      if (localC.length > 0) {
        setCollaborations(localC);
        collaborationsRef.current = localC;
      }
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

  // Save changes to localStorage and databases
  const saveToStorage = (updatedPercorsi: Percorso[]) => {
    percorsiRef.current = updatedPercorsi;
    setPercorsi(updatedPercorsi);
    try {
      localStorage.setItem('francesco_rocco_percorsi', JSON.stringify(updatedPercorsi));
    } catch (e) {
      console.warn('Impossibile salvare in localStorage (quota superata):', e);
      try {
        const lightweightP = updatedPercorsi.map(p => ({ ...p, image: p.image && p.image.length > 2000 ? '' : p.image }));
        localStorage.setItem('francesco_rocco_percorsi', JSON.stringify(lightweightP));
      } catch (e2) {}
    }
    syncData(updatedPercorsi, collaborationsRef.current);
  };

  const handleAddCourse = (newCourse: Percorso) => {
    const updated = [newCourse, ...percorsi];
    saveToStorage(updated);
  };

  const handleUpdateCourse = (updatedCourse: Percorso) => {
    const updated = percorsi.map(item => item.id === updatedCourse.id ? updatedCourse : item);
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
    try {
      localStorage.setItem('francesco_rocco_collaborations', JSON.stringify(updatedCollabs));
    } catch (e) {
      console.warn('Impossibile salvare le collaborazioni in localStorage (quota superata):', e);
      try {
        const lightweightC = updatedCollabs.map(c => ({ ...c, logoUrl: c.logoUrl && c.logoUrl.length > 2000 ? '' : c.logoUrl }));
        localStorage.setItem('francesco_rocco_collaborations', JSON.stringify(lightweightC));
      } catch (e2) {}
    }
    syncData(percorsiRef.current, updatedCollabs);
  };

  const handleAddCollab = (newCollab: Collaboration) => {
    const updated = [...collaborations, newCollab];
    saveCollabsToStorage(updated);
  };

  const handleUpdateCollab = (updatedCollab: Collaboration) => {
    const updated = collaborations.map(item => item.id === updatedCollab.id ? updatedCollab : item);
    saveCollabsToStorage(updated);
  };

  const handleDeleteCollab = (id: string) => {
    const updated = collaborations.filter(item => item.id !== id);
    if (isSupabaseConfigured) {
      deleteCollaborationFromSupabase(id);
    }
    saveCollabsToStorage(updated);
  };

  const handleUpdateVideoInterview = (updated: VideoInterviewData) => {
    videoInterviewRef.current = updated;
    setVideoInterview(updated);
    try {
      localStorage.setItem('francesco_rocco_video_interview', JSON.stringify(updated));
    } catch (e) {
      console.warn('Impossibile salvare la videointervista in localStorage:', e);
    }
    syncData(percorsiRef.current, collaborationsRef.current, updated);
  };

  // Local file backup download
  const handleExportBackup = () => {
    const dataStr = JSON.stringify({ percorsi, collaborations, videoInterview }, null, 2);
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
          if (parsed && (parsed.percorsi || parsed.collaborations || parsed.videoInterview)) {
            const importedPercorsi = parsed.percorsi || [];
            const importedCollabs = parsed.collaborations || [];
            const importedVideo = parsed.videoInterview || videoInterviewRef.current;
            
            setPercorsi(importedPercorsi);
            setCollaborations(importedCollabs);
            setVideoInterview(importedVideo);
            
            localStorage.setItem('francesco_rocco_percorsi', JSON.stringify(importedPercorsi));
            localStorage.setItem('francesco_rocco_collaborations', JSON.stringify(importedCollabs));
            localStorage.setItem('francesco_rocco_video_interview', JSON.stringify(importedVideo));
            
            syncData(importedPercorsi, importedCollabs, importedVideo);
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
