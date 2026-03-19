import React, { useState, useEffect } from 'react';
import { ExternalLink, Info, Megaphone } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';

/**
 * AdBanner — Muestra un banner publicitario.
 *
 * Prioridad de datos:
 * 1. Si existe `zone`, busca en Firestore el banner activo para esa zona.
 * 2. Si no hay en Firestore, usa las props (title, description, image, link).
 * 3. Si tampoco hay props, muestra el banner de fallback (placeholder visual).
 *
 * Props:
 * - zone: string — identificador de la zona (ej: "home-top")
 * - type: "horizontal" | "vertical"
 * - title, description, image, link — contenido manual (fallback de props)
 * - showFallback: boolean — si true (default), muestra placeholder cuando no hay datos
 */
const AdBanner = ({
    title: propTitle,
    description: propDescription,
    image: propImage,
    link: propLink,
    type = 'horizontal',
    zone,
    showFallback = true,
}) => {
    const [adData, setAdData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    useEffect(() => {
        if (!zone) { setFetched(true); return; }

        const fetchAd = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'ads'),
                    where('zone', '==', zone),
                    where('active', '==', true),
                    limit(1)
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    setAdData(snapshot.docs[0].data());
                }
            } catch (err) {
                console.error('Error fetching ad for zone:', zone, err);
            } finally {
                setLoading(false);
                setFetched(true);
            }
        };

        fetchAd();
    }, [zone]);

    // 1. Datos de Firestore
    const data = adData
        ? {
            title: adData.title,
            description: adData.description || 'Contenido patrocinado verificado.',
            image: adData.image,
            link: adData.link,
        }
        : {
            // 2. Props manuales
            title: propTitle,
            description: propDescription,
            image: propImage,
            link: propLink || '#',
        };

    // Loading skeleton
    if (loading || !fetched) {
        return (
            <div className="animate-pulse bg-slate-200 rounded-2xl w-full"
                style={{ minHeight: type === 'horizontal' ? '120px' : '200px' }} />
        );
    }

    // Si no hay datos y no mostramos fallback, no renderizar nada
    if (!data.title && !showFallback) return null;

    // FALLBACK: placeholder visual para zonas sin banner configurado
    if (!data.title) {
        return (
            <div
                className={`relative group overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all
                    ${type === 'horizontal' ? 'flex flex-col md:flex-row min-h-[120px] items-center' : 'flex flex-col min-h-[180px] items-center justify-center'}`}
            >
                <div className={`flex items-center justify-center ${type === 'horizontal' ? 'w-full md:w-1/3 h-28 md:h-full bg-slate-100' : 'w-full h-28 bg-slate-100'}`}>
                    <Megaphone className="w-10 h-10 text-slate-300" />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-center">
                    <div className="inline-flex items-center gap-1.5 bg-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded self-start mb-2">
                        <Info className="w-3 h-3" /> Espacio publicitario
                    </div>
                    <h4 className="text-base font-bold text-slate-400 mb-1 uppercase tracking-tight">
                        Tu anuncio aquí
                    </h4>
                    <p className="text-sm text-slate-400 line-clamp-2">
                        {zone ? `Zona: ${zone} — Configura este banner desde el panel admin.` : 'Espacio disponible para publicidad.'}
                    </p>
                </div>
            </div>
        );
    }

    // BANNER REAL (con datos)
    return (
        <div
            className={`relative group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg
                ${type === 'horizontal' ? 'flex flex-col md:flex-row min-h-[120px]' : 'flex flex-col'}`}
        >
            {/* Etiqueta Patrocinado */}
            <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1">
                <Info className="w-3 h-3 text-teal-400" /> Patrocinado
            </div>

            {/* Imagen */}
            <div className={`${type === 'horizontal' ? 'w-full md:w-1/3' : 'w-full aspect-[16/9]'} overflow-hidden bg-slate-100`}>
                <img
                    src={data.image || 'https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&q=80&w=800'}
                    alt={data.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </div>

            {/* Contenido */}
            <div className={`p-5 flex-1 flex flex-col justify-center ${type === 'horizontal' ? 'md:pl-8' : ''}`}>
                <h4 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-teal-600 transition-colors uppercase tracking-tight line-clamp-1">
                    {data.title}
                </h4>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                    {data.description}
                </p>
                <a
                    href={data.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
                >
                    MÁS INFORMACIÓN <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            {/* Glow hover */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-teal-500/10 rounded-2xl pointer-events-none transition-colors" />
        </div>
    );
};

export default AdBanner;
