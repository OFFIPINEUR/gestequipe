// scripts/google-calendar.js

// TODO: Remplacer par les informations de votre console Google Cloud
const GOOGLE_API_KEY = 'VOTRE_CLE_API_GOOGLE';
const GOOGLE_CLIENT_ID = 'VOTRE_CLIENT_ID_GOOGLE.apps.googleusercontent.com';

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

let tokenClient;
let gapiInited = false;
let gisInited = false;

const googleSignInBtn = document.getElementById('google-signin-btn');

/**
 * Callback après le chargement de api.js.
 */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

/**
 * Callback après le chargement du client API. Charge le document de découverte.
 */
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    checkAuthStatus();
}

/**
 * Callback après le chargement de Google Identity Services.
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
    });
    gisInited = true;
    checkAuthStatus();
}

/**
 * Vérifie si l'utilisateur est déjà authentifié et met à jour l'interface.
 */
function checkAuthStatus() {
    if (gapiInited && gisInited) {
        googleSignInBtn.classList.remove('hidden');
    }
}

/**
 * Gère le clic sur le bouton de connexion/autorisation Google.
 */
googleSignInBtn.addEventListener('click', () => {
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
});

/**
 * Gère la réponse du serveur d'authentification.
 * @param {object} resp La réponse contenant le jeton d'accès.
 */
async function handleTokenResponse(resp) {
    if (resp.error !== undefined) {
        throw (resp);
    }
    console.log("Authentification Google réussie !");
    googleSignInBtn.innerText = 'Calendrier Lié';
    googleSignInBtn.disabled = true;

    // TODO: Stocker le jeton d'accès de manière sécurisée (côté serveur ou dans Firestore)
    // Pour l'instant, nous le gardons en mémoire.
}

/**
 * Crée un événement dans le calendrier principal de l'utilisateur.
 * @param {object} task La tâche WorkFlow à synchroniser.
 * @returns {Promise<object>} L'événement créé.
 */
async function createCalendarEvent(task) {
    const event = {
        'summary': task.title,
        'description': `Tâche WorkFlow : ${task.description}\n\nLien vers la tâche : [URL de l'app]`, // TODO: Remplacer par un vrai lien
        'start': {
            'date': task.deadline,
        },
        'end': {
            'date': task.deadline,
        },
        'id': 'wf' + task.id // Utiliser un préfixe pour garantir l'unicité et la conformité
    };

    const request = gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': event
    });

    return new Promise((resolve, reject) => {
        request.execute(event => {
            console.log('Événement créé : ' + event.htmlLink);
            resolve(event);
        });
    });
}

/**
 * Met à jour un événement existant dans le calendrier.
 * @param {string} eventId L'ID de l'événement Google Calendar.
 * @param {object} task La tâche WorkFlow mise à jour.
 */
async function updateCalendarEvent(eventId, task) {
    const event = {
        'summary': task.title,
        'description': `Tâche WorkFlow : ${task.description}\n\nLien vers la tâche : [URL de l'app]`,
        'start': {
            'date': task.deadline,
        },
        'end': {
            'date': task.deadline,
        }
    };

    const request = gapi.client.calendar.events.update({
        'calendarId': 'primary',
        'eventId': eventId,
        'resource': event
    });

    request.execute(event => {
        console.log('Événement mis à jour : ' + event.htmlLink);
    });
}

/**
 * Supprime un événement du calendrier.
 * @param {string} eventId L'ID de l'événement Google Calendar.
 */
async function deleteCalendarEvent(eventId) {
    const request = gapi.client.calendar.events.delete({
        'calendarId': 'primary',
        'eventId': eventId
    });

    request.execute(() => {
        console.log('Événement supprimé.');
    });
}
