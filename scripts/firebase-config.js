// scripts/firebase-config.js

// Configuration du projet Firebase fournie par l'utilisateur.
const firebaseConfig = {
  apiKey: "AIzaSyDTdIoh4bg-Z-F03qAPpyqHbQxGEJwEhPg",
  authDomain: "workflowapp-81fc2.firebaseapp.com",
  projectId: "workflowapp-81fc2",
  storageBucket: "workflowapp-81fc2.firebasestorage.app",
  messagingSenderId: "689663027362",
  appId: "1:689663027362:web:861273e7614c312b18cffb",
  measurementId: "G-9BLV5HDVM8"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);

// Exporter les services pour les utiliser dans d'autres fichiers
const auth = firebase.auth();
const db = firebase.firestore();
