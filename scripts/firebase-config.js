// scripts/firebase-config.js

// IMPORTANT: Remplacez cet objet par la configuration de VOTRE projet Firebase
// Allez sur la console Firebase > Paramètres du projet > Général > Vos applications
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);

// Exporter les services pour les utiliser dans d'autres fichiers
const auth = firebase.auth();
const db = firebase.firestore();
