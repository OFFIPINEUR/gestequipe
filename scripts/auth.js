// scripts/auth.js

// --- GESTION DE L'AUTHENTIFICATION ---

/**
 * Gère l'état de connexion de l'utilisateur.
 * C'est le point d'entrée principal pour le rendu de l'application.
 */
/**
 * Vérifie si un super admin existe et en crée un si nécessaire.
 * Doit être appelé une seule fois au démarrage de l'application.
 */
async function initSuperAdmin() {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.limit(1).get();
    if (snapshot.empty) {
        console.log("Aucun utilisateur trouvé. Création du Super Admin...");
        try {
            // Utiliser une fonction "secrète" ou un mécanisme sécurisé dans un vrai projet
            const initialUser = { email: 'super.admin@ibiocosmetics.com', password: 'password' };
            const userCredential = await auth.createUserWithEmailAndPassword(initialUser.email, initialUser.password);
            const user = userCredential.user;
            await usersRef.doc(user.uid).set({
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

// Initialiser le Super Admin au chargement du script, puis l'application
(async () => {
    await initSuperAdmin();
    document.body.dataset.appReady = true; // Signal pour les tests E2E

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userProfile = await db.collection('users').doc(user.uid).get();
            if (userProfile.exists) {
                const userData = { uid: user.uid, email: user.email, ...userProfile.data() };
                if (userData.active) {
                    renderApp(userData);
                } else {
                    renderApp(null);
                    showMessage('login-error', 'Ce compte a été désactivé.');
                }
            } else {
                renderApp(null);
            }
        } else {
            renderApp(null);
        }
    });
})();

/**
 * Connecte un utilisateur avec email et mot de passe.
 * @param {string} email
 * @param {string} password
 */
async function signIn(email, password) {
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        console.error("Erreur de connexion:", error);
        showMessage('login-error', 'Email ou mot de passe incorrect.');
    }
}

/**
 * Déconnecte l'utilisateur actuel.
 */
function signOutUser() {
    auth.signOut();
}

/**
 * Crée un nouvel utilisateur dans Firebase Auth et sa fiche dans Firestore.
 * @param {string} email
 * @param {string} password
 * @param {string} name
 * @param {string} role
 * @param {string} department
 */
async function signUp(email, password, name, role, department) {
    try {
        // Étape 1: Créer l'utilisateur dans Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Étape 2: Créer un document utilisateur dans Firestore
        await db.collection('users').doc(user.uid).set({
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
