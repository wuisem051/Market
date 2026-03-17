import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup, loginWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();

    // Si el usuario ya está autenticado (o la sesión continuó por onAuthStateChanged), redirigir
    React.useEffect(() => {
        if (currentUser) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password, name);
            }
            navigate('/dashboard'); // Redirigir si fue exitoso
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Este correo ya está registrado');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError('Correo o contraseña incorrectos');
            } else {
                setError('Ocurrió un error: ' + err.message);
            }
        }
        setLoading(false);
    };

    const handleGoogleAuth = async () => {
        setError('');
        setLoading(true);
        try {
            await loginWithGoogle();
            navigate('/dashboard');
        } catch (err) {
            setError('Problema al conectar con Google.');
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded bg-teal-500 flex items-center justify-center mb-4">
                        <Package className="text-white w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900">
                        {isLogin ? 'Inicia sesión' : 'Crea tu cuenta'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {isLogin ? 'Accede para gestionar tus anuncios' : 'Únete a MarketVenezuela hoy'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label htmlFor="name" className="sr-only">Nombre Completo</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="appearance-none rounded relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                    placeholder="Nombre Completo"
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email-address" className="sr-only">Correo electrónico</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                placeholder="Correo electrónico"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Contraseña</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                placeholder="Contraseña"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors shadow-sm disabled:opacity-70"
                        >
                            {loading ? 'Cargando...' : (isLogin ? 'Ingresar' : 'Registrarse')}
                        </button>
                    </div>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500">O continuar con</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={handleGoogleAuth}
                                disabled={loading}
                                className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-70"
                            >
                                <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                                Google
                            </button>
                        </div>
                    </div>
                </form>
                <div className="text-center mt-4 text-sm">
                    <p className="text-slate-600">
                        {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-1 text-teal-600 hover:text-teal-500 font-medium font-semibold"
                        >
                            {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
