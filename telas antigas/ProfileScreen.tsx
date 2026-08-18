import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, ChevronLeft, MoreVertical, Image as ImageIcon, Smile } from 'lucide-react';
import { cn, getArtistImage } from '@/src/lib/utils';
import { db, auth } from '@/src/lib/firebase';
import { handleFirestoreError, OperationType } from '@/src/lib/firestore-utils';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

export function ChatScreen({ role, initialContact }: { role?: string, initialContact?: any }) {
  const [chatsList, setChatsList] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialContact?.prefillMessage) {
      setMessage(initialContact.prefillMessage);
    }
  }, [initialContact]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Format timestamp helper
  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Agora';
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Chat helper names and photos
  const getChatInfo = (chat: any) => {
    const isArtist = role === 'artist';
    return {
      name: isArtist ? (chat.clientName || 'Cliente') : (chat.artistName || 'Artista'),
      image: isArtist 
        ? (chat.clientPhotoURL || 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=200&auto=format&fit=crop')
        : (chat.artistPhotoURL || 'https://images.unsplash.com/photo-1598136490941-30d885318abd?q=80&w=200&auto=format&fit=crop')
    };
  };

  // Real-time listener for current user's active chats
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const chatQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const loadedChats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort client-side of lastMessageTime
      loadedChats.sort((a: any, b: any) => {
        const timeA = a.lastMessageTime?.seconds || 0;
        const timeB = b.lastMessageTime?.seconds || 0;
        return timeB - timeA;
      });
      setChatsList(loadedChats);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle auto-selection when contacting an artist from their profile
  useEffect(() => {
    if (initialContact && auth.currentUser) {
      const clientUid = auth.currentUser.uid;
      const artistUid = initialContact.uid || initialContact.id;
      const id = [clientUid, artistUid].sort().join('_');
      
      const existingChat = chatsList.find(c => c.id === id);
      if (existingChat) {
        setSelectedChat(existingChat);
      } else {
        setSelectedChat({
          id: id,
          participants: [clientUid, artistUid],
          clientName: auth.currentUser.displayName || 'Nicolas',
          artistName: initialContact.displayName || initialContact.name || 'Artista',
          clientPhotoURL: auth.currentUser.photoURL || '',
          artistPhotoURL: getArtistImage(initialContact) || '',
          lastMessage: '',
          isNew: true
        });
      }
    }
  }, [initialContact, chatsList]);

  // Real-time listener for messages in the selected chat
  useEffect(() => {
    if (!selectedChat?.id) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, 'chats', selectedChat.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(loadedMessages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${selectedChat.id}/messages`);
    });

    return () => unsubscribe();
  }, [selectedChat?.id]);

  // Send message helper
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || !selectedChat?.id || !auth.currentUser) return;

    const currentMsgText = message.trim();
    setMessage('');

    const chatId = selectedChat.id;
    const participants = selectedChat.participants || [
      auth.currentUser.uid,
      selectedChat.id.replace(auth.currentUser.uid, '').replace('_', '')
    ];

    try {
      // 1. Set/update the parent chat document with latest state first
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        participants,
        clientName: selectedChat.clientName || 'Nicolas',
        artistName: selectedChat.artistName || 'Artista',
        clientPhotoURL: selectedChat.clientPhotoURL || '',
        artistPhotoURL: selectedChat.artistPhotoURL || '',
        lastMessage: currentMsgText,
        lastMessageTime: serverTimestamp()
      }, { merge: true });

      // 2. Add Message subdocument
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || (role === 'artist' ? 'Tatuador' : 'Cliente'),
        text: currentMsgText,
        createdAt: serverTimestamp()
      });

      if (selectedChat.isNew) {
        setSelectedChat((prev: any) => ({ ...prev, isNew: false }));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chats/${chatId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedChat) {
    const chatInfo = getChatInfo(selectedChat);
    return (
      <div className="flex flex-col h-screen bg-[#0A0A0A] relative">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 bg-[#0A0A0A] border-b border-[#1A1A1A] z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedChat(null)} className="p-2 -ml-2 text-zinc-500 hover:text-primary">
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-[#1A1A1A] overflow-hidden">
                <img src={chatInfo.image} className="w-full h-full object-cover" alt="" />
              </div>
              <div>
                <h4 className="font-black text-sm leading-tight uppercase italic tracking-tighter">{chatInfo.name}</h4>
                <p className="text-[9px] text-primary font-black uppercase tracking-widest">Ativo</p>
              </div>
            </div>
          </div>
          <button className="p-2 text-zinc-700">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-40 no-scrollbar">
          <div className="flex flex-col items-center py-2">
            <span className="text-[9px] font-black uppercase text-zinc-800 tracking-[0.4em] bg-white/5 px-4 py-1 rounded-sm">Sessão Iniciada</span>
          </div>
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
              <p className="text-xs italic uppercase tracking-widest font-black text-zinc-500">Nenhuma mensagem enviada</p>
              <p className="text-[10px] tracking-wider mt-1 opacity-70">Comece a planejar sua tatuagem ideal aqui!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === auth.currentUser?.uid;
              return (
                <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "p-4 rounded-xl max-w-[85%] shadow-2xl",
                    isMe 
                      ? "bg-primary rounded-tr-none text-black shadow-primary/10 font-medium" 
                      : "bg-[#121212] border border-[#1A1A1A] rounded-tl-none text-zinc-300"
                  )}>
                    <p className={cn("text-sm leading-relaxed", isMe ? "text-right" : "text-left")}>
                      {msg.text}
                    </p>
                    <div className="flex justify-between items-center mt-2 gap-4">
                      {!isMe && (
                        <span className="text-[9px] text-primary font-black uppercase tracking-widest italic leading-none">
                          {msg.senderName}
                        </span>
                      )}
                      <span className={cn("text-[9px] font-black leading-none uppercase tracking-widest", isMe ? "text-black/40 block text-right w-full" : "text-zinc-600")}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0A0A0A] border-t border-[#1A1A1A] z-20">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            <button type="button" className="w-12 h-12 flex items-center justify-center text-zinc-600 bg-[#121212] border border-[#1A1A1A] rounded-xl hover:text-primary transition-colors">
              <ImageIcon size={20} />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Esculpa sua mensagem..."
                className="w-full h-12 bg-[#121212] border border-[#1A1A1A] rounded-xl pl-4 pr-12 text-sm outline-none focus:border-primary transition-all text-white placeholder:text-zinc-800"
              />
            </div>
            <button type="submit" className="w-12 h-12 flex items-center justify-center bg-primary text-black rounded-xl shadow-2xl shadow-primary/20 active:scale-95 transition-all">
              <Send size={20} />
            </button>
          </form>
          <div className="h-20"></div> {/* Space for bottom nav */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 pb-24 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black uppercase text-primary italic tracking-tighter">Conversas</h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
          {role === 'artist' ? 'Negociações com Clientes' : 'Negociações em Arte'}
        </p>
      </div>

      <div className="space-y-4">
        {chatsList.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-xs font-black uppercase text-zinc-600 tracking-widest">Nenhuma conversa ativa ainda</p>
            <p className="text-[10px] text-zinc-500 mt-1">Inicie contato com um {role === 'artist' ? 'cliente' : 'artista'} para começar a conversar.</p>
          </div>
        ) : (
          chatsList.map((chat) => {
            const info = getChatInfo(chat);
            return (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedChat(chat)}
                className="flex items-center gap-4 p-4 bg-[#121212] border border-[#1A1A1A] rounded-2xl cursor-pointer hover:bg-zinc-900 group transition-all"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl border border-[#1A1A1A] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                    <img src={info.image} className="w-full h-full object-cover" alt="" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm uppercase truncate">{info.name}</h4>
                    <span className="text-[9px] font-black text-zinc-600 uppercase italic">{formatTime(chat.lastMessageTime)}</span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate mt-1 italic">"{chat.lastMessage}"</p>
                </div>
                <ChevronLeft className="rotate-180 text-zinc-800" size={16} />
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
