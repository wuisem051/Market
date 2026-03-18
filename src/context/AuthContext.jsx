import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Registrar con Email y Nombre
    const signup = async (email, password, displayName) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Actualizar nombre en Auth
        await updateProfile(user, { displayName });

        // Guardar perfil inicial en Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            role: 'user', // user default, luego puede cambiarse a pro
            isVerified: false,
            createdAt: new Date().toISOString()
        });

        return userCredential;
    };

    // Login con Email
    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Login/Registro Híbrido con Google
    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        // Verificamos si es primera vez consultando Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: 'user',
                isVerified: true, // Google accounts assumed basic verification
                createdAt: new Date().toISOString()
            });
        }

        return userCredential;
    };

    // Cerrar sesión
    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const updateUserProfile = async (data) => {
        if (!currentUser) return;

        // Update Firebase Auth Profile
        if (data.displayName || data.photoURL) {
            await updateProfile(auth.currentUser, {
                displayName: data.displayName,
                photoURL: data.photoURL
            });
        }

        // Update Firestore User Doc
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
            ...data,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        // Force Auth update in context
        setCurrentUser({ ...auth.currentUser });
    };

    const value = {
        currentUser,
        signup,
        login,
        loginWithGoogle,
        logout,
        updateUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
