import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Dashboard from './pages/user/Dashboard';
import CreateListing from './pages/user/CreateListing';
import EditListing from './pages/user/EditListing';
import Messages from './pages/user/Messages';
import { AuthProvider } from './context/AuthContext';

import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import Services from './pages/Services';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAds from './pages/admin/AdminAds';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/productos" element={<Marketplace />} />
              <Route path="/servicios" element={<Services />} />
              <Route path="/producto/:id" element={<ProductDetail />} />
              <Route path="/mensajes" element={<Messages />} />
              <Route path="/mensajes/:productId/:sellerId" element={<Messages />} />
              <Route path="/crear-anuncio" element={<CreateListing />} />
              <Route path="/editar-anuncio/:id" element={<EditListing />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/ads" element={<AdminAds />} />
              {/* Opcional: Ruta para cuando la página no existe */}
              <Route path="*" element={<div className="p-8 text-center text-slate-500">Página no encontrada</div>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
