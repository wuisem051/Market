import React from 'react';
import {
    Search, MapPin, Package, Wrench,
    Smartphone, MonitorPlay, Briefcase, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdBanner from '../components/AdBanner';

const Home = () => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* HERO BANNER - ADS #1 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full">
                <AdBanner
                    title="¡Llega a toda Venezuela!"
                    description="Promociona tus productos o servicios en la plataforma de mayor crecimiento en el país. Planes desde $5/mes."
                    image="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200"
                    link="/crear-anuncio"
                    type="horizontal"
                />
            </div>

            {/* HERO SECTION */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        Compra, vende y contrata <br className="hidden md:block" />
                        <span className="text-teal-600">servicios cerca de ti.</span>
                    </h1>
                    <p className="mt-4 text-lg text-slate-500">
                        Miles de productos verificados y profesionales a un clic de distancia en Venezuela.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <div className="md:hidden relative w-full mb-4">
                            <input
                                type="text"
                                placeholder="¿Qué estás buscando?"
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 text-sm outline-none"
                            />
                            <Search className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                        </div>

                        <Link to="/productos" className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm">
                            <Package className="w-5 h-5 text-teal-500" />
                            Ver Marketplace
                        </Link>
                        <Link to="/servicios" className="flex items-center justify-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-600 transition-colors shadow-sm shadow-teal-500/20">
                            <Wrench className="w-5 h-5" />
                            Explorar Servicios
                        </Link>
                    </div>
                </div>
            </section>

            {/* CATEGORÍAS RÁPIDAS */}
            <section className="bg-white border-y border-slate-200 py-6 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                        {[
                            { icon: Smartphone, label: 'Electrónica' },
                            { icon: MonitorPlay, label: 'Digital' },
                            { icon: Wrench, label: 'Hogar' },
                            { icon: Briefcase, label: 'Negocios' },
                            { icon: Package, label: 'Envíos' },
                        ].map((cat, i) => (
                            <button key={i} className="flex flex-col items-center gap-2 min-w-[100px] p-3 rounded-xl hover:bg-teal-50 text-slate-600 hover:text-teal-600 transition-colors border border-transparent hover:border-teal-100 cursor-pointer group">
                                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center transition-colors">
                                    <cat.icon className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium">{cat.label}</span>
                            </button>
                        ))}
                        <button className="flex flex-col items-center gap-2 min-w-[100px] p-3 rounded-xl hover:bg-slate-50 text-slate-600">
                            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium">Ver todas</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* PRODUCTOS RECIENTES */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Productos Recientes</h2>
                        <p className="text-slate-500 mt-1">Últimas publicaciones</p>
                    </div>
                    <Link to="/productos" className="hidden sm:flex text-teal-600 font-medium hover:text-teal-700 items-center gap-1">
                        Ver todo <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((item) => (
                        <Link to={`/producto/${item}`} key={item} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col cursor-pointer">
                            <div className="aspect-square bg-slate-100 relative group-hover:brightness-95 transition-all">
                                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                    <Package className="w-10 h-10 text-slate-400" />
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-medium text-slate-900 line-clamp-2 text-sm">Laptop HP Pavilion 15 Core i5 8GB RAM 256GB SSD</h3>
                                <p className="text-lg font-bold text-teal-600 mt-2 mt-auto">$350</p>
                                <div className="flex gap-1 items-center mt-2 text-slate-500 text-xs">
                                    <MapPin className="w-3 h-3" /> Valencia, VE
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* SERVICIOS + SIDEBAR ADS */}
            <section className="bg-slate-100/50 py-16 border-t border-slate-200 flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Servicios Destacados</h2>
                                    <p className="text-slate-500 mt-1">Profesionales online y presenciales</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { name: 'Carlos Mendoza', job: 'Servicio Técnico de PC y Laptops', rate: '4.9', price: '$15', type: 'Presencial', loc: '0.8km' },
                                    { name: 'Ana Torres', job: 'Diseño Gráfico & Branding Base', rate: '5.0', price: '$40', type: 'Digital', loc: 'Online' },
                                    { name: 'José Pérez', job: 'Instalación de Aires Acondicionados', rate: '4.7', price: '$20', type: 'Presencial', loc: '3.2km' },
                                ].map((srv, i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4 items-center hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer">
                                        <div className="w-16 h-16 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                                            <span className="text-lg text-slate-500 font-bold">{srv.name.charAt(0)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    {srv.type}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {srv.loc}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-slate-900 truncate">{srv.job}</h3>
                                            <p className="text-sm text-slate-500 truncate">{srv.name}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="flex items-center justify-end gap-1 text-sm font-medium text-amber-500 mb-1">
                                                ⭐ {srv.rate}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Desde <span className="font-bold text-slate-900">{srv.price}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
                            {/* SIDEBAR ADS */}
                            <AdBanner
                                title="Anuncia Aquí"
                                description="Potencia tu negocio con nosotros. Banners dinámicos en toda la red."
                                image="https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=800"
                                link="/contacto"
                                type="vertical"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-white border-t border-slate-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <span className="text-2xl font-bold text-slate-900 tracking-tight">Market<span className="text-teal-600">Venezuela</span></span>
                        <p className="mt-2 text-slate-500 text-sm">Desarrollado con ❤️ para Venezuela.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
