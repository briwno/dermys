import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import { UserProfile, Expense } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { 
  DollarSign, Users, Calendar, TrendingUp, ChevronRight, 
  TrendingDown, Plus, Trash2, X, Receipt, Calculator, Award
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { 
  collection, query, where, onSnapshot, orderBy, limit,
  addDoc, deleteDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';
import { format, subDays, subMonths, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Logo } from '../ui/Logo';

function getBookingDate(b: any): Date | null {
  if (b.sessionEnd && typeof b.sessionEnd.toDate === 'function') {
    return b.sessionEnd.toDate();
  }
  if (b.updatedAt && typeof b.updatedAt.toDate === 'function') {
    return b.updatedAt.toDate();
  }
  if (b.date) {
    if (typeof b.date.toDate === 'function') {
      return b.date.toDate();
    }
    if (typeof b.date === 'string') {
      const parsed = new Date(b.date);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  if (b.createdAt && typeof b.createdAt.toDate === 'function') {
    return b.createdAt.toDate();
  }
  return null;
}

function getExpenseDate(e: any): Date | null {
  if (e.date) {
    const parsed = new Date(e.date + 'T12:00:00');
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  if (e.createdAt && typeof e.createdAt.toDate === 'function') {
    return e.createdAt.toDate();
  }
  return null;
}

export function ArtistDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Expense form state
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [savingExpense, setSavingExpense] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const qBookings = query(
      collection(db, 'bookings'), 
      where('artistId', '==', auth.currentUser.uid)
    );

    const qExpenses = query(
      collection(db, 'expenses'),
      where('artistId', '==', auth.currentUser.uid)
    );

    let bookingsLoaded = false;
    let expensesLoaded = false;

    const unsubscribeBookings = onSnapshot(qBookings, (snapshot) => {
      const allBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setBookings(allBookings);
      bookingsLoaded = true;
      if (bookingsLoaded && expensesLoaded) {
        setLoading(false);
      }
    }, (error) => {
      if (error.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
      }
    });

    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const allExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setExpenses(allExpenses);
      expensesLoaded = true;
      if (bookingsLoaded && expensesLoaded) {
        setLoading(false);
      }
    }, (error) => {
      if (error.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.LIST, 'expenses');
      }
    });

    // Safeguard loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => {
      unsubscribeBookings();
      unsubscribeExpenses();
      clearTimeout(timer);
    };
  }, []);

  // Compute stats in real-time
  const stats = React.useMemo(() => {
    const completed = bookings.filter(b => b.status === 'concluido');
    const totalRevenue = completed.reduce((acc, curr) => acc + (curr.finalPrice || curr.price || 0), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const netEarnings = totalRevenue - totalExpenses;
    const uniqueClients = new Set(bookings.map(b => b.clientId)).size;
    const activeBookings = bookings.filter(b => b.status === 'confirmado' || b.status === 'em_andamento' || b.status === 'pendente').length;

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      netEarnings,
      clients: uniqueClients,
      bookings: activeBookings,
    };
  }, [bookings, expenses]);

  // Compute 7 days chart data with Revenue, Expenses and Net Profit
  const chartData = React.useMemo(() => {
    const completed = bookings.filter(b => b.status === 'concluido');
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayLabel = format(date, 'eee', { locale: ptBR });
      
      const dayRevenue = completed
        .filter(b => b.sessionEnd && isSameDay(b.sessionEnd.toDate(), date))
        .reduce((acc, curr) => acc + (curr.finalPrice || curr.price || 0), 0);
        
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayExpenses = expenses
        .filter(e => e.date === dateStr)
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

      const netEarnings = dayRevenue - dayExpenses;

      return {
        name: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
        Receita: dayRevenue,
        Despesas: dayExpenses,
        Rendimento: netEarnings,
      };
    });
  }, [bookings, expenses]);

  const monthlyChartData = React.useMemo(() => {
    const completedBookings = bookings.filter(b => b.status === 'concluido');
    
    // Generate the last 6 months from 5 months ago to today
    return Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const yearMonthStr = format(date, 'yyyy-MM'); // e.g. "2026-05"
      const label = format(date, 'MMMM/yy', { locale: ptBR }); // e.g. "maio/26"
      const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

      // Filter bookings in this month
      const monthlyRevenue = completedBookings
        .filter(b => {
          const bDate = getBookingDate(b);
          if (!bDate) return false;
          return format(bDate, 'yyyy-MM') === yearMonthStr;
        })
        .reduce((acc, curr) => acc + (curr.finalPrice || curr.price || 0), 0);

      // Filter expenses in this month
      const monthlyExpenses = expenses
        .filter(e => {
          if (e.date) {
            return e.date.substring(0, 7) === yearMonthStr;
          }
          const eDate = getExpenseDate(e);
          if (!eDate) return false;
          return format(eDate, 'yyyy-MM') === yearMonthStr;
        })
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

      const netProfit = monthlyRevenue - monthlyExpenses;

      return {
        name: capitalizedLabel,
        key: yearMonthStr,
        Receita: monthlyRevenue,
        Despesas: monthlyExpenses,
        Lucro: netProfit,
      };
    });
  }, [bookings, expenses]);

  const recentBookings = React.useMemo(() => {
    const completed = bookings.filter(b => b.status === 'concluido');
    return completed
      .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
      .slice(0, 5);
  }, [bookings]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !expDesc.trim() || !expAmount) return;

    setSavingExpense(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        artistId: auth.currentUser.uid,
        description: expDesc.trim(),
        amount: parseFloat(expAmount),
        date: expDate,
        createdAt: serverTimestamp(),
      });
      setExpDesc('');
      setExpAmount('');
      setExpDate(format(new Date(), 'yyyy-MM-dd'));
    } catch (err: any) {
      console.error('Error adding expense:', err);
      alert('Erro ao salvar despesa. Verifique as permissões de gravação.');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('Tem certeza que deseja remover este gasto?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      alert('Erro ao excluir o gasto registrado.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 pb-24 space-y-8 overflow-y-auto no-scrollbar bg-black text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-primary">Dashboard</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Visão Geral de Lucros</p>
        </div>
        <Logo className="w-12 h-12" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Rendimento Líquido - Principal Full Width */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-2 relative overflow-hidden bg-gradient-to-r from-emerald-950/20 to-zinc-950 border border-emerald-500/20 rounded-2xl p-5 flex justify-between items-center group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl"></div>
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.22em]">Rendimento Líquido</p>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-emerald-400 mt-2 leading-none">
              R$ {stats.netEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-[9px] text-zinc-400 font-medium mt-1.5 opacity-80">Renda bruta menos despesas.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp size={24} />
          </div>
        </motion.div>

        {/* Faturamento Bruto */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="immersive-card p-4 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl font-black italic tracking-tighter uppercase text-white leading-none">
              R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-1.5">Faturamento Bruto</p>
          </div>
        </motion.div>

        {/* Total de Gastos */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="immersive-card p-4 relative overflow-hidden group"
        >
          <div className="flex justify-between items-start gap-1">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingDown size={16} />
            </div>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-black rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 border border-rose-500/20 hover:border-transparent transition-all"
            >
              <Plus size={8} strokeWidth={4} /> Gastos
            </button>
          </div>
          <div className="mt-3">
            <p className="text-xl font-black italic tracking-tighter uppercase text-rose-400 leading-none">
              R$ {stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-1.5">Despesas (Gastos)</p>
          </div>
        </motion.div>

        {/* Clientes */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="immersive-card p-4"
        >
          <div className="p-2 w-fit rounded-lg bg-blue-500/10 text-blue-400">
            <Users size={16} />
          </div>
          <div className="mt-3">
            <p className="text-xl font-black italic tracking-tighter uppercase leading-none">
              {stats.clients}
            </p>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-1.5">Clientes Únicos</p>
          </div>
        </motion.div>

        {/* Agendamentos */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="immersive-card p-4"
        >
          <div className="p-2 w-fit rounded-lg bg-purple-500/10 text-purple-400">
            <Calendar size={16} />
          </div>
          <div className="mt-3">
            <p className="text-xl font-black italic tracking-tighter uppercase leading-none">
              {stats.bookings}
            </p>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-1.5">Ativos na Agenda</p>
          </div>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        className="immersive-card h-[280px]"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl"></div>
        <div className="flex justify-between items-center mb-6 relative z-10 animate-pulse">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Rendimento Líquido Diário (R$)</h3>
          <span className="text-[9px] text-emerald-400 font-black bg-emerald-500/10 px-3 py-1 rounded-sm uppercase tracking-widest">Tempo Real</span>
        </div>
        <div className="w-full h-[200px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#3f3f46', fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0A0A0A', 
                  border: '1px solid #1A1A1A',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 800
                }}
                itemStyle={{ color: '#10B981' }}
              />
              <Area 
                type="monotone" 
                dataKey="Rendimento" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorRend)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Relatório de Receita Mensal dos Últimos 6 Meses */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="immersive-card flex flex-col space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl pointer-events-none"></div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h3 className="text-sm font-black uppercase italic tracking-tighter text-primary">Análise Consolidada Semestral</h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Faturamento Bruto vs Lucro Líquido</p>
          </div>
          <span className="text-[9px] text-primary font-black bg-primary/10 px-3 py-1 rounded-sm uppercase tracking-widest">Últimos 6 Meses</span>
        </div>

        {/* Line Chart */}
        <div className="w-full h-[250px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#52525b', fontSize: 9, fontWeight: 700 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#52525b', fontSize: 9, fontWeight: 700 }}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0A0A0A', 
                  border: '1px solid #1A1A1A',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#fff'
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
              />
              <Line 
                name="Faturamento Bruto"
                type="monotone" 
                dataKey="Receita" 
                stroke="#FACC15" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 1, fill: '#000' }}
                activeDot={{ r: 6 }}
              />
              <Line 
                name="Lucro Líquido"
                type="monotone" 
                dataKey="Lucro" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 1, fill: '#000' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Breakdown Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {monthlyChartData.slice().reverse().map((m, i) => (
            <div key={m.key} className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-colors">
              <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider block border-b border-zinc-900 pb-1.5 mb-2">{m.name}</span>
              <div className="space-y-1 text-[10px] font-medium text-zinc-400">
                <div className="flex justify-between items-center">
                  <span>Faturamento:</span>
                  <span className="font-extrabold text-white">R$ {m.Receita.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Despesas:</span>
                  <span className="font-extrabold text-rose-500">R$ {m.Despesas.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-zinc-900/50 mt-1">
                  <span className="font-bold text-zinc-350">Lucro Líquido:</span>
                  <span className={cn("font-black italic text-xs", m.Lucro >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    R$ {m.Lucro.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-black uppercase tracking-widest text-sm">Sessões Concluídas</h3>
          <button className="text-[10px] text-primary font-bold uppercase hover:underline">Ver Todos</button>
        </div>
        <div className="space-y-3">
          {recentBookings.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest bg-zinc-900/30 rounded-2xl border border-zinc-900">
              Nenhuma sessão concluída ainda
            </div>
          ) : recentBookings.map((booking, i) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, x: -25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className="glass-card p-4 rounded-2xl flex justify-between items-center group cursor-pointer hover:bg-zinc-850 transition-all border border-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center font-bold text-primary border border-zinc-800">
                  {booking.clientName?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-200">{booking.clientName}</h4>
                  <p className="text-[10px] text-zinc-500 font-medium">{booking.date}, {booking.time}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <p className="text-xs font-black text-primary">R$ {booking.finalPrice || booking.price}</p>
                  <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Concluído</p>
                </div>
                <ChevronRight className="text-zinc-700 group-hover:text-primary transition-colors" size={16} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Expense Management Modal */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#0A0A0A] border border-zinc-805 rounded-3xl overflow-hidden shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-black/50">
                <div>
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-primary">Gerenciar Gastos</h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 animate-pulse">Controle financeiro manual</p>
                </div>
                <button 
                  onClick={() => setIsExpenseModalOpen(false)} 
                  className="text-zinc-550 hover:text-white bg-zinc-900/50 p-2 rounded-full border border-white/5 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-6 overflow-y-auto no-scrollbar flex-1 bg-black/30">
                {/* Form to Add Expense */}
                <form onSubmit={handleAddExpense} className="space-y-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-900">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Novo Lançamento</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Descrição</label>
                    <input
                      type="text"
                      required
                      value={expDesc}
                      onChange={(e) => setExpDesc(e.target.value)}
                      placeholder="Ex: Agulhas, Tintas, Aluguel do box"
                      className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-medium focus:border-primary focus:outline-none placeholder-zinc-650 text-zinc-200 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={expAmount}
                        onChange={(e) => setExpAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-black focus:border-primary focus:outline-none placeholder-zinc-650 text-rose-400 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Data</label>
                      <input
                        type="date"
                        required
                        value={expDate}
                        onChange={(e) => setExpDate(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold focus:border-primary focus:outline-none text-zinc-300 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingExpense}
                    className="w-full h-11 mt-2 bg-primary text-black font-black uppercase tracking-widest italic rounded-xl flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all disabled:opacity-55 text-xs"
                  >
                    {savingExpense ? 'Salvando...' : <><Plus size={14} strokeWidth={2.5} /> Adicionar Despesa</>}
                  </button>
                </form>

                {/* Expense List */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex justify-between items-center">
                    <span>Lançamentos Recentes ({expenses.length})</span>
                    <span className="text-rose-500 font-bold">R$ {stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </h4>

                  {expenses.length === 0 ? (
                    <div className="p-8 text-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest border border-dashed border-zinc-900 rounded-2xl bg-zinc-950/40">
                      Nenhum gasto cadastrado
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                      {[...expenses]
                        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0) || b.date.localeCompare(a.date))
                        .map((expense) => (
                          <div 
                            key={expense.id} 
                            className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-xl flex justify-between items-center hover:border-zinc-800 transition-colors"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <h5 className="text-xs font-bold uppercase text-zinc-350 truncate">{expense.description}</h5>
                              <p className="text-[9px] text-zinc-500 font-black tracking-wider uppercase mt-1">
                                {format(new Date(expense.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-rose-500 uppercase italic">
                                -R$ {expense.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <button 
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="text-zinc-600 hover:text-rose-500 p-1.5 hover:bg-zinc-900 rounded-lg transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

