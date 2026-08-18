import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { Mail, Lock, User, Phone, MapPin, Building2, ChevronRight, Grape as Google } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-utils';

import { Logo } from '../ui/Logo';

interface AuthScreenProps {
  onComplete: (data: any) => void;
}

export function AuthScreen({ onComplete }: AuthScreenProps) {
  const [step, setStep] = useState<'welcome' | 'role' | 'login' | 'register'>('welcome');
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [role, setRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    studioName: '',
    studioAddress: '',
    bio: '',
  });

  const handleModeSelection = (selectedMode: 'login' | 'register') => {
    setMode(selectedMode);
    setStep('role');
  };

  const handleRoleSelection = () => {
    setStep(mode === 'login' ? 'login' : 'register');
  };

  const handleAuthError = (err: any) => {
    console.error(err);
    if (err.code === 'auth/email-already-in-use') {
      setError('Este e-mail já está em uso.');
    } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      setError('E-mail ou senha incorretos.');
    } else if (err.code === 'auth/user-not-found') {
      setError('Usuário não encontrado.');
    } else if (err.code === 'auth/weak-password') {
      setError('A senha deve ter pelo menos 6 caracteres.');
    } else if (err.code === 'auth/operation-not-allowed') {
      setError('O login por e-mail/senha não está ativado no Firebase Console.');
    } else {
      setError('Ocorreu um erro. Tente novamente.');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // If new user, they need to select a role first. 
        // For simplicity in this demo, if they use Google without landing on role selection, 
        // we might need to prompt them, but here we'll use the current 'role' state.
        const profileData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || formData.name || 'User',
          role: role, // use current role selection
          phoneNumber: user.phoneNumber || formData.phone || '',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', user.uid), profileData);
        onComplete(profileData);
      } else {
        onComplete(userDoc.data());
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedEmail = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    if (mode === 'register' && formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, formData.password);
        const user = userCredential.user;

        const profileData = {
          uid: user.uid,
          email: trimmedEmail,
          displayName: formData.name,
          role,
          phoneNumber: formData.phone,
          createdAt: serverTimestamp(),
          ...(role === 'artist' ? {
            studioName: formData.studioName,
            studioAddress: formData.studioAddress,
            bio: formData.bio,
          } : {})
        };

        const path = `users/${user.uid}`;
        try {
          await setDoc(doc(db, 'users', user.uid), profileData);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
        
        onComplete(profileData);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, formData.password);
        const user = userCredential.user;
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          onComplete(userDoc.data());
        } else {
          // This shouldn't happen usually if they registered correctly
          setError('Perfil não encontrado no banco de dados.');
        }
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-8 justify-center bg-black">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-12"
          >
            <div className="space-y-4">
              <div className="mx-auto flex items-center justify-center">
                <Logo className="w-40 h-40" />
              </div>
              <div className="space-y-1">
                <h1 className="text-6xl font-black tracking-tighter uppercase italic text-primary">Dermys</h1>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Arte Incontestável</p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleModeSelection('login')}
                className="w-full h-16 bg-zinc-900 text-white font-black uppercase tracking-widest rounded-xl border border-zinc-800 transition-all hover:bg-zinc-800"
              >
                Entrar
              </button>
              <button
                onClick={() => handleModeSelection('register')}
                className="w-full h-16 bg-primary text-black font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/10 transition-all hover:brightness-110"
              >
                Cadastrar
              </button>
            </div>
          </motion.div>
        )}

        {step === 'role' && (
          <motion.div
            key="role"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase text-primary italic tracking-tighter">Quem é você?</h2>
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Selecione seu perfil</p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => setRole('client')}
                className={cn(
                  "p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden group",
                  role === 'client' ? "border-primary bg-primary/5" : "border-zinc-900 bg-zinc-900/30"
                )}
              >
                <div className="flex justify-between items-center mb-4">
                  <User className={role === 'client' ? "text-primary" : "text-zinc-600"} size={32} />
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    role === 'client' ? "border-primary bg-primary" : "border-zinc-800"
                  )}>
                    {role === 'client' && <div className="w-2 h-2 bg-black rounded-full" />}
                  </div>
                </div>
                <h3 className="text-xl font-black uppercase italic text-white">Cliente</h3>
                <p className="text-xs text-zinc-500 mt-2 font-medium">Buscando artes e agendamentos.</p>
              </button>

              <button
                onClick={() => setRole('artist')}
                className={cn(
                  "p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden group",
                  role === 'artist' ? "border-primary bg-primary/5" : "border-zinc-900 bg-zinc-900/30"
                )}
              >
                <div className="flex justify-between items-center mb-4">
                  <Building2 className={role === 'artist' ? "text-primary" : "text-zinc-600"} size={32} />
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    role === 'artist' ? "border-primary bg-primary" : "border-zinc-800"
                  )}>
                    {role === 'artist' && <div className="w-2 h-2 bg-black rounded-full" />}
                  </div>
                </div>
                <h3 className="text-xl font-black uppercase italic text-white">Tatuador</h3>
                <p className="text-xs text-zinc-500 mt-2 font-medium">Gerenciando estúdio e agenda.</p>
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('welcome')}
                className="flex-1 h-16 bg-zinc-900 text-white font-black uppercase tracking-widest rounded-xl border border-zinc-800"
              >
                Voltar
              </button>
              <button
                onClick={handleRoleSelection}
                className="flex-[2] h-16 bg-primary text-black font-black uppercase tracking-widest rounded-xl shadow-lg"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        )}

        {(step === 'login' || step === 'register') && (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase text-primary italic tracking-tighter">
                {step === 'login' ? 'Entrar' : 'Cadastro'}
              </h2>
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
                Como {role === 'artist' ? 'Tatuador' : 'Cliente'}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-wider text-center">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {step === 'register' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-14 bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 focus:border-primary outline-none text-white text-sm"
                  />
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                  type="email"
                  placeholder="E-mail"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-14 bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 focus:border-primary outline-none text-white text-sm"
                />
              </div>

              {step === 'register' && (
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="tel"
                    placeholder="Telefone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-14 bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 focus:border-primary outline-none text-white text-sm"
                  />
                </div>
              )}

              {step === 'register' && role === 'artist' && (
                <>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input
                      type="text"
                      placeholder="Nome do Estúdio"
                      value={formData.studioName}
                      onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
                      className="w-full h-14 bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 focus:border-primary outline-none text-white text-sm"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input
                      type="text"
                      placeholder="Endereço do Estúdio"
                      value={formData.studioAddress}
                      onChange={(e) => setFormData({ ...formData, studioAddress: e.target.value })}
                      className="w-full h-14 bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 focus:border-primary outline-none text-white text-sm"
                    />
                  </div>
                  <div className="relative">
                    <textarea
                      placeholder="Sua Bio / Descrição Curta"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 focus:border-primary outline-none text-white text-sm h-24 resize-none"
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                  type="password"
                  placeholder={step === 'register' ? "Crie uma Senha" : "Sua Senha"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full h-14 bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 focus:border-primary outline-none text-white text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-16 bg-primary text-black font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/10 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  step === 'login' ? 'Entrar' : 'Finalizar Registro'
                )}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-zinc-900"></div>
                <span className="flex-shrink mx-4 text-zinc-600 text-[10px] font-black uppercase tracking-widest">Ou</span>
                <div className="flex-grow border-t border-zinc-900"></div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-14 bg-white text-black font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-zinc-100 disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Google
              </button>

              <button
                onClick={() => setStep('role')}
                className="w-full h-10 text-zinc-500 font-black uppercase text-[10px] tracking-widest"
              >
                Voltar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
