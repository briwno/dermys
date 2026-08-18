import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, Clock, MapPin, ChevronRight, 
  CheckCircle2, AlertCircle, ShieldCheck, X, Play, Square, 
  CheckCircle, IndianRupee, CreditCard, Wallet, Landmark,
  Timer, DollarSign, MessageSquare
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, auth } from '../../lib/firebase';
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, serverTimestamp, Timestamp 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';

export function ScheduleScreen({ role, onViewChat }: { role?: string; onViewChat?: (partnerId: string, partnerName: string, partnerPhoto?: string, prefillMessage?: string) => void }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'history'>('all');

  useEffect(() => {
    if (!auth.currentUser) return;

    const field = role === 'artist' ? 'artistId' : 'clientId';
    const q = query(collection(db, 'bookings'), where(field, '==', auth.currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date/time (naive sort for now since date is string "dd de MMM")
      setBookings(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    return () => unsubscribe();
  }, [role]);

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return b.status !== 'concluido' && b.status !== 'cancelado';
    if (filter === 'history') return b.status === 'concluido';
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-black">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 pb-24 space-y-6 overflow-y-auto no-scrollbar bg-black text-white">
      <div className="space-y-1">
        <h1 className="text-3xl font-black uppercase text-primary italic tracking-tighter">
          {role === 'client' ? 'Agendamentos' : 'Agenda'}
        </h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
          {role === 'client' ? 'Histórico & Sessões' : 'Gestão de Horários'}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-xl border border-white/5">
        {(['all', 'upcoming', 'history'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
              filter === f ? "bg-primary text-black" : "text-zinc-500 hover:text-white"
            )}
          >
            {f === 'all' ? 'Tudo' : f === 'upcoming' ? 'Próximos' : 'Histórico'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-[#121212] p-12 rounded-[2rem] border border-zinc-900 text-center space-y-5">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto text-zinc-800">
               <CalendarIcon size={32} />
            </div>
            <div className="space-y-2">
              <p className="text-white font-black uppercase italic tracking-tighter">Vazio por aqui</p>
              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                Nenhuma sessão agendada nesta categoria.
              </p>
            </div>
          </div>
        ) : (
          filteredBookings.map((booking, i) => (
            <BookingCard key={booking.id} booking={booking} index={i} role={role} onViewChat={onViewChat} />
          ))
        )}
      </div>
    </div>
  );
}

interface BookingCardProps {
  booking: any;
  index: number;
  role?: string;
  onViewChat?: (partnerId: string, partnerName: string, partnerPhoto?: string, prefillMessage?: string) => void;
  key?: any;
}

function BookingCard({ booking, index, role, onViewChat }: BookingCardProps) {
  const [showAftercare, setShowAftercare] = React.useState(false);
  const [showFinishModal, setShowFinishModal] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: string, additionalData: any = {}) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...additionalData
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${booking.id}`);
    } finally {
      setLoading(false);
    }
  };

  const startSession = () => updateStatus('em_andamento', { sessionStart: serverTimestamp() });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        onClick={() => setShowDetails(true)}
        className="bg-[#121212] rounded-xl overflow-hidden border border-[#1A1A1A] shadow-2xl relative cursor-pointer hover:border-zinc-800 transition-all duration-305"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl"></div>
        <div className="p-6 space-y-5 relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-black border border-[#1A1A1A] flex items-center justify-center font-black text-primary italic text-xl">
                {(role === 'artist' ? booking.clientName : booking.artistName)?.charAt(0) || '?'}
              </div>
              <div>
                <h4 className="font-black text-sm uppercase italic tracking-tighter leading-none">
                  {role === 'artist' ? `Cliente: ${booking.clientName}` : booking.artistName}
                </h4>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1.5 grayscale opacity-60">
                  <MapPin size={9} /> {booking.studio}
                </p>
              </div>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest flex items-center gap-1 text-center shrink-0",
              booking.status === 'confirmado' ? "bg-emerald-500/10 text-emerald-500" : 
              booking.status === 'pendente' ? "bg-primary/10 text-primary" :
              booking.status === 'em_andamento' ? "bg-blue-500/10 text-blue-500 animate-pulse" :
              booking.status === 'concluido' ? "bg-zinc-800 text-zinc-400" :
              "bg-zinc-800 text-zinc-600"
            )}>
              {booking.status.replace('_', ' ')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black border border-zinc-900 flex items-center justify-center text-zinc-700">
                <CalendarIcon size={14} />
              </div>
              <div>
                <p className="text-[8px] text-zinc-700 font-black uppercase tracking-widest">Data</p>
                <p className="text-xs font-black text-zinc-400 uppercase italic">{booking.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black border border-zinc-900 flex items-center justify-center text-zinc-700">
                <Clock size={14} />
              </div>
              <div>
                <p className="text-[8px] text-zinc-700 font-black uppercase tracking-widest">Hora</p>
                <p className="text-xs font-black text-zinc-400 uppercase italic">{booking.time}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div>
              <p className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.3em]">
                {booking.status === 'concluido' ? 'Total Pago' : 'Orçamento'}
              </p>
              <p className="text-xl font-black text-primary italic tracking-tighter uppercase">
                R$ {booking.status === 'concluido' ? booking.finalPrice : booking.price}
              </p>
            </div>
            <div className="flex gap-2">
              {role === 'artist' ? (
                <>
                  {booking.status === 'pendente' && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateStatus('confirmado'); }}
                        disabled={loading}
                        className="h-10 px-4 bg-emerald-500 text-black rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                      >
                        {loading ? <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={12} fill="currentColor" />}
                        Aceitar
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateStatus('cancelado'); }}
                        disabled={loading}
                        className="h-10 px-4 bg-zinc-900 text-zinc-500 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-rose-500 transition-colors"
                      >
                        Recusar
                      </button>
                    </>
                  )}
                  {booking.status === 'confirmado' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); startSession(); }}
                      disabled={loading}
                      className="h-10 px-4 bg-primary text-black rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {loading ? <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Play size={12} fill="currentColor" />}
                      Iniciar
                    </button>
                  )}
                  {booking.status === 'em_andamento' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowFinishModal(true); }}
                      className="h-10 px-4 bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                    >
                      <Square size={12} fill="currentColor" />
                      Finalizar
                    </button>
                  )}
                  {booking.status === 'concluido' && (
                    <div className="h-10 px-4 bg-zinc-900 text-emerald-500/50 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-zinc-800">
                      <CheckCircle2 size={12} />
                      Concluído
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                  {booking.status === 'concluido' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowAftercare(true); }}
                      className="h-10 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                    >
                      <ShieldCheck size={12} /> Guia Pós
                    </button>
                  )}
                  {booking.status === 'cancelado' && (
                    <div className="h-10 px-4 bg-zinc-950/50 text-rose-500/50 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-zinc-900/40">
                      <X size={12} /> Cancelado
                    </div>
                  )}
                  {booking.status !== 'concluido' && booking.status !== 'cancelado' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateStatus('cancelado'); }}
                      disabled={loading}
                      className="h-10 px-3.5 bg-rose-500/10 hover:bg-rose-500 hover:text-black border border-rose-500/20 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
                    >
                      {loading ? <div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /> : <X size={12} />}
                      Cancelar
                    </button>
                  )}
                  {onViewChat && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const partnerId = role === 'artist' ? booking.clientId : booking.artistId;
                        const partnerName = role === 'artist' ? booking.clientName : booking.artistName;
                        const partnerPhoto = role === 'artist' ? (booking.clientPhoto || '') : (booking.artistImage || '');
                        const prefillMessage = `Olá! Gostaria de conversar sobre o nosso agendamento de tattoo para o dia ${booking.date} às ${booking.time}.`;
                        onViewChat(partnerId, partnerName, partnerPhoto, prefillMessage);
                      }}
                      className="h-10 px-3.5 bg-primary/10 border border-primary/20 hover:bg-primary hover:text-black text-primary rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300"
                    >
                      <MessageSquare size={12} /> Chat
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Booking Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <BookingDetailsModal 
            booking={booking} 
            role={role} 
            onClose={() => setShowDetails(false)} 
            onViewChat={onViewChat}
            updateStatus={updateStatus}
            loading={loading}
          />
        )}
      </AnimatePresence>

      {/* Aftercare Modal */}
      <AnimatePresence>
        {showAftercare && (
          <AftercareModal booking={booking} onClose={() => setShowAftercare(false)} />
        )}
      </AnimatePresence>

      {/* Finish Session Modal */}
      <AnimatePresence>
        {showFinishModal && (
          <FinishSessionModal 
            booking={booking} 
            onClose={() => setShowFinishModal(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

function AftercareModal({ booking, onClose }: { booking: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-sm bg-[#0A0A0A] border border-emerald-500/20 rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10"
      >
        <div className="p-0 flex flex-col h-[80vh]">
          <div className="bg-[#121212] p-8 border-b border-white/5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <ShieldCheck size={28} />
              </div>
              <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Guia de Cicatrização</h3>
              <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.4em]">Protocolo de biossegurança</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
            {/* Guide Content */}
            <p className="text-xs text-zinc-400 leading-relaxed">Siga as instruções para uma cicatrização perfeita...</p>
            {/* ... (Existing guide content could go here) */}
          </div>
          <div className="p-8 bg-[#121212] border-t border-white/5">
            <button 
              onClick={onClose}
              className="w-full h-14 bg-emerald-500 text-black font-black uppercase tracking-[0.2em] italic rounded-xl shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FinishSessionModal({ booking, onClose }: { booking: any, onClose: () => void }) {
  const [finalPrice, setFinalPrice] = useState(booking.price);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | 'dinheiro'>('pix');
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (booking.sessionStart) {
      const start = (booking.sessionStart as Timestamp).toDate();
      const end = new Date();
      const diffMs = end.getTime() - start.getTime();
      setDuration(Math.round(diffMs / 1000 / 60)); // minutes
    }
  }, [booking.sessionStart]);

  const handleFinish = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'concluido',
        sessionEnd: serverTimestamp(),
        finalPrice: Number(finalPrice),
        paymentMethod,
        durationMinutes: duration,
        updatedAt: serverTimestamp(),
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${booking.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-sm bg-[#0A0A0A] border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10"
      >
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/20">
              <Timer size={28} />
            </div>
            <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Finalizar Sessão</h3>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.4em]">Resumos de execução e pagamento</p>
          </div>

          <div className="space-y-6">
            {/* Duration Info */}
            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Timer size={18} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Duração</span>
              </div>
              <span className="text-lg font-black text-white italic">{duration} min</span>
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest ml-2">Valor Final</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                <input 
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(Number(e.target.value))}
                  className="w-full h-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-6 outline-none focus:border-primary text-white font-black text-xl italic"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest ml-2">Forma de Pagamento</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'pix', label: 'Pix', icon: Landmark },
                  { id: 'cartao', label: 'Cartão', icon: CreditCard },
                  { id: 'dinheiro', label: 'Dinheiro', icon: Wallet },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 h-20 rounded-2xl border transition-all",
                      paymentMethod === method.id 
                        ? "bg-primary border-primary text-black shadow-lg shadow-primary/10" 
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    <method.icon size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleFinish}
            disabled={loading}
            className="w-full h-16 bg-primary text-black font-black uppercase tracking-[0.2em] italic rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Confirmar e Arquivar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function BookingDetailsModal({ booking, role, onClose, onViewChat, updateStatus, loading }: {
  booking: any;
  role?: string;
  onClose: () => void;
  onViewChat?: (partnerId: string, partnerName: string, partnerPhoto?: string, prefillMessage?: string) => void;
  updateStatus: (newStatus: string, additionalData?: any) => Promise<void>;
  loading: boolean;
}) {
  const partnerId = role === 'artist' ? booking.clientId : booking.artistId;
  const partnerName = role === 'artist' ? booking.clientName : booking.artistName;
  const partnerPhoto = role === 'artist' ? (booking.clientPhoto || '') : (booking.artistImage || '');

  const startPrefilledMsg = `Olá, ${partnerName}! Vamos conversar sobre o nosso agendamento de tattoo para o dia ${booking.date} às ${booking.time}?`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[#0A0A0A] border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
      >
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 font-black italic text-lg uppercase font-sans">
                {partnerName?.charAt(0) || '?'}
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">
                  Sessão: {partnerName}
                </h3>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.25em] mt-1.5">
                  Estúdio: {booking.studio || 'Studio Principal'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-600 hover:text-white bg-zinc-900/50 p-2 rounded-full border border-white/5 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Status and core details in grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#121212] border border-[#1A1A1A] rounded-xl flex flex-col justify-between">
              <span className="text-[8px] text-zinc-600 font-black uppercase tracking-wider">Status</span>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wider mt-1.5 block",
                booking.status === 'confirmado' ? "text-emerald-500" :
                booking.status === 'pendente' ? "text-primary" :
                booking.status === 'em_andamento' ? "text-blue-500" :
                booking.status === 'concluido' ? "text-zinc-400" :
                "text-rose-500"
              )}>
                {booking.status?.replace('_', ' ')}
              </span>
            </div>
            <div className="p-4 bg-[#121212] border border-[#1A1A1A] rounded-xl flex flex-col justify-between">
              <span className="text-[8px] text-zinc-600 font-black uppercase tracking-wider">Valor</span>
              <span className="text-xs font-black text-primary uppercase italic mt-1.5 block">
                R$ {booking.status === 'concluido' ? (booking.finalPrice || booking.price) : booking.price}
              </span>
            </div>
            <div className="p-4 bg-[#121212] border border-[#1A1A1A] rounded-xl flex flex-col justify-between">
              <span className="text-[8px] text-zinc-600 font-black uppercase tracking-wider">Data</span>
              <span className="text-xs font-black text-zinc-350 uppercase italic mt-1.5 block">
                {booking.date}
              </span>
            </div>
            <div className="p-4 bg-[#121212] border border-[#1A1A1A] rounded-xl flex flex-col justify-between">
              <span className="text-[8px] text-zinc-600 font-black uppercase tracking-wider">Horário</span>
              <span className="text-xs font-black text-zinc-350 uppercase italic mt-1.5 block">
                {booking.time}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Description/Concept section */}
            {booking.description && (
              <div className="space-y-1.5">
                <h4 className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Conceito e Descrição</h4>
                <div className="bg-[#121212] border border-[#1A1A1A] rounded-2xl p-4 text-xs text-zinc-400 italic leading-relaxed">
                  "{booking.description}"
                </div>
              </div>
            )}

            {/* Anamnesis / Health criteria */}
            {booking.anamnesis && (
              <div className="space-y-1.5">
                <h4 className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Ficha de Anamnese</h4>
                <div className="grid grid-cols-1 gap-2 text-[9px] font-bold uppercase tracking-wider">
                  <div className="p-3 rounded-xl border border-[#1A1A1A] bg-[#121212]/50 flex justify-between items-center">
                    <span className="text-zinc-600 font-black">Maior de 18 anos:</span>
                    <span className={booking.anamnesis.ageApproved ? "text-emerald-500" : "text-rose-500"}>
                      {booking.anamnesis.ageApproved ? "Sim" : "Não"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-[#1A1A1A] bg-[#121212]/50 flex justify-between items-center">
                    <span className="text-zinc-600 font-black">Restrições de Saúde / Alergias:</span>
                    <span className={booking.anamnesis.healthClean ? "text-emerald-500" : "text-rose-500"}>
                      {booking.anamnesis.healthClean ? "Sem restrições" : "Sim / Possui"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-[#1A1A1A] bg-[#121212]/50 flex justify-between items-center">
                    <span className="text-zinc-600 font-black">Primeira Tatuagem:</span>
                    <span className="text-primary">
                      {booking.anamnesis.firstTattoo ? "Sim" : "Não"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Proposed Payment info */}
            {booking.initialPaymentMethod && (
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#121212] border border-[#1A1A1A]">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Método de pagamento sugerido</span>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{booking.initialPaymentMethod}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons in Modal footer */}
        <div className="p-6 md:p-8 bg-[#121212]/60 border-t border-white/5 space-y-3">
          {onViewChat && (
            <button 
              onClick={() => {
                onClose();
                onViewChat(partnerId, partnerName, partnerPhoto, startPrefilledMsg);
              }}
              className="w-full h-14 bg-primary text-black font-black uppercase tracking-widest italic rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:brightness-110 transition-all text-[11px]"
            >
              <MessageSquare size={16} /> Falar no Chat (Preencher Detalhes)
            </button>
          )}

          <div className="flex gap-2">
            {role === 'artist' && booking.status === 'pendente' && (
              <>
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    await updateStatus('confirmado');
                    onClose();
                  }}
                  disabled={loading}
                  className="flex-1 h-12 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-xl text-[10px] flex items-center justify-center gap-1.5 hover:bg-emerald-400 transition-all"
                >
                  Aceitar
                </button>
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    await updateStatus('cancelado');
                    onClose();
                  }}
                  disabled={loading}
                  className="flex-1 h-12 bg-zinc-900 border border-zinc-800 text-rose-500 font-black uppercase tracking-widest rounded-xl text-[10px] flex items-center justify-center gap-1.5 hover:bg-zinc-800 transition-all"
                >
                  Recusar
                </button>
              </>
            )}

            {role === 'artist' && booking.status === 'confirmado' && (
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  await updateStatus('em_andamento', { sessionStart: serverTimestamp() });
                  onClose();
                }}
                disabled={loading}
                className="w-full h-12 bg-primary text-black font-black uppercase tracking-widest rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all"
              >
                <Play size={14} fill="currentColor" /> Iniciar Sessão
              </button>
            )}

            {role === 'client' && booking.status !== 'concluido' && booking.status !== 'cancelado' && (
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  await updateStatus('cancelado');
                  onClose();
                }}
                disabled={loading}
                className="w-full h-12 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-black text-rose-500 font-black uppercase tracking-widest rounded-xl text-xs flex items-center justify-center gap-2 transition-all duration-300"
              >
                Cancelar Agendamento
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

