import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Package, MapPin, Phone, ArrowLeft, ShieldCheck, Clock } from 'lucide-react';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, 'listings', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching document:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center">
                <p className="text-slate-500 font-medium">Cargando detalles...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
                <Package className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Producto no encontrado</h2>
                <p className="text-slate-500 mb-6">El anuncio que buscas no existe o fue eliminado.</p>
                <button onClick={() => navigate('/productos')} className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                    Volver al Marketplace
                </button>
            </div>
        );
    }

    // Formatear número para WhatsApp
    const handleWhatsAppClick = () => {
        const defaultMessage = `Hola, estoy interesado en tu anuncio "${product.title}" publicado en MarketVenezuela.`;
        const whatsappUrl = `https://wa.me/${product.contactMethod.whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(defaultMessage)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Botón de retroceso */}
                <button
                    onClick={() => navigate('/productos')}
                    className="flex items-center gap-2 text-slate-500 hover:text-teal-600 mb-6 transition-colors font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver al listado
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row">
                    <div className="w-full lg:w-1/2 bg-slate-100 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200">
                        {/* IMAGEN PRINCIPAL */}
                        <div className="flex-1 aspect-square relative flex items-center justify-center p-4">
                            {product.images && product.images.length > 0 ? (
                                <img
                                    src={product.images[activeImage]}
                                    alt={product.title}
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            ) : (
                                <Package className="w-24 h-24 text-slate-300" />
                            )}

                            {product.images?.length > 1 && (
                                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                                    {activeImage + 1} / {product.images.length}
                                </div>
                            )}
                        </div>

                        {/* MINIATURAS (Solo si hay más de una foto) */}
                        {product.images?.length > 1 && (
                            <div className="p-4 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto pb-6 -mb-2">
                                {product.images.map((url, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveImage(index)}
                                        className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === index ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-transparent hover:border-slate-300'}`}
                                    >
                                        <img src={url} alt={`Thumb ${index}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* DETALLES DEL PRODUCTO */}
                    <div className="w-full lg:w-1/2 p-6 md:p-8 lg:p-10 flex flex-col">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-xs uppercase font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full tracking-wide">
                                {product.category}
                            </span>
                            <span className="text-xs uppercase font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full tracking-wide">
                                {product.condition === 'new' ? 'Nuevo' : 'Usado'}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 leading-tight">
                            {product.title}
                        </h1>

                        <div className="text-3xl sm:text-4xl font-extrabold text-teal-600 mb-6">
                            <span className="text-2xl text-teal-500 mr-1">{product.currency === 'USD' ? '$' : 'Bs'}</span>
                            {product.price}
                        </div>

                        <hr className="border-slate-100 mb-6" />

                        <div className="space-y-4 mb-8 flex-1">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                    <span className="text-slate-600 font-bold">{product.sellerName?.charAt(0) || 'U'}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Vendido por {product.sellerName || 'Usuario de MarketVenezuela'}</p>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> Publicado recientemente</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                Ubicación: <span className="font-medium text-slate-800">{product.location?.city || 'Venezuela'}</span>
                            </div>
                        </div>

                        {/* DESCRIPCIÓN */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Descripción</h3>
                            <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        {/* ACCIONES DE CONTACTO */}
                        <div className="mt-auto space-y-3">
                            <button
                                onClick={handleWhatsAppClick}
                                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3.5 rounded-xl font-medium transition-colors shadow-sm focus:ring-4 focus:ring-[#25D366]/20"
                            >
                                <Phone className="w-5 h-5" />
                                Contactar por WhatsApp
                            </button>

                            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4 bg-slate-50 py-3 rounded-lg border border-slate-100">
                                <ShieldCheck className="w-4 h-4 text-teal-500" />
                                <span>Transacción directa entre comprador y vendedor. Protege siempre tu privacidad y acuerdos económicos en WhatsApp.</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
