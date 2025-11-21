// scripts/firestore.js

// --- GESTION DES DONNÉES FIRESTORE ---

/**
 * Récupère tous les utilisateurs et déclenche un callback à chaque mise à jour.
 * @param {function} callback
 */
function onUsersUpdate(callback) {
    db.collection('users').onSnapshot(snapshot => {
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
function onTasksUpdate(department, callback) {
    db.collection('tasks')
      .where('department', '==', department)
      .onSnapshot(snapshot => {
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
function onRequestsUpdate(department, callback) {
    db.collection('requests')
      .where('department', '==', department)
      .onSnapshot(snapshot => {
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
async function addTask(taskData) {
    try {
        const docRef = await db.collection('tasks').add(taskData);
        return { success: true, taskId: docRef.id };
    } catch (error) {
        console.error("Erreur lors de l'ajout de la tâche:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Supprime une tâche de Firestore.
 * @param {string} taskId
 */
async function deleteTaskFromDb(taskId) {
    try {
        await db.collection('tasks').doc(taskId).delete();
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
async function updateTask(taskId, updateData) {
    try {
        await db.collection('tasks').doc(taskId).update(updateData);
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
async function addRequest(requestData) {
    try {
        await db.collection('requests').add(requestData);
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
async function updateRequest(requestId, updateData) {
    try {
        await db.collection('requests').doc(requestId).update(updateData);
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
async function updateUserStatus(uid, isActive) {
    try {
        await db.collection('users').doc(uid).update({ active: isActive });
        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
        return { success: false, message: error.message };
    }
}
