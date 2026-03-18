import React, { useState, useEffect } from 'react';
import { Package, Wrench, MessageSquare, Settings, LogOut, Plus, MapPin, Tag, Loader2, UploadCloud, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import API_CONFIG, { getPocketBaseFileUrl } from '../../config/api';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('marketplace');
    const [listings, setListings] = useState([]);
    const [loadingListings, setLoadingListings] = useState(false);

    const [profileData, setProfileData] = useState({
        displayName: '',
        phone: '',
        location: '',
        photoURL: ''
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    const { currentUser, logout, updateUserProfile } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const fetchAllData = async () => {
            setLoadingListings(true);
            try {
                // Fetch Listings
                const q = query(
                    collection(db, 'listings'),
                    where('sellerId', '==', currentUser.uid)
                );
                const querySnapshot = await getDocs(q);
                const fetchedListings = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setListings(fetchedListings);

                // Fetch Profile details from Firestore
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setProfileData({
                        displayName: userDoc.data().displayName || currentUser.displayName || '',
                        phone: userDoc.data().phone || '',
                        location: userDoc.data().location || '',
                        photoURL: userDoc.data().photoURL || currentUser.photoURL || ''
                    });
                } else {
                    setProfileData({
                        displayName: currentUser.displayName || '',
                        photoURL: currentUser.photoURL || '',
                        phone: '',
                        location: ''
                    });
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoadingListings(false);
            }
        };

        fetchAllData();
    }, [currentUser, navigate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const previewUrl = URL.createObjectURL(file);
            setFilePreview(previewUrl);
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
            throw new Error(errorData.message || 'Error al subir la imagen');
        }

        const data = await response.json();
        return getPocketBaseFileUrl(data);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            let finalPhotoURL = profileData.photoURL;

            if (selectedFile) {
                finalPhotoURL = await handleUploadToPocketBase(selectedFile);
            }

            await updateUserProfile({
                ...profileData,
                photoURL: finalPhotoURL
            });

            setProfileData(prev => ({ ...prev, photoURL: finalPhotoURL }));
            setSelectedFile(null);
            setFilePreview(null);

            alert("Perfil actualizado correctamente");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Error al actualizar perfil: " + error.message);
        } finally {
            setSavingProfile(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
            try {
                await deleteDoc(doc(db, 'listings', id));
                setListings(prev => prev.filter(item => item.id !== id));
            } catch (error) {
                console.error("Error al eliminar:", error);
                alert("Hubo un error al eliminar la publicación");
            }
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Error al cerrar sesión', error);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="flex-1 flex flex-col md:flex-row bg-slate-50 min-h-screen">
            {/* SIDEBAR */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 space-y-1">
                <div className="flex items-center gap-3 p-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-teal-500 overflow-hidden text-white flex items-center justify-center font-black text-xl shadow-lg shadow-teal-500/20">
                        {profileData.photoURL ? (
                            <img src={profileData.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                            (profileData.displayName || 'U').charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="overflow-hidden">
                        <h3 className="font-black text-slate-900 truncate text-sm uppercase tracking-tighter">
                            {profileData.displayName || 'Usuario'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{currentUser.email}</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    <button
                        onClick={() => setActiveTab('marketplace')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'marketplace' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Package className="w-4 h-4" /> Mis Productos
                    </button>
                    <button
                        onClick={() => setActiveTab('servicios')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'servicios' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Wrench className="w-4 h-4" /> Mis Servicios
                    </button>
                    <button
                        onClick={() => navigate('/mensajes')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all`}
                    >
                        <MessageSquare className="w-4 h-4" /> Centro de Mensajes
                    </button>

                    <div className="h-px bg-slate-100 my-4 mx-2" />

                    <button
                        onClick={() => setActiveTab('config')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Settings className="w-4 h-4" /> Configuración
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all mt-4"
                    >
                        <LogOut className="w-4 h-4" /> Salir
                    </button>
                </nav>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 p-6 sm:p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-baseline justify-between mb-10 pb-6 border-b border-slate-200 gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                                {activeTab === 'marketplace' && 'Mis Anuncios'}
                                {activeTab === 'servicios' && 'Mis Servicios'}
                                {activeTab === 'config' && 'Configuración de Cuenta'}
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {activeTab === 'config' ? 'Gestiona tu perfil público y datos de contacto.' : 'Gestiona tus publicaciones en el marketplace.'}
                            </p>
                        </div>

                        {(activeTab === 'marketplace' || activeTab === 'servicios') && (
                            <button
                                onClick={() => navigate('/crear-anuncio')}
                                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-500/20 active:scale-95"
                            >
                                <Plus className="w-4 h-4" /> Publicar Nuevo
                            </button>
                        )}
                    </div>

                    {activeTab === 'config' ? (
                        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 md:p-12 shadow-2xl shadow-slate-200/50">
                            <form onSubmit={handleUpdateProfile} className="space-y-8">
                                {/* FOTO DE PERFIL CON POCKETBASE */}
                                <div className="flex flex-col items-center gap-4 border-b border-slate-100 pb-8">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-4 border-white shadow-xl overflow-hidden">
                                            {filePreview ? (
                                                <img src={filePreview} alt="" className="w-full h-full object-cover" />
                                            ) : profileData.photoURL ? (
                                                <img src={profileData.photoURL} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-200 uppercase font-black text-4xl">
                                                    {(profileData.displayName || 'U').charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="absolute -bottom-2 -right-2 bg-teal-500 text-white p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                                            <UploadCloud className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pulsa para cambiar foto</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Público</label>
                                        <input
                                            type="text"
                                            value={profileData.displayName}
                                            onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none transition-all"
                                            placeholder="Tu nombre en el market"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Número de Teléfono</label>
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none transition-all"
                                            placeholder="+58 412 0000000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ubicación (Ciudad / Estado)</label>
                                        <input
                                            type="text"
                                            value={profileData.location}
                                            onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none transition-all"
                                            placeholder="Ej: Caracas, Dto Capital"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">URL de Foto (Opcional)</label>
                                        <input
                                            type="text"
                                            value={profileData.photoURL}
                                            onChange={(e) => setProfileData({ ...profileData, photoURL: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white focus:border-teal-500 outline-none transition-all"
                                            placeholder="https://enlace-a-tu-foto.jpg"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={savingProfile}
                                        className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-12 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {savingProfile ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Actualizando...
                                            </>
                                        ) : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {loadingListings ? (
                                <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-teal-500" /></div>
                            ) : (
                                listings.filter(item => {
                                    if (activeTab === 'marketplace') return item.type === 'product';
                                    if (activeTab === 'servicios') return item.type === 'service';
                                    return false;
                                }).length > 0 ? (
                                    <div className="grid grid-cols-1 gap-6">
                                        {listings
                                            .filter(item => {
                                                if (activeTab === 'marketplace') return item.type === 'product';
                                                if (activeTab === 'servicios') return item.type === 'service';
                                                return false;
                                            })
                                            .map(item => (
                                                <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center gap-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group">
                                                    <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                                                        {item.images?.[0] ? (
                                                            <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <Package className="w-10 h-10" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-black text-slate-900 truncate uppercase tracking-tighter text-lg">{item.title}</h4>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <span className="text-sm font-black text-teal-600 uppercase tracking-widest">
                                                                {item.currency} {item.price}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                <MapPin className="w-3 h-3" /> {item.location?.city || 'Varios'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 shrink-0">
                                                        <Link
                                                            to={`/producto/${item.id}`}
                                                            className="px-6 py-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center"
                                                        >
                                                            Ver
                                                        </Link>
                                                        <Link
                                                            to={`/editar-anuncio/${item.id}`}
                                                            className="px-6 py-2 bg-teal-50 hover:bg-teal-500 hover:text-white text-teal-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center border border-teal-100"
                                                        >
                                                            Editar
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="px-6 py-2 text-red-500 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Borrar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center flex flex-col items-center justify-center shadow-sm">
                                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8">
                                            {activeTab === 'marketplace' && <Package className="w-12 h-12 text-slate-200" />}
                                            {activeTab === 'servicios' && <Wrench className="w-12 h-12 text-slate-200" />}
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Aún no hay anuncios</h3>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-xs leading-loose">
                                            Publica algo nuevo para empezar a vender en el market.
                                        </p>
                                        <button
                                            onClick={() => navigate('/crear-anuncio')}
                                            className="mt-10 flex items-center gap-2 bg-teal-500 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-500/20 active:scale-95 transition-all"
                                        >
                                            <Plus className="w-4 h-4" /> Publicar ahora
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
