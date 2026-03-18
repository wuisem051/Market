import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Package, MapPin, Phone, ArrowLeft, ShieldCheck, Clock, Mail, MessageCircle, AlertCircle } from 'lucide-react';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
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
                <p className="text-slate-500 font-medium tracking-tight">Cargando detalles...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
                <Package className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Producto no encontrado</h2>
                <p className="text-slate-500 mb-6">El anuncio que buscas no existe o fue eliminado.</p>
                <button onClick={() => navigate('/productos')} className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-bold shadow-lg shadow-teal-500/20">
                    Volver al Marketplace
                </button>
            </div>
        );
    }

    // Gestionar chat interno
    const handleStartChat = () => {
        if (!currentUser) {
            // No registrado
            alert("Debes iniciar sesión para iniciar una conversación con el vendedor.");
            navigate('/login');
            return;
        }

        if (currentUser.uid === product.sellerId) {
            alert("No puedes iniciar un chat contigo mismo.");
            return;
        }

        // Navegar a la página de mensajes con el ID del producto y el vendedor
        navigate(`/mensajes/${id}/${product.sellerId}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Botón de retroceso */}
                <button
                    onClick={() => navigate('/productos')}
                    className="flex items-center gap-2 text-slate-500 hover:text-teal-600 mb-6 transition-colors font-bold text-xs uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver al listado
                </button>

                <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
                    <div className="w-full lg:w-[60%] bg-slate-50 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100">
                        {/* IMAGEN PRINCIPAL */}
                        <div className="flex-1 aspect-video lg:aspect-auto relative flex items-center justify-center p-8">
                            {product.images && product.images.length > 0 ? (
                                <img
                                    src={product.images[activeImage]}
                                    alt={product.title}
                                    className="w-full h-full object-contain rounded-2xl drop-shadow-2xl"
                                />
                            ) : (
                                <Package className="w-24 h-24 text-slate-200" />
                            )}

                            {product.images?.length > 1 && (
                                <div className="absolute bottom-6 right-6 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                    {activeImage + 1} / {product.images.length}
                                </div>
                            )}
                        </div>

                        {/* MINIATURAS */}
                        {product.images?.length > 1 && (
                            <div className="p-6 bg-white flex gap-4 overflow-x-auto border-t border-slate-50 custom-scrollbar">
                                {product.images.map((url, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveImage(index)}
                                        className={`w-24 h-24 rounded-2xl overflow-hidden border-4 transition-all flex-shrink-0 ${activeImage === index ? 'border-teal-500 shadow-xl scale-95' : 'border-transparent hover:border-slate-200 opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={url} alt={`Thumb ${index}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* DETALLES DEL PRODUCTO */}
                    <div className="w-full lg:w-[40%] p-8 md:p-12 flex flex-col bg-white">
                        <div className="mb-6 flex items-center gap-2">
                            <span className="text-[10px] uppercase font-black text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg tracking-[0.1em]">
                                {product.category}
                            </span>
                            <span className="text-[10px] uppercase font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg tracking-[0.1em]">
                                {product.condition === 'new' ? 'Nuevo' : 'Usado'}
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 leading-[1.1] tracking-tight">
                            {product.title}
                        </h1>

                        <div className="flex items-baseline gap-2 mb-8">
                            <span className="text-xl font-bold text-teal-500">{product.currency === 'USD' ? '$' : 'Bs'}</span>
                            <span className="text-5xl font-black text-teal-600 tracking-tighter">{product.price}</span>
                        </div>

                        <div className="space-y-6 mb-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-teal-500/30">
                                    {product.sellerName?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Vendedor</p>
                                    <p className="text-sm font-bold text-slate-900">{product.sellerName || 'Usuario Oficial'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 border-t border-slate-200/50 pt-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-500">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Ubicación</p>
                                    <p className="text-sm font-bold text-slate-800">{product.location?.city || 'Venezuela'}</p>
                                </div>
                            </div>
                        </div>

                        {/* DESCRIPCIÓN */}
                        <div className="mb-10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Descripción del Producto</h3>
                            <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                {product.description}
                            </p>
                        </div>

                        {/* ACCIONES DE CONTACTO INTERNO */}
                        <div className="mt-auto space-y-4">
                            {!currentUser ? (
                                <div className="bg-amber-50 border border-amber-100 p-6 rounded-[1.5rem] flex items-start gap-4">
                                    <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-900 mb-3">Acceso restringido</p>
                                        <button
                                            onClick={() => navigate('/login')}
                                            className="w-full bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-amber-500/20"
                                        >
                                            Inicia Sesión para Contactar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleStartChat}
                                    className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-teal-600 text-white px-8 py-5 rounded-2xl font-black uppercase text-sm tracking-[0.1em] transition-all shadow-xl shadow-slate-900/20 hover:shadow-teal-600/30 group"
                                >
                                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    Enviar Mensaje al Vendedor
                                </button>
                            )}

                            <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-400 mt-6 bg-slate-50/50 py-4 px-6 rounded-2xl border border-slate-100">
                                <ShieldCheck className="w-5 h-5 text-teal-500" />
                                <span className="uppercase tracking-widest leading-relaxed">Chat protegido por MarketVE. No compartas datos sensibles fuera de la plataforma.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
