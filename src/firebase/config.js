// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAFHoqwSkhozV8D4X7zTC2cvZiMeRXMDf0",
    authDomain: "market-caeed.firebaseapp.com",
    projectId: "market-caeed",
    storageBucket: "market-caeed.firebasestorage.app",
    messagingSenderId: "104310859705",
    appId: "1:104310859705:web:89b37522a32b29b9e6f868",
    measurementId: "G-2J9979DVCJ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Servicios
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
