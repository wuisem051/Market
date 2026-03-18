import React, { useState, useEffect, useRef } from 'react';
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

const MessageCenter = ({ initialProductId, initialSellerId }) => {
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeConversation]);

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

            if (initialProductId && initialSellerId && !activeConversation) {
                const convId = `${currentUser.uid}_${initialSellerId}_${initialProductId}`;
                const existing = fetchedConvs.find(c => c.productId === initialProductId || c.id === convId);
                if (existing) {
                    setActiveConversation(existing);
                }
            }
        });

        return () => unsubscribe();
    }, [currentUser, initialProductId, initialSellerId]);

    // Create new conversation if needed
    useEffect(() => {
        if (!currentUser || !initialProductId || !initialSellerId) return;

        const checkAndCreateConv = async () => {
            setInitializing(true);
            try {
                const convId = `${currentUser.uid}_${initialSellerId}_${initialProductId}`;
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
    }, [currentUser, initialProductId, initialSellerId]);

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
        if (!window.confirm("¿Seguro que quieres eliminar este chat?")) return;
        try {
            const msgsSnap = await getDocs(collection(db, 'conversations', activeConversation.id, 'messages'));
            const batch = writeBatch(db);
            msgsSnap.forEach(d => batch.delete(d.ref));
            await batch.commit();
            await deleteDoc(doc(db, 'conversations', activeConversation.id));
            setActiveConversation(null);
            setShowOptions(false);
        } catch (error) { }
    };

    const handleReport = async () => {
        const otherId = activeConversation.participants.find(id => id !== currentUser.uid);
        const reason = window.prompt("Motivo del reporte:");
        if (!reason) return;
        setReporting(true);
        try {
            await addDoc(collection(db, 'reports'), {
                reportedUserId: otherId,
                reportedById: currentUser.uid,
                conversationId: activeConversation.id,
                reason,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            alert("Reporte enviado");
            setShowOptions(false);
        } catch (error) { } finally { setReporting(false); }
    };

    const handleNewConversation = async () => {
        try {
            const productRef = doc(db, 'listings', initialProductId);
            const productSnap = await getDoc(productRef);
            let pData = { title: "Producto", images: [] };
            if (productSnap.exists()) pData = productSnap.data();

            const convId = `${currentUser.uid}_${initialSellerId}_${initialProductId}`;
            const convRef = doc(db, 'conversations', convId);

            const newConvData = {
                participants: [currentUser.uid, initialSellerId],
                participantNames: {
                    [currentUser.uid]: currentUser.displayName || 'Comprador',
                    [initialSellerId]: pData.sellerName || 'Vendedor'
                },
                productId: initialProductId,
                productTitle: pData.title,
                productImage: pData.images?.[0] || "",
                lastMessage: 'Inició una conversación',
                unreadCount: { [currentUser.uid]: 0, [initialSellerId]: 0 },
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            };

            await setDoc(convRef, newConvData);
            setActiveConversation({ id: convId, ...newConvData });
        } catch (error) { }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;
        const text = newMessage.trim();
        setNewMessage('');
        try {
            const otherId = activeConversation.participants.find(id => id !== currentUser.uid);
            await addDoc(collection(db, 'conversations', activeConversation.id, 'messages'), {
                senderId: currentUser.uid,
                receiverId: otherId,
                text,
                read: false,
                createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, 'conversations', activeConversation.id), {
                lastMessage: text,
                lastSenderId: currentUser.uid,
                updatedAt: serverTimestamp(),
                [`unreadCount.${otherId}`]: increment(1)
            });
        } catch (error) { }
    };

    return (
        <div className="flex h-[calc(100vh-280px)] min-h-[500px] bg-white border-t border-slate-100 overflow-hidden">
            {/* Sidebar */}
            <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-50 bg-slate-50/30`}>
                <div className="p-6 border-b border-slate-100 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Buscar chats..." className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-10 pr-4 text-sm font-medium outline-none" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map(conv => {
                        const unread = conv.unreadCount?.[currentUser.uid] || 0;
                        return (
                            <button key={conv.id} onClick={() => { setActiveConversation(conv); setShowOptions(false); }} className={`w-full p-4 flex gap-4 border-b border-slate-50/50 transition-all ${activeConversation?.id === conv.id ? 'bg-white shadow-lg z-10' : 'hover:bg-slate-50'}`}>
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-xl bg-teal-500 overflow-hidden text-white flex items-center justify-center font-black">
                                        {conv.productImage ? <img src={conv.productImage} className="w-full h-full object-cover" /> : conv.productTitle?.[0]}
                                    </div>
                                    {unread > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">{unread}</div>}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className={`text-sm font-black truncate uppercase tracking-tighter ${unread > 0 ? 'text-teal-600' : 'text-slate-900'}`}>{conv.productTitle}</p>
                                    <p className="text-[10px] text-slate-400 truncate font-medium">{conv.lastMessage}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chat */}
            <div className={`${!activeConversation ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white`}>
                {activeConversation ? (
                    <>
                        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white/80 shrink-0">
                            <button onClick={() => setActiveConversation(null)} className="md:hidden p-2 hover:bg-slate-100 rounded-xl"><ArrowLeft className="w-5 h-5" /></button>
                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border">
                                {activeConversation.productImage ? <img src={activeConversation.productImage} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-2 text-slate-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight truncate">{activeConversation.productTitle}</h3>
                            </div>
                            <div className="relative">
                                <button onClick={() => setShowOptions(!showOptions)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><MoreVertical className="w-5 h-5" /></button>
                                {showOptions && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 py-2">
                                        <button onClick={handleDeleteChat} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3 h-3" /> Eliminar</button>
                                        <button onClick={handleReport} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-orange-500 hover:bg-orange-50 transition-colors"><ShieldAlert className="w-3 h-3" /> Reportar</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === currentUser.uid;
                                return (
                                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-3 rounded-2xl text-sm font-medium ${isMe ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none shadow-sm'}`}>{msg.text}</div>
                                            <div className="flex items-center gap-2 px-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...'}</span>
                                                {isMe && <CheckCheck className={`w-3 h-3 ${msg.read ? 'text-teal-500' : 'text-slate-300'}`} />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-4 shrink-0">
                            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium outline-none" />
                            <button type="submit" disabled={!newMessage.trim()} className="w-14 h-14 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20"><Send className="w-6 h-6" /></button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 select-none p-12">
                        <MessageSquare className="w-20 h-20 text-slate-300 mb-6" />
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Selecciona un chat</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageCenter;
