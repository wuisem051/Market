import React, { useState, useEffect } from 'react';
import { Search, Menu, Package, User, MessageSquare, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [unreadTotal, setUnreadTotal] = useState(0);

    useEffect(() => {
        if (!currentUser) {
            setUnreadTotal(0);
            return;
        }

        // Listen to conversations to sum unread counts
        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let total = 0;
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                total += (data.unreadCount?.[currentUser.uid] || 0);
            });
            setUnreadTotal(total);
        });

        return () => unsubscribe();
    }, [currentUser]);

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm backdrop-blur-md bg-white/90">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:rotate-12 transition-transform">
                            <Package className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                            Market<span className="text-teal-500 not-italic">VE</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex flex-1 max-w-xl px-12">
                        <div className="relative w-full group">
                            <input
                                type="text"
                                placeholder="Buscar en el marketplace..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-500 text-sm font-bold transition-all outline-none"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-teal-500 transition-colors" />
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <nav className="flex gap-6">
                            <Link to="/productos" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors">Productos</Link>
                            <Link to="/servicios" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors">Servicios</Link>
                        </nav>

                        <div className="h-8 w-px bg-slate-100"></div>

                        {!currentUser ? (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-teal-600 transition-colors">Ingresar</Link>
                                <Link to="/login" className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10">
                                    Publicar Anuncio
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                {/* CAMPANA DE NOTIFICACIONES */}
                                <Link to="/mensajes" className="relative p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-all group">
                                    <Bell className={`w-5 h-5 ${unreadTotal > 0 ? 'animate-swing' : ''}`} />
                                    {unreadTotal > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                            {unreadTotal}
                                        </span>
                                    )}
                                </Link>

                                <Link to="/mensajes" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>Chats</span>
                                </Link>

                                <Link to="/dashboard" className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all overflow-hidden border-2 border-white shadow-sm">
                                    {currentUser.photoURL ? (
                                        <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5" />
                                    )}
                                </Link>

                                <Link to="/crear-anuncio" className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-500/20 active:scale-95">
                                    Publicar Gratis
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="md:hidden flex items-center gap-4">
                        {currentUser && unreadTotal > 0 && (
                            <Link to="/mensajes" className="relative p-2 text-teal-600">
                                <Bell className="w-6 h-6 animate-swing" />
                                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                                    {unreadTotal}
                                </span>
                            </Link>
                        )}
                        <button className="p-2 text-slate-900 bg-slate-50 rounded-xl">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
