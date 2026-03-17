import React from 'react';
import { Search, Menu, Package, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { currentUser, logout } = useAuth();

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-teal-500 flex items-center justify-center">
                            <Package className="text-white w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">Market<span className="text-teal-600">Venezuela</span></span>
                    </Link>

                    <div className="hidden md:flex flex-1 max-w-xl px-8">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Busca productos, servicios, profesionales..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-teal-500 text-sm transition-all outline-none"
                            />
                            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <nav className="flex gap-4">
                            <Link to="/productos" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Productos</Link>
                            <Link to="/servicios" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Servicios</Link>
                        </nav>
                        <div className="h-6 w-px bg-slate-200"></div>

                        {!currentUser ? (
                            <>
                                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Ingresar</Link>
                                <Link to="/login" className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm shadow-teal-500/20">
                                    Publicar Gratis
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                                    <User className="w-4 h-4" /> Panel
                                </Link>
                                <Link to="/dashboard" className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm shadow-teal-500/20">
                                    Publicar Nuevo
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="md:hidden flex items-center">
                        <button className="p-2 text-slate-600">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
