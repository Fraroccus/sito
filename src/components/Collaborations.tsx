/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Info, ChevronLeft, ChevronRight, Plus, Building2, ArrowLeft, ArrowRight, ArrowUpDown } from 'lucide-react';
import { Collaboration } from '../types';
import PartnerModal from './PartnerModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import ReorderModal from './ReorderModal';

interface CollaborationsProps {
  collaborations: Collaboration[];
  isAdmin: boolean;
  onAddCollab: (partner: Collaboration) => void;
  onUpdateCollab: (partner: Collaboration) => void;
  onDeleteCollab: (id: string) => void;
  onReorderCollabs?: (newCollabs: Collaboration[]) => void;
}

export default function Collaborations({ 
  collaborations = [], 
  isAdmin = false, 
  onAddCollab, 
  onUpdateCollab, 
  onDeleteCollab,
  onReorderCollabs
}: CollaborationsProps) {
  const baseItems = collaborations;
  // Duplicate the list of collaborations to enable infinite looping
  const items = [...baseItems, ...baseItems, ...baseItems];

  const [currentIndex, setCurrentIndex] = React.useState(baseItems.length);
  const [isTransitioning, setIsTransitioning] = React.useState(true);
  const [isPaused, setIsPaused] = React.useState(false);
  const [itemsPerView, setItemsPerView] = React.useState(4);
  const isMoving = React.useRef(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = React.useState(false);
  const [partnerToEdit, setPartnerToEdit] = React.useState<Collaboration | null>(null);
  const [deletingCollabInfo, setDeletingCollabInfo] = React.useState<{ id: string; name: string } | null>(null);

  const handleMovePartner = (fromIndex: number, toIndex: number) => {
    if (!onReorderCollabs) return;
    if (fromIndex < 0 || fromIndex >= baseItems.length) return;
    if (toIndex < 0 || toIndex >= baseItems.length) return;

    const newCollabs = [...baseItems];
    const [moved] = newCollabs.splice(fromIndex, 1);
    newCollabs.splice(toIndex, 0, moved);

    onReorderCollabs(newCollabs);
  };

  // Sync index on baseItems length change to avoid out of bounds
  React.useEffect(() => {
    setCurrentIndex(baseItems.length);
  }, [baseItems.length]);

  // Monitor screen width to dynamically update how many cards to show per view
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(4);
      } else if (window.innerWidth >= 640) {
        setItemsPerView(2);
      } else {
        setItemsPerView(1);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = React.useCallback(() => {
    if (baseItems.length === 0) return;
    if (isMoving.current) return;
    isMoving.current = true;
    setCurrentIndex((prev) => prev + 1);
    setTimeout(() => {
      isMoving.current = false;
    }, 700); // matching the transition duration
  }, [baseItems.length]);

  const prevSlide = React.useCallback(() => {
    if (baseItems.length === 0) return;
    if (isMoving.current) return;
    isMoving.current = true;
    setCurrentIndex((prev) => prev - 1);
    setTimeout(() => {
      isMoving.current = false;
    }, 700); // matching the transition duration
  }, [baseItems.length]);

  const handleTransitionEnd = () => {
    if (baseItems.length === 0) return;
    // If we've scrolled past the middle group to the right, snap back to the middle group instantly
    if (currentIndex >= baseItems.length * 2) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex - baseItems.length);
    }
    // If we've scrolled past the middle group to the left, snap forward to the middle group instantly
    else if (currentIndex < baseItems.length) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex + baseItems.length);
    }
  };

  // Re-enable transitioning once snapping is complete
  React.useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // Handle automatic scrolling from right to left
  React.useEffect(() => {
    if (isPaused || baseItems.length === 0) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 3500); // advances every 3.5 seconds
    return () => clearInterval(interval);
  }, [nextSlide, isPaused, baseItems.length]);

  const handleSavePartner = (partner: Collaboration) => {
    try {
      if (partnerToEdit) {
        onUpdateCollab(partner);
      } else {
        onAddCollab(partner);
      }
    } catch (err) {
      console.error('Errore durante il salvataggio della collaborazione:', err);
    } finally {
      setIsModalOpen(false);
      setPartnerToEdit(null);
    }
  };

  // If there are no partners yet, show a clean state
  if (baseItems.length === 0) {
    return (
      <section id="collaborazioni" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <span className="font-mono text-sm sm:text-base font-bold uppercase tracking-widest text-indigo-600 block">
              La Mia Rete
            </span>
            <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
              Enti e Aziende Partner
            </h2>
            <p className="font-sans text-slate-500 text-sm sm:text-base leading-relaxed">
              I percorsi formativi sono progettati e modificati in base alle necessità di istituti scolastici, enti di formazione e aziende del territorio.
            </p>
            
            {isAdmin && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => {
                    setPartnerToEdit(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-sm rounded-xl shadow-lg hover:shadow-indigo-100 transition-all cursor-pointer uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Partner
                </button>
              </div>
            )}
          </div>

          <div className="text-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-3xl max-w-md mx-auto">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="font-sans font-bold text-slate-800 text-base mb-1">Nessun partner inserito</h3>
            <p className="font-sans text-slate-500 text-xs">
              Usa la modalità editor attiva per aggiungere partner o enti con cui hai collaborato.
            </p>
          </div>

        </div>

        <PartnerModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setPartnerToEdit(null);
          }}
          onSave={handleSavePartner}
          onDelete={(id) => {
            onDeleteCollab(id);
            setIsModalOpen(false);
            setPartnerToEdit(null);
          }}
          partnerToEdit={partnerToEdit}
        />
      </section>
    );
  }

  return (
    <section id="collaborazioni" className="py-20 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <span className="font-mono text-sm sm:text-base font-bold uppercase tracking-widest text-indigo-600 block">
            La Mia Rete
          </span>
          <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight" id="collab-heading">
            Enti e Aziende Partner
          </h2>
          <p className="font-sans text-slate-500 text-sm sm:text-base leading-relaxed">
            I percorsi formativi sono progettati e modificati in base alle necessità di istituti scolastici, enti di formazione e aziende del territorio.
          </p>

          {isAdmin && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button
                onClick={() => {
                  setPartnerToEdit(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-sm rounded-xl shadow-lg hover:shadow-indigo-100 transition-all cursor-pointer uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                <span>Aggiungi Partner</span>
              </button>

              {baseItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsReorderModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider"
                >
                  <ArrowUpDown className="w-4 h-4 text-emerald-400" />
                  <span>Riordina Partner ({baseItems.length})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Collaborations Slider Container */}
        <div 
          className="relative px-4 sm:px-12"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left Arrow Button */}
          <button 
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-white/90 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-600 hover:bg-white shadow-md hover:shadow-lg transition-all focus:outline-none cursor-pointer"
            aria-label="Previous slide"
            id="collab-prev-btn"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Arrow Button */}
          <button 
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-white/90 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-600 hover:bg-white shadow-md hover:shadow-lg transition-all focus:outline-none cursor-pointer"
            aria-label="Next slide"
            id="collab-next-btn"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slider Window */}
          <div className="overflow-hidden">
            <div 
              className={`flex ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
              style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
              onTransitionEnd={handleTransitionEnd}
            >
              {items.map((collab, index) => {
                const realIndex = index % baseItems.length;
                return (
                  <div
                    key={`${collab.id}-${index}`}
                    className="w-full sm:w-1/2 lg:w-1/4 shrink-0 px-3 py-2"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ delay: realIndex * 0.05, duration: 0.4 }}
                      className="group h-full p-6 bg-slate-50/50 border border-slate-200 rounded-2xl flex flex-col justify-between items-center hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100/50 transition-all text-center relative"
                      id={`collab-card-${collab.id}-${index}`}
                    >
                      <div className="flex flex-col items-center space-y-4 w-full">
                        {collab.websiteUrl ? (
                          <a 
                            href={collab.websiteUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex flex-col items-center space-y-4 w-full group/link cursor-pointer"
                          >
                            {/* Centered Space for the Logo */}
                            <div className="w-16 h-16 flex items-center justify-center font-mono font-black text-slate-700 group-hover:text-indigo-600 group-hover/link:text-indigo-600 transition-colors overflow-hidden text-lg">
                              {collab.logoUrl ? (
                                <img 
                                  src={collab.logoUrl} 
                                  alt={collab.name} 
                                  className="w-full h-full object-contain p-1.5"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                collab.logoText
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <h3 className="font-sans font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 group-hover/link:text-indigo-600 transition-colors uppercase tracking-wider leading-snug line-clamp-2 hover:underline">
                                {collab.name}
                              </h3>
                              <p className="font-sans text-slate-500 text-[11px] sm:text-xs font-normal leading-normal">
                                {collab.role}
                              </p>
                            </div>
                          </a>
                        ) : (
                          <>
                            {/* Centered Space for the Logo */}
                            <div className="w-16 h-16 flex items-center justify-center font-mono font-black text-slate-700 group-hover:text-indigo-600 transition-colors overflow-hidden text-lg">
                              {collab.logoUrl ? (
                                <img 
                                  src={collab.logoUrl} 
                                  alt={collab.name} 
                                  className="w-full h-full object-contain p-1.5"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                collab.logoText
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <h3 className="font-sans font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-wider leading-snug line-clamp-2">
                                {collab.name}
                              </h3>
                              <p className="font-sans text-slate-500 text-[11px] sm:text-xs font-normal leading-normal">
                                {collab.role}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Admin actions or empty if not admin */}
                      {isAdmin && (
                        <div className="mt-6 pt-4 border-t border-slate-200/50 flex flex-wrap items-center justify-center gap-1.5 w-full z-20">
                          {/* Reorder inline buttons */}
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs mr-1">
                            <button
                              type="button"
                              disabled={realIndex === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMovePartner(realIndex, realIndex - 1);
                              }}
                              className={`p-1 rounded transition-all ${
                                realIndex === 0
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer'
                              }`}
                              title="Sposta prima"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <span className="text-[9px] font-mono font-bold text-slate-500 px-0.5 select-none">
                              {realIndex + 1}
                            </span>
                            <button
                              type="button"
                              disabled={realIndex === baseItems.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMovePartner(realIndex, realIndex + 1);
                              }}
                              className={`p-1 rounded transition-all ${
                                realIndex === baseItems.length - 1
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer'
                              }`}
                              title="Sposta dopo"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPartnerToEdit(collab);
                              setIsModalOpen(true);
                            }}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Modifica
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingCollabInfo({ id: collab.id, name: collab.name });
                            }}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Elimina
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      <PartnerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPartnerToEdit(null);
        }}
        onSave={handleSavePartner}
        onDelete={(id) => {
          onDeleteCollab(id);
          setIsModalOpen(false);
          setPartnerToEdit(null);
        }}
        partnerToEdit={partnerToEdit}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingCollabInfo)}
        title="Rimuovi Partner"
        message={`Sei sicuro di voler rimuovere "${deletingCollabInfo?.name}" dalla tua rete? Questa operazione lo eliminerà permanentemente.`}
        onConfirm={() => {
          if (deletingCollabInfo) {
            onDeleteCollab(deletingCollabInfo.id);
            setDeletingCollabInfo(null);
          }
        }}
        onClose={() => setDeletingCollabInfo(null)}
      />

      <ReorderModal
        isOpen={isReorderModalOpen}
        title="Riordina Enti e Aziende Partner"
        description="Sposta i partner in alto o in basso per modificarne l'ordine nel carosello."
        items={baseItems.map(item => ({
          id: item.id,
          title: item.name,
          subtitle: item.role,
          badge: item.logoText,
          imageUrl: item.logoUrl
        }))}
        onMoveItem={handleMovePartner}
        onClose={() => setIsReorderModalOpen(false)}
      />
    </section>
  );
}
