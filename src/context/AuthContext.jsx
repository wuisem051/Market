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
import { doc, setDoc, getDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

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

        const oldName = currentUser.displayName;
        const oldPhoto = currentUser.photoURL;
        const newName = data.displayName || oldName;
        const newPhoto = data.photoURL || oldPhoto;

        // 1. Update Firebase Auth Profile
        await updateProfile(auth.currentUser, {
            displayName: newName,
            photoURL: newPhoto
        });

        // 2. Update Firestore User Doc
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
            ...data,
            displayName: newName,
            photoURL: newPhoto,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        // DENORMALIZATION: Update name/photo in listings and conversations
        if (newName !== oldName || newPhoto !== oldPhoto) {
            try {
                const batch = writeBatch(db);

                // 3. Update Listings (donde el usuario es el vendedor)
                const listingsQuery = query(collection(db, 'listings'), where('sellerId', '==', currentUser.uid));
                const listingsSnap = await getDocs(listingsQuery);
                listingsSnap.forEach(d => {
                    batch.update(d.ref, {
                        sellerName: newName,
                        sellerPhoto: newPhoto
                    });
                });

                // 4. Update Conversations (donde el usuario es participante)
                const convsQuery = query(collection(db, 'conversations'), where('participants', 'array-contains', currentUser.uid));
                const convsSnap = await getDocs(convsQuery);
                convsSnap.forEach(d => {
                    batch.update(d.ref, {
                        [`participantNames.${currentUser.uid}`]: newName
                    });
                });

                await batch.commit();
                console.log("Datos denormalizados actualizados con éxito");
            } catch (err) {
                console.error("Error actualizando datos denormalizados:", err);
            }
        }

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
