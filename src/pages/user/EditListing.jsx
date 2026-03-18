import React, { useState, useEffect } from 'react';
import { Package, Save, UploadCloud, MapPin, Phone, X, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import API_CONFIG, { getPocketBaseFileUrl } from '../../config/api';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const EditListing = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
    const [images, setImages] = useState([]); // Array de URLs existentes
    const [imageUrl, setImageUrl] = useState(''); // Nuevo Link
    const [selectedFile, setSelectedFile] = useState(null); // Nuevo Archivo
    const [filePreview, setFilePreview] = useState(null);

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const docRef = doc(db, 'listings', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();

                    // Seguridad: Solo el dueño puede editar
                    if (data.sellerId !== currentUser?.uid) {
                        navigate('/dashboard');
                        return;
                    }

                    setTitle(data.title || '');
                    setDescription(data.description || '');
                    setPrice(data.price || '');
                    setCurrency(data.currency || 'USD');
                    setCondition(data.condition || 'new');
                    setCategory(data.category || '');
                    setCity(data.location?.city || '');
                    setWhatsapp(data.contactMethod?.whatsapp || '');
                    setImages(data.images || []);
                } else {
                    setError('El anuncio no existe');
                }
            } catch (err) {
                console.error("Error fetching listing:", err);
                setError('Error al cargar datos');
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) fetchListing();
    }, [id, currentUser, navigate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const previewUrl = URL.createObjectURL(file);
            setFilePreview(previewUrl);
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

        if (!response.ok) throw new Error('Error al subir imagen');
        const data = await response.json();
        return getPocketBaseFileUrl(data);
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            let updatedImages = [...images];

            // 1. Subir nueva foto si hay link
            if (imageUrl) {
                updatedImages.push(imageUrl);
            }

            // 2. Subir nueva foto si hay archivo
            if (selectedFile) {
                setUploading(true);
                const pocketBaseUrl = await handleUploadToPocketBase(selectedFile);
                updatedImages.push(pocketBaseUrl);
                setUploading(false);
            }

            const docRef = doc(db, 'listings', id);
            await updateDoc(docRef, {
                title,
                description,
                price: Number(price),
                currency,
                condition,
                category,
                location: { city },
                contactMethod: { whatsapp },
                images: updatedImages,
                updatedAt: serverTimestamp()
            });

            navigate('/dashboard');
        } catch (err) {
            console.error("Update error:", err);
            setError('Error al actualizar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center p-20">
            <Loader2 className="w-12 h-12 animate-spin text-teal-500" />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
            <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-900 text-xs font-black uppercase tracking-widest transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver al Panel
            </button>

            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                        <Package className="w-8 h-8 text-teal-500" /> Editar Anuncio
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Actualiza los detalles de tu publicación.</p>
                </div>

                <div className="p-8">
                    {error && <div className="p-4 mb-8 bg-red-50 text-red-500 border border-red-100 rounded-2xl text-xs font-bold uppercase tracking-widest">{error}</div>}

                    <form onSubmit={handleUpdate} className="space-y-8">
                        {/* GESTIÓN DE FOTOS */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fotos Actuales</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* Botón para agregar más */}
                                <div className="relative aspect-square border-4 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:border-teal-500 transition-all group overflow-hidden">
                                    {filePreview ? (
                                        <img src={filePreview} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <UploadCloud className="w-6 h-6 text-slate-300 group-hover:scale-110 transition-transform" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">Más Fotos</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>

                        {/* INFO DEL PRODUCTO */}
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título del Anuncio</label>
                                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} maxLength={100} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none transition-all" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Precio</label>
                                    <div className="flex gap-2">
                                        <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-slate-900 text-white px-4 rounded-2xl text-xs font-black uppercase tracking-widest outline-none">
                                            <option value="USD">USD</option>
                                            <option value="VES">VES</option>
                                        </select>
                                        <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none transition-all" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ubicación</label>
                                    <input type="text" required value={city} onChange={e => setCity(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none transition-all" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descripción detallada</label>
                                <textarea required value={description} onChange={e => setDescription(e.target.value)} rows="5" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none resize-none transition-all"></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end pt-8 gap-4 border-t border-slate-100">
                            <button type="button" onClick={() => navigate('/dashboard')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">Descartar</button>
                            <button type="submit" disabled={saving || uploading} className="px-12 py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-teal-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {uploading ? 'Suviendo Imagen...' : 'Guardando...'}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditListing;
