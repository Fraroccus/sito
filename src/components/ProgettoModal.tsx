/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, Sparkles, AlertCircle, Upload, Link2, Palette, Check, ExternalLink, Calendar, Building, Tag } from 'lucide-react';
import { Progetto, ProjectCategory } from '../types';
import { GRADIENT_PRESETS } from '../data';

interface ProgettoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (progetto: Progetto) => void;
  onDelete?: (id: string) => void;
  progettoToEdit?: Progetto | null;
}

const PROJECT_CATEGORIES: Exclude<ProjectCategory, 'Tutti'>[] = [
  'Didattica & STEM',
  'Intelligenza Artificiale',
  'Robotica & Coding',
  'Aziende & Formazione',
  'Divulgazione & Eventi',
  'Altro'
];

export default function ProgettoModal({ isOpen, onClose, onSave, onDelete, progettoToEdit }: ProgettoModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Didattica & STEM');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState('');
  const [client, setClient] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // Cover state
  const [coverType, setCoverType] = useState<'upload' | 'url' | 'gradient'>('gradient');
  const [gradientIndex, setGradientIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
    setUploadError('');
    if (progettoToEdit) {
      setTitle(progettoToEdit.title || '');
      if (PROJECT_CATEGORIES.includes(progettoToEdit.category as any)) {
        setCategory(progettoToEdit.category);
        setCustomCategory('');
      } else {
        setCategory('Altro');
        setCustomCategory(progettoToEdit.category);
      }
      setDescription(progettoToEdit.description || '');
      setPeriod(progettoToEdit.period || '');
      setClient(progettoToEdit.client || '');
      setLinkUrl(progettoToEdit.linkUrl || '');
      setLinkText(progettoToEdit.linkText || '');
      setGithubUrl(progettoToEdit.githubUrl || '');
      setTags(progettoToEdit.tags || []);

      if (progettoToEdit.image) {
        setImageUrl(progettoToEdit.image);
        if (progettoToEdit.image.startsWith('data:')) {
          setCoverType('upload');
        } else {
          setCoverType('url');
        }
      } else {
        setCoverType('gradient');
        setGradientIndex(progettoToEdit.gradientIndex ?? 0);
        setImageUrl('');
      }
    } else {
      setTitle('');
      setCategory('Didattica & STEM');
      setCustomCategory('');
      setDescription('');
      setPeriod('');
      setClient('');
      setLinkUrl('');
      setLinkText('');
      setGithubUrl('');
      setTags([]);
      setCoverType('gradient');
      setGradientIndex(0);
      setImageUrl('');
    }
  }, [progettoToEdit, isOpen]);

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

    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setCoverType('upload');
      };
      reader.readAsDataURL(file);
      return;
    }

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
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setImageUrl(compressedDataUrl);
          setCoverType('upload');
        } else {
          setImageUrl(e.target?.result as string);
          setCoverType('upload');
        }
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

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Inserisci il titolo del progetto');
      return;
    }

    const finalCategory = category === 'Altro' && customCategory.trim() 
      ? customCategory.trim() 
      : category;

    const finalImage = coverType === 'gradient' ? '' : imageUrl.trim();

    const savedProgetto: Progetto = {
      id: progettoToEdit ? progettoToEdit.id : `progetto-${Date.now()}`,
      title: title.trim(),
      category: finalCategory,
      description: description.trim(),
      image: finalImage,
      gradientIndex: coverType === 'gradient' ? gradientIndex : undefined,
      period: period.trim() || undefined,
      client: client.trim() || undefined,
      linkUrl: linkUrl.trim() || undefined,
      linkText: linkText.trim() || undefined,
      githubUrl: githubUrl.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      isExample: progettoToEdit ? progettoToEdit.isExample : false,
      created_at: progettoToEdit?.created_at || new Date().toISOString()
    };

    onSave(savedProgetto);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="progetto-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-lg leading-tight" id="progetto-modal-title">
                {progettoToEdit ? 'Modifica Progetto' : 'Nuovo Progetto'}
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                {progettoToEdit ? 'Aggiorna i dettagli, copertina e link del progetto' : 'Aggiungi una nuova attività o progetto svolto'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Chiudi finestra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-2">
              Titolo del Progetto *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Laboratori PNRR STEM & Intelligenza Artificiale per Scuole"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-sans text-sm text-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Category & Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-2">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-sans text-sm text-slate-900 transition-all cursor-pointer bg-white"
              >
                {PROJECT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {category === 'Altro' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Specifica categoria personalizzata"
                  className="mt-2 w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-sans text-xs text-slate-900 transition-all"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Committente / Partner</span>
                </span>
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="es. Scuole Secondarie / StoryTime"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-sans text-sm text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Period & External Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Periodo / Anno</span>
                </span>
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="es. 2023 - 2024 / In corso"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-sans text-sm text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Link Pagina / Progetto / Demo (Opzionale)</span>
                </span>
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="es. /neuromechfly-tris/ oppure https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-sans text-sm text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Button Text & GitHub Repo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Testo Pulsante (Opzionale)</span>
                </span>
              </label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="es. Vedi progetto"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-sans text-sm text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Repository GitHub (Opzionale)</span>
                </span>
              </label>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="es. https://github.com/..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-sans text-sm text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-2">
              Descrizione Sintetica *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sintesi degli obiettivi raggiunti, tecnologie utilizzate e impatto..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-sans text-sm text-slate-900 transition-all placeholder:text-slate-400 resize-none leading-relaxed"
            />
          </div>

          {/* Thumbnail / Cover Selection */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4">
            <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
              Copertina / Thumbnail
            </label>

            {/* Selection modes */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCoverType('gradient')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold font-sans transition-all cursor-pointer ${
                  coverType === 'gradient'
                    ? 'bg-white border-indigo-600 text-indigo-700 shadow-xs'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Gradiente</span>
              </button>
              <button
                type="button"
                onClick={() => setCoverType('upload')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold font-sans transition-all cursor-pointer ${
                  coverType === 'upload'
                    ? 'bg-white border-indigo-600 text-indigo-700 shadow-xs'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Carica File</span>
              </button>
              <button
                type="button"
                onClick={() => setCoverType('url')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold font-sans transition-all cursor-pointer ${
                  coverType === 'url'
                    ? 'bg-white border-indigo-600 text-indigo-700 shadow-xs'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Link URL</span>
              </button>
            </div>

            {/* Gradient Selector */}
            {coverType === 'gradient' && (
              <div className="space-y-3">
                <span className="text-[11px] text-slate-500 font-sans block">
                  Scegli uno sfondo moderno con sfumatura astratta:
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {GRADIENT_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setGradientIndex(idx)}
                      style={{ background: preset.css }}
                      className={`h-10 rounded-xl relative transition-all transform hover:scale-105 cursor-pointer ${
                        gradientIndex === idx ? 'ring-2 ring-indigo-600 ring-offset-2 scale-105' : 'opacity-85'
                      }`}
                      title={preset.name}
                    >
                      {gradientIndex === idx && (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <Check className="w-4 h-4 drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Selector */}
            {coverType === 'upload' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50/20 transition-all cursor-pointer"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs font-bold font-sans">Seleziona immagine dal computer</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, WebP o SVG (ottimizzata automaticamente)</span>
                </button>
              </div>
            )}

            {/* URL Selector */}
            {coverType === 'url' && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-sans text-xs text-slate-900 transition-all"
                />
              </div>
            )}

            {uploadError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Live Preview */}
            <div className="pt-2 border-t border-slate-200/80">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
                Anteprima Copertina Card
              </span>
              <div 
                className="h-28 rounded-2xl relative overflow-hidden flex items-end p-4 border border-slate-200"
                style={
                  coverType !== 'gradient' && imageUrl
                    ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: GRADIENT_PRESETS[gradientIndex]?.css || GRADIENT_PRESETS[0].css }
                }
              >
                {coverType !== 'gradient' && imageUrl && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                )}
                <div className="relative z-10 flex items-center justify-between w-full text-white">
                  <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {category === 'Altro' && customCategory ? customCategory : category}
                  </span>
                  {period && (
                    <span className="text-[10px] font-mono text-white/90">
                      {period}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tags & Key highlights */}
          <div>
            <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Tag e Punti Salienti</span>
              </span>
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="es. PNRR D.M. 65, Lego Spike, LLM..."
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-sans text-xs text-slate-900 transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-sans font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi</span>
              </button>
            </div>

            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-sans rounded-lg"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 font-sans italic">
                Nessun tag inserito. I tag appariranno come pillole nella card del progetto.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              {progettoToEdit && onDelete && (
                <div>
                  {!isConfirmingDelete ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="text-rose-600 hover:text-rose-700 text-xs font-sans font-bold px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Elimina Progetto</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-700 font-bold">Confermi?</span>
                      <button
                        type="button"
                        onClick={() => onDelete(progettoToEdit.id)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Sì, elimina
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Annulla
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-sans text-xs font-bold transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer uppercase tracking-wider"
              >
                {progettoToEdit ? 'Salva Modifiche' : 'Crea Progetto'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
