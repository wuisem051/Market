import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, Package } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import AdBanner from '../components/AdBanner';

const Marketplace = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros simples
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const fetchedListings = [];
                querySnapshot.forEach((doc) => {
                    fetchedListings.push({ id: doc.id, ...doc.data() });
                });
                setListings(fetchedListings);
            } catch (error) {
                console.error('Error fetching listings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, []);

    const filteredListings = listings.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* HEADER DE LA SECCIÓN */}
            <div className="bg-white border-b border-slate-200 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900">Marketplace</h1>
                            <p className="text-slate-500 mt-1">Encuentra los mejores productos cerca de ti.</p>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative w-full md:w-80">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar productos..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                                <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                            </div>
                            <button className="p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                                <Filter className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* REJILLA DE PRODUCTOS */}
            <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {/* Espacio Publicitario Marketplace */}
                <div className="mb-8">
                    <AdBanner
                        title="Vende más rápido"
                        description="Destaca tu anuncio en las primeras posiciones y llega a más compradores potenciales hoy mismo."
                        image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200"
                        link="/dashboard"
                        type="horizontal"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64 text-slate-400">
                        Cargando productos...
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No se encontraron productos</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Sé el primero en publicar un anuncio en esta categoría.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredListings.map((item) => (
                            <Link to={`/producto/${item.id}`} key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col cursor-pointer">
                                <div className="aspect-square bg-slate-100 relative group-hover:brightness-95 transition-all overflow-hidden">
                                    {item.images && item.images.length > 0 ? (
                                        <img
                                            src={item.images[0]}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                            <Package className="w-10 h-10 text-slate-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-medium text-slate-900 line-clamp-2 text-sm">{item.title}</h3>
                                    <p className="text-lg font-bold text-teal-600 mt-2 mt-auto">
                                        {item.currency === 'USD' ? '$' : 'Bs '} {item.price}
                                    </p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="flex gap-1 items-center text-slate-500 text-xs">
                                            <MapPin className="w-3 h-3" /> {item.location?.city || 'Venezuela'}
                                        </span>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                            {item.condition === 'new' ? 'Nuevo' : 'Usado'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Marketplace;
