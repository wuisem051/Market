# Estado del Proyecto: Market Venezuela 🇻🇪

Este documento sirve como memoria local para retomar el desarrollo en cualquier momento.

## 🛠️ Stack Tecnológico
- **Frontend:** React + Vite + Tailwind CSS v4.
- **Iconografía:** Lucide React.
- **Backend:** Firebase (Auth, Firestore, Storage).
- **Enrutamiento:** React Router DOM.

## ✅ Funcionalidades Implementadas

### 1. Autenticación (Firebase Auth)
- Provisión de `AuthContext` para manejo global de sesión.
- Pantalla de **Login / Registro** funcional con Email y Google.
- Redirección automática al Dashboard tras el éxito.

### 2. Marketplace de Productos (C2C)
- **Base de Datos:** Estructura en Firestore bajo la colección `listings`.
- **Publicación:** Formulario en `/crear-anuncio` que guarda título, precio, categoría, ciudad y WhatsApp.
- **Galería Global:** Vista en `/productos` que consume datos en tiempo real de Firestore.
- **Detalle de Producto:** Vista individual en `/producto/:id` con botón dinámico de contacto directo a WhatsApp.

### 3. Seguridad y DevOps
- **Reglas de Firestore:** Configurado para que todos lean, pero solo el dueño del anuncio pueda editar o borrar. Desplegado vía CLI.
- **Configuración Local:** Archivos `firebase.json`, `firestore.rules` y `storage.rules` listos para despliegue.

### 4. Imágenes (Alternativa Gratuita) ✅
- Implementado campo para **Link de Imagen** opcional en el formulario.
- Las imágenes externas se visualizan correctamente en Marketplace y Detalle de Producto.
- Esto permite publicar anuncios con fotos sin costo de almacenamiento.

### 5. Módulo de Servicios Dual ✅
- Implementado directorio `/servicios` con arquitectura dual (Digital vs Físico).
- Categorización automática y filtrado por tipo de servicio.

### 6. Sistema de Ads Nativo ✅
- Componente `AdBanner.jsx` premium para publicidad nativa.
- Espacios estratégicos integrados en Home y Marketplace.

### 7. Panel Admin ✅
- Estructura base en `/admin/dashboard` para visualización de estadísticas.

## 🚧 Próximos Pasos (Fase 2)

1.  **Imágenes (Firebase Storage / Cloudinary):** Integrar subida directa cuando el proyecto tenga presupuesto o buscar una API gratuita como Cloudinary.
2.  **Protección de Rutas Admin:** Implementar middleware/guards para el dashboard admin.
3.  **Chat Interno:** Integración de Firebase Realtime Database para contacto directo.
4.  **SEO Avanzado:** Meta Tags dinámicos.

## 📍 Notas de Interés
- Las reglas de Firestore permiten escritura a usuarios logueados.
- El color de acento principal es **Teal (#14b8a6)**.
- El marketplace ahora soporta tanto Productos como Servicios en la misma colección para optimizar lecturas.

