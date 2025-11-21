// scripts/firestore.js
import { db } from './firebase-config.js';
import {
    collection,
    onSnapshot,
    query,
    where,
    addDoc,
    doc,
    deleteDoc,
    updateDoc,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// --- GESTION DES DONNÉES FIRESTORE ---

/**
 * Récupère tous les utilisateurs et déclenche un callback à chaque mise à jour.
 * @param {function} callback
 */
export function onUsersUpdate(callback) {
    onSnapshot(collection(db, 'users'), snapshot => {
        const users = {};
        snapshot.forEach(doc => {
            users[doc.id] = { uid: doc.id, ...doc.data() };
        });
        callback(users);
    });
}

/**
 * Récupère les tâches d'un département et déclenche un callback à chaque mise à jour.
 * @param {string} department
 * @param {function} callback
 */
export function onTasksUpdate(department, callback) {
    const q = query(collection(db, 'tasks'), where('department', '==', department));
    onSnapshot(q, snapshot => {
        const tasks = [];
        snapshot.forEach(doc => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
        callback(tasks);
    });
}

/**
 * Récupère les demandes d'un département et déclenche un callback à chaque mise à jour.
 * @param {string} department
 * @param {function} callback
 */
export function onRequestsUpdate(department, callback) {
    const q = query(collection(db, 'requests'), where('department', '==', department));
    onSnapshot(q, snapshot => {
        const requests = [];
        snapshot.forEach(doc => {
            requests.push({ id: doc.id, ...doc.data() });
        });
        callback(requests);
    });
}

/**
 * Ajoute une nouvelle tâche dans Firestore.
 * @param {object} taskData
 */
export async function addTask(taskData) {
    try {
        const docRef = await addDoc(collection(db, 'tasks'), taskData);
        return { success: true, taskId: docRef.id };
    } catch (error) {
        console.error("Erreur lors de l'ajout de la tâche:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Écoute les mises à jour des messages pour un chat donné.
 * @param {string} chatId
 * @param {function} callback
 */
export function onMessagesUpdate(chatId, callback) {
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
    onSnapshot(q, snapshot => {
        const messages = [];
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        callback(messages);
    });
}

/**
 * Envoie un message de chat.
 * @param {string} senderId
 * @param {string} receiverId
 * @param {string} text
 */
export async function sendMessage(senderId, receiverId, text) {
    try {
        const chatId = [senderId, receiverId].sort().join('_');
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            senderId,
            receiverId,
            text,
            timestamp: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Supprime une tâche de Firestore.
 * @param {string} taskId
 */
export async function deleteTaskFromDb(taskId) {
    try {
        await deleteDoc(doc(db, 'tasks', taskId));
        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la suppression de la tâche:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Met à jour une tâche existante dans Firestore.
 * @param {string} taskId
 * @param {object} updateData
 */
export async function updateTask(taskId, updateData) {
    try {
        await updateDoc(doc(db, 'tasks', taskId), updateData);
        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la tâche:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Ajoute une nouvelle demande dans Firestore.
 * @param {object} requestData
 */
export async function addRequest(requestData) {
    try {
        await addDoc(collection(db, 'requests'), requestData);
        return { success: true };
    } catch (error) {
        console.error("Erreur lors de l'ajout de la demande:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Met à jour une demande existante dans Firestore.
 * @param {string} requestId
 * @param {object} updateData
 */
export async function updateRequest(requestId, updateData) {
    try {
        await updateDoc(doc(db, 'requests', requestId), updateData);
        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la demande:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Met à jour le statut d'un utilisateur.
 * @param {string} uid
 * @param {boolean} isActive
 */
export async function updateUserStatus(uid, isActive) {
    try {
        await updateDoc(doc(db, 'users', uid), { active: isActive });
        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
        return { success: false, message: error.message };
    }
}
