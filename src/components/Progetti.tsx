/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Progetto } from '../types';
import { GRADIENT_PRESETS } from '../data';
import { 
  FolderGit2, 
  Edit, 
  Trash2, 
  Plus, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUpDown, 
  Sparkles, 
  Bot, 
  Code2, 
  GraduationCap, 
  Building2, 
  Calendar, 
  ExternalLink, 
  Radio, 
  Cpu, 
  Layers, 
  Tag as TagIcon,
  MessageSquare
} from 'lucide-react';
import ProgettoModal from './ProgettoModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import ReorderModal from './ReorderModal';

interface ProgettiProps {
  progetti: Progetto[];
  isAdmin: boolean;
  onAddProgetto: (progetto: Progetto) => void;
  onUpdateProgetto: (progetto: Progetto) => void;
  onDeleteProgetto: (id: string) => void;
  onReorderProgetti?: (newProgetti: Progetto[]) => void;
}

export default function Progetti({ 
  progetti, 
  isAdmin, 
  onAddProgetto, 
  onUpdateProgetto, 
  onDeleteProgetto, 
  onReorderProgetti 
}: ProgettiProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutti');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [editingProgetto, setEditingProgetto] = useState<Progetto | null>(null);
  const [deletingProgettoInfo, setDeletingProgettoInfo] = useState<{ id: string; title: string } | null>(null);

  // Extract unique categories from actual progetti plus presets
  const availableCategories = useMemo(() => {
    const defaultCategories = [
      'Didattica & STEM',
      'Intelligenza Artificiale',
      'Robotica & Coding',
      'Aziende & Formazione',
      'Divulgazione & Eventi'
    ];
    const presentCategories = Array.from(new Set(progetti.map(p => p.category).filter(Boolean)));
    const combined = Array.from(new Set([...defaultCategories, ...presentCategories]));
    return ['Tutti', ...combined];
  }, [progetti]);

  // Filter projects by selected category
  const filteredProgetti = useMemo(() => {
    if (selectedCategory === 'Tutti') return progetti;
    return progetti.filter(p => p.category === selectedCategory);
  }, [progetti, selectedCategory]);

  // Helper to reorder filtered projects in main list
  const handleMoveProgetto = (fromIndex: number, toIndex: number) => {
    if (!onReorderProgetti) return;
    if (fromIndex < 0 || fromIndex >= filteredProgetti.length) return;
    if (toIndex < 0 || toIndex >= filteredProgetti.length) return;

    const newSubset = [...filteredProgetti];
    const [moved] = newSubset.splice(fromIndex, 1);
    newSubset.splice(toIndex, 0, moved);

    const subsetIds = new Set(newSubset.map(item => item.id));
    let subsetIdx = 0;
    const newAllProgetti = progetti.map(item => {
      if (subsetIds.has(item.id)) {
        const nextItem = newSubset[subsetIdx];
        subsetIdx++;
        return nextItem;
      }
      return item;
    });

    onReorderProgetti(newAllProgetti);
  };

  const handleEditClick = (progetto: Progetto) => {
    setEditingProgetto(progetto);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingProgetto(null);
    setIsModalOpen(true);
  };

  const handleSaveProgetto = (savedProgetto: Progetto) => {
    try {
      if (editingProgetto) {
        onUpdateProgetto(savedProgetto);
      } else {
        onAddProgetto(savedProgetto);
      }
    } catch (err) {
      console.error('Errore durante il salvataggio del progetto:', err);
    } finally {
      setIsModalOpen(false);
      setEditingProgetto(null);
    }
  };

  const handleDeleteClick = (id: string, title: string) => {
    setDeletingProgettoInfo({ id, title });
  };

  // Helper for vibrant themed fallback backgrounds
  const getFallbackGradient = (progetto: Progetto) => {
    if (typeof progetto.gradientIndex === 'number' && progetto.gradientIndex >= 0 && progetto.gradientIndex < GRADIENT_PRESETS.length) {
      return GRADIENT_PRESETS[progetto.gradientIndex].css;
    }
    const cat = progetto.category.toLowerCase();
    if (cat.includes('robotica')) return 'linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #fb7185 100%)';
    if (cat.includes('coding')) return 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)';
    if (cat.includes('didattica') || cat.includes('stem') || cat.includes('scuola')) return 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)';
    if (cat.includes('aziend') || cat.includes('pmi')) return 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)';
    if (cat.includes('divulgazione') || cat.includes('eventi') || cat.includes('media')) return 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fbbf24 100%)';
    if (cat.includes('intelligenza') || cat.includes('ia') || cat.includes('ai')) return 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)';
    return 'linear-gradient(135deg, #0f172a 0%, #334155 50%, #475569 100%)';
  };

  const getThematicIcon = (progetto: Progetto) => {
    const cat = progetto.category.toLowerCase();
    const titleLower = progetto.title.toLowerCase();

    if (cat.includes('robotica') || titleLower.includes('robot') || titleLower.includes('spike')) {
      return <Bot className="w-20 h-20 text-white/20" />;
    }
    if (cat.includes('coding') || titleLower.includes('scratch') || titleLower.includes('python')) {
      return <Code2 className="w-20 h-20 text-white/20" />;
    }
    if (cat.includes('divulgazione') || cat.includes('media') || titleLower.includes('radio') || titleLower.includes('storytime')) {
      return <Radio className="w-20 h-20 text-white/20" />;
    }
    if (cat.includes('aziend') || titleLower.includes('pmi') || titleLower.includes('flussi')) {
      return <Building2 className="w-20 h-20 text-white/20" />;
    }
    if (cat.includes('didattica') || cat.includes('stem') || titleLower.includes('scuola') || titleLower.includes('pnrr')) {
      return <GraduationCap className="w-20 h-20 text-white/20" />;
    }
    if (titleLower.includes('microbit') || titleLower.includes('elettronica')) {
      return <Cpu className="w-20 h-20 text-white/20" />;
    }
    return <Sparkles className="w-20 h-20 text-white/20" />;
  };

  // Tag styling helper
  const getCategoryStyles = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('didattica') || cat.includes('stem') || cat.includes('scuola')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (cat.includes('aziend') || cat.includes('pmi')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    if (cat.includes('robotica')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (cat.includes('coding')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (cat.includes('divulgazione') || cat.includes('eventi') || cat.includes('media')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (cat.includes('intelligenza') || cat.includes('ia')) {
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <section id="progetti" className="py-24 bg-white border-t border-slate-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl space-y-4">
            <span className="font-mono text-sm sm:text-base font-bold uppercase tracking-widest text-indigo-600 block">
              Portfolio & Esperienze
            </span>
            <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight" id="progetti-heading">
              I Miei Progetti
            </h2>
            <p className="font-sans text-slate-600 text-sm sm:text-base leading-relaxed">
              Attività formative speciali sul campo, interventi di divulgazione scientifica e progetti di integrazione dell'Intelligenza Artificiale applicata a diversi campi.
            </p>
          </div>

          {/* Add Progetto button for Admin */}
          {isAdmin && (
            <button
              id="admin-add-progetto-btn"
              onClick={handleCreateClick}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-indigo-100 transition-all scale-100 hover:scale-[1.02] cursor-pointer uppercase tracking-wider shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Progetto</span>
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12 border-b border-slate-200 pb-5">
          {availableCategories.map((cat) => {
            const count = cat === 'Tutti' 
              ? progetti.length 
              : progetti.filter(p => p.category === cat).length;

            if (cat !== 'Tutti' && count === 0) return null;

            return (
              <button
                key={cat}
                id={`filter-progetto-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 py-2.5 rounded-xl font-sans text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  selectedCategory === cat 
                    ? 'bg-white/20 text-white font-mono' 
                    : 'bg-slate-100 text-slate-500 font-mono'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Admin status banner */}
        {isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            id="admin-progetti-status-banner"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="text-xs sm:text-sm font-sans text-indigo-900">
                <span className="font-bold">Gestione Progetti Attiva:</span> Puoi modificare, creare, eliminare e riordinare i progetti visibili in questo catalogo.
              </div>
            </div>

            {filteredProgetti.length > 1 && (
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0 uppercase tracking-wider"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>Riordina Progetti ({filteredProgetti.length})</span>
              </button>
            )}
          </motion.div>
        )}

        {/* Projects Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProgetti.map((progetto, index) => {
              const hasCustomImage = Boolean(progetto.image && progetto.image.trim().length > 0);
              const fallbackGradient = getFallbackGradient(progetto);
              const backgroundStyle = hasCustomImage 
                ? { backgroundImage: `url(${progetto.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: fallbackGradient };

              return (
                <motion.article
                  key={progetto.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-slate-100/60 transition-all duration-300 group"
                  id={`progetto-card-${progetto.id}`}
                >
                  {/* Card Thumbnail / Header */}
                  <div 
                    className="h-44 relative flex items-end p-6 overflow-hidden select-none"
                    style={backgroundStyle}
                  >
                    {/* Thematic watermark icon if no custom image */}
                    {!hasCustomImage && (
                      <div className="absolute -right-3 -bottom-3 transform rotate-12 opacity-75 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                        {getThematicIcon(progetto)}
                      </div>
                    )}

                    {/* Overlay for custom image readability */}
                    {hasCustomImage && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                    )}

                    {/* Overlay badges */}
                    <div className="relative z-10 w-full flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getCategoryStyles(progetto.category)}`}>
                        {progetto.category}
                      </span>

                      {progetto.isExample && (
                        <span className="px-2 py-1 bg-amber-500 text-slate-900 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
                          Esempio Modificabile
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Main Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      {/* Meta line: Period and/or Client */}
                      {(progetto.period || progetto.client) && (
                        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-slate-500 font-semibold">
                          {progetto.period && (
                            <div className="flex items-center gap-1.5 uppercase tracking-wider">
                              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{progetto.period}</span>
                            </div>
                          )}
                          {progetto.period && progetto.client && (
                            <span className="text-slate-300">•</span>
                          )}
                          {progetto.client && (
                            <div className="flex items-center gap-1.5 text-slate-600 line-clamp-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{progetto.client}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Project Title */}
                      <h3 className="font-sans font-bold text-slate-900 text-lg leading-snug tracking-tight group-hover:text-indigo-600 transition-colors">
                        {progetto.title}
                      </h3>

                      {/* Project Description */}
                      <p className="font-sans text-slate-600 text-sm leading-relaxed line-clamp-4">
                        {progetto.description}
                      </p>
                    </div>

                    {/* Tags / Highlights List */}
                    {progetto.tags && progetto.tags.length > 0 && (
                      <div className="border-t border-slate-100 pt-4 space-y-2">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                          Punti Chiave
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {progetto.tags.map((tag, tagIdx) => (
                            <span 
                              key={tagIdx} 
                              className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-sans rounded-lg font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action & Links */}
                  {(() => {
                    const isNeuroMechFly = progetto.title.toLowerCase().includes('neuromechfly') || progetto.title.toLowerCase().includes('mosca');
                    const targetUrl = progetto.linkUrl || (isNeuroMechFly ? '/neuromechfly-tris/' : undefined);
                    const targetGithub = progetto.githubUrl || (isNeuroMechFly ? 'https://github.com/Fraroccus/moscatris' : undefined);
                    const buttonText = progetto.linkText || (targetUrl ? 'Vedi progetto' : 'Richiedi Progetto Simile');

                    return (
                      <div className="flex flex-col">
                        <div className="px-6 pb-6 pt-0 bg-white">
                          {targetUrl ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={targetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group"
                              >
                                <ExternalLink className="w-4 h-4 transition-transform group-hover:scale-110" />
                                <span>{buttonText}</span>
                              </a>
                              {targetGithub && (
                                <a
                                  href={targetGithub}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Repository GitHub del progetto"
                                  className="inline-flex items-center justify-center p-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-sans text-xs rounded-xl transition-all cursor-pointer"
                                >
                                  <FolderGit2 className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <a
                              href="#contatti"
                              className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Richiedi Progetto Simile</span>
                            </a>
                          )}
                        </div>

                        {/* Admin Toolbar (always accessible when logged in as admin) */}
                        {isAdmin && (
                          <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            {/* Reorder inline buttons */}
                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveProgetto(index, index - 1)}
                                className={`p-1.5 rounded-lg transition-all ${
                                  index === 0
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer'
                                }`}
                                title="Sposta indietro"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[10px] font-mono font-bold text-slate-500 px-1 select-none">
                                {index + 1}/{filteredProgetti.length}
                              </span>
                              <button
                                type="button"
                                disabled={index === filteredProgetti.length - 1}
                                onClick={() => handleMoveProgetto(index, index + 1)}
                                className={`p-1.5 rounded-lg transition-all ${
                                  index === filteredProgetti.length - 1
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer'
                                }`}
                                title="Sposta avanti"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleEditClick(progetto)}
                                className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-sans font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                                title="Modifica progetto"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-500" />
                                <span>Modifica</span>
                              </button>

                              <button
                                onClick={() => handleDeleteClick(progetto.id, progetto.title)}
                                className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-sans font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                                title="Elimina progetto"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Elimina</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </motion.article>
              );
            })}

            {/* Empty state message */}
            {filteredProgetti.length === 0 && (
              <div className="col-span-full py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-slate-900 text-base">Nessun progetto trovato</h4>
                  <p className="font-sans text-slate-500 text-xs mt-1">
                    {selectedCategory === 'Tutti' 
                      ? "Nessun progetto attualmente registrato. Se sei l'amministratore, puoi aggiungerne uno con 'Nuovo Progetto'." 
                      : `Non ci sono progetti per la categoria "${selectedCategory}".`}
                  </p>
                </div>
                {selectedCategory !== 'Tutti' && (
                  <button
                    onClick={() => setSelectedCategory('Tutti')}
                    className="font-mono text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest cursor-pointer"
                  >
                    Azzera filtri categoria
                  </button>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Editor Overlay */}
        <ProgettoModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProgetto(null);
          }}
          onSave={handleSaveProgetto}
          onDelete={(id) => {
            onDeleteProgetto(id);
            setIsModalOpen(false);
            setEditingProgetto(null);
          }}
          progettoToEdit={editingProgetto}
        />

        {/* Confirm Delete Modal */}
        <ConfirmDeleteModal
          isOpen={Boolean(deletingProgettoInfo)}
          title="Elimina Progetto"
          message={`Sei sicuro di voler eliminare il progetto "${deletingProgettoInfo?.title}"? Questa operazione lo rimuoverà permanentemente.`}
          onConfirm={() => {
            if (deletingProgettoInfo) {
              onDeleteProgetto(deletingProgettoInfo.id);
              setDeletingProgettoInfo(null);
            }
          }}
          onClose={() => setDeletingProgettoInfo(null)}
        />

        {/* Reorder Modal */}
        <ReorderModal
          isOpen={isReorderModalOpen}
          title={`Riordina Progetti - ${selectedCategory}`}
          description="Sposta i progetti in alto o in basso per modificarne l'ordine di visualizzazione nella pagina."
          items={filteredProgetti.map(item => ({
            id: item.id,
            title: item.title,
            subtitle: `${item.period || 'Attività'} • ${item.category}`,
            badge: item.category,
            imageUrl: item.image
          }))}
          onMoveItem={handleMoveProgetto}
          onClose={() => setIsReorderModalOpen(false)}
        />

      </div>
    </section>
  );
}
