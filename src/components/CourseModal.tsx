/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, Sparkles, AlertCircle, Upload, Link2, Palette, Check } from 'lucide-react';
import { Percorso, Category } from '../types';
import { GRADIENT_PRESETS } from '../data';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Percorso) => void;
  onDelete?: (id: string) => void;
  courseToEdit?: Percorso | null;
}

export default function CourseModal({ isOpen, onClose, onSave, onDelete, courseToEdit }: CourseModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Formazione docenti');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  
  // Cover state
  const [coverType, setCoverType] = useState<'upload' | 'url' | 'gradient'>('gradient');
  const [gradientIndex, setGradientIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Topics state (dynamic array of bullet points)
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [requiresKit, setRequiresKit] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Reset/populate form when modal opens or edit course changes
  useEffect(() => {
    setIsConfirmingDelete(false);
    setUploadError('');
    if (courseToEdit) {
      setTitle(courseToEdit.title);
      setCategory(courseToEdit.category);
      setDuration(courseToEdit.duration);
      setDescription(courseToEdit.description);
      setTopics(courseToEdit.topics || []);
      setRequiresKit(courseToEdit.requiresKit ?? false);
      
      if (courseToEdit.image) {
        setImageUrl(courseToEdit.image);
        if (courseToEdit.image.startsWith('data:')) {
          setCoverType('upload');
        } else {
          setCoverType('url');
        }
      } else {
        setCoverType('gradient');
        setGradientIndex(courseToEdit.gradientIndex ?? 0);
        setImageUrl('');
      }
    } else {
      // Clear form for creation
      setTitle('');
      setCategory('Formazione docenti');
      setDuration('');
      setDescription('');
      setTopics([]);
      setRequiresKit(false);
      setCoverType('gradient');
      setGradientIndex(0);
      setImageUrl('');
    }
  }, [courseToEdit, isOpen]);

  if (!isOpen) return null;

  const compressAndSetImage = (file: File) => {
    setUploadError('');
    setCoverType('upload');
    if (!file.type.startsWith('image/')) {
      setUploadError("Si prega di caricare solo file d'immagine (PNG, JPG, WebP, SVG).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("L'immagine supera gli 8 MB. Scegli un file più leggero.");
      return;
    }

    // Direct read for SVG
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setCoverType('upload');
      };
      reader.readAsDataURL(file);
      return;
    }

    // Compress & resize raster image on canvas to lightweight dimensions
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          setImageUrl(compressed);
          setCoverType('upload');
        } else {
          setImageUrl(e.target?.result as string);
          setCoverType('upload');
        }
      };
      img.onerror = () => {
        setImageUrl(e.target?.result as string);
        setCoverType('upload');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressAndSetImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      compressAndSetImage(file);
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (indexToRemove: number) => {
    setTopics(topics.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !duration.trim() || !description.trim()) {
      return;
    }

    const savedCourse: Percorso = {
      id: courseToEdit ? courseToEdit.id : `percorso-${Date.now()}`,
      title: title.trim(),
      category,
      duration: duration.trim(),
      description: description.trim(),
      image: coverType === 'gradient' ? '' : imageUrl.trim(),
      gradientIndex: coverType === 'gradient' ? gradientIndex : undefined,
      topics: topics,
      requiresKit: requiresKit,
      isExample: courseToEdit ? courseToEdit.isExample : false
    };

    onSave(savedCourse);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-sans font-black text-lg text-slate-900 uppercase tracking-tight">
              {courseToEdit ? 'Modifica Percorso' : 'Nuovo Percorso Formativo'}
            </h3>
            <p className="font-sans text-xs text-slate-500 mt-1">
              Riempi i dettagli per aggiornare il catalogo visualizzato sul sito.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Titolo del Percorso *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Intelligenza Artificiale per la Gestione Amministrativa"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans text-slate-900"
            />
          </div>

          {/* Category & Duration Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Categoria / Target *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans text-slate-900 bg-white"
              >
                <optgroup label="STUDENTI">
                  <option value="Scuola primaria">Scuola primaria (Primaria)</option>
                  <option value="Scuola secondaria di I grado">Scuola secondaria di I grado (Medie)</option>
                  <option value="Scuola secondaria di II grado">Scuola secondaria di II grado (Superiori)</option>
                  <option value="CODING">CODING (Coding)</option>
                  <option value="ROBOTICA">ROBOTICA (Robotica)</option>
                </optgroup>
                <optgroup label="PERSONALE SCOLASTICO">
                  <option value="Personale ATA">Personale ATA</option>
                  <option value="Formazione docenti">Formazione docenti</option>
                </optgroup>
                <optgroup label="AZIENDE E PRIVATI">
                  <option value="PMI">PMI / Imprese</option>
                  <option value="Privati">Privati e Freelance</option>
                  <option value="ALTRO">Altro / Altri Percorsi</option>
                </optgroup>
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Durata e Formato *
              </label>
              <input
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="es. 12 ore (4 moduli da 3 ore), online o in presenza"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans text-slate-900"
              />
            </div>

          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Descrizione Dettagliata *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi l'obiettivo del corso, il metodo didattico e il valore misurabile che genera..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans text-slate-900 leading-relaxed"
            />
          </div>

          {/* Image & Style Picker */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Immagine di Copertina o Sfondo
              </span>
              
              {/* 3 Mode Selector */}
              <div className="flex gap-1 p-1 bg-slate-200/80 rounded-xl text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setCoverType('upload')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    coverType === 'upload' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Carica File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCoverType('url')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    coverType === 'url' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-3 h-3" />
                  <span>Link URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCoverType('gradient')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    coverType === 'gradient' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Palette className="w-3 h-3" />
                  <span>Gradiente</span>
                </button>
              </div>
            </div>

            {/* Error banner */}
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-sans">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Option 1: File Upload */}
            {coverType === 'upload' && (
              <div className="space-y-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/png,image/jpeg,image/webp,image/svg+xml" 
                  className="hidden" 
                />

                {imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-36 bg-slate-900 group">
                    <img 
                      src={imageUrl} 
                      alt="Anteprima copertina" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-xl shadow-md hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        Cambia Immagine
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-rose-700 transition-all cursor-pointer"
                      >
                        Rimuovi
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl bg-white text-center cursor-pointer transition-all hover:bg-indigo-50/30 group"
                  >
                    <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="font-sans font-bold text-slate-800 text-xs">
                      Trascina qui l'immagine della copertina o <span className="text-indigo-600 underline">sfoglia dal PC</span>
                    </p>
                    <p className="font-sans text-[10px] text-slate-400 mt-1">
                      Supporta PNG, JPG, WebP o SVG (Max 2 MB).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Option 2: Link URL */}
            {coverType === 'url' && (
              <div className="space-y-3">
                <span className="block text-xs text-slate-600 font-medium">Incolla l'indirizzo (URL) di un'immagine di copertina:</span>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-xs text-slate-800 bg-white"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Pulisci
                    </button>
                  )}
                </div>

                {imageUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-28 bg-slate-100">
                    <img 
                      src={imageUrl} 
                      alt="Anteprima URL" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Option 3: Gradient Presets */}
            {coverType === 'gradient' && (
              <div className="space-y-3">
                <span className="block text-xs text-slate-600 font-medium">Scegli una palette energetica con gradiente:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GRADIENT_PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setGradientIndex(index)}
                      className={`h-16 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden flex items-center justify-center ${
                        gradientIndex === index 
                          ? 'border-indigo-600 scale-[1.03] shadow-md' 
                          : 'border-transparent opacity-85 hover:opacity-100'
                      }`}
                      style={{ background: preset?.css || 'transparent' }}
                    >
                      {gradientIndex === index && (
                        <span className="absolute inset-0 bg-black/20 flex items-center justify-center text-white font-sans text-xs font-black uppercase tracking-wider gap-1">
                          <Check className="w-4 h-4" />
                          Selezionato
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Topics covered (Bullet points list builder) */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Argomenti e Moduli (Opzionale)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                placeholder="Aggiungi modulo o argomento trattato..."
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans text-slate-900 text-sm"
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-sans font-bold text-sm rounded-xl transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Aggiungi</span>
              </button>
            </div>

            {/* List of current topics */}
            {topics.length > 0 ? (
              <ul className="mt-3 divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                {topics.map((topic, idx) => (
                  <li key={idx} className="px-4 py-2 flex items-center justify-between gap-4 text-sm font-sans text-slate-700">
                    <span className="line-clamp-1">{topic}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-full hover:bg-slate-100 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
                <AlertCircle className="w-4 h-4" />
                <span className="font-sans text-xs">Nessun modulo ancora aggiunto. Appariranno come punti elenco nella card.</span>
              </div>
            )}
          </div>

          {/* Kit Requirement Notice Toggle */}
          <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl transition-all">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requiresKit}
                onChange={(e) => setRequiresKit(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600 shrink-0"
              />
              <div>
                <span className="font-sans font-bold text-xs text-amber-950 block">
                  Avviso Possesso Kit Didattico
                </span>
                <p className="font-sans text-xs text-amber-800/90 mt-0.5 leading-snug">
                  Aggiungi il messaggio di attenzione sulla card: <strong className="font-semibold text-amber-950">"La scuola deve già essere in possesso del kit"</strong>
                </p>
              </div>
            </label>
          </div>

        </form>

        {/* Footer actions */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          {courseToEdit && onDelete ? (
            isConfirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-700">Sei sicuro?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(courseToEdit.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-sans font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Sì, Elimina
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Elimina Percorso</span>
              </button>
            )
          ) : (
            <div />
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-sans font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || !duration.trim() || !description.trim()}
              className="px-5 py-2 bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-slate-900 text-white font-sans font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-wider"
            >
              Salva modifiche
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
