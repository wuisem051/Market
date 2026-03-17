import React, { useState } from 'react';
import { Package, Plus, UploadCloud, MapPin, Phone, X, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const CreateListing = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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
    const [imageUrl, setImageUrl] = useState(''); // Nueva opción: Link de imagen (gratis)

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Iniciando publicación...");

        if (!currentUser) {
            console.error("No hay usuario autenticado");
            setError('Debes iniciar sesión para publicar');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log("Intentando guardar en Firestore con UID:", currentUser.uid);

            // Generar ID manual para evitar el hang de addDoc en algunos entornos locales
            const customId = `${Date.now()}-${currentUser.uid.slice(0, 5)}`;
            const listingRef = doc(db, 'listings', customId);

            const docData = {
                sellerId: currentUser.uid,
                sellerName: currentUser.displayName || 'Vendedor',
                type: category.startsWith('servicios') ? 'service' : 'product',
                title,
                description,
                price: Number(price),
                currency,
                condition: category.startsWith('servicios') ? 'N/A' : condition,
                category,
                location: { city },
                contactMethod: { whatsapp },
                images: imageUrl ? [imageUrl] : [],
                status: 'active',
                createdAt: serverTimestamp(),
            };

            console.log("Datos a enviar:", docData);

            await setDoc(listingRef, docData);
            console.log("¡Publicado con éxito! ID:", customId);

            // Volver al dash
            navigate('/dashboard');
        } catch (err) {
            console.error("Error detallado de Firestore:", err);
            setError('Error al publicar: ' + (err.code || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-teal-600" /> Nuevo Producto
                    </h1>
                    <p className="text-slate-500 mt-1">Completa los detalles para publicar en el Marketplace</p>
                </div>

                <div className="p-6">
                    {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Imagen vía URL (Opción Gratis) */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> Link de Imagen (Opcional)
                            </label>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <input
                                        type="url"
                                        value={imageUrl}
                                        onChange={e => setImageUrl(e.target.value)}
                                        placeholder="Pega el link de una imagen (Google Photos, Imgur, etc.)"
                                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Usa un link directo de imagen para mostrarla en el marketplace sin costo.</p>
                                </div>
                                {imageUrl && (
                                    <div className="w-20 h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0">
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error+Link'; }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <hr className="border-slate-200" />

                        {/* Info Básica */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Título del Anuncio</label>
                                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} maxLength={100} placeholder="Ej: Laptop HP Pavilion 15" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-shadow" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Precio</label>
                                    <div className="flex">
                                        <select value={currency} onChange={e => setCurrency(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-300 border-r-0 rounded-l-lg focus:ring-teal-500 outline-none">
                                            <option value="USD">USD ($)</option>
                                            <option value="VES">VES (Bs)</option>
                                        </select>
                                        <input type="number" required value={price} onChange={e => setPrice(e.target.value)} min={0} placeholder="0.00" className="w-full px-4 py-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                                    <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none">
                                        <option value="">Seleccionar...</option>
                                        <optgroup label="Productos Físicos">
                                            <option value="electronica">Electrónica y Computación</option>
                                            <option value="vehiculos">Vehículos</option>
                                            <option value="inmuebles">Inmuebles</option>
                                            <option value="hogar">Hogar y Muebles</option>
                                            <option value="ropa">Ropa y Accesorios</option>
                                        </optgroup>
                                        <optgroup label="Directorio de Servicios">
                                            <option value="servicios-digitales">Servicios Digitales (Remoto)</option>
                                            <option value="servicios-fisicos">Servicios Físicos (Presencial)</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            {/* Mostrar condición solo si no es un servicio */}
                            {!category.startsWith('servicios') && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Estado del Producto</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-lg flex-1 hover:bg-slate-50 transition-colors">
                                            <input type="radio" value="new" checked={condition === 'new'} onChange={e => setCondition(e.target.value)} className="text-teal-600 focus:ring-teal-500" />
                                            <span className="text-sm font-medium">Nuevo</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-lg flex-1 hover:bg-slate-50 transition-colors">
                                            <input type="radio" value="used" checked={condition === 'used'} onChange={e => setCondition(e.target.value)} className="text-teal-600 focus:ring-teal-500" />
                                            <span className="text-sm font-medium">Usado</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción detallada</label>
                                <textarea required value={description} onChange={e => setDescription(e.target.value)} rows="5" placeholder="Describe tu producto, accesorios incluidos, detalles..." className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none"></textarea>
                            </div>
                        </div>

                        <hr className="border-slate-200" />

                        {/* Contacto y Ubicación */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><MapPin className="w-4 h-4" /> Ciudad</label>
                                <input type="text" required value={city} onChange={e => setCity(e.target.value)} placeholder="Ej: Valencia" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Phone className="w-4 h-4" /> Número de WhatsApp</label>
                                <input type="tel" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="Ej: +584121234567" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 space-x-4 border-t border-slate-200">
                            <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-2 text-slate-600 hover:text-slate-900 font-medium">Cancelar</button>
                            <button type="submit" disabled={loading} className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg shadow-sm shadow-teal-500/20 disabled:opacity-50 flex items-center gap-2 transition-colors">
                                {loading ? 'Publicando...' : <><Plus className="w-4 h-4" /> Publicar Anuncio</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateListing;
