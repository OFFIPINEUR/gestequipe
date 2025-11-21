// scripts/storage.js

/**
 * Téléverse un fichier dans Firebase Storage.
 * @param {File} file Le fichier à téléverser.
 * @param {string} path Le chemin de stockage (ex: 'task-attachments/filename.jpg').
 * @returns {Promise<string>} L'URL de téléchargement du fichier.
 */
async function uploadFile(file, path) {
    try {
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(path);
        await fileRef.put(file);
        const downloadURL = await fileRef.getDownloadURL();
        return downloadURL;
    } catch (error) {
        console.error("Erreur lors du téléversement du fichier:", error);
        throw error;
    }
}
