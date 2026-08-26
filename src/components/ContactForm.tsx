/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Linkedin, Send, CheckCircle, ArrowRight, Building, Landmark, UserCheck, AlertCircle } from 'lucide-react';
import { ContactFormData, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    category: 'Generale',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('https://formspree.io/f/xwlkeprb', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          category: formData.category,
          message: formData.message.trim(),
          _subject: `Nuova richiesta di contatto da ${formData.name.trim()} [${formData.category}]`
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({
          name: '',
          email: '',
          category: 'Generale',
          message: ''
        });
      } else {
        const data = await response.json();
        if (data && data.errors && data.errors.length > 0) {
          setErrorMessage(data.errors.map((err: { message: string }) => err.message).join(', '));
        } else {
          setErrorMessage('Si è verificato un errore durante l\'invio. Riprova tra poco.');
        }
      }
    } catch {
      setErrorMessage('Impossibile completare l\'invio. Verifica la tua connessione internet o scrivi direttamente a formazione.rocco99@gmail.com.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <section id="contatti" className="py-24 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Info Column (Left) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="font-mono text-sm sm:text-base font-bold uppercase tracking-widest text-indigo-600 block">
                Contatti & Sinergie
              </span>
              <h2 className="font-sans font-black text-3xl sm:text-4xl text-slate-900 tracking-tight" id="contacts-heading">
                Iniziamo a Lavorare Insieme
              </h2>
              <p className="font-sans text-slate-500 text-sm sm:text-base leading-relaxed">
                Hai bisogno di progettare un piano formativo personalizzato per il tuo istituto scolastico o per la tua impresa? Inviami un messaggio descrivendo brevemente i tuoi obiettivi.
              </p>
            </div>

            {/* Quick value props list */}
            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                Cosa Aspettarsi
              </span>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <div className="p-1 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span><strong>Risposta in 24 ore:</strong> Valuto la richiesta e propongo una prima chiamata conoscitiva di 15 minuti.</span>
                </li>

                <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <div className="p-1 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span><strong>Analisi dei bisogni:</strong> Nessun corso pre-confezionato: ogni modulo viene tarato sulle reali competenze di partenza del team o del personale.</span>
                </li>
              </ul>
            </div>

            {/* Core Channels Placeholders */}
            <div className="space-y-4 pt-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                Canali Diretti & Social
              </span>

              <div className="space-y-3">
                {/* Email link */}
                <a 
                  href="mailto:formazione.rocco99@gmail.com" 
                  className="flex items-center gap-3.5 p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all group cursor-pointer"
                  id="direct-email-link"
                >
                  <div className="p-2.5 bg-white text-slate-500 group-hover:text-indigo-600 rounded-lg border border-slate-150 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Scrivimi direttamente</span>
                    <span className="font-mono text-sm text-slate-700 group-hover:text-indigo-950 font-medium transition-colors">
                      formazione.rocco99@gmail.com
                    </span>
                  </div>
                </a>

                {/* Linkedin link */}
                <a 
                  href="https://www.linkedin.com/in/francesco-rocco-formazione" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3.5 p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all group cursor-pointer"
                  id="linkedin-link"
                >
                  <div className="p-2.5 bg-white text-slate-500 group-hover:text-indigo-600 rounded-lg border border-slate-150 transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Rete Professionale</span>
                    <span className="font-sans text-sm text-slate-700 group-hover:text-indigo-950 font-medium transition-colors">
                      www.linkedin.com/in/francesco-rocco-formazione
                    </span>
                  </div>
                </a>
              </div>
            </div>

          </div>

          {/* Form Column (Right) */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-100/30">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form 
                  key="contact-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit} 
                  className="space-y-6"
                  id="consultation-form"
                >
                  <h3 className="font-sans font-black text-xl text-slate-900 tracking-tight uppercase">
                    Invia un Messaggio
                  </h3>

                  {/* Input Nome */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      Nome e Cognome / Ente *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="es. Marco Rossi / Istituto Comprensivo G. Galilei"
                      className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans text-slate-950"
                    />
                  </div>

                  {/* Input Email */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      Indirizzo Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="es. marco.rossi@email.it"
                      className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans text-slate-950"
                    />
                  </div>

                  {/* Select Categoria/Target */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      Ambito di Interesse *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'Scuole', label: 'Scuole/ATA', icon: Landmark },
                        { id: 'PMI', label: 'PMI', icon: Building },
                        { id: 'Privati', label: 'Freelance', icon: UserCheck },
                        { id: 'Generale', label: 'Generale', icon: Mail }
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = formData.category === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, category: item.id as Category | 'Generale' }))}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span className="text-[10px] sm:text-xs font-semibold tracking-tight uppercase">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input Messaggio */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      Come posso aiutarti? *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Descrivi brevemente il target, la durata indicativa desiderata e i temi principali che vorresti affrontare..."
                      className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans text-slate-950 leading-relaxed text-sm"
                    />
                  </div>

                  {/* Error display if any */}
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 font-sans text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                      <div className="flex-1">{errorMessage}</div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.name.trim() || !formData.email.trim() || !formData.message.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 text-white font-sans font-bold py-4 rounded-xl transition-all shadow-md shadow-slate-900/10 hover:scale-[1.01] cursor-pointer text-xs uppercase tracking-wider"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Invio in corso...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>INVIA RICHIESTA</span>
                      </>
                    )}
                  </button>

                </motion.form>
              ) : (
                <motion.div 
                  key="contact-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center space-y-6"
                  id="contact-success-banner"
                >
                  <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-sans font-black text-2xl text-slate-900 tracking-tight uppercase">
                      Messaggio Inviato con Successo!
                    </h3>
                    <p className="font-sans text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                      Grazie per avermi contattato. Ho ricevuto direttamente la tua richiesta e ti risponderò al più presto via email.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200/80">
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setErrorMessage('');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      <span>Invia un altro messaggio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
