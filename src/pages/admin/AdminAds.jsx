import React, { useState, useEffect } from 'react';
import {
    Megaphone, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
    Save, X, ImageIcon, Link2, MapPin, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const ZONES = [
    { id: 'home-top', label: '🏠 Home — Arriba del Hero (Banner Principal)' },
    { id: 'home-middle', label: '🏠 Home — Entre categorías y productos' },
    { id: 'home-services-top', label: '🏠 Home — Encima de Servicios' },
    { id: 'home-footer', label: '🏠 Home — Pre-Footer' },
    { id: 'sidebar', label: '📌 Sidebar — Columna derecha (primario)' },
    { id: 'sidebar-2', label: '📌 Sidebar — Columna derecha (secundario)' },
    { id: 'marketplace-top', label: '🛒 Marketplace — Arriba' },
    { id: 'marketplace-middle', label: '🛒 Marketplace — Medio' },
    { id: 'services-top', label: '🔧 Servicios — Arriba' },
];

const EMPTY_FORM = {
    zone: 'home-top',
    title: '',
    description: '',
    image: '',
    link: '',
    active: true,
};

const AdminAds = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchAds = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'ads'));
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => (a.zone || '').localeCompare(b.zone || ''));
            setAds(list);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAds(); }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setError('');
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openEdit = (ad) => {
        setEditingId(ad.id);
        setForm({
            zone: ad.zone || 'home-top',
            title: ad.title || '',
            description: ad.description || '',
            image: ad.image || '',
            link: ad.link || '',
            active: ad.active !== false,
        });
        setError('');
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSave = async () => {
        if (!form.title.trim()) { setError('El título es obligatorio.'); return; }
        if (!form.link.trim()) { setError('El enlace URL es obligatorio.'); return; }
        setSaving(true);
        setError('');
        try {
            const payload = {
                zone: form.zone,
                title: form.title.trim(),
                description: form.description.trim(),
                image: form.image.trim(),
                link: form.link.trim(),
                active: form.active,
                updatedAt: serverTimestamp(),
            };
            if (editingId) {
                await updateDoc(doc(db, 'ads', editingId), payload);
            } else {
                payload.createdAt = serverTimestamp();
                await addDoc(collection(db, 'ads'), payload);
            }
            setShowForm(false);
            fetchAds();
        } catch (err) {
            console.error(err);
            setError('Error al guardar. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (ad) => {
        try {
            await updateDoc(doc(db, 'ads', ad.id), { active: !ad.active });
            setAds(prev => prev.map(a => a.id === ad.id ? { ...a, active: !a.active } : a));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'ads', id));
            setAds(prev => prev.filter(a => a.id !== id));
            setDeleteConfirm(null);
        } catch (err) {
            console.error(err);
        }
    };

    const zoneLabel = (zoneId) => ZONES.find(z => z.id === zoneId)?.label || zoneId;

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">

                {/* HEADER */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Megaphone className="w-6 h-6 text-teal-600" />
                            Gestión de Banners / Anuncios
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Administra los banners publicitarios en cada zona del sitio.</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Banner
                    </button>
                </div>

                {/* FORM */}
                {showForm && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-md mb-8 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-teal-50 flex items-center justify-between">
                            <h2 className="font-bold text-slate-900 text-sm">
                                {editingId ? '✏️ Editar Banner' : '➕ Crear Nuevo Banner'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Zona */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                    <MapPin className="w-3 h-3 inline mr-1" />Zona de visualización
                                </label>
                                <select
                                    value={form.zone}
                                    onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    {ZONES.map(z => (
                                        <option key={z.id} value={z.id}>{z.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Título */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                    Título del banner *
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="ej. VENDE MÁS RÁPIDO"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            {/* URL del enlace */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                    <Link2 className="w-3 h-3 inline mr-1" />URL de destino *
                                </label>
                                <input
                                    type="url"
                                    value={form.link}
                                    onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                                    placeholder="https://ejemplo.com"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            {/* Descripción */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={2}
                                    placeholder="Texto descriptivo del banner (opcional)"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                                />
                            </div>

                            {/* URL imagen */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                    <ImageIcon className="w-3 h-3 inline mr-1" />URL de imagen (opcional)
                                </label>
                                <input
                                    type="url"
                                    value={form.image}
                                    onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                                    placeholder="https://imagen.com/banner.jpg"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500"
                                />
                                {form.image && (
                                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 h-32 bg-slate-100">
                                        <img src={form.image} alt="preview" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                                    </div>
                                )}
                            </div>

                            {/* Toggle Activo */}
                            <div className="md:col-span-2 flex items-center gap-3">
                                <button
                                    onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${form.active ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
                                >
                                    {form.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                    {form.active ? 'Activo (visible)' : 'Inactivo (oculto)'}
                                </button>
                                <span className="text-xs text-slate-400">Solo los banners activos se muestran en el sitio.</span>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="md:col-span-2 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                                </div>
                            )}
                        </div>

                        <div className="px-6 pb-6 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white rounded-xl text-sm font-bold transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Guardando...' : editingId ? 'Actualizar Banner' : 'Crear Banner'}
                            </button>
                        </div>
                    </div>
                )}

                {/* BANNERS LIST */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white border border-slate-200 rounded-2xl h-24 animate-pulse" />
                        ))}
                    </div>
                ) : ads.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
                        <Megaphone className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-semibold">No hay banners creados aún.</p>
                        <p className="text-slate-400 text-sm mt-1">Haz clic en "Nuevo Banner" para empezar.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {ads.map(ad => (
                            <div key={ad.id} className={`bg-white rounded-2xl border transition-all overflow-hidden ${ad.active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                                <div className="flex items-center gap-4 p-4">
                                    {/* Imagen preview */}
                                    <div className="w-20 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                                        {ad.image ? (
                                            <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-5 h-5 text-slate-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${ad.active ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
                                                {ad.active ? '● Activo' : '○ Inactivo'}
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-medium truncate">{zoneLabel(ad.zone)}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 truncate">{ad.title}</h3>
                                        <p className="text-xs text-slate-400 truncate">{ad.description || '—'}</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleToggleActive(ad)}
                                            title={ad.active ? 'Desactivar' : 'Activar'}
                                            className={`p-2 rounded-lg transition-colors ${ad.active ? 'text-teal-600 hover:bg-teal-50' : 'text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            {ad.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => openEdit(ad)}
                                            title="Editar"
                                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(ad.id)}
                                            title="Eliminar"
                                            className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Delete confirm inline */}
                                {deleteConfirm === ad.id && (
                                    <div className="border-t border-red-100 bg-red-50 px-5 py-3 flex items-center justify-between">
                                        <span className="text-sm text-red-700 font-medium">¿Eliminar este banner permanentemente?</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ad.id)}
                                                className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                            >
                                                Sí, eliminar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ZONES REFERENCE */}
                <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">📍 Zonas disponibles</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ZONES.map(z => (
                            <div key={z.id} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50">
                                <code className="text-xs bg-slate-100 text-teal-700 px-2 py-1 rounded font-mono">{z.id}</code>
                                <span className="text-slate-600">{z.label.replace(/^[^ ]+ /, '')}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminAds;
