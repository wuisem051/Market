import React, { useState, useEffect } from 'react';
import { Package, Wrench, MessageSquare, Settings, LogOut, Plus, MapPin, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('marketplace');
    const [listings, setListings] = useState([]);
    const [loadingListings, setLoadingListings] = useState(false);
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const fetchUserListings = async () => {
            setLoadingListings(true);
            try {
                const q = query(
                    collection(db, 'listings'),
                    where('sellerId', '==', currentUser.uid)
                );
                const querySnapshot = await getDocs(q);
                const fetchedListings = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setListings(fetchedListings);
            } catch (error) {
                console.error("Error fetching listings:", error);
            } finally {
                setLoadingListings(false);
            }
        };

        fetchUserListings();
    }, [currentUser, navigate]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Error al cerrar sesión', error);
        }
    };

    if (!currentUser) return null; // Previene un parpadeo de contenido mientras redirige

    return (
        <div className="flex-1 flex flex-col md:flex-row bg-slate-50 min-h-screen">
            {/* SIDEBAR */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 space-y-1">
                <div className="flex items-center gap-3 p-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg">
                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <h3 className="font-semibold text-slate-900 truncate">
                            {currentUser.displayName || 'Usuario'}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    </div>
                </div>

                <nav className="space-y-2">
                    <button
                        onClick={() => setActiveTab('marketplace')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'marketplace' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Package className="w-5 h-5" /> Mis Productos
                    </button>
                    <button
                        onClick={() => setActiveTab('servicios')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'servicios' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Wrench className="w-5 h-5" /> Mis Servicios
                    </button>
                    <button
                        onClick={() => setActiveTab('mensajes')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'mensajes' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <MessageSquare className="w-5 h-5" /> Chats / Consultas
                    </button>

                    <hr className="border-slate-200 my-4" />

                    <button
                        onClick={() => setActiveTab('config')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'config' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Settings className="w-5 h-5" /> Configuración
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" /> Salir
                    </button>
                </nav>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 p-6 sm:p-8 lg:p-10">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {activeTab === 'marketplace' && 'Mis Anuncios de Productos'}
                                {activeTab === 'servicios' && 'Mi Directorio de Servicios'}
                                {activeTab === 'mensajes' && 'Centro de Mensajes (WhatsApp & Chat)'}
                                {activeTab === 'config' && 'Configuración de Cuenta'}
                            </h1>
                            <p className="text-slate-500 mt-1">Gestiona tu contenido y tus contactos.</p>
                        </div>

                        {(activeTab === 'marketplace' || activeTab === 'servicios') && (
                            <button
                                onClick={() => navigate('/crear-anuncio')}
                                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-teal-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                Crear Nuevo
                            </button>
                        )}
                    </div>

                    {/* FILTRADO DE CONTENIDO */}
                    <div className="space-y-4">
                        {loadingListings ? (
                            <div className="text-center py-10 text-slate-500">Cargando tus anuncios...</div>
                        ) : (
                            listings.filter(item => {
                                if (activeTab === 'marketplace') return item.type === 'product';
                                if (activeTab === 'servicios') return item.type === 'service';
                                return false;
                            }).length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {listings
                                        .filter(item => {
                                            if (activeTab === 'marketplace') return item.type === 'product';
                                            if (activeTab === 'servicios') return item.type === 'service';
                                            return false;
                                        })
                                        .map(item => (
                                            <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 hover:border-teal-200 transition-colors group">
                                                <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.images?.[0] ? (
                                                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                            <Package className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-900 truncate">{item.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                                        <span className="flex items-center gap-1 font-medium text-teal-600">
                                                            {item.currency} {item.price}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3.5 h-3.5" /> {item.location?.city}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Link
                                                        to={`/producto/${item.id}`}
                                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors text-center"
                                                    >
                                                        Ver Anuncio
                                                    </Link>
                                                    <button className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors">
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        {activeTab === 'marketplace' && <Package className="w-8 h-8 text-slate-300" />}
                                        {activeTab === 'servicios' && <Wrench className="w-8 h-8 text-slate-300" />}
                                        {activeTab === 'mensajes' && <MessageSquare className="w-8 h-8 text-slate-300" />}
                                        {activeTab === 'config' && <Settings className="w-8 h-8 text-slate-300" />}
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900 mb-2">Aún no hay anuncios {activeTab === 'marketplace' ? 'de productos' : 'de servicios'}</h3>
                                    <p className="text-slate-500 text-sm max-w-sm">
                                        Cuando publiques algo nuevo, aparecerá listado aquí para que puedas gestionarlo.
                                    </p>
                                    <button
                                        onClick={() => navigate('/crear-anuncio')}
                                        className="mt-6 flex items-center gap-2 text-teal-600 font-medium hover:underline"
                                    >
                                        <Plus className="w-4 h-4" /> Publicar ahora
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
