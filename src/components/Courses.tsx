/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Percorso, Category } from '../types';
import { GRADIENT_PRESETS } from '../data';
import { Clock, Tag, Edit, Trash2, Plus, AlertCircle, BookOpen, Check, ArrowLeft, ArrowRight, ArrowUpDown, Cpu, Code2, Bot, GraduationCap, Building2, User, Sparkles, Binary } from 'lucide-react';
import CourseModal from './CourseModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import ReorderModal from './ReorderModal';

interface CoursesProps {
  percorsi: Percorso[];
  isAdmin: boolean;
  onAddCourse: (course: Percorso) => void;
  onUpdateCourse: (course: Percorso) => void;
  onDeleteCourse: (id: string) => void;
  onReorderCourses?: (newPercorsi: Percorso[]) => void;
}

export default function Courses({ percorsi, isAdmin, onAddCourse, onUpdateCourse, onDeleteCourse, onReorderCourses }: CoursesProps) {
  const [activeMacro, setActiveMacro] = useState<'STUDENTI' | 'PERSONALE SCOLASTICO' | 'AZIENDE'>('STUDENTI');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Tutti'>('Tutti');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Percorso | null>(null);
  const [deletingCourseInfo, setDeletingCourseInfo] = useState<{ id: string; title: string } | null>(null);

  // Helper to determine macro category
  const getMacroCategory = (cat: Category): 'STUDENTI' | 'PERSONALE SCOLASTICO' | 'AZIENDE' => {
    if ([
      "Scuola primaria",
      "Scuola secondaria di I grado",
      "Scuola secondaria di II grado",
      "CODING",
      "ROBOTICA"
    ].includes(cat)) {
      return 'STUDENTI';
    }
    if ([
      "Personale ATA",
      "Formazione docenti"
    ].includes(cat)) {
      return 'PERSONALE SCOLASTICO';
    }
    return 'AZIENDE';
  };

  // Helper for vibrant themed fallback backgrounds based on course content / category
  const getFallbackGradient = (course: Percorso) => {
    if (typeof course.gradientIndex === 'number' && course.gradientIndex >= 0 && course.gradientIndex < GRADIENT_PRESETS.length) {
      return GRADIENT_PRESETS[course.gradientIndex].css;
    }
    const cat = course.category;
    if (cat === 'ROBOTICA') return 'linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #fb7185 100%)';
    if (cat === 'CODING') return 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)';
    if (cat === 'Formazione docenti') return 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)';
    if (cat === 'Personale ATA') return 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)';
    if (cat === 'PMI') return 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)';
    if (cat === 'Privati') return 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fbbf24 100%)';
    if (cat === 'Scuola primaria') return 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #38bdf8 100%)';
    if (cat === 'Scuola secondaria di I grado' || cat === 'Scuola secondaria di II grado') return 'linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #818cf8 100%)';
    return 'linear-gradient(135deg, #0f172a 0%, #334155 50%, #475569 100%)';
  };

  const getThematicIcon = (course: Percorso) => {
    const cat = course.category;
    const titleLower = course.title.toLowerCase();
    if (cat === 'ROBOTICA' || titleLower.includes('robot') || titleLower.includes('spike') || titleLower.includes('mbot')) {
      return <Bot className="w-20 h-20 text-white/20" />;
    }
    if (cat === 'CODING' || titleLower.includes('scratch') || titleLower.includes('coding') || titleLower.includes('programmazione')) {
      return <Code2 className="w-20 h-20 text-white/20" />;
    }
    if (titleLower.includes('intelligenza artificiale') || titleLower.includes('ia') || titleLower.includes('ai') || titleLower.includes('prompt')) {
      return <Sparkles className="w-20 h-20 text-white/20" />;
    }
    if (titleLower.includes('3d') || titleLower.includes('tinkercad') || titleLower.includes('realtà')) {
      return <Binary className="w-20 h-20 text-white/20" />;
    }
    if (titleLower.includes('microbit') || titleLower.includes('iot') || titleLower.includes('elettronica')) {
      return <Cpu className="w-20 h-20 text-white/20" />;
    }
    if (cat === 'Formazione docenti' || cat === 'Personale ATA' || cat.includes('Scuola')) {
      return <GraduationCap className="w-20 h-20 text-white/20" />;
    }
    if (cat === 'PMI') {
      return <Building2 className="w-20 h-20 text-white/20" />;
    }
    return <BookOpen className="w-20 h-20 text-white/20" />;
  };

  // Filter paths based on macro-category and sub-category
  const filteredPercorsi = percorsi.filter(item => {
    const itemMacro = getMacroCategory(item.category);
    if (itemMacro !== activeMacro) return false;
    return selectedCategory === 'Tutti' || item.category === selectedCategory;
  });

  // Reorder filtered items within main percorsi list
  const handleMoveCourse = (fromIndex: number, toIndex: number) => {
    if (!onReorderCourses) return;
    if (fromIndex < 0 || fromIndex >= filteredPercorsi.length) return;
    if (toIndex < 0 || toIndex >= filteredPercorsi.length) return;

    const newSubset = [...filteredPercorsi];
    const [moved] = newSubset.splice(fromIndex, 1);
    newSubset.splice(toIndex, 0, moved);

    const subsetIds = new Set(newSubset.map(item => item.id));
    let subsetIdx = 0;
    const newAllPercorsi = percorsi.map(item => {
      if (subsetIds.has(item.id)) {
        const nextItem = newSubset[subsetIdx];
        subsetIdx++;
        return nextItem;
      }
      return item;
    });

    onReorderCourses(newAllPercorsi);
  };

  const handleEditClick = (course: Percorso) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleSaveCourse = (savedCourse: Percorso) => {
    try {
      if (editingCourse) {
        onUpdateCourse(savedCourse);
      } else {
        onAddCourse(savedCourse);
      }
    } catch (err) {
      console.error('Errore durante il salvataggio del percorso:', err);
    } finally {
      setIsModalOpen(false);
      setEditingCourse(null);
    }
  };

  const handleDeleteClick = (id: string, title: string) => {
    setDeletingCourseInfo({ id, title });
  };

  // Get color styles based on category tag
  const getCategoryStyles = (category: Category) => {
    switch (category) {
      case "Personale ATA":
      case "Scuola primaria":
      case "Scuola secondaria di I grado":
      case "Scuola secondaria di II grado":
      case "Formazione docenti":
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PMI':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Privati':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CODING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ROBOTICA':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'ALTRO':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <section id="percorsi" className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl space-y-4">
            <span className="font-mono text-sm sm:text-base font-bold uppercase tracking-widest text-indigo-600 block">
              Catalogo Formativo
            </span>
            <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight" id="courses-heading">
              I Miei Percorsi Formativi
            </h2>
            <p className="font-sans text-slate-600 text-sm sm:text-base leading-relaxed">
              Percorsi modulari personalizzabili in base alle esigenze didattiche e organizzative. Ogni percorso prevede una base teorica, laboratori pratici e dispense pronte all'uso.
            </p>
          </div>

          {/* Add Course button for Admin */}
          {isAdmin && (
            <button
              id="admin-add-course-btn"
              onClick={handleCreateClick}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-indigo-100 transition-all scale-100 hover:scale-[1.02] cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Percorso</span>
            </button>
          )}
        </div>

        {/* Macro Category Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-2xl flex-wrap justify-center gap-1">
            <button
              onClick={() => {
                setActiveMacro('STUDENTI');
                setSelectedCategory('Tutti');
              }}
              className={`px-6 py-2.5 rounded-xl font-sans text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeMacro === 'STUDENTI'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Studenti
            </button>
            <button
              onClick={() => {
                setActiveMacro('PERSONALE SCOLASTICO');
                setSelectedCategory('Tutti');
              }}
              className={`px-6 py-2.5 rounded-xl font-sans text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeMacro === 'PERSONALE SCOLASTICO'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Personale Scolastico
            </button>
            <button
              onClick={() => {
                setActiveMacro('AZIENDE');
                setSelectedCategory('Tutti');
              }}
              className={`px-6 py-2.5 rounded-xl font-sans text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeMacro === 'AZIENDE'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Aziende e Privati
            </button>
          </div>
        </div>

        {/* Category Filters bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12 border-b border-slate-200 pb-5">
          {activeMacro === 'STUDENTI' ? (
            (['Tutti', "Scuola primaria", "Scuola secondaria di I grado", "Scuola secondaria di II grado"] as const).map((cat) => (
              <button
                key={cat}
                id={`filter-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 py-2.5 rounded-xl font-sans text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {cat === 'Tutti' 
                  ? 'Tutti i Percorsi Studenti' 
                  : cat === "Scuola primaria" 
                    ? "Primaria" 
                    : cat === "Scuola secondaria di I grado" 
                      ? "Medie (I Grado)" 
                      : "Superiori (II Grado)"}
              </button>
            ))
          ) : activeMacro === 'PERSONALE SCOLASTICO' ? (
            (['Tutti', "Formazione docenti", "Personale ATA"] as const).map((cat) => (
              <button
                key={cat}
                id={`filter-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 py-2.5 rounded-xl font-sans text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {cat === 'Tutti' 
                  ? 'Tutti i Percorsi Personale' 
                  : cat === "Formazione docenti" 
                    ? "Docenti" 
                    : "Personale ATA"}
              </button>
            ))
          ) : (
            (['Tutti'] as const).map((cat) => (
              <button
                key={cat}
                id={`filter-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 py-2.5 rounded-xl font-sans text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                Tutti i Percorsi Aziende
              </button>
            ))
          )}
        </div>

        {/* Admin status banner */}
        {isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            id="admin-status-banner"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs sm:text-sm font-sans text-emerald-800">
                <span className="font-bold">Modalità Autore Attiva:</span> Puoi modificare, eliminare e riordinare l'ordine dei corsi della categoria tramite le frecce sulle card o con il pulsante dedicato.
              </div>
            </div>

            {filteredPercorsi.length > 1 && (
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0 uppercase tracking-wider"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>Riordina Categoria ({filteredPercorsi.length})</span>
              </button>
            )}
          </motion.div>
        )}

        {/* Courses Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredPercorsi.map((percorso, index) => {
              const hasCustomImage = Boolean(percorso.image && percorso.image.trim().length > 0);
              const fallbackGradient = getFallbackGradient(percorso);
              const backgroundStyle = hasCustomImage 
                ? { backgroundImage: `url(${percorso.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: fallbackGradient };

              return (
                <motion.article
                  key={percorso.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-slate-100/60 transition-all duration-300"
                  id={`course-card-${percorso.id}`}
                >
                  {/* Card Image/Gradient header */}
                  <div 
                    className="h-44 relative flex items-end p-6 overflow-hidden select-none"
                    style={backgroundStyle}
                  >
                    {/* Thematic watermark icon if no custom image */}
                    {!hasCustomImage && (
                      <div className="absolute -right-3 -bottom-3 transform rotate-12 opacity-75 pointer-events-none">
                        {getThematicIcon(percorso)}
                      </div>
                    )}

                    {/* Shadow overlay for legibility if using custom image */}
                    {hasCustomImage && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                    )}
                    
                    {/* Overlay elements */}
                    <div className="relative z-10 w-full flex items-center justify-between">
                      {/* Tag target category */}
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getCategoryStyles(percorso.category)}`}>
                        {percorso.category}
                      </span>

                      {percorso.isExample && (
                        <span className="px-2.5 py-1 bg-amber-500 text-slate-900 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
                          Esempio Modificabile
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Main Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      {/* Duration widget */}
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{percorso.duration}</span>
                      </div>

                      {/* Course Title */}
                      <h3 className="font-sans font-bold text-slate-900 text-lg leading-snug tracking-tight hover:text-indigo-600 transition-colors">
                        {percorso.title}
                      </h3>

                      {/* Course Description */}
                      <p className="font-sans text-slate-600 text-sm leading-relaxed line-clamp-4">
                        {percorso.description}
                      </p>

                      {/* Kit Requirement Warning Banner */}
                      {percorso.requiresKit && (
                        <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-amber-900 shadow-2xs">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span className="font-sans text-xs font-semibold leading-snug">
                            La scuola deve già essere in possesso del kit
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Key Topics / Bullet points */}
                    {percorso.topics && percorso.topics.length > 0 && (
                      <div className="border-t border-slate-100 pt-4 space-y-2.5">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                          Moduli Chiave Trattati
                        </span>
                        <ul className="space-y-1.5">
                          {percorso.topics.slice(0, 4).map((topic, topicIdx) => (
                            <li key={topicIdx} className="flex items-start gap-2 text-xs font-sans text-slate-600 leading-tight">
                              <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Card Admin Actions Footer */}
                  {isAdmin ? (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      {/* Reorder inline buttons */}
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveCourse(index, index - 1)}
                          className={`p-1.5 rounded-lg transition-all ${
                            index === 0
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer'
                          }`}
                          title="Sposta indietro nella sequenza"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-mono font-bold text-slate-500 px-1 select-none">
                          {index + 1}/{filteredPercorsi.length}
                        </span>
                        <button
                          type="button"
                          disabled={index === filteredPercorsi.length - 1}
                          onClick={() => handleMoveCourse(index, index + 1)}
                          className={`p-1.5 rounded-lg transition-all ${
                            index === filteredPercorsi.length - 1
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer'
                          }`}
                          title="Sposta avanti nella sequenza"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditClick(percorso)}
                          className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-sans font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                          title="Modifica contenuti"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-500" />
                          <span>Modifica</span>
                        </button>

                        <button
                          onClick={() => handleDeleteClick(percorso.id, percorso.title)}
                          className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-sans font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                          title="Elimina percorso"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Elimina</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-6 pb-6 pt-0 bg-white">
                      <a
                        href="#contatti"
                        className="w-full inline-flex items-center justify-center gap-1.5 py-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-sans font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Richiedi Info</span>
                      </a>
                    </div>
                  )}
                </motion.article>
              );
            })}

            {/* Empty catalogue message */}
            {filteredPercorsi.length === 0 && (
              <div className="col-span-full py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-slate-900 text-base">Nessun percorso trovato</h4>
                  <p className="font-sans text-slate-500 text-xs mt-1">
                    {selectedCategory === 'Tutti' 
                      ? "Il catalogo è attualmente vuoto. Se sei l'amministratore, puoi aggiungere nuovi percorsi cliccando su 'Nuovo Percorso'." 
                      : `Non ci sono percorsi disponibili per la categoria selezionata.`}
                  </p>
                </div>
                {selectedCategory !== 'Tutti' && (
                  <button
                    onClick={() => setSelectedCategory('Tutti')}
                    className="font-mono text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest"
                  >
                    Azzera filtri categoria
                  </button>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Editor Overlay */}
        <CourseModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCourse(null);
          }}
          onSave={handleSaveCourse}
          onDelete={(id) => {
            onDeleteCourse(id);
            setIsModalOpen(false);
            setEditingCourse(null);
          }}
          courseToEdit={editingCourse}
        />

        <ConfirmDeleteModal
          isOpen={Boolean(deletingCourseInfo)}
          title="Elimina Percorso Formativo"
          message={`Sei sicuro di voler eliminare il percorso "${deletingCourseInfo?.title}"? Questa operazione lo rimuoverà permanentemente.`}
          onConfirm={() => {
            if (deletingCourseInfo) {
              onDeleteCourse(deletingCourseInfo.id);
              setDeletingCourseInfo(null);
            }
          }}
          onClose={() => setDeletingCourseInfo(null)}
        />

        <ReorderModal
          isOpen={isReorderModalOpen}
          title={`Riordina Corsi - ${selectedCategory === 'Tutti' ? activeMacro : selectedCategory}`}
          description="Sposta i percorsi in alto o in basso per modificarne l'ordine di visualizzazione nella pagina."
          items={filteredPercorsi.map(item => ({
            id: item.id,
            title: item.title,
            subtitle: `${item.duration} • ${item.category}`,
            badge: item.category,
            imageUrl: item.image
          }))}
          onMoveItem={handleMoveCourse}
          onClose={() => setIsReorderModalOpen(false)}
        />

      </div>
    </section>
  );
}
