// scripts/app.js (extrait)

// ... autre code ...

async function deleteTask(taskId, googleCalendarEventId) {
    // Supprimer l'événement du calendrier Google s'il existe
    if (googleCalendarEventId) {
        await deleteCalendarEvent(googleCalendarEventId);
    }

    // Supprimer la tâche de Firestore
    await deleteTaskFromDb(taskId);
    // Le rendu se mettra à jour automatiquement grâce à onSnapshot
}
