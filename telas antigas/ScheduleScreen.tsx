import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Settings, LogOut, Shield, CreditCard, HelpCircle, 
  Bell, ChevronRight, Camera, Plus, Trash2, Tag, 
  Maximize2, X, Image as ImageIcon, Loader2
} from 'lucide-react';
import { UserRole } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';

interface PortfolioItem {
  id: string;
  url: string;
  category: string;
  tags: string[];
}

interface ProfileScreenProps {
  user: any;
  onLogout: () => void;
  onUpdateUser?: (data: any) => void;
}

export function ProfileScreen({ user, onLogout, onUpdateUser }: ProfileScreenProps) {
  const [showPortfolioManager, setShowPortfolioManager] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editableUser, setEditableUser] = useState({
    displayName: user.displayName || '',
    studioName: user.studioName || '',
    studioAddress: user.studioAddress || '',
    bio: user.bio || ''
  });

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([
    { id: '1', url: '/src/assets/images/regenerated_image_1779250755194.jpg', category: 'Traditional', tags: ['leopard', 'sleeve'] },
    { id: '2', url: '/src/assets/images/regenerated_image_1779250607490.jpg', category: 'Traditional', tags: ['flash', 'umbrella'] },
    { id: '3', url: '/src/assets/images/regenerated_image_1779250487618.jpg', category: 'Traditional', tags: ['nurse', 'snake'] },
    { id: '4', url: '/src/assets/images/regenerated_image_1779250405298.jpg', category: 'Blackwork', tags: ['scorpion'] },
    { id: '5', url: '/src/assets/images/regenerated_image_1778706240305.jpg', category: 'Blackwork', tags: ['skull'] },
    { id: '6', url: '/src/assets/images/regenerated_image_1778706238754.jpg', category: 'Fineline', tags: ['geometric'] },
  ]);

  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        ...editableUser,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userRef, updateData);
      
      if (onUpdateUser) {
        onUpdateUser({ ...user, ...updateData });
      }
      
      setShowProfileEditor(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (id: string) => {
    setPortfolio(portfolio.filter(p => p.id !== id));
  };

  const addImage = () => {
    const newItem: PortfolioItem = {
      id: Math.random().toString(36).substr(2, 9),
      url: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad',
      category: 'New Work',
      tags: ['fresh']
    };
    setPortfolio([newItem, ...portfolio]);
  };

  if (showProfileEditor) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] z-[200] flex flex-col p-6 pb-24 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black uppercase text-primary italic tracking-tighter">Editar Perfil</h2>
            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em]">Dados Profissionais</p>
          </div>
          <button 
            onClick={() => setShowProfileEditor(false)}
            className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest px-2">Nome Comercial</label>
            <input 
              type="text"
              value={editableUser.displayName}
              onChange={(e) => setEditableUser({ ...editableUser, displayName: e.target.value })}
              className="w-full h-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 outline-none focus:border-primary text-white font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest px-2">Nome do Estúdio</label>
            <input 
              type="text"
              value={editableUser.studioName}
              onChange={(e) => setEditableUser({ ...editableUser, studioName: e.target.value })}
              className="w-full h-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 outline-none focus:border-primary text-white font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest px-2">Endereço do Estúdio</label>
            <input 
              type="text"
              value={editableUser.studioAddress}
              onChange={(e) => setEditableUser({ ...editableUser, studioAddress: e.target.value })}
              className="w-full h-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 outline-none focus:border-primary text-white font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest px-2">Biografia / Sobre</label>
            <textarea 
              rows={4}
              value={editableUser.bio}
              onChange={(e) => setEditableUser({ ...editableUser, bio: e.target.value })}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 outline-none focus:border-primary text-white font-medium italic text-sm leading-relaxed"
            />
          </div>

          <button 
            onClick={handleSaveProfile}
            disabled={loading}
            className="w-full h-16 bg-primary text-black font-black uppercase tracking-[0.2em] italic rounded-2xl shadow-xl shadow-primary/10 mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'Salvar Alterações'
            )}
          </button>
        </div>
      </div>
    );
  }

  if (showPortfolioManager) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] z-[200] flex flex-col p-6 pb-24 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black uppercase text-primary italic tracking-tighter">Gerenciar Portfólio</h2>
            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em]">Total: {portfolio.length} Trabalhos</p>
          </div>
          <button 
            onClick={() => setShowPortfolioManager(false)}
            className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500"
          >
            <X size={20} />
          </button>
        </div>

        <button 
          onClick={addImage}
          className="w-full h-32 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-3 text-zinc-600 hover:text-primary hover:border-primary/30 transition-all mb-8 group"
        >
          <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Nova Arte</span>
        </button>

        <div className="grid grid-cols-1 gap-6">
          {portfolio.map((item) => (
            <motion.div 
              layout
              key={item.id}
              className="bg-[#121212] border border-[#1A1A1A] rounded-[2rem] overflow-hidden group shadow-2xl"
            >
              <div className="aspect-[4/3] relative">
                <img src={item.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => removeImage(item.id)}
                    className="w-10 h-10 bg-black/80 backdrop-blur-md rounded-xl flex items-center justify-center text-red-500 border border-red-500/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-3 py-1 rounded-sm tracking-widest">{item.category}</span>
                  <div className="flex gap-1">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[8px] font-black uppercase text-zinc-600 tracking-tighter border border-zinc-800 px-2 py-0.5 rounded-full italic">#{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="h-10 bg-zinc-900 rounded-lg flex items-center justify-center gap-2 text-[9px] font-black uppercase text-zinc-400 tracking-widest italic">
                    <Tag size={12} /> Editar Tags
                  </button>
                  <button className="h-10 bg-zinc-900 rounded-lg flex items-center justify-center gap-2 text-[9px] font-black uppercase text-zinc-400 tracking-widest italic">
                    <ImageIcon size={12} /> Categoria
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 pb-24 space-y-8 overflow-y-auto no-scrollbar">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-4 pt-4 relative">
        <div className="absolute top-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10"></div>
        <div className="relative">
          <div className="w-24 h-24 bg-primary rounded-sm mx-auto flex items-center justify-center rotate-45 shadow-2xl shadow-primary/20">
            <div className="w-20 h-20 bg-[#0A0A0A] -rotate-45 overflow-hidden flex items-center justify-center border border-primary/20">
               <User size={40} className="text-zinc-800" />
            </div>
          </div>
          <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-black rounded-lg border-4 border-[#0A0A0A] flex items-center justify-center shadow-lg active:scale-95 transition-all">
            <Camera size={14} />
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase text-white leading-tight italic tracking-tighter">{user.displayName || 'Sem Nome'}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[9px] font-black uppercase bg-primary text-black px-3 py-1 rounded-sm tracking-[0.1em]">
              {user.role === 'artist' ? 'Tatuador' : 'Cliente'}
            </span>
            <span className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.2em] italic">Dermys Core</span>
          </div>
        </div>
      </div>

      {/* Artist Specific Section */}
      {user.role === 'artist' && (
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            onClick={() => setShowProfileEditor(true)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-6 bg-[#121212] border border-[#1A1A1A] rounded-[2rem] group hover:border-primary/30 transition-all shadow-xl"
          >
            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-primary transition-colors mb-3">
              <Settings size={22} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors italic">Editar Perfil</p>
          </motion.button>

          <motion.button
            onClick={() => setShowPortfolioManager(true)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-6 bg-primary/10 border border-primary/20 rounded-[2rem] group shadow-2xl shadow-primary/5 hover:border-primary/40 transition-all"
          >
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black shadow-lg mb-3">
              <ImageIcon size={22} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Portfólio</p>
          </motion.button>
        </div>
      )}

      {/* Menu Sections */}
      <div className="space-y-6">
        <div>
          <h3 className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.4em] mb-4 px-1 italic">Preferências</h3>
          <div className="space-y-3">
            {[
              { icon: Shield, label: 'Segurança', sub: 'Proteção de Identidade' },
              { icon: CreditCard, label: 'Pagamento', sub: 'Transações e Ingressos' },
              { icon: Bell, label: 'Notificações', sub: 'Alertas de Sessão' },
              { icon: Settings, label: 'Geral', sub: 'Interface e Ajustes' },
            ].map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-full flex items-center justify-between p-4 bg-[#121212] border border-[#1A1A1A] rounded-xl group hover:border-primary/30 transition-all shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-black/40 rounded-lg flex items-center justify-center text-zinc-600 group-hover:text-primary transition-colors border border-[#1A1A1A]">
                    <item.icon size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-wider group-hover:text-white transition-colors">{item.label}</p>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter mt-0.5">{item.sub}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-800" />
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.4em] mb-4 px-1 italic">Sistema</h3>
          <div className="space-y-3">
            {[
              { icon: HelpCircle, label: 'Central de Apoio' },
              { icon: LogOut, label: 'Encerrar Conexão', color: 'text-red-500/80', action: onLogout },
            ].map((item, i) => (
              <motion.button
                key={item.label}
                onClick={item.action}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "w-full flex items-center justify-between p-4 bg-[#121212] border border-[#1A1A1A] rounded-xl group shadow-lg",
                  item.color || ""
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 bg-black/40 rounded-lg flex items-center justify-center text-zinc-600 border border-[#1A1A1A]", item.color)}>
                    <item.icon size={18} strokeWidth={item.color ? 2.5 : 2} />
                  </div>
                  <p className="text-xs font-black uppercase tracking-wider">{item.label}</p>
                </div>
                {!item.color && <ChevronRight size={14} className="text-zinc-800" />}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center py-6">
        <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">Dermys App v1.0.4</p>
        <p className="text-[8px] text-zinc-800 font-medium uppercase mt-1 italic">Made with blood and yellow ink</p>
      </div>
    </div>
  );
}
