import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    collection, query, where, onSnapshot, orderBy,
    addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import {
    Send, User, Search, ArrowLeft, MoreVertical,
    MessageSquare, Clock, Package, Check, CheckCheck
} from 'lucide-react';

const Messages = () => {
    const { productId, sellerId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Fetch conversations for the current user
    useEffect(() => {
        if (!currentUser) return;

        // Optimized query without orderBy to avoid index requirements
        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedConvs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by updatedAt in memory (descending)
            const sortedConvs = fetchedConvs.sort((a, b) => {
                const dateA = a.updatedAt?.toDate?.() || new Date(0);
                const dateB = b.updatedAt?.toDate?.() || new Date(0);
                return dateB - dateA;
            });

            setConversations(sortedConvs);
            setLoading(false);

            // If we came from a product page, try to find and auto-select
            if (productId && sellerId) {
                const convId = `${currentUser.uid}_${sellerId}_${productId}`;
                const existing = fetchedConvs.find(c => c.id === convId || c.productId === productId);
                if (existing) {
                    setActiveConversation(existing);
                }
            }
        }, (error) => {
            console.error("Error in onSnapshot:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, productId, sellerId]);

    // Separate effect to handle creation of new conversation from URL
    useEffect(() => {
        if (!currentUser || !productId || !sellerId) return;

        const checkAndCreateConv = async () => {
            try {
                const convId = `${currentUser.uid}_${sellerId}_${productId}`;
                const convRef = doc(db, 'conversations', convId);
                const convSnap = await getDoc(convRef);

                if (convSnap.exists()) {
                    setActiveConversation({ id: convSnap.id, ...convSnap.data() });
                } else {
                    handleNewConversation();
                }
            } catch (error) {
                console.error("Error checking conversation:", error);
            }
        };

        checkAndCreateConv();
    }, [currentUser, productId, sellerId]);

    // Fetch messages for active conversation
    useEffect(() => {
        if (!activeConversation) {
            setMessages([]);
            return;
        }

        const q = query(
            collection(db, 'conversations', activeConversation.id, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [activeConversation]);

    const handleNewConversation = async () => {
        try {
            // Get product info for the conversation header
            const productRef = doc(db, 'listings', productId);
            const productSnap = await getDoc(productRef);

            if (!productSnap.exists()) return;
            const pData = productSnap.data();

            // Create a unique ID for this buyer-seller-product combo
            const convId = `${currentUser.uid}_${sellerId}_${productId}`;
            const convRef = doc(db, 'conversations', convId);

            const newConv = {
                participants: [currentUser.uid, sellerId],
                participantNames: {
                    [currentUser.uid]: currentUser.displayName || 'Comprador',
                    [sellerId]: pData.sellerName || 'Vendedor'
                },
                productId: productId,
                productTitle: pData.title,
                productImage: pData.images?.[0] || '',
                productPrice: pData.price,
                productCurrency: pData.currency,
                lastMessage: 'Inició una conversación',
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            };

            await setDoc(convRef, newConv);
            setActiveConversation({ id: convId, ...newConv });
        } catch (error) {
            console.error("Error creating conversation:", error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        const text = newMessage.trim();
        setNewMessage('');

        try {
            const msgData = {
                senderId: currentUser.uid,
                senderName: currentUser.displayName || 'Usuario',
                text,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'conversations', activeConversation.id, 'messages'), msgData);

            await updateDoc(doc(db, 'conversations', activeConversation.id), {
                lastMessage: text,
                lastSenderId: currentUser.uid,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (!currentUser) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Inicia sesión</h2>
                    <p className="text-slate-500 mb-6 font-medium">Debes estar registrado para ver tus mensajes.</p>
                    <button onClick={() => navigate('/login')} className="bg-teal-500 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-teal-500/20">
                        Ir al Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex overflow-hidden bg-white max-w-7xl mx-auto w-full border-x border-slate-100 shadow-2xl">
            {/* Sidebar: Conversations List */}
            <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-[350px] border-r border-slate-100 flex-col bg-slate-50/30`}>
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4">Mensajes</h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar chats..."
                            className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 && !loading ? (
                        <div className="p-10 text-center opacity-40">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest">Sin conversaciones</p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const otherParticipantId = conv.participants?.find(id => id !== currentUser.uid);
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveConversation(conv)}
                                    className={`w-full p-4 flex gap-4 transition-all border-b border-slate-50/50 ${activeConversation?.id === conv.id ? 'bg-white shadow-lg z-10 scale-[1.02] ring-1 ring-slate-100' : 'hover:bg-slate-50'}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                                            {conv.productImage ? (
                                                <img src={conv.productImage} className="w-full h-full object-cover rounded-2xl" alt="" />
                                            ) : (
                                                conv.productTitle?.charAt(0) || '?'
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <p className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">
                                                {conv.productTitle}
                                            </p>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                {conv.updatedAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 truncate mb-1">
                                            {conv.participantNames?.[otherParticipantId] || 'Usuario'}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate font-medium">
                                            {conv.lastSenderId === currentUser.uid ? 'Tú: ' : ''}{conv.lastMessage}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${!activeConversation ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white relative`}>
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                            <button onClick={() => setActiveConversation(null)} className="md:hidden p-2 hover:bg-slate-100 rounded-xl">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>

                            <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                                {activeConversation.productImage ? (
                                    <img src={activeConversation.productImage} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <Package className="w-full h-full p-2.5 text-slate-300" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight truncate">
                                    {activeConversation.productTitle}
                                </h3>
                                <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">
                                    Chat con el vendedor
                                </p>
                            </div>

                            <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40 custom-scrollbar">
                            <div className="text-center py-8">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Clock className="w-3 h-3" /> Chat iniciado el {activeConversation.createdAt?.toDate().toLocaleDateString()}
                                </div>
                            </div>

                            {messages.map((msg, index) => {
                                const isMe = msg.senderId === currentUser.uid;
                                return (
                                    <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`max-w-[80%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                            <div className={`px-5 py-3.5 rounded-[1.5rem] shadow-sm text-sm font-medium leading-relaxed ${isMe ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                                                {msg.text}
                                            </div>
                                            <div className="flex items-center gap-2 px-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
                                                    {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isMe && <CheckCheck className="w-3 h-3 text-teal-500" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-6 bg-white border-t border-slate-100">
                            <form onSubmit={sendMessage} className="flex gap-4">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-0 transition-all outline-none shadow-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="w-14 h-14 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:hover:bg-teal-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Send className="w-6 h-6" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30 select-none">
                        <div className="w-32 h-32 bg-slate-100 rounded-[3rem] flex items-center justify-center mb-8">
                            <MessageSquare className="w-16 h-16 text-slate-300" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Selecciona un chat</h2>
                        <p className="max-w-xs font-bold text-slate-500 uppercase text-[10px] tracking-widest leading-loose">
                            Elige una conversación de la izquierda para ver los detalles y negociar con el vendedor.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
