import React, { useState } from 'react';
import { Package, Plus, UploadCloud, MapPin, Phone, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import API_CONFIG, { getPocketBaseFileUrl } from '../../config/api';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const CreateListing = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [condition, setCondition] = useState('new');
    const [category, setCategory] = useState('');
    const [city, setCity] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [imageUrl, setImageUrl] = useState(''); // Opción 1: Link directo
    const [selectedFile, setSelectedFile] = useState(null); // Opción 2: Archivo local
    const [filePreview, setFilePreview] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setFilePreview(previewUrl);
            // Si sube un archivo, limpiamos el campo de link
            setImageUrl('');
        }
    };

    const handleUploadToPocketBase = async (file) => {
        const formData = new FormData();
        formData.append(API_CONFIG.FILE_FIELD_NAME, file);

        const response = await fetch(`${API_CONFIG.POCKETBASE_URL}/api/collections/${API_CONFIG.COLLECTION_NAME}/records`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al subir la imagen a PocketBase');
        }

        const data = await response.json();
        return getPocketBaseFileUrl(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            setError('Debes iniciar sesión para publicar');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let finalImageUrl = imageUrl;

            // Si hay un archivo seleccionado, subirlo primero
            if (selectedFile) {
                setUploading(true);
                try {
                    finalImageUrl = await handleUploadToPocketBase(selectedFile);
                } catch (uploadErr) {
                    console.error("Upload error:", uploadErr);
                    setLoading(false);
                    setUploading(false);
                    setError('Error al subir imagen al servidor personal (PocketBase). ¿Está encendido el servidor? ' + uploadErr.message);
                    return;
                }
                setUploading(false);
            }

            // Generar ID manual
            const customId = `${Date.now()}-${currentUser.uid.slice(0, 5)}`;
            const listingRef = doc(db, 'listings', customId);

            const docData = {
                sellerId: currentUser.uid,
                sellerName: currentUser.displayName || 'Vendedor',
                type: (category && (category.startsWith('servicios-digitales') || category.startsWith('servicios-fisicos'))) ? 'service' : 'product',
                title,
                description,
                price: Number(price),
                currency,
                condition: (category && (category.startsWith('servicios-digitales') || category.startsWith('servicios-fisicos'))) ? 'N/A' : condition,
                category,
                location: { city },
                contactMethod: { whatsapp: whatsapp.startsWith('+') ? whatsapp : `+58${whatsapp}` },
                images: finalImageUrl ? [finalImageUrl] : [],
                status: 'active',
                createdAt: serverTimestamp(),
            };

            await setDoc(listingRef, docData);
            navigate('/dashboard');
        } catch (err) {
            console.error("Firestore error:", err);
            setError('Error al publicar: ' + (err.code || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                        <Package className="w-8 h-8 text-teal-500" /> Nuevo Anuncio
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sube tus fotos y vende al instante.</p>
                </div>

                <div className="p-8">
                    {error && <div className="p-4 mb-8 bg-red-50 text-red-500 border border-red-100 rounded-2xl text-xs font-bold uppercase tracking-widest">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* SECCIÓN DE IMAGEN */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fotos del Producto / Servicio</label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Subir Archivo (PocketBase) */}
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`h-40 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${filePreview ? 'border-teal-500 bg-teal-50' : 'border-slate-100 bg-slate-50 group-hover:border-slate-300'}`}>
                                        {filePreview ? (
                                            <img src={filePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                                        ) : (
                                            <>
                                                <UploadCloud className="w-10 h-10 text-slate-300 mb-2 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subir desde PC/Móvil</span>
                                            </>
                                        )}
                                    </div>
                                    {filePreview && (
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                                            className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg z-20 hover:scale-110 transition-transform"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* O un enlace directo */}
                                <div className="space-y-3">
                                    <div className="h-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 flex flex-col justify-center">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">O pega un enlace directo:</label>
                                        <input
                                            type="url"
                                            value={imageUrl}
                                            onChange={e => { setImageUrl(e.target.value); setSelectedFile(null); setFilePreview(null); }}
                                            placeholder="https://imgur.com/foto.jpg"
                                            className="w-full bg-white border-2 border-transparent rounded-xl py-3 px-4 text-xs font-bold focus:border-teal-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100" />

                        {/* INFO DEL PRODUCTO */}
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título del Anuncio</label>
                                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} maxLength={100} placeholder="¿Qué estás vendiendo?" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none transition-all" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Precio</label>
                                    <div className="flex gap-2">
                                        <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-slate-900 text-white px-4 rounded-2xl text-xs font-black uppercase tracking-widest outline-none">
                                            <option value="USD">USD</option>
                                            <option value="VES">VES</option>
                                        </select>
                                        <input type="number" required value={price} onChange={e => setPrice(e.target.value)} min={0} placeholder="0.00" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none transition-all" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoría / Tipo</label>
                                    <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none transition-all">
                                        <option value="">Seleccionar...</option>
                                        <optgroup label="Productos">
                                            <option value="electronica">Electrónica</option>
                                            <option value="vehiculos">Vehículos</option>
                                            <option value="inmuebles">Inmuebles</option>
                                            <option value="hogar">Hogar</option>
                                            <option value="ropa">Ropa</option>
                                        </optgroup>
                                        <optgroup label="Servicios">
                                            <option value="servicios-digitales">Digital / Remoto</option>
                                            <option value="servicios-fisicos">Presencial / Físico</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            {(!category.startsWith('servicios-digitales') && !category.startsWith('servicios-fisicos')) && category !== '' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button type="button" onClick={() => setCondition('new')} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${condition === 'new' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Nuevo</button>
                                    <button type="button" onClick={() => setCondition('used')} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${condition === 'used' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Usado</button>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descripción detallada</label>
                                <textarea required value={description} onChange={e => setDescription(e.target.value)} rows="4" placeholder="Especificaciones, detalles, por qué lo vendes..." className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none resize-none transition-all"></textarea>
                            </div>
                        </div>

                        {/* UBICACIÓN Y WHATSAPP */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ciudad</label>
                                <input type="text" required value={city} onChange={e => setCity(e.target.value)} placeholder="Ej: Valencia" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp de contacto</label>
                                <input type="tel" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="Ej: 412 1234567" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none transition-all" />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end pt-8 gap-4 border-t border-slate-100">
                            <button type="button" onClick={() => navigate('/dashboard')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">Cancelar</button>
                            <button type="submit" disabled={loading || uploading} className="px-12 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {uploading ? 'Suviendo Imagen...' : 'Publicando...'}
                                    </>
                                ) : (
                                    'Publicar Anuncio'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateListing;
