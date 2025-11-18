// scripts/app.js

const ROLES = {
    ADMIN: 'Admin',
    MEMBER: 'Membre_Equipe'
};

// --- SIMULATION DE BASE DE DONNÉES ---
// Les données sont stockées dans localStorage pour persister entre les sessions.

const INITIAL_USERS = {
    'admin@compagnie.com': { id: 'u1', name: 'Admin Boss', role: ROLES.ADMIN, password: 'password' },
    'membre@compagnie.com': { id: 'u2', name: 'Jean Membre', role: ROLES.MEMBER, password: 'password' },
};

let TASKS = JSON.parse(localStorage.getItem('tasks')) || [
    { id: 't1', title: 'Vérification du stock', description: 'Compter tous les produits A en entrepôt.', status: 'En_cours', assignedToId: 'u2', deadline: '2025-12-20', creatorId: 'u1', comments: [] },
    { id: 't2', title: 'Réunion de planning', description: 'Préparer l\'agenda de la réunion Q4.', status: 'A_faire', assignedToId: 'u1', deadline: '2025-11-25', creatorId: 'u1', comments: [] },
];

let REQUESTS = JSON.parse(localStorage.getItem('requests')) || [
    { id: 'r1', title: 'Demande de congés', type: 'Conges', details: 'Du 25 au 30 Décembre.', status: 'En_attente', submitterId: 'u2' }
];

// ------------------------------------

// Éléments du DOM
const views = {
    login: document.getElementById('login-view'),
    admin: document.getElementById('admin-view'),
    member: document.getElementById('member-view')
};
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const adminTasksList = document.getElementById('admin-tasks-list');
const memberTasksList = document.getElementById('member-tasks-list');
const memberRequestsList = document.getElementById('member-requests-list');
const taskCreationForm = document.getElementById('task-creation-form');
const taskAssignedToSelect = document.getElementById('task-assigned-to');
const requestForm = document.getElementById('request-form');


// --- FONCTIONS UTILITAIRES ---

function saveState() {
    localStorage.setItem('tasks', JSON.stringify(TASKS));
    localStorage.setItem('requests', JSON.stringify(REQUESTS));
}

function getCurrentUser() {
    const email = localStorage.getItem('currentUserEmail');
    return INITIAL_USERS[email] || null;
}

function hideAllViews() {
    Object.values(views).forEach(view => view.classList.add('hidden'));
}

function renderTask(task, currentUserRole) {
    const assignedUser = Object.values(INITIAL_USERS).find(u => u.id === task.assignedToId);
    
    const taskEl = document.createElement('div');
    taskEl.className = `task-card statut-${task.status}`;
    taskEl.innerHTML = `
        <h4>${task.title} (ID: ${task.id})</h4>
        <p><strong>Statut:</strong> ${task.status.replace('_', ' ')}</p>
        <p><strong>Assigné à:</strong> ${assignedUser ? assignedUser.name : 'N/A'}</p>
        <p><strong>Date Limite:</strong> ${task.deadline}</p>
        <p>${task.description.substring(0, 50)}...</p>
    `;

    if (currentUserRole === ROLES.MEMBER && task.assignedToId === getCurrentUser().id && task.status !== 'Termine') {
        const completeBtn = document.createElement('button');
        completeBtn.textContent = 'Marquer Terminé';
        completeBtn.onclick = () => updateTaskStatus(task.id, 'Termine');
        taskEl.appendChild(completeBtn);
    }
    
    // Ajout d'une zone de commentaires simple pour l'exemple
    taskEl.innerHTML += `
        <div class="chat-section">
            <input type="text" id="comment-${task.id}" placeholder="Ajouter un commentaire...">
            <button onclick="addComment('${task.id}')">Chat</button>
        </div>
        <div class="comments-list">${task.comments.map(c => `<p><strong>${c.user}:</strong> ${c.text}</p>`).join('')}</div>
    `;

    return taskEl;
}

function updateTaskStatus(taskId, newStatus) {
    const task = TASKS.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        saveState();
        renderApp(getCurrentUser());
        alert(`Tâche ${taskId} marquée comme ${newStatus.replace('_', ' ')}.`);
    }
}

function addComment(taskId) {
    const input = document.getElementById(`comment-${taskId}`);
    const text = input.value.trim();
    if (text) {
        const task = TASKS.find(t => t.id === taskId);
        if (task) {
            task.comments.push({ user: getCurrentUser().name, text: text, timestamp: new Date().toISOString() });
            input.value = ''; // Vider le champ
            saveState();
            renderApp(getCurrentUser());
        }
    }
}

// --- RENDU PRINCIPAL ---

function renderApp(user) {
    hideAllViews();
    document.getElementById('user-role').textContent = user ? `Rôle: ${user.role}` : '';
    document.getElementById('user-info').style.display = user ? 'flex' : 'none';

    if (!user) {
        views.login.classList.remove('hidden');
        return;
    }

    if (user.role === ROLES.ADMIN) {
        views.admin.classList.remove('hidden');
        renderAdminTasks();
    } else {
        views.member.classList.remove('hidden');
        renderMemberTasks();
        renderMemberRequests();
    }
}

function renderAdminTasks() {
    adminTasksList.innerHTML = '';
    
    // Remplir le select d'assignation
    taskAssignedToSelect.innerHTML = '<option value="">Assigner à...</option>';
    Object.values(INITIAL_USERS).forEach(u => {
        const option = document.createElement('option');
        option.value = u.id;
        option.textContent = u.name;
        taskAssignedToSelect.appendChild(option);
    });
    
    // Afficher toutes les tâches pour l'admin
    TASKS.forEach(task => {
        adminTasksList.appendChild(renderTask(task, ROLES.ADMIN));
    });
}

function renderMemberTasks() {
    memberTasksList.innerHTML = '';
    const myTasks = TASKS.filter(t => t.assignedToId === getCurrentUser().id);
    myTasks.forEach(task => {
        memberTasksList.appendChild(renderTask(task, ROLES.MEMBER));
    });
}

function renderMemberRequests() {
    memberRequestsList.innerHTML = '';
    const myRequests = REQUESTS.filter(r => r.submitterId === getCurrentUser().id);
    myRequests.forEach(req => {
        const reqEl = document.createElement('div');
        reqEl.className = `request-card statut-${req.status.toLowerCase()}`;
        reqEl.innerHTML = `
            <h4>${req.title} (${req.type})</h4>
            <p><strong>Statut:</strong> ${req.status}</p>
            <p>${req.details.substring(0, 50)}...</p>
        `;
        memberRequestsList.appendChild(reqEl);
    });
}


// --- GESTION DES ÉVÉNEMENTS ---

// 1. Connexion
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const user = INITIAL_USERS[email];
    
    // Vérification simplifiée
    if (user && user.password === password) {
        localStorage.setItem('currentUserEmail', email);
        renderApp(user);
    } else {
        alert('Email ou mot de passe incorrect.');
    }
});

// 2. Déconnexion
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUserEmail');
    renderApp(null);
});

// 3. Création de tâche (Admin)
document.getElementById('show-task-form').addEventListener('click', () => {
    taskCreationForm.classList.toggle('hidden');
});

document.getElementById('submit-new-task').addEventListener('click', () => {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const assignedToId = taskAssignedToSelect.value;
    const deadline = document.getElementById('task-deadline').value;
    
    if (title && assignedToId && deadline) {
        const newTask = {
            id: 't' + (TASKS.length + 1),
            title,
            description,
            status: 'A_faire',
            assignedToId,
            deadline,
            creatorId: getCurrentUser().id,
            comments: []
        };
        TASKS.push(newTask);
        saveState();
        taskCreationForm.classList.add('hidden');
        renderApp(getCurrentUser());
        alert('Tâche créée avec succès !');
    } else {
        alert('Veuillez remplir le titre, l\'assignation et la date limite.');
    }
});

// 4. Soumission de Demande (Membre)
requestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('request-title').value;
    const type = document.getElementById('request-type').value;
    const details = document.getElementById('request-details').value;
    
    const newRequest = {
        id: 'r' + (REQUESTS.length + 1),
        title,
        type,
        details,
        status: 'En_attente',
        submitterId: getCurrentUser().id
    };
    REQUESTS.push(newRequest);
    saveState();
    requestForm.reset();
    renderApp(getCurrentUser());
    alert('Votre demande a été soumise à l\'administrateur.');
});


// Initialisation : charge l'état de l'utilisateur au démarrage
document.addEventListener('DOMContentLoaded', () => {
    renderApp(getCurrentUser());
});