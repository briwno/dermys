import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Calendar as CalendarIcon, Clock, Image as ImageIcon, 
  FileText, CheckCircle2, ChevronRight, X, AlertCircle, ShieldCheck,
  ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon,
  DollarSign
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, isToday, isBefore, startOfDay 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';

interface BookingWorkflowProps {
  artist: any;
  onClose: () => void;
  onComplete: () => void;
}

function CalendarPicker({ selectedDate, onDateSelect }: { selectedDate: Date, onDateSelect: (date: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-white italic">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 transition-colors"
          >
            <ChevronLeftIcon size={18} />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 transition-colors"
          >
            <ChevronRightIcon size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center">
        {days.map(day => (
          <div key={day} className="text-[10px] font-black uppercase text-zinc-600 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isPast = isBefore(day, startOfDay(new Date()));
          const today = isToday(day);

          return (
            <button
              key={day.toString()}
              onClick={() => !isPast && onDateSelect(day)}
              disabled={isPast}
              className={cn(
                "h-12 rounded-lg flex flex-col items-center justify-center transition-all relative text-sm font-bold",
                !isCurrentMonth && "opacity-20",
                isPast && "cursor-not-allowed opacity-10",
                isSelected ? "bg-primary text-black" : "hover:bg-white/5 text-zinc-400",
                today && !isSelected && "text-primary"
              )}
            >
              {day.getDate()}
              {today && !isSelected && (
                <div className="absolute bottom-1.5 w-1 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BookingWorkflow({ artist, onClose, onComplete }: BookingWorkflowProps) {
  const [step, setStep] = useState(1);
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date(),
    time: '14:00',
    description: '',
    anamnesis: {
      hasAllergy: false,
      hasAllergyDetail: '',
      hasDisease: false,
      hasDiseaseDetail: '',
      isPregnant: false,
      firstTattoo: true
    },
    paymentMethod: 'pix',
    termsAccepted: false
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => step > 1 ? setStep(s => s - 1) : onClose();

  const handleConfirm = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const bookingData = {
        clientId: auth.currentUser.uid,
        clientName: auth.currentUser.displayName || 'Cliente',
        artistId: artist.uid || artist.id,
        artistName: artist.displayName || artist.name,
        studio: artist.studioName || artist.studio || 'Studio Principal',
        date: format(formData.date, "dd 'de' MMM", { locale: ptBR }),
        time: formData.time,
        status: 'pendente',
        price: 350,
        createdAt: serverTimestamp(),
        description: formData.description,
        anamnesis: formData.anamnesis,
        initialPaymentMethod: formData.paymentMethod
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      setIsDone(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Data/Hora', icon: CalendarIcon },
    { id: 2, title: 'Inspiração', icon: ImageIcon },
    { id: 3, title: 'Anamnese', icon: FileText },
    { id: 4, title: 'Pagamento', icon: DollarSign },
    { id: 5, title: 'Confirmação', icon: ShieldCheck },
  ];

  if (isDone) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] z-[150] flex flex-col items-center justify-center p-10 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-8 border border-primary/30"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-black uppercase italic tracking-tighter text-white mb-2"
        >
          Agendamento<br />Solicitado!
        </motion.h2>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs font-black uppercase text-zinc-500 tracking-widest leading-relaxed"
        >
          {artist.displayName} recebeu seu pedido.<br />
          Você será notificado assim que for confirmado.
        </motion.p>
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onComplete}
          className="mt-12 h-14 px-10 bg-primary text-black font-black uppercase tracking-widest italic rounded-xl active:scale-95 transition-all shadow-2xl shadow-primary/20"
        >
          Ver Meus Agendamentos
        </motion.button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#1A1A1A]">
        <button onClick={prevStep} className="text-zinc-600 hover:text-white transition-colors" disabled={loading}>
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-1">
          {steps.map(s => (
            <div 
              key={s.id} 
              className={cn(
                "h-1 transition-all duration-500 rounded-full",
                step >= s.id ? "w-6 bg-primary" : "w-2 bg-zinc-800"
              )} 
            />
          ))}
        </div>
        <button onClick={onClose} className="text-zinc-800 hover:text-white transition-colors" disabled={loading}>
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-32">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="space-y-1">
                <h2 className="text-3xl font-black uppercase text-primary italic tracking-tighter">Escolha o Dia</h2>
                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">Disponibilidade de {artist.name}</p>
              </div>

              {/* Calendar Component */}
              <div className="immersive-card p-2 bg-[#121212] border border-[#1A1A1A] rounded-[2rem]">
                <CalendarPicker 
                  selectedDate={formData.date}
                  onDateSelect={(date) => setFormData({ ...formData, date })}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={format(formData.date, 'yyyy-MM-dd')}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-zinc-900"></div>
                    <div className="flex items-center gap-2">
                       <Clock size={14} className="text-primary" />
                       <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Horários em {format(formData.date, 'dd/MM', { locale: ptBR })}</span>
                    </div>
                    <div className="h-[1px] flex-1 bg-zinc-900"></div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {['09:00', '10:30', '13:00', '14:30', '16:00', '18:30', '20:00'].map((t, i) => {
                      // Simulated availability based on date
                      const seed = (formData.date.getDate() + i) % 5;
                      const isBooked = seed === 0;
                      
                      return (
                        <button
                          key={t}
                          disabled={isBooked}
                          onClick={() => setFormData({ ...formData, time: t })}
                          className={cn(
                            "h-14 rounded-xl border flex flex-col items-center justify-center transition-all font-black text-xs relative overflow-hidden",
                            formData.time === t && !isBooked ? "border-primary bg-primary/20 text-primary" : 
                            isBooked ? "border-zinc-950 bg-black/40 text-zinc-800 cursor-not-allowed" : 
                            "border-zinc-900 bg-[#121212] text-zinc-500 hover:border-zinc-700"
                          )}
                        >
                          {t}
                          {isBooked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                               <X size={12} className="opacity-20" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="p-4 bg-zinc-900/30 rounded-2xl flex items-start gap-3 border border-white/5">
                    <AlertCircle size={14} className="text-zinc-600 mt-0.5" />
                    <p className="text-[9px] text-zinc-500 font-medium leading-relaxed italic uppercase tracking-wider">
                      Sessões duram em média 2-4 horas. O horário selecionado é a previsão de início.
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase text-primary italic tracking-tighter">Referências</h2>
                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">Guie o Artista</p>
              </div>

              <div className="w-full aspect-video rounded-2xl border-2 border-dashed border-[#1A1A1A] bg-[#121212] flex flex-col items-center justify-center group cursor-pointer hover:border-primary/50 transition-all">
                 <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-600 group-hover:text-primary transition-colors">
                    <ImageIcon size={32} />
                 </div>
                 <p className="mt-4 text-xs font-black uppercase text-zinc-500 tracking-widest">Anexar Referências</p>
                 <p className="text-[9px] text-zinc-700 mt-1">PNG, JPG ou PDF (Máx. 10MB)</p>
              </div>

              <textarea 
                placeholder="Descreva sua ideia, local do corpo e tamanho aproximado..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-32 bg-[#121212] border border-[#1A1A1A] rounded-2xl p-4 text-white text-sm outline-none focus:border-primary transition-all placeholder:text-zinc-800 font-medium"
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase text-primary italic tracking-tighter">Anamnese</h2>
                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">Protocolo de Segurança</p>
              </div>

              <div className="space-y-6">
                {[
                  { key: 'hasAllergy', detailKey: 'hasAllergyDetail', label: 'Possui alergia a tintas ou componentes?' },
                  { key: 'hasDisease', detailKey: 'hasDiseaseDetail', label: 'Alguma doença crônica ou transmissível?' },
                  { key: 'isPregnant', detailKey: null, label: 'Está gestante ou lactante?' },
                  { key: 'firstTattoo', detailKey: null, label: 'É sua primeira tatuagem?' },
                ].map((item) => (
                  <div key={item.key} className="space-y-3">
                    <div className="flex items-center justify-between p-5 bg-[#121212] border border-[#1A1A1A] rounded-2xl">
                      <span className="text-xs font-black uppercase text-white tracking-wide">{item.label}</span>
                      <button 
                        onClick={() => setFormData({ ...formData, anamnesis: { ...formData.anamnesis, [item.key]: !formData.anamnesis[item.key as keyof typeof formData.anamnesis] } })}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-all duration-500",
                          formData.anamnesis[item.key as keyof typeof formData.anamnesis] ? "bg-primary" : "bg-zinc-800"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-500",
                          formData.anamnesis[item.key as keyof typeof formData.anamnesis] ? "left-7 bg-black" : "left-1"
                        )} />
                      </button>
                    </div>
                    
                    <AnimatePresence>
                      {item.detailKey && formData.anamnesis[item.key as keyof typeof formData.anamnesis] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <textarea
                            placeholder="Por favor, detalhe aqui..."
                            value={formData.anamnesis[item.detailKey as keyof typeof formData.anamnesis] as string}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              anamnesis: { ...formData.anamnesis, [item.detailKey as string]: e.target.value } 
                            })}
                            className="w-full h-24 bg-black border border-primary/20 rounded-xl p-4 text-xs text-white outline-none focus:border-primary transition-all placeholder:text-zinc-700 font-medium italic"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl flex gap-3">
                 <AlertCircle size={16} className="text-orange-500 shrink-0" />
                 <p className="text-[10px] text-zinc-500 font-medium italic">As informações acima são sigilosas e fundamentais para a segurança do procedimento.</p>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase text-primary italic tracking-tighter">Pagamento</h2>
                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">Reserva de Horário</p>
              </div>

              <div className="immersive-card space-y-4">
                <div className="flex justify-between items-center text-zinc-500 text-[10px] uppercase font-black tracking-widest">
                  <span>Valor do Sinal</span>
                  <span className="text-primary">R$ 150,00</span>
                </div>
                <div className="p-6 bg-black border border-zinc-900 rounded-2xl flex flex-col items-center">
                  <div className="w-48 h-48 bg-white p-3 rounded-xl mb-4 grayscale">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TATTOO_PAY" className="w-full h-full" alt="QR Code PIX" />
                  </div>
                  <p className="text-[9px] text-zinc-600 font-black uppercase italic tracking-widest">Escaneie para pagar via PIX</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {['pix', 'card', 'local'].map(method => (
                  <button
                    key={method}
                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                    className={cn(
                      "h-14 rounded-xl border flex items-center justify-center gap-2 font-black uppercase text-[8px] tracking-widest transition-all",
                      formData.paymentMethod === method ? "border-primary bg-primary/10 text-primary" : "border-zinc-900 bg-[#121212] text-zinc-600"
                    )}
                  >
                    {method === 'pix' ? 'PIX' : method === 'card' ? 'Cartão' : 'No Local'}
                    <CheckCircle2 size={10} className={formData.paymentMethod === method ? 'opacity-100' : 'opacity-0'} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase text-primary italic tracking-tighter">Resumo</h2>
                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">Confira os detalhes</p>
              </div>

              {/* Booking Summary Card */}
              <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-white tracking-widest">{artist.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight mt-1">
                    {format(formData.date, "dd 'de' MMMM", { locale: ptBR })} • {formData.time} • Pagamento: {formData.paymentMethod.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase text-primary italic tracking-tighter">Termos</h2>
                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">Finalizando sua Reserva</p>
              </div>

              <div className="p-6 bg-[#121212] border border-[#1A1A1A] rounded-3xl space-y-6">
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2 no-scrollbar text-zinc-500 text-[11px] leading-relaxed italic font-medium">
                  <p className="font-black text-white uppercase text-xs">Termo de Consentimento Livre e Esclarecido</p>
                  <p>1. Admito ser maior de 18 anos e possuir plena capacidade para decisão.</p>
                  <p>2. Compreendo que a pigmentação artificial é um procedimento invasivo e permanente.</p>
                  <p>3. Estou ciente de que cada organismo reage de forma singular ao pigmento e cicatrização.</p>
                  <p>4. Comprometo-me a seguir rigorosamente as orientações de pós-procedimento.</p>
                  <p>5. Autorizo a captura de imagens para portfólio (preservando minha identidade conforme lei).</p>
                </div>

                <button 
                  onClick={() => setFormData({ ...formData, termsAccepted: !formData.termsAccepted })}
                  className="flex items-center gap-3 group"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center",
                    formData.termsAccepted ? "border-primary bg-primary text-black" : "border-zinc-800 bg-black"
                  )}>
                    {formData.termsAccepted && <CheckCircle2 size={16} />}
                  </div>
                  <span className="text-[10px] font-black uppercase text-white tracking-widest">Aceito os termos e condições</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-[#1A1A1A] bg-black">
        <button 
          onClick={step === 5 ? handleConfirm : nextStep}
          disabled={loading || (step === 5 && !formData.termsAccepted)}
          className={cn(
            "w-full h-16 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] italic transition-all active:scale-95",
            step === 5 && !formData.termsAccepted ? "bg-zinc-900 text-zinc-800" : "bg-primary text-black shadow-2xl shadow-primary/20"
          )}
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {step === 5 ? 'Confirmar Agendamento' : 'Próxima Etapa'}
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
