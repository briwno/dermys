import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Star, MapPin, Grid, MessageSquare, Instagram, 
  ExternalLink, Calendar, Plus, X, Tag, Edit3, Check
} from 'lucide-react';
import { cn, getArtistImage } from '@/src/lib/utils';

interface ArtistProfileScreenProps {
  artist: any;
  onBack: () => void;
  onStartBooking: () => void;
  onStartChat: () => void;
  isOwnProfile?: boolean;
}

export function ArtistProfileScreen({ artist, onBack, onStartBooking, onStartChat, isOwnProfile = false }: ArtistProfileScreenProps) {
  const [specialties, setSpecialties] = useState<string[]>(artist.specialties || ['Fine Line', 'Blackwork']);
  const [isEditingSpecialties, setIsEditingSpecialties] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);

  const artistName = artist.displayName || artist.name || 'Artist';
  const artistRating = artist.rating || 5.0;
  const artistImage = getArtistImage(artist);
  const artistStudio = artist.studioName || artist.studio;
  const artistBio = artist.bio || "Especialista em tatuagem artística. Procuro transformar sentimentos em arte eterna na pele.";

  const portfolio = [
    '/src/assets/images/regenerated_image_1779250755194.jpg',
    '/src/assets/images/regenerated_image_1779250607490.jpg',
    '/src/assets/images/regenerated_image_1779250487618.jpg',
    '/src/assets/images/regenerated_image_1779250405298.jpg',
    '/src/assets/images/regenerated_image_1778706240305.jpg',
    '/src/assets/images/regenerated_image_1778706238754.jpg',
  ];

  const addSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (tag: string) => {
    setSpecialties(specialties.filter(s => s !== tag));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] pb-32 overflow-y-auto no-scrollbar">
      <AnimatePresence>
        {isEditingSpecialties && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] p-6 flex flex-col pt-20"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black uppercase text-primary italic tracking-tighter">Editar Especialidades</h2>
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Defina seus estilos principais</p>
              </div>
              <button 
                onClick={() => setIsEditingSpecialties(false)}
                className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input 
                    type="text" 
                    placeholder="Ex: Realismo, Fineline..."
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSpecialty()}
                    className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 text-white font-bold placeholder:text-zinc-700 focus:border-primary outline-none"
                  />
                </div>
                <button 
                  onClick={addSpecialty}
                  className="w-14 h-14 bg-primary text-black rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
                >
                  <Plus size={24} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {specialties.map(tag => (
                  <motion.div 
                    layout
                    key={tag}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-widest"
                  >
                    {tag}
                    <button onClick={() => removeSpecialty(tag)} className="hover:text-white transition-colors">
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setIsEditingSpecialties(false)}
              className="mt-auto w-full h-16 bg-primary text-black font-black uppercase tracking-[0.2em] italic rounded-2xl flex items-center justify-center gap-3"
            >
              <Check size={20} /> Salvar Alterações
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div className="relative h-80 shrink-0">
        <img src={artistImage} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/40"></div>
        
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 w-10 h-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-white"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="absolute bottom-6 left-6 right-6 text-left">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">{artistName}</h1>
              <p className="text-primary text-xs font-black uppercase tracking-[0.2em] mt-2">@{artistName.toLowerCase().replace(/ /g, '_')}</p>
            </div>
            <div className="bg-primary px-3 py-1.5 rounded-sm text-black text-[10px] font-black uppercase italic shadow-xl shadow-primary/20">
              {artistRating.toFixed(1)} <Star size={10} className="inline ml-1" fill="currentColor" />
            </div>
          </div>
        </div>
      </div>

      {/* Info Stats */}
      <div className="grid grid-cols-3 gap-1 px-6 mt-6">
        <div className="flex flex-col items-center p-4 bg-[#121212] border border-[#1A1A1A] rounded-l-2xl">
          <span className="text-xl font-black italic text-white leading-none">124</span>
          <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest mt-1">Sessions</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-[#121212] border-y border-[#1A1A1A]">
          <span className="text-xl font-black italic text-white leading-none">8 anos</span>
          <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest mt-1">Exp.</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-[#121212] border border-[#1A1A1A] rounded-r-2xl">
          <span className="text-xl font-black italic text-white leading-none">2.4k</span>
          <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest mt-1">Followers</span>
        </div>
      </div>

      <div className="px-6 space-y-6 mt-8">
        {/* Specialties */}
        <div className="space-y-4">
          <div className="flex justify-between items-center group">
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em]">Especialidades</h3>
            {isOwnProfile && (
              <button 
                onClick={() => setIsEditingSpecialties(true)}
                className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-1 hover:brightness-110 transition-all bg-primary/10 px-3 py-1 rounded-full border border-primary/20"
              >
                <Edit3 size={10} /> Editar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {specialties.map(tag => (
              <span key={tag} className="px-3 py-1 bg-[#121212] border border-[#1A1A1A] rounded-full text-zinc-400 text-[10px] font-black uppercase tracking-wider italic">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] flex items-center gap-2 text-left">
            Bio <div className="h-[1px] flex-1 bg-[#1A1A1A]"></div>
          </h3>
          <p className="text-sm text-zinc-400 font-medium leading-relaxed italic text-left">
            "{artistBio}"
          </p>
        </div>

        {/* Studio Info */}
        <div className="immersive-card">
          <div className="flex items-start gap-4 text-left">
            <div className="w-10 h-10 bg-black border border-zinc-800 rounded-lg flex items-center justify-center text-primary">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase italic tracking-tighter text-white">{artistStudio}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Av. Paulista, 1024 - SP</p>
              <button className="text-[9px] text-primary font-black uppercase mt-2 flex items-center gap-1">Ver no mapa <ExternalLink size={10} /></button>
            </div>
          </div>
        </div>

        {/* Portfolio Tabs */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-left">
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em]">Portfólio</h3>
            <Instagram size={16} className="text-zinc-700" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {portfolio.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="aspect-[3/4] bg-[#121212] border border-[#1A1A1A] rounded-xl overflow-hidden relative group"
              >
                <img src={img} className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                   <span className="text-[8px] font-black uppercase text-primary tracking-widest">Ver Detalhes</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-40">
        <div className="flex gap-4">
          <button 
            onClick={async () => {
              setIsStartingChat(true);
              await new Promise(resolve => setTimeout(resolve, 800));
              onStartChat();
              setIsStartingChat(false);
            }}
            disabled={isStartingChat}
            className={cn(
              "flex-1 h-14 rounded-xl flex items-center justify-center gap-2 transition-all font-black uppercase tracking-[0.14em] italic border text-xs",
              isStartingChat 
                ? "bg-primary text-black border-primary animate-pulse" 
                : "bg-[#121212] border-[#1A1A1A] text-primary hover:bg-zinc-900 hover:text-white active:scale-95"
            )}
          >
            {isStartingChat ? (
              <>
                <svg className="animate-spin h-4 w-4 text-black mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando...
              </>
            ) : (
              <>
                <MessageSquare size={20} strokeWidth={2.5} /> Chat
              </>
            )}
          </button>
          <button 
            onClick={onStartBooking}
            className="flex-[1.5] h-14 bg-primary text-black font-black uppercase tracking-[0.15em] italic rounded-xl flex items-center justify-center gap-2 shadow-2xl shadow-primary/20 active:scale-95 transition-all"
          >
             Reservar <Calendar size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
