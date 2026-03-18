import React, { useState, useEffect } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';

const AdBanner = ({ title: propTitle, description: propDescription, image: propImage, link: propLink, type = 'horizontal', zone }) => {
    const [adData, setAdData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!zone) return;

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
                console.error("Error fetching ad for zone:", zone, err);
            } finally {
                setLoading(false);
            }
        };

        fetchAd();
    }, [zone]);

    // Usar datos de Firestore si existe el zone, de lo contrario usar props
    const data = adData ? {
        title: adData.title,
        description: adData.description || 'Contenido patrocinado verificado.',
        image: adData.image,
        link: adData.link,
        width: adData.width,
        height: adData.height
    } : {
        title: propTitle,
        description: propDescription,
        image: propImage,
        link: propLink
    };

    if (!data.title && !loading) return null;
    if (loading) return <div className="animate-pulse bg-slate-200 rounded-2xl h-32 w-full"></div>;

    return (
        <div
            className={`relative group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg ${type === 'horizontal' ? 'flex flex-col md:flex-row min-h-[120px]' : 'flex flex-col'}`}
            style={adData ? { maxWidth: `${data.width}px` } : {}}
        >
            {/* Etiqueta de "Anuncio" */}
            <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1">
                <Info className="w-3 h-3 text-teal-400" /> Patrocinado
            </div>

            {/* Imagen del Ad */}
            <div className={`${type === 'horizontal' ? 'w-full md:w-1/3' : 'w-full aspect-[16/9]'} overflow-hidden bg-slate-100`}>
                <img
                    src={data.image || 'https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&q=80&w=800'}
                    alt={data.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </div>

            {/* Contenido del Ad */}
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

            {/* Glow Effect on Hover */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-teal-500/10 rounded-2xl pointer-events-none transition-colors"></div>
        </div>
    );
};

export default AdBanner;
