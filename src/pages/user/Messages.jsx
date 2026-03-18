import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    collection, query, where, onSnapshot, orderBy,
    addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, writeBatch, increment, deleteDoc, getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import {
    Send, User, Search, ArrowLeft, MoreVertical,
    MessageSquare, Clock, Package, Check, CheckCheck, Loader2, Trash2, ShieldAlert, X
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
    const [initializing, setInitializing] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [reporting, setReporting] = useState(false);

    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Fetch conversations for the current user
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedConvs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const sortedConvs = fetchedConvs.sort((a, b) => {
                const dateA = a.updatedAt?.toDate?.() || new Date(0);
                const dateB = b.updatedAt?.toDate?.() || new Date(0);
                return dateB - dateA;
            });

            setConversations(sortedConvs);
            setLoading(false);

            if (productId && sellerId && !activeConversation) {
                const convId = `${currentUser.uid}_${sellerId}_${productId}`;
                const existing = fetchedConvs.find(c => c.productId === productId || c.id === convId);
                if (existing) {
                    setActiveConversation(existing);
                }
            }
        }, (error) => {
            console.error("Error Snapshot:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, productId, sellerId]);

    // Create new conversation if needed
    useEffect(() => {
        if (!currentUser || !productId || !sellerId) return;

        const checkAndCreateConv = async () => {
            setInitializing(true);
            try {
                const convId = `${currentUser.uid}_${sellerId}_${productId}`;
                const convRef = doc(db, 'conversations', convId);
                const convSnap = await getDoc(convRef);

                if (convSnap.exists()) {
                    setActiveConversation({ id: convSnap.id, ...convSnap.data() });
                } else {
                    await handleNewConversation();
                }
            } catch (error) {
                console.error("Error check chat:", error);
            } finally {
                setInitializing(false);
            }
        };

        checkAndCreateConv();
    }, [currentUser, productId, sellerId]);

    // Fetch messages AND Mark as READ
    useEffect(() => {
        if (!activeConversation || !currentUser) {
            setMessages([]);
            return;
        }

        const q = query(
            collection(db, 'conversations', activeConversation.id, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);

            // Logic to mark as read
            const unreadMsgs = snapshot.docs.filter(d =>
                d.data().read === false &&
                d.data().senderId !== currentUser.uid
            );

            if (unreadMsgs.length > 0) {
                const batch = writeBatch(db);
                unreadMsgs.forEach(d => {
                    batch.update(doc(db, 'conversations', activeConversation.id, 'messages', d.id), {
                        read: true
                    });
                });

                batch.update(doc(db, 'conversations', activeConversation.id), {
                    [`unreadCount.${currentUser.uid}`]: 0
                });

                await batch.commit();
            }
        });

        return () => unsubscribe();
    }, [activeConversation, currentUser]);

    const handleDeleteChat = async () => {
        if (!activeConversation) return;
        if (!window.confirm("¿Seguro que quieres eliminar este chat? Se borrarán todos los mensajes.")) return;

        try {
            // Delete all messages first (batch)
            const msgsSnap = await getDocs(collection(db, 'conversations', activeConversation.id, 'messages'));
            const batch = writeBatch(db);
            msgsSnap.forEach(d => batch.delete(d.ref));
            await batch.commit();

            // Delete conversation
            await deleteDoc(doc(db, 'conversations', activeConversation.id));

            setActiveConversation(null);
            setShowOptions(false);
        } catch (error) {
            console.error("Error deleting chat:", error);
            alert("Error al eliminar chat");
        }
    };

    const handleReport = async () => {
        if (!activeConversation) return;
        const otherId = activeConversation.participants.find(id => id !== currentUser.uid);
        const reason = window.prompt("¿Por qué quieres denunciar a este usuario? (Inapropiado, Estafa, Spam, etc.)");

        if (!reason) return;

        setReporting(true);
        try {
            await addDoc(collection(db, 'reports'), {
                reportedUserId: otherId,
                reportedByName: currentUser.displayName || 'Anon',
                reportedById: currentUser.uid,
                conversationId: activeConversation.id,
                reason,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            alert("Hemos recibido tu reporte. El equipo de administración revisará el caso.");
            setShowOptions(false);
        } catch (error) {
            console.error("Error reporting:", error);
            alert("Error al enviar reporte");
        } finally {
            setReporting(false);
        }
    };

    const handleNewConversation = async () => {
        try {
            let pTitle = "Producto / Servicio";
            let pImg = "";
            let pPrice = 0;
            let pCurr = "USD";
            let sNames = { [sellerId]: "Vendedor" };

            try {
                const productRef = doc(db, 'listings', productId);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                    const p = productSnap.data();
                    pTitle = p.title || pTitle;
                    pImg = p.images?.[0] || "";
                    pPrice = p.price || 0;
                    pCurr = p.currency || "USD";
                    sNames[sellerId] = p.sellerName || "Vendedor";
                }
            } catch (err) { }

            const convId = `${currentUser.uid}_${sellerId}_${productId}`;
            const convRef = doc(db, 'conversations', convId);

            const newConvData = {
                participants: [currentUser.uid, sellerId],
                participantNames: {
                    [currentUser.uid]: currentUser.displayName || 'Comprador',
                    ...sNames
                },
                productId: productId,
                productTitle: pTitle,
                productImage: pImg,
                productPrice: pPrice,
                productCurrency: pCurr,
                lastMessage: 'Inició una conversación',
                unreadCount: {
                    [currentUser.uid]: 0,
                    [sellerId]: 0
                },
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            };

            await setDoc(convRef, newConvData);
            setActiveConversation({ id: convId, ...newConvData });

        } catch (error) {
            console.error("Error creating chat:", error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        const text = newMessage.trim();
        setNewMessage('');

        try {
            const otherId = activeConversation.participants.find(id => id !== currentUser.uid);

            const msgData = {
                senderId: currentUser.uid,
                receiverId: otherId,
                senderName: currentUser.displayName || 'Usuario',
                text,
                read: false,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'conversations', activeConversation.id, 'messages'), msgData);

            await updateDoc(doc(db, 'conversations', activeConversation.id), {
                lastMessage: text,
                lastSenderId: currentUser.uid,
                updatedAt: serverTimestamp(),
                [`unreadCount.${otherId}`]: increment(1)
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="flex-1 flex overflow-hidden bg-white max-w-7xl mx-auto w-full border-x border-slate-100 shadow-2xl relative">
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
                    {loading ? (
                        <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" /></div>
                    ) : (
                        conversations.map(conv => {
                            const otherParticipantId = conv.participants?.find(id => id !== currentUser.uid);
                            const unread = conv.unreadCount?.[currentUser.uid] || 0;
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => { setActiveConversation(conv); setShowOptions(false); }}
                                    className={`w-full p-4 flex gap-4 transition-all border-b border-slate-50/50 ${activeConversation?.id === conv.id ? 'bg-white shadow-lg z-10 scale-[1.02] ring-1 ring-slate-100' : 'hover:bg-slate-50'}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center text-white font-black text-lg shadow-md overflow-hidden">
                                            {conv.productImage ? (
                                                <img src={conv.productImage} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                conv.productTitle?.charAt(0) || '?'
                                            )}
                                        </div>
                                        {unread > 0 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white animate-bounce">
                                                {unread}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <p className={`font-black text-slate-900 text-sm truncate uppercase tracking-tight ${unread > 0 ? 'text-teal-600' : ''}`}>
                                                {conv.productTitle}
                                            </p>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                {conv.updatedAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '--:--'}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 truncate mb-1">
                                            {conv.participantNames?.[otherParticipantId] || 'Vendedor'}
                                        </p>
                                        <p className={`text-xs truncate font-medium flex items-center gap-1 ${unread > 0 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
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
                                    Con: {activeConversation.participantNames?.[Object.keys(activeConversation.participantNames || {}).find(id => id !== currentUser.uid)] || 'Vendedor'}
                                </p>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowOptions(!showOptions)}
                                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>

                                {showOptions && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            onClick={handleDeleteChat}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" /> Eliminar Chat
                                        </button>
                                        <button
                                            onClick={handleReport}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
                                        >
                                            <ShieldAlert className="w-4 h-4 text-orange-500" /> Reportar Usuario
                                        </button>
                                        {reporting && <div className="px-4 py-2 text-[10px] font-bold text-teal-500 animate-pulse">Enviando reporte...</div>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40 custom-scrollbar">
                            <div className="text-center py-8">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Clock className="w-3 h-3" /> Chat iniciado el {activeConversation.createdAt?.toDate?.()?.toLocaleDateString() || '...'}
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
                                                    {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...'}
                                                </span>
                                                {isMe && (
                                                    <CheckCheck className={`w-3 h-3 ${msg.read ? 'text-teal-500' : 'text-slate-300'}`} />
                                                )}
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
                            {productId && initializing ? (
                                <Loader2 className="w-16 h-16 text-teal-500 animate-spin" />
                            ) : (
                                <MessageSquare className="w-16 h-16 text-slate-300" />
                            )}
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                            {productId && initializing ? 'Cargando Chat...' : 'Selecciona un chat'}
                        </h2>
                        <p className="max-w-xs font-bold text-slate-500 uppercase text-[10px] tracking-widest leading-loose">
                            {productId && initializing ? 'Estamos preparando tu conversación con el vendedor.' : 'Elige una conversación de la izquierda para ver los detalles y negociar con el vendedor.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
