/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, ShieldAlert, BookOpen } from 'lucide-react';

interface HeroProps {
  onExploreCourses: () => void;
  onContactClick: () => void;
}

export default function Hero({ onExploreCourses, onContactClick }: HeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  const domains = [
    'Alfabetizzazione AI',
    'Edutech',
    'Potenziamento della didattica',
    'Divulgazione scientifica'
  ];

  return (
    <section 
      id="presentazione" 
      className="relative min-h-screen pt-28 pb-16 flex flex-col justify-center bg-slate-50 overflow-hidden"
    >
      {/* Decorative Blur Ambient elements */}
      <div className="absolute -top-10 -left-10 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
        >
          {/* Main Copy Column */}
          <div className="lg:col-span-7 space-y-6 bg-white/40 p-6 sm:p-8 rounded-3xl border border-slate-200/40 backdrop-blur-sm">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Formatore & Docente in Intelligenza Artificiale</span>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="font-sans font-black text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-[0.98] text-balance"
              id="hero-heading"
            >
              Formazione e Consulenza AI: <span className="text-indigo-600">valore concreto</span> per Scuole e Aziende
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="font-sans text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl text-balance"
              id="hero-bio"
            >
              Neuroscienziato di formazione, <strong>formatore AI</strong>, docente e divulgatore scientifico. Progetto percorsi su misura di <strong>formazione in intelligenza artificiale</strong> per scuole, docenti, enti e imprese. Laboratori pratici di alfabetizzazione AI, Edutech e didattica innovativa con risultati misurabili.
            </motion.p>

            {/* Core Competencies badges */}
            <motion.div variants={itemVariants} className="space-y-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                Ambiti di specializzazione
              </span>
              <div className="flex flex-wrap gap-2">
                {domains.map((domain, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-semibold shadow-sm transition-all hover:border-indigo-400 hover:shadow-indigo-50/40"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Call to Actions */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                id="hero-cta-courses"
                onClick={onExploreCourses}
                className="group flex items-center justify-center gap-2 bg-slate-900 text-white font-sans font-bold px-8 py-4 rounded-xl text-sm hover:bg-indigo-600 transition-all shadow-md hover:shadow-indigo-100 hover:scale-[1.02] cursor-pointer"
              >
                <span>VEDI PERCORSI</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="hero-cta-contact"
                onClick={onContactClick}
                className="flex items-center justify-center bg-white text-slate-700 border-2 border-slate-200 font-sans font-bold px-8 py-4 rounded-xl text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
              >
                <span>SCRIVIMI ORA</span>
              </button>
            </motion.div>
          </div>

          {/* Stats & Trust Card Column */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <motion.div 
              variants={itemVariants}
              className="bg-indigo-600 text-white p-8 rounded-3xl shadow-xl shadow-indigo-100/50 relative overflow-hidden"
              id="hero-stats-card"
            >
              <div className="absolute -right-4 -top-12 text-white/10 pointer-events-none select-none">
                <BookOpen className="w-56 h-56 rotate-12" />
              </div>
              
              <div className="space-y-6 relative z-10">
                <span className="font-mono text-sm sm:text-base font-bold uppercase tracking-widest text-indigo-200 block">
                  Esperienza e Risultati
                </span>

                <div className="grid grid-cols-2 gap-4">
                  {/* Stat 1 */}
                  <div className="space-y-0.5">
                    <span className="font-sans font-black text-4xl sm:text-5xl text-white tracking-tight block">
                      4
                    </span>
                    <span className="font-sans text-[10px] font-bold text-indigo-100 uppercase tracking-widest block">
                      Anni di Attività
                    </span>
                  </div>

                  {/* Stat 2 */}
                  <div className="space-y-0.5">
                    <span className="font-sans font-black text-4xl sm:text-5xl text-white tracking-tight block">
                      1500+
                    </span>
                    <span className="font-sans text-[10px] font-bold text-indigo-100 uppercase tracking-widest block">
                      Ore Erogate
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-5 space-y-3">
                  <div className="flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-sans font-bold text-white text-xs uppercase tracking-wide">Target Definiti</h4>
                      <p className="font-sans text-[11px] text-indigo-100 leading-normal">Studenti, personale scolastico, PMI e privati.</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-sans font-bold text-white text-xs uppercase tracking-wide">Laboratori Pratici</h4>
                      <p className="font-sans text-[11px] text-indigo-100 leading-normal">Non solo teoria astratta. Esercitazioni e applicazioni pratiche.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            
          </div>
        </motion.div>
      </div>
    </section>
  );
}
