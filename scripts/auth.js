import { supabase } from './supabase-config.js';

async function initSuperAdmin() {
    const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

    if (error) {
        console.error("Erreur lors de la vérification des utilisateurs:", error);
        return;
    }

    if (!users || users.length === 0) {
        console.log("Aucun utilisateur trouvé. Création du Super Admin...");
        try {
            const initialUser = {
                email: 'super.admin@ibiocosmetics.com',
                password: 'password'
            };

            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: initialUser.email,
                password: initialUser.password,
                options: {
                    data: {
                        name: 'Super Admin',
                        role: 'Super_Admin'
                    }
                }
            });

            if (signUpError) {
                if (signUpError.message.includes('already registered')) {
                    console.log("Le Super Admin existe déjà dans Auth.");
                } else {
                    console.error("Erreur lors de la création du Super Admin:", signUpError);
                }
                return;
            }

            if (authData.user) {
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([{
                        id: authData.user.id,
                        name: 'Super Admin',
                        email: initialUser.email,
                        role: 'Super_Admin',
                        department: null,
                        active: true
                    }]);

                if (insertError) {
                    console.error("Erreur lors de l'insertion du Super Admin dans users:", insertError);
                } else {
                    console.log("Super Admin créé avec succès.");
                }
            }
        } catch (error) {
            console.error("Erreur lors de la création du Super Admin:", error);
        }
    } else {
        console.log("Des utilisateurs existent déjà.");
    }
}

(async () => {
    await initSuperAdmin();
    document.body.dataset.appReady = true;

    supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            const { data: userProfile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (error) {
                console.error("Erreur lors de la récupération du profil:", error);
                renderApp(null);
                return;
            }

            if (userProfile) {
                const userData = {
                    uid: session.user.id,
                    email: session.user.email,
                    ...userProfile
                };

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

async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error("Erreur de connexion:", error);
            showMessage('login-error', 'Email ou mot de passe incorrect.');
        }
    } catch (error) {
        console.error("Erreur de connexion:", error);
        showMessage('login-error', 'Email ou mot de passe incorrect.');
    }
}

function signOutUser() {
    supabase.auth.signOut();
}

async function signUp(email, password, name, role, department) {
    try {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role
                }
            }
        });

        if (signUpError) {
            console.error("Erreur lors de la création de l'utilisateur:", signUpError);
            return { success: false, message: signUpError.message };
        }

        if (authData.user) {
            const { error: insertError } = await supabase
                .from('users')
                .insert([{
                    id: authData.user.id,
                    name,
                    email,
                    role,
                    department,
                    active: true
                }]);

            if (insertError) {
                console.error("Erreur lors de l'insertion dans users:", insertError);
                return { success: false, message: insertError.message };
            }

            return { success: true };
        }

        return { success: false, message: "Erreur lors de la création de l'utilisateur" };
    } catch (error) {
        console.error("Erreur lors de la création de l'utilisateur:", error);
        return { success: false, message: error.message };
    }
}

window.signIn = signIn;
window.signOutUser = signOutUser;
window.signUp = signUp;
