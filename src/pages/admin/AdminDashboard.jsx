import React, { useState, useEffect } from 'react';
import {
    Users, Package, Briefcase, TrendingUp,
    AlertCircle, CheckCircle, Clock, Search,
    MoreVertical, LayoutDashboard, Megaphone, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        users: 0,
        products: 0,
        services: 0,
        activeAds: 0
    });
    const [recentActions, setRecentActions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const listingsSnap = await getDocs(collection(db, 'listings'));
                const listings = listingsSnap.docs.map(doc => doc.data());

                // Count active ads
                const adsSnap = await getDocs(collection(db, 'ads'));
                const activeAds = adsSnap.docs.filter(d => d.data().active !== false).length;

                setStats({
                    users: 42,
                    products: listings.filter(l => l.type === 'product').length,
                    services: listings.filter(l => l.type === 'service').length,
                    activeAds,
                });

                setRecentActions([
                    { id: 1, type: 'new_user', user: 'Maria G.', time: 'hace 5 min', status: 'success' },
                    { id: 2, type: 'new_listing', user: 'Juan P.', time: 'hace 12 min', status: 'pending' },
                    { id: 3, type: 'report', user: 'Anon', time: 'hace 1 hora', status: 'alert' },
                ]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-teal-600">
                <TrendingUp className="w-3 h-3" /> +12% <span className="text-slate-400 font-normal ml-1">vs mes pasado</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-teal-600" /> Panel de Administración
                    </h1>
                    <p className="text-slate-500">Gestión global de MarketVenezuela</p>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Usuarios Totales" value={stats.users} icon={Users} color="bg-blue-500" />
                    <StatCard title="Productos Activos" value={stats.products} icon={Package} color="bg-teal-500" />
                    <StatCard title="Servicios Profesionales" value={stats.services} icon={Briefcase} color="bg-purple-500" />
                    <StatCard title="Banners Activos" value={stats.activeAds} icon={Megaphone} color="bg-amber-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="font-bold text-slate-900">Actividad Reciente</h2>
                            <button className="text-xs font-bold text-teal-600 hover:text-teal-700">Ver Historial</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {recentActions.map((action) => (
                                <div key={action.id} className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                    <div className={`p-2 rounded-full ${action.status === 'success' ? 'bg-teal-50 text-teal-600' : action.status === 'pending' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                        {action.status === 'success' ? <CheckCircle className="w-4 h-4" /> : action.status === 'pending' ? <Clock className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900">
                                            {action.type === 'new_user' ? `Nuevo usuario: ${action.user}` : action.type === 'new_listing' ? `Nuevo anuncio por ${action.user}` : `Reporte por ${action.user}`}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">{action.time}</p>
                                    </div>
                                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Tools */}
                    <div className="space-y-4">
                        {/* Search tool */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                                <Search className="w-4 h-4 text-teal-600" /> Soporte Rápido
                            </h2>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Buscar por UID o Email..."
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                />
                                <button className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                                    Localizar Usuario
                                </button>
                            </div>
                        </div>

                        {/* System monitor */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="font-bold mb-2 text-slate-900 text-sm">Monitor del Sistema</h2>
                            <p className="text-slate-500 text-xs mb-4">Firestore y Storage operando con normalidad.</p>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-teal-500 w-[98%] h-full rounded-full"></div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-right">Uptime: 99.9%</p>
                        </div>

                        {/* Banners quick access */}
                        <Link
                            to="/admin/ads"
                            className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-500 p-5 rounded-2xl shadow-sm text-white group hover:from-teal-700 hover:to-teal-600 transition-all"
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Megaphone className="w-5 h-5" />
                                    <span className="font-bold text-sm">Gestionar Banners</span>
                                </div>
                                <p className="text-teal-100 text-xs">Crea y edita banners en todo el sitio.</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-teal-200 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
