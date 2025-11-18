// scripts/app.js

const ROLES = {
    ADMIN: 'Admin',
    MEMBER: 'Membre_Equipe'
};

// --- SIMULATION DE BASE DE DONNÉES ---
const INITIAL_USERS = {
    'admin@compagnie.com': { id: 'u1', name: 'Admin Boss', role: ROLES.ADMIN, password: 'password' },
    'membre@compagnie.com': { id: 'u2', name: 'Jean Membre', role: ROLES.MEMBER, password: 'password' },
};

let TASKS = JSON.parse(localStorage.getItem('tasks')) || [
    { id: 't1', title: 'Vérification du stock', description: 'Compter tous les produits A en entrepôt.', status: 'En_cours', assignedToId: 'u2', deadline: '2025-12-20', creatorId: 'u1', priority: 'Haute', comments: [] },
    { id: 't2', title: 'Réunion de planning', description: 'Préparer l\'agenda de la réunion Q4.', status: 'A_faire', assignedToId: 'u1', deadline: '2025-11-25', creatorId: 'u1', priority: 'Normale', comments: [] },
];

let REQUESTS = JSON.parse(localStorage.getItem('requests')) || [
    { id: 'r1', title: 'Demande de congés', type: 'Conges', details: 'Du 25 au 30 Décembre.', status: 'En_attente', submitterId: 'u2' }
];

// --- Éléments du DOM ---
const views = { login: document.getElementById('login-view'), admin: document.getElementById('admin-view'), member: document.getElementById('member-view') };
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const adminTasksList = document.getElementById('admin-tasks-list');
const memberTasksList = document.getElementById('member-tasks-list');
const memberRequestsList = document.getElementById('member-requests-list');
const taskCreationForm = document.getElementById('task-creation-form');
const taskAssignedToSelect = document.getElementById('task-assigned-to');
const requestForm = document.getElementById('request-form');
const adminRequestsList = document.getElementById('admin-requests-list');

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

function showMessage(elementId, message, isError = true) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.style.color = isError ? 'red' : 'green';
    setTimeout(() => el.textContent = '', 3000);
}

// --- FONCTIONS DE RENDU ---
function renderTask(task, currentUserRole) {
    const assignedUser = Object.values(INITIAL_USERS).find(u => u.id === task.assignedToId);
    const creatorUser = Object.values(INITIAL_USERS).find(u => u.id === task.creatorId);

    const taskEl = document.createElement('div');
    taskEl.className = `task-card status-${task.status} priority-${task.priority}`;
    taskEl.innerHTML = `
        <div class="task-header">
            <h4>${task.title}</h4>
            <span class="priority">${task.priority}</span>
        </div>
        <p><strong>Statut:</strong> ${task.status.replace('_', ' ')}</p>
        <p><strong>Assigné à:</strong> ${assignedUser ? assignedUser.name : 'N/A'}</p>
        <p><strong>Date Limite:</strong> ${task.deadline}</p>
        <div class="task-details hidden">
            <p><strong>Description:</strong> ${task.description}</p>
            <p><strong>Créateur:</strong> ${creatorUser ? creatorUser.name : 'N/A'}</p>
        </div>
    `;
    taskEl.addEventListener('click', () => taskEl.querySelector('.task-details').classList.toggle('hidden'));

    // Chat
    const chatSection = document.createElement('div');
    chatSection.className = 'chat-section';
    chatSection.innerHTML = `
        <div class="comments-list">
            ${task.comments.map(c => `<p class="${c.role === ROLES.ADMIN ? 'admin-comment' : ''}"><strong>${c.user}:</strong> ${c.text} <span class="timestamp">${new Date(c.timestamp).toLocaleTimeString()}</span></p>`).join('')}
        </div>
        <input type="text" id="comment-${task.id}" placeholder="Ajouter un commentaire...">
        <button>Envoyer</button>
    `;
    chatSection.querySelector('button').onclick = (e) => {
        e.stopPropagation();
        addComment(task.id);
    };
    taskEl.appendChild(chatSection);

    return taskEl;
}

function renderAdminRequests() {
    adminRequestsList.innerHTML = '';
    REQUESTS.forEach(req => {
        const submitter = Object.values(INITIAL_USERS).find(u => u.id === req.submitterId);
        const reqEl = document.createElement('div');
        reqEl.className = 'request-card';
        reqEl.innerHTML = `
            <h4>${req.title} (${req.type})</h4>
            <p><strong>Demandeur:</strong> ${submitter.name}</p>
            <p><strong>Statut:</strong> ${req.status}</p>
            <p>${req.details}</p>
        `;
        if (req.status === 'En_attente') {
            const approveBtn = document.createElement('button');
            approveBtn.textContent = 'Approuver';
            approveBtn.onclick = () => updateRequestStatus(req.id, 'Approuve');
            const rejectBtn = document.createElement('button');
            rejectBtn.textContent = 'Rejeter';
            rejectBtn.onclick = () => updateRequestStatus(req.id, 'Rejete');
            reqEl.append(approveBtn, rejectBtn);
        }
        adminRequestsList.appendChild(reqEl);
    });
}

// --- LOGIQUE MÉTIER ---
function updateTaskStatus(taskId, newStatus) {
    const task = TASKS.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        saveState();
        renderApp(getCurrentUser());
    }
}

function updateRequestStatus(reqId, newStatus) {
    const request = REQUESTS.find(r => r.id === reqId);
    if (request) {
        request.status = newStatus;
        saveState();
        renderApp(getCurrentUser());
    }
}

function addComment(taskId) {
    const input = document.getElementById(`comment-${taskId}`);
    const text = input.value.trim();
    if (text) {
        const task = TASKS.find(t => t.id === taskId);
        const currentUser = getCurrentUser();
        if (task) {
            task.comments.push({ user: currentUser.name, text, timestamp: new Date().toISOString(), role: currentUser.role });
            input.value = '';
            saveState();
            renderApp(currentUser);
        }
    }
}

// --- GESTION DES VUES ---
function renderApp(user) {
    hideAllViews();
    document.getElementById('user-role').textContent = user ? `Rôle: ${user.role}` : '';
    document.getElementById('user-info').style.display = user ? 'block' : 'none';

    if (!user) {
        views.login.classList.remove('hidden');
        return;
    }

    if (user.role === ROLES.ADMIN) {
        views.admin.classList.remove('hidden');
        renderAdminTasks();
        renderAdminRequests();
    } else {
        views.member.classList.remove('hidden');
        renderMemberTasks();
        renderMemberRequests();
    }
}

function renderAdminTasks() {
    const statusFilter = document.getElementById('filter-status').value;
    const priorityFilter = document.getElementById('filter-priority').value;

    const filteredTasks = TASKS.filter(task =>
        (statusFilter === 'all' || task.status === statusFilter) &&
        (priorityFilter === 'all' || task.priority === priorityFilter)
    );

    adminTasksList.innerHTML = '';
    filteredTasks.forEach(task => adminTasksList.appendChild(renderTask(task, ROLES.ADMIN)));
}

function renderMemberTasks() {
    memberTasksList.innerHTML = '';
    const myTasks = TASKS.filter(t => t.assignedToId === getCurrentUser().id);
    myTasks.forEach(task => memberTasksList.appendChild(renderTask(task, ROLES.MEMBER)));
}

function renderMemberRequests() {
    memberRequestsList.innerHTML = '';
    const myRequests = REQUESTS.filter(r => r.submitterId === getCurrentUser().id);
    myRequests.forEach(req => {
        const reqEl = document.createElement('div');
        reqEl.className = `request-card status-${req.status.toLowerCase()}`;
        reqEl.innerHTML = `<h4>${req.title}</h4><p>Statut: ${req.status}</p>`;
        memberRequestsList.appendChild(reqEl);
    });
}

// --- ÉVÉNEMENTS ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const user = INITIAL_USERS[email];
    if (user && user.password === document.getElementById('password').value) {
        localStorage.setItem('currentUserEmail', email);
        renderApp(user);
    } else {
        showMessage('login-error', 'Email ou mot de passe incorrect.');
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUserEmail');
    renderApp(null);
});

document.getElementById('show-task-form').addEventListener('click', () => {
    taskCreationForm.classList.toggle('hidden');
});

document.getElementById('submit-new-task').addEventListener('click', () => {
    const deadline = document.getElementById('task-deadline').value;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
    if (new Date(deadline) < today) {
        showMessage('task-form-error', 'La date limite ne peut pas être dans le passé.');
        return;
    }
    const newTask = {
        id: 't' + (TASKS.length + 1),
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        assignedToId: document.getElementById('task-assigned-to').value,
        deadline,
        priority: document.getElementById('task-priority').value,
        status: 'A_faire',
        creatorId: getCurrentUser().id,
        comments: []
    };
    TASKS.push(newTask);
    saveState();
    taskCreationForm.reset();
    taskCreationForm.classList.add('hidden');
    renderApp(getCurrentUser());
});

requestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    REQUESTS.push({
        id: 'r' + (REQUESTS.length + 1),
        title: document.getElementById('request-title').value,
        type: document.getElementById('request-type').value,
        details: document.getElementById('request-details').value,
        status: 'En_attente',
        submitterId: getCurrentUser().id
    });
    saveState();
    requestForm.reset();
    renderApp(getCurrentUser());
});

document.getElementById('filter-status').addEventListener('change', renderAdminTasks);
document.getElementById('filter-priority').addEventListener('change', renderAdminTasks);

document.getElementById('fab-add-request').addEventListener('click', () => {
    requestForm.classList.toggle('hidden');
});

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
        // Remplir le select d'assignation
        Object.values(INITIAL_USERS).forEach(u => {
            const option = document.createElement('option');
            option.value = u.id;
            option.textContent = u.name;
            taskAssignedToSelect.appendChild(option);
        });
    }
    renderApp(currentUser);
});