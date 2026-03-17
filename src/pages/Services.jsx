import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, Briefcase, Globe, Navigation, ChevronRight } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('digital'); // 'digital' o 'physical'
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            try {
                // Por ahora usamos la misma colección 'listings' o una nueva 'services'
                // Si usamos 'listings', necesitamos un campo 'type' (product vs service)
                // Para este MVP, asumiremos que los servicios están marcados como categoria 'servicios-digitales' o 'servicios-fisicos'
                const q = query(
                    collection(db, 'listings'),
                    where('category', '==', activeTab === 'digital' ? 'servicios-digitales' : 'servicios-fisicos'),
                    orderBy('createdAt', 'desc')
                );

                const querySnapshot = await getDocs(q);
                const fetchedServices = [];
                querySnapshot.forEach((doc) => {
                    fetchedServices.push({ id: doc.id, ...doc.data() });
                });
                setServices(fetchedServices);
            } catch (error) {
                console.error('Error fetching services:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, [activeTab]);

    const filteredServices = services.filter(service =>
        service.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Cabecera Dinámica */}
            <div className="bg-white border-b border-slate-200 pt-8 pb-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                                <Briefcase className="w-8 h-8 text-teal-600" /> Directorio de Servicios
                            </h1>
                            <p className="text-slate-500 mt-1">Encuentra profesionales calificados en toda Venezuela.</p>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative w-full md:w-80">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar servicios..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                                <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Selector de Tabs Moderno */}
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('digital')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'digital' ? 'border-teal-500 text-teal-600 bg-teal-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Globe className="w-4 h-4" /> Servicios Digitales
                        </button>
                        <button
                            onClick={() => setActiveTab('physical')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'physical' ? 'border-teal-500 text-teal-600 bg-teal-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Navigation className="w-4 h-4" /> Servicios Físicos (Presencial)
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenido de Servicios */}
            <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-slate-400">
                        Cargando servicios...
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <Briefcase className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No hay {activeTab === 'digital' ? 'servicios digitales' : 'profesionales'} registrados</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-6">
                            ¿Ofreces algún servicio? Sé el primero en publicarte en esta sección.
                        </p>
                        <Link to="/crear-anuncio" className="inline-flex items-center gap-2 bg-teal-500 text-white px-6 py-2.5 rounded-full font-bold hover:bg-teal-600 transition-colors">
                            Publicar mi Servicio
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredServices.map((service) => (
                            <Link to={`/producto/${service.id}`} key={service.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col p-5">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 group-hover:border-teal-200 transition-colors">
                                        {service.images && service.images.length > 0 ? (
                                            <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-teal-50">
                                                <Briefcase className="w-8 h-8 text-teal-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors leading-tight mb-1">{service.title}</h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            {activeTab === 'physical' ? (
                                                <><MapPin className="w-3 h-3" /> {service.location?.city || 'Venezuela'}</>
                                            ) : (
                                                <><Globe className="w-3 h-3" /> Remoto / Online</>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 line-clamp-2 mb-6 flex-1">
                                    {service.description}
                                </p>

                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
                                    <span className="text-teal-600">
                                        {service.currency === 'USD' ? '$' : 'Bs '} {service.price}
                                        <span className="text-[10px] text-slate-400 ml-1 font-normal"> / base</span>
                                    </span>
                                    <div className="flex items-center gap-1 text-teal-600 group-hover:gap-2 transition-all">
                                        Ver más <ChevronRight className="w-4 h-4" />
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

export default Services;
