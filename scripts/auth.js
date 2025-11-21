// auth.js
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { collection, doc, setDoc, getDocs, limit, query, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// --- GESTION DE L'AUTHENTIFICATION ---

/**
 * Vérifie si un super admin existe et en crée un si nécessaire.
 */
export async function initSuperAdmin() {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        console.log("Aucun utilisateur trouvé. Création du Super Admin...");
        try {
            const initialUser = { email: 'super.admin@ibiocosmetics.com', password: 'password' };
            const userCredential = await createUserWithEmailAndPassword(auth, initialUser.email, initialUser.password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                name: 'Super Admin',
                role: 'Super_Admin',
                department: null,
                active: true,
                email: initialUser.email
            });
            console.log("Super Admin créé avec succès.");
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log("Le Super Admin existe déjà dans Auth, mais pas dans Firestore. C'est ok.");
            } else {
                console.error("Erreur lors de la création du Super Admin:", error);
            }
        }
    } else {
        console.log("Des utilisateurs existent déjà. Pas besoin de créer le Super Admin.");
    }
}

/**
 * Connecte un utilisateur avec email et mot de passe.
 */
export async function signIn(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Erreur de connexion:", error);
        throw error;
    }
}

/**
 * Déconnecte l'utilisateur actuel.
 */
export function signOutUser() {
    signOut(auth);
}

/**
 * Crée un nouvel utilisateur dans Firebase Auth et sa fiche dans Firestore.
 */
export async function signUp(email, password, name, role, department) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            role: role,
            department: department,
            active: true,
            email: email
        });

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la création de l'utilisateur:", error);
        return { success: false, message: error.message };
    }
}
