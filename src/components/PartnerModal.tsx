/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Building2, Upload, Image as ImageIcon, Link2, Trash2 } from 'lucide-react';
import { Collaboration } from '../types';

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partner: Collaboration) => void;
  onDelete?: (id: string) => void;
  partnerToEdit?: Collaboration | null;
}

export default function PartnerModal({ isOpen, onClose, onSave, onDelete, partnerToEdit }: PartnerModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [logoText, setLogoText] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset/populate form when modal opens or edit partner changes
  useEffect(() => {
    setIsConfirmingDelete(false);
    if (partnerToEdit) {
      setName(partnerToEdit.name);
      setRole(partnerToEdit.role);
      setLogoText(partnerToEdit.logoText || '');
      setLogoUrl(partnerToEdit.logoUrl || '');
      setWebsiteUrl(partnerToEdit.websiteUrl || '');
    } else {
      // Clear form for creation
      setName('');
      setRole('');
      setLogoText('');
      setLogoUrl('');
      setWebsiteUrl('');
    }
    setUploadError('');
  }, [partnerToEdit, isOpen]);

  if (!isOpen) return null;

  const compressAndSetLogo = (file: File) => {
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError("Per favore carica solo file d'immagine (PNG, JPG, SVG, WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("L'immagine è troppo pesante. Usa un logo di dimensioni inferiori a 8 MB.");
      return;
    }

    // Direct read for SVG
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
      return;
    }

    // Compress logo to max 400x400 PNG/JPEG
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 400;
        const maxHeight = 400;
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
          const compressed = canvas.toDataURL('image/png');
          setLogoUrl(compressed);
        } else {
          setLogoUrl(e.target?.result as string);
        }
      };
      img.onerror = () => setLogoUrl(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressAndSetLogo(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      compressAndSetLogo(file);
    }
  };

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || !role.trim()) {
      return;
    }

    // If logoText is empty, make a 2/3 letter fallback based on name
    const finalLogoText = logoText.trim() || name.trim().split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();

    const savedPartner: Collaboration = {
      id: partnerToEdit ? partnerToEdit.id : `collab-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      logoText: finalLogoText.toUpperCase(),
      logoUrl: logoUrl.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined
    };

    onSave(savedPartner);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-sans font-black text-lg text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              {partnerToEdit ? 'Modifica Partner' : 'Nuovo Ente / Partner'}
            </h3>
            <p className="font-sans text-xs text-slate-500 mt-1">
              Inserisci i dettagli e il logo del partner da mostrare nel carosello.
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Logo Upload Section */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Logo del Partner *
            </label>
            
            {/* Visual Preview Card */}
            <div className="flex gap-4 items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Anteprima Logo" 
                    className="w-full h-full object-contain p-1.5"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="font-mono font-black text-slate-400 text-lg uppercase">
                    {logoText.trim() || '?'}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-sans font-bold text-xs text-slate-700">Anteprima Logo</p>
                <p className="font-sans text-[11px] text-slate-400 leading-tight">
                  {logoUrl ? 'Immagine caricata correttamente.' : 'Mostra le iniziali o carica un\'immagine.'}
                </p>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="font-sans text-[10px] font-bold text-rose-500 hover:text-rose-600 underline block cursor-pointer"
                  >
                    Rimuovi immagine logo
                  </button>
                )}
              </div>
            </div>

            {/* Upload Area */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-slate-50 rounded-xl p-4 text-center cursor-pointer transition-all space-y-1.5"
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden" 
              />
              <Upload className="w-5 h-5 text-slate-400 mx-auto" />
              <p className="font-sans font-bold text-xs text-slate-700">Trascina qui l'immagine o clicca per caricare</p>
              <p className="font-sans text-[10px] text-slate-400">PNG, JPG, SVG o WebP (Max 1.5 MB)</p>
            </div>
            {uploadError && (
              <p className="font-sans text-[11px] text-rose-500 font-medium leading-tight">{uploadError}</p>
            )}

            {/* URL Fallback Field */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Link2 className="w-3 h-3" /> oppure incolla l'URL di un'immagine online:
              </span>
              <input
                type="text"
                value={logoUrl.startsWith('data:') ? '' : logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://esempio.com/logo.png"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Fallback Text Input (Initials) */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Iniziali di Fallback (Opzionale - max 3 lettere)
            </label>
            <input
              type="text"
              maxLength={3}
              value={logoText}
              onChange={(e) => setLogoText(e.target.value)}
              placeholder="es. MAR"
              className="w-24 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-center text-slate-900 font-bold uppercase"
            />
            <p className="font-sans text-[10px] text-slate-400">
              Usato come testo di riserva se l'immagine non è presente o non può essere caricata.
            </p>
          </div>

          {/* Partner/Company Name */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Nome dell'Ente o Azienda *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. IIS MARCONI REGGIO EMILIA"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans text-slate-900"
            />
          </div>

          {/* Role / Description of services */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Tipo di prestazione erogata / Dettaglio *
            </label>
            <textarea
              required
              rows={3}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="es. Corsi di AI & Prompt Engineering per Personale ATA e Docenti"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans text-slate-900 leading-normal"
            />
          </div>

          {/* Website URL */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Sito Web del Partner (Opzionale)
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="es. https://www.istitutomarcora.edu.it"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans text-slate-900"
            />
            <p className="font-sans text-[10px] text-slate-400">
              Se inserito, gli utenti potranno cliccare sul nome dell'ente per visitarne il sito.
            </p>
          </div>

        </form>

        {/* Footer actions */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          {partnerToEdit && onDelete ? (
            isConfirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-700">Sei sicuro?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(partnerToEdit.id);
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
                <span>Elimina Partner</span>
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
              disabled={!name.trim() || !role.trim()}
              className="px-5 py-2 bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-slate-900 text-white font-sans font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-wider"
            >
              Salva Partner
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
