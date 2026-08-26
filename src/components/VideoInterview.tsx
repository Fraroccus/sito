/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2,
  Tv,
  ExternalLink,
  Play,
  Copy,
  Check,
  AlertCircle,
  UploadCloud,
  FileVideo,
  Loader2,
  Radio,
  HardDrive,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { VideoInterviewData } from '../types';
import { normalizeVideoData } from '../data';

interface VideoInterviewProps {
  data: VideoInterviewData;
  isAdmin: boolean;
  onUpdate: (updated: VideoInterviewData) => void;
}

const DEFAULT_YT_ID = 'yEveLtaHpHQ';
const DEFAULT_YT_WATCH = 'https://www.youtube.com/watch?v=yEveLtaHpHQ';

/**
 * Normalizes any external URL to ensure it has http/https protocol.
 */
export function normalizeUrl(url: string): string {
  if (!url || !url.trim()) return '';
  const trimmed = url.trim();
  // Filter out invalid/temporary blob URLs
  if (trimmed.startsWith('blob:')) {
    return DEFAULT_YT_WATCH;
  }
  if (
    trimmed.startsWith('http://') || 
    trimmed.startsWith('https://') || 
    trimmed.startsWith('data:') || 
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('/uploads/')
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Converts YouTube, Google Drive, Vimeo, or raw MP4 links into safe embed and direct watch links.
 */
export function parseVideoUrl(rawUrl: string): { 
  type: 'youtube' | 'drive' | 'iframe' | 'video' | 'empty'; 
  src: string; 
  watchUrl: string;
  videoId?: string;
  thumbnailUrl?: string;
  highResThumbnailUrl?: string;
  isDrive: boolean;
  isYouTube: boolean;
  isDirectVideo: boolean;
} {
  // If empty, null, or invalid blob URL, fallback to default YouTube video
  if (!rawUrl || !rawUrl.trim() || rawUrl.trim().startsWith('blob:')) {
    return {
      type: 'youtube',
      src: `https://www.youtube.com/embed/${DEFAULT_YT_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
      watchUrl: DEFAULT_YT_WATCH,
      videoId: DEFAULT_YT_ID,
      thumbnailUrl: `https://i.ytimg.com/vi/${DEFAULT_YT_ID}/hqdefault.jpg`,
      highResThumbnailUrl: `https://i.ytimg.com/vi/${DEFAULT_YT_ID}/hqdefault.jpg`,
      isDrive: false,
      isYouTube: true,
      isDirectVideo: false
    };
  }

  const trimmed = rawUrl.trim();

  // Local / uploaded video file on the server
  if (
    trimmed.startsWith('/uploads/') || 
    trimmed.startsWith('data:video') ||
    trimmed.match(/\.(mp4|webm|ogg|m4v|mov)(\?.*)?$/i)
  ) {
    return { 
      type: 'video', 
      src: trimmed, 
      watchUrl: trimmed, 
      isDrive: false, 
      isYouTube: false, 
      isDirectVideo: true 
    };
  }

  // YouTube match (handles youtu.be, youtube.com/watch, youtube.com/embed, youtube.com/shorts, etc.)
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    return {
      type: 'youtube',
      src: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
      videoId: id,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      highResThumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      isDrive: false,
      isYouTube: true,
      isDirectVideo: false
    };
  }

  // Google Drive: /file/d/FILE_ID/
  const driveMatch1 = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch1 && driveMatch1[1]) {
    const fileId = driveMatch1[1];
    return {
      type: 'drive',
      src: `https://drive.google.com/file/d/${fileId}/preview`,
      watchUrl: `https://drive.google.com/file/d/${fileId}/view`,
      isDrive: true,
      isYouTube: false,
      isDirectVideo: false
    };
  }

  // Google Drive: id=FILE_ID
  const driveMatch2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (trimmed.includes('drive.google.com') && driveMatch2 && driveMatch2[1]) {
    const fileId = driveMatch2[1];
    return {
      type: 'drive',
      src: `https://drive.google.com/file/d/${fileId}/preview`,
      watchUrl: `https://drive.google.com/file/d/${fileId}/view`,
      isDrive: true,
      isYouTube: false,
      isDirectVideo: false
    };
  }

  // Vimeo
  if (trimmed.includes('vimeo.com')) {
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        type: 'iframe',
        src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
        watchUrl: `https://vimeo.com/${vimeoMatch[1]}`,
        isDrive: false,
        isYouTube: false,
        isDirectVideo: false
      };
    }
  }

  // Generic http/https iframe fallback
  const safeHttpUrl = normalizeUrl(trimmed);
  return { 
    type: 'iframe', 
    src: safeHttpUrl, 
    watchUrl: safeHttpUrl, 
    isDrive: false, 
    isYouTube: false, 
    isDirectVideo: false 
  };
}

export default function VideoInterview({ data, isAdmin, onUpdate }: VideoInterviewProps) {
  const currentData = normalizeVideoData(data);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<VideoInterviewData>(() => normalizeVideoData(data));
  const [activeTab, setActiveTab] = useState<'youtube' | 'upload' | 'drive'>('youtube');
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState(false);

  // Sync state and automatically clean invalid blob URLs
  useEffect(() => {
    const cleanData = normalizeVideoData(data);
    setFormData(cleanData);
    setIsPlayingInline(false);
    
    if (cleanData.videoUrl && (cleanData.videoUrl.startsWith('/uploads/') || cleanData.videoUrl.match(/\.(mp4|mov|webm)$/i))) {
      setActiveTab('upload');
    } else if (cleanData.videoUrl && cleanData.videoUrl.includes('drive.google.com')) {
      setActiveTab('drive');
    } else {
      setActiveTab('youtube');
    }
  }, [data]);

  const videoMeta = parseVideoUrl(formData.videoUrl || currentData.videoUrl);
  
  // Safe direct link for opening on YouTube or in a new tab (guaranteed valid URL)
  const directLink = (videoMeta.watchUrl && !videoMeta.watchUrl.startsWith('blob:')) 
    ? videoMeta.watchUrl 
    : DEFAULT_YT_WATCH;

  const posterSrc = currentData.posterImage || videoMeta.highResThumbnailUrl || videoMeta.thumbnailUrl || 'https://i.ytimg.com/vi/yEveLtaHpHQ/hqdefault.jpg';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedFormData = normalizeVideoData(formData);
    onUpdate(sanitizedFormData);
    setIsEditing(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenDirect = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    window.open(directLink, '_blank', 'noopener,noreferrer');
  };

  const handlePlayClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsPlayingInline(true);
  };

  // Direct File Upload Handler (MP4 / WebM / MOV)
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);
    setUploadSuccess(null);

    const bodyFormData = new FormData();
    bodyFormData.append('video', file);

    try {
      setUploadProgress(40);
      const res = await fetch('/api/upload-video', {
        method: 'POST',
        body: bodyFormData,
      });

      setUploadProgress(85);
      const json = await res.json();

      if (res.ok && json.success) {
        setUploadProgress(100);
        setUploadSuccess(`File caricato con successo: ${file.name}`);
        const updated = {
          ...formData,
          videoUrl: json.videoUrl
        };
        setFormData(updated);
        onUpdate(updated);
        setIsPlayingInline(true);
        setTimeout(() => {
          setIsUploading(false);
        }, 800);
      } else {
        throw new Error(json.error || 'Errore durante il caricamento del file');
      }
    } catch (err: any) {
      console.error("Upload video failed", err);
      setIsUploading(false);
      setUploadError(err.message || "Errore di connessione al server");
    }
  };

  return (
    <section id="video-intervista" className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8">
          <span className="font-mono text-sm sm:text-base font-bold uppercase tracking-widest text-indigo-600 block">
            Videointervista
          </span>
          <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
            {currentData.title}
          </h2>
          {currentData.subtitle && (
            <p className="font-sans text-slate-500 text-sm sm:text-base leading-relaxed">
              {currentData.subtitle}
            </p>
          )}

          {/* Action buttons under header */}
          {isAdmin && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => {
                  setFormData(currentData);
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all cursor-pointer border border-indigo-200 shadow-sm"
                id="edit-video-interview-btn"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Gestisci Video & Carica MP4</span>
              </button>
            </div>
          )}
        </div>

        {/* Video Player Display Canvas */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-200/90 group">
          
          {/* 1. Direct Uploaded MP4 Video (Native HTML5 Player) */}
          {videoMeta.isDirectVideo && (
            <video
              src={videoMeta.src}
              controls
              playsInline
              preload="metadata"
              poster={posterSrc}
              className="w-full h-full object-contain absolute inset-0 z-10 bg-black"
            >
              Il tuo browser non supporta la riproduzione video HTML5.
            </video>
          )}

          {/* 2. YouTube Inline Active Player */}
          {!videoMeta.isDirectVideo && videoMeta.isYouTube && isPlayingInline && (
            <div className="w-full h-full absolute inset-0 z-10 bg-black flex flex-col">
              <iframe
                src={videoMeta.src}
                title={currentData.title}
                className="w-full h-full border-0 flex-1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              />
              
              {/* Overlay Top Bar inside Active Player */}
              <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
                <button
                  onClick={() => setIsPlayingInline(false)}
                  className="px-3 py-1.5 bg-slate-900/90 hover:bg-black text-white text-xs font-semibold rounded-lg backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="Torna all'anteprima"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Chiudi Player</span>
                </button>

                <a
                  href={directLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleOpenDirect}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="Apri su YouTube in alta definizione"
                >
                  <span>Apri su YouTube in HD</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* 3. YouTube Interactive High-Res Poster Card (Zero-lag, beautiful, click to play) */}
          {!videoMeta.isDirectVideo && videoMeta.isYouTube && !isPlayingInline && (
            <div 
              onClick={handlePlayClick}
              className="w-full h-full absolute inset-0 z-10 flex items-center justify-center cursor-pointer select-none overflow-hidden group/poster"
            >
              {/* High-res Background Thumbnail */}
              <img
                src={posterSrc}
                alt={currentData.title}
                className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
              />

              {/* Dark Gradient Overlay for Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/30 group-hover/poster:via-slate-950/20 transition-colors" />

              {/* Top Badge Overlay */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
                <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-white shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-xs font-bold tracking-tight">StoryTime • Radio Canale Italia</span>
                </div>
                <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-white text-[11px] font-mono font-semibold">
                  1080p HD
                </div>
              </div>

              {/* Center Play Button Action */}
              <div className="relative z-20 flex flex-col items-center gap-3">
                <button
                  onClick={handlePlayClick}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl shadow-red-600/60 transform group-hover/poster:scale-110 transition-all duration-300 active:scale-95 cursor-pointer ring-8 ring-white/20 group-hover/poster:ring-white/30"
                  aria-label="Riproduci Intervista"
                >
                  <Play className="w-9 h-9 sm:w-11 sm:h-11 translate-x-0.5 fill-white text-white" />
                </button>
                <div className="flex flex-col items-center text-center px-4">
                  <span className="text-white font-bold text-sm sm:text-base drop-shadow-md flex items-center gap-1.5">
                    <span>Riproduci Videointervista</span>
                  </span>
                  <span className="text-slate-300 text-xs drop-shadow-sm">
                    Fai clic per avviare il video incorporato
                  </span>
                </div>
              </div>

              {/* Bottom Quick-Action Bar over Poster */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-20">
                <div className="text-slate-200 text-xs drop-shadow truncate max-w-[70%] font-medium">
                  {data.subtitle || "Divulgazione scientifica, Gamification e AI"}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenDirect}
                    className="px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-bold backdrop-blur-md border border-white/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                    title="Guarda su YouTube in HD in una nuova scheda"
                  >
                    <span>Guarda su YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. Non-YouTube Iframe (Google Drive / Vimeo) */}
          {!videoMeta.isYouTube && !videoMeta.isDirectVideo && (videoMeta.type === 'drive' || videoMeta.type === 'iframe') && (
            <iframe
              src={videoMeta.src}
              title={data.title || "Videointervista StoryTime"}
              className="w-full h-full border-0 absolute inset-0 z-10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
            />
          )}

          {/* 5. Empty Fallback */}
          {videoMeta.type === 'empty' && (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-900 text-slate-300 w-full h-full absolute inset-0 z-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Tv className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-base font-bold text-white font-sans">
                  Nessun video collegato
                </h3>
                <p className="text-xs text-slate-400">
                  Accedi in modalità editor per caricare il file MP4 o inserire il link di YouTube.
                </p>
              </div>
            </div>
          )}

          {/* Top-Right Quick Pop-Out Button */}
          <div className="absolute top-3.5 right-3.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
            <a
              href={directLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenDirect}
              className="px-3.5 py-2 bg-slate-900/90 hover:bg-black text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-xl transition-transform active:scale-95 cursor-pointer"
            >
              <span>{videoMeta.isYouTube ? 'Apri su YouTube HD' : 'Apri in nuova scheda'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            </a>
          </div>
        </div>

        {/* Action bar below the video with Direct Link & Copy Link */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 px-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="font-semibold text-slate-800">
              Intervista per StoryTime • Radio Canale Italia
            </span>
            {videoMeta.isDirectVideo && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                File Diretto MP4 HD (Nessun Blocco)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-300 transition-colors shadow-xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Link Copiato!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copia link video</span>
                </>
              )}
            </button>

            {/* Direct Open Link */}
            <a
              href={directLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenDirect}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Play className="w-3 h-3 fill-white text-white" />
              <span>Guarda su YouTube in HD</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>

      {/* Edit Modal for Admin */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-900 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-base text-slate-900 font-sans">
                    Configura Videointervista
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Source Selector Tabs */}
              <div className="px-6 pt-4 border-b border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('youtube')}
                  className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 cursor-pointer ${
                    activeTab === 'youtube'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  <span>Link YouTube</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 cursor-pointer ${
                    activeTab === 'upload'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Carica File (.MP4)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Consigliato</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('drive')}
                  className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 cursor-pointer ${
                    activeTab === 'drive'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Google Drive / Altro</span>
                </button>
              </div>

              {/* Modal Form Content */}
              <form onSubmit={handleSave} className="p-6 space-y-4 font-sans text-xs overflow-y-auto">
                
                {/* TAB 1: YouTube Link */}
                {activeTab === 'youtube' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Link Video YouTube
                      </label>
                      <input
                        type="text"
                        value={formData.videoUrl || ''}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=yEveLtaHpHQ"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] space-y-1.5">
                      <p className="font-bold text-slate-800">Link YouTube Attuale:</p>
                      <p className="font-mono text-[10px] text-indigo-600 truncate">
                        {formData.videoUrl || DEFAULT_YT_WATCH}
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: Direct File Upload */}
                {activeTab === 'upload' && (
                  <div className="space-y-3">
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Caricamento Diretto del File Video</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Caricando il file video dal tuo computer (`.mp4`, `.mov`, `.webm`), il video viene ospitato sul server del sito e riprodotto con il player video nativo.
                      </p>
                    </div>

                    {/* Drag & Drop Upload Zone */}
                    <div
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                        isUploading 
                          ? 'border-indigo-400 bg-indigo-50/50 cursor-not-allowed' 
                          : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />

                      {isUploading ? (
                        <div className="space-y-3">
                          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800">Caricamento del video in corso...</p>
                            <p className="text-[11px] text-slate-500">Attendere il completamento del trasferimento</p>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden max-w-xs mx-auto">
                            <div 
                              className="bg-indigo-600 h-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto" />
                          <div>
                            <span className="font-bold text-indigo-600 hover:underline">
                              Fai clic per selezionare il file video
                            </span>
                            <span className="text-slate-600"> oppure trascinalo qui</span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Supporta file MP4, WebM, MOV (fino a 1GB)
                          </p>
                        </div>
                      )}
                    </div>

                    {uploadSuccess && (
                      <p className="text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-semibold text-xs flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{uploadSuccess}</span>
                      </p>
                    )}

                    {uploadError && (
                      <p className="text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200 font-semibold text-xs flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{uploadError}</span>
                      </p>
                    )}

                    {/* Current direct video path */}
                    {formData.videoUrl && (formData.videoUrl.startsWith('/uploads/') || formData.videoUrl.match(/\.(mp4|mov|webm)$/i)) && (
                      <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-between gap-2 text-slate-700 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileVideo className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="truncate font-mono text-[11px]">{formData.videoUrl}</span>
                        </div>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold shrink-0">
                          Attivo
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Google Drive / Other */}
                {activeTab === 'drive' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Link Condiviso Google Drive o Vimeo
                      </label>
                      <input
                        type="text"
                        value={formData.videoUrl || ''}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Assicurati che su Google Drive il link sia impostato su <em>"Chiunque abbia il link può visualizzare"</em>.
                    </p>
                  </div>
                )}

                {/* Title & Subtitle Fields */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Titolo Principale
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Sottotitolo (opzionale)
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle || ''}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="Es. Divulgazione scientifica, Gamification nella didattica e Intelligenza Artificiale"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-sans"
                    />
                  </div>
                </div>

                {/* Form Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salva Modifiche</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
