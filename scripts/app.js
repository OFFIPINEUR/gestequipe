// scripts/app.js

const ROLES = {
    SUPER_ADMIN: 'Super_Admin',
    ADMIN: 'Admin',
    EMPLOYE: 'Employe'
};

const DEPARTMENTS = {
    MARKETING: 'Marketing',
    FINANCE: 'Finance',
    TECH: 'Technique'
};

// --- SIMULATION DE BASE DE DONNÉES ---
let USERS = JSON.parse(localStorage.getItem('users')) || {
    'super.admin@ibiocosmetics.com': { id: 'u0', name: 'Super Admin', role: ROLES.SUPER_ADMIN, password: 'password', department: null },
    'admin.tech@ibiocosmetics.com': { id: 'u1', name: 'Admin Tech', role: ROLES.ADMIN, password: 'password', department: DEPARTMENTS.TECH },
    'employe.tech@ibiocosmetics.com': { id: 'u2', name: 'Employé Tech', role: ROLES.EMPLOYE, password: 'password', department: DEPARTMENTS.TECH },
    'comptable@ibiocosmetics.com': { id: 'u3', name: 'Comptable Finance', role: ROLES.EMPLOYE, password: 'password', department: DEPARTMENTS.FINANCE },
};

let TASKS = JSON.parse(localStorage.getItem('tasks')) || [
    { id: 't1', title: 'Vérification du stock', description: 'Compter tous les produits A en entrepôt.', status: 'En_cours', assignedToId: 'u2', deadline: '2025-12-20', creatorId: 'u1', priority: 'Haute', comments: [], report: null, attachment: null },
];

let REQUESTS = JSON.parse(localStorage.getItem('requests')) || [
    { id: 'r1', title: 'Demande de congés', type: 'Conges', details: 'Du 25 au 30 Décembre.', status: 'En_attente', submitterId: 'u2', observations: null, assignedToId: null }
];

// --- Éléments du DOM ---
const views = {
    login: document.getElementById('login-view'),
    admin: document.getElementById('admin-view'),
    member: document.getElementById('member-view'),
    superAdmin: document.getElementById('super-admin-view')
};
const loginForm = document.getElementById('login-form');
const createUserForm = document.getElementById('create-user-form');
const newUserDepartmentSelect = document.getElementById('new-user-department');
const newUserRoleSelect = document.getElementById('new-user-role');
const superAdminUsersList = document.getElementById('super-admin-users-list');
const memberTasksList = document.getElementById('member-tasks-list');
const adminRequestsList = document.getElementById('admin-requests-list');
const adminTasksList = document.getElementById('admin-tasks-list');
const taskReportModal = document.getElementById('task-report-modal');
const taskReportForm = document.getElementById('task-report-form');
const closeModalButton = document.querySelector('.close-button');
const showTaskFormBtn = document.getElementById('show-task-form');
const taskCreationForm = document.getElementById('task-creation-form');
const submitNewTaskBtn = document.getElementById('submit-new-task');
const taskAssignedToSelect = document.getElementById('task-assigned-to');
const requestForm = document.getElementById('request-form');
const memberRequestsList = document.getElementById('member-requests-list');
const fabAddRequest = document.getElementById('fab-add-request');
const filterStatusSelect = document.getElementById('filter-status');
const filterPrioritySelect = document.getElementById('filter-priority');


// --- FONCTIONS UTILITAIRES ---
function saveState() {
    localStorage.setItem('users', JSON.stringify(USERS));
    localStorage.setItem('tasks', JSON.stringify(TASKS));
    localStorage.setItem('requests', JSON.stringify(REQUESTS));
}

function getCurrentUser() {
    const email = localStorage.getItem('currentUserEmail');
    return USERS[email] || null;
}

function hideAllViews() {
    Object.values(views).forEach(view => view.classList.add('hidden'));
}

function showMessage(elementId, message, isError = true) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.color = isError ? 'red' : 'green';
        setTimeout(() => el.textContent = '', 3000);
    }
}

// --- GESTION DES VUES ---
function renderApp(user) {
    hideAllViews();
    if (!user) {
        views.login.classList.remove('hidden');
        return;
    }

    if (user.role === ROLES.SUPER_ADMIN) {
        views.superAdmin.classList.remove('hidden');
        renderSuperAdminDashboard();
    } else if (user.role === ROLES.ADMIN) {
        views.admin.classList.remove('hidden');
        renderAdminDashboard();
    } else {
        views.member.classList.remove('hidden');
        renderEmployeDashboard();
    }
}

function renderAdminDashboard() {
    const currentUser = getCurrentUser();
    const departmentMembers = Object.values(USERS).filter(u => u.department === currentUser.department);
    const departmentMemberIds = departmentMembers.map(u => u.id);

    // Filter tasks
    let departmentTasks = Object.values(TASKS).filter(t => departmentMemberIds.includes(t.assignedToId));
    const statusFilter = filterStatusSelect.value;
    const priorityFilter = filterPrioritySelect.value;

    if (statusFilter !== 'all') {
        departmentTasks = departmentTasks.filter(t => t.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
        departmentTasks = departmentTasks.filter(t => t.priority === priorityFilter);
    }

    // Render tasks
    adminTasksList.innerHTML = '';
    departmentTasks.forEach(task => {
        adminTasksList.appendChild(renderTask(task, ROLES.ADMIN));
    });

    // Render requests
    adminRequestsList.innerHTML = '';
    const departmentRequests = Object.values(REQUESTS).filter(r => departmentMemberIds.includes(r.submitterId));
    departmentRequests.forEach(req => {
        adminRequestsList.appendChild(renderRequest(req));
    });

    // Populate 'Assign To' dropdown
    taskAssignedToSelect.innerHTML = '<option value="">Assigner à...</option>';
    const employees = departmentMembers.filter(u => u.role === ROLES.EMPLOYE);
    employees.forEach(emp => {
        taskAssignedToSelect.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
    });
}


function renderEmployeDashboard() {
    // Render tasks
    memberTasksList.innerHTML = '';
    const myTasks = Object.values(TASKS).filter(t => t.assignedToId === getCurrentUser().id);
    myTasks.forEach(task => {
        memberTasksList.appendChild(renderTask(task, ROLES.EMPLOYE));
    });

    // Render requests
    memberRequestsList.innerHTML = '';
    const myRequests = Object.values(REQUESTS).filter(r => r.submitterId === getCurrentUser().id);
    myRequests.forEach(req => {
        // We can reuse the renderRequest function, but it might show admin controls.
        // For now, let's create a simpler display for members.
        const reqEl = document.createElement('div');
        reqEl.className = 'request-card';
        reqEl.innerHTML = `<h4>${req.title}</h4><p>Statut: ${req.status}</p>`;
        memberRequestsList.appendChild(reqEl);
    });
}

function renderTask(task, userRole) {
    const taskEl = document.createElement('div');
    taskEl.className = `task-card status-${task.status} priority-${task.priority}`;
    const creator = Object.values(USERS).find(u => u.id === task.creatorId);
    let taskHTML = `<h4>${task.title}</h4>
        <p><strong>Statut:</strong> ${task.status.replace('_', ' ')}</p>
        <p><strong>Date Limite:</strong> ${task.deadline}</p>
        <div class="task-details hidden">
            <p><strong>Description:</strong> ${task.description}</p>
            <p><strong>Créateur:</strong> ${creator ? creator.name : 'Inconnu'}</p>`;

    if (task.report) {
        taskHTML += `<p><strong>Rapport:</strong> ${task.report}</p>`;
    }
    if (task.attachment) {
        taskHTML += `<p><strong>Pièce jointe:</strong> ${task.attachment}</p>`;
    }
    taskHTML += `</div>`;
    taskEl.innerHTML = taskHTML;

    taskEl.addEventListener('click', () => taskEl.querySelector('.task-details').classList.toggle('hidden'));

    if (userRole === ROLES.EMPLOYE && task.status === 'En_cours') {
        const completeBtn = document.createElement('button');
        completeBtn.textContent = 'Marquer Terminé';
        completeBtn.onclick = (e) => {
            e.stopPropagation();
            openTaskReportModal(task.id);
        };
        taskEl.appendChild(completeBtn);
    }

    // --- CHAT ---
    const chatSection = document.createElement('div');
    chatSection.className = 'chat-section';
    chatSection.innerHTML = `
        <div class="comments-list">
            ${task.comments.map(c => `<p class="${c.role === ROLES.ADMIN ? 'admin-comment' : ''}">
                <strong>${c.userName}:</strong> ${c.text}
                <span class="chat-timestamp">(${c.timestamp || ''})</span>
            </p>`).join('')}
        </div>
        <input type="text" id="comment-${task.id}" placeholder="Ajouter un commentaire...">
        <button onclick="addComment('${task.id}')">Envoyer</button>
    `;
    taskEl.appendChild(chatSection);


    return taskEl;
}

function addComment(taskId) {
    const input = document.getElementById(`comment-${taskId}`);
    const text = input.value.trim();
    if (text) {
        const task = TASKS.find(t => t.id === taskId);
        const currentUser = getCurrentUser();
        if (task) {
            const timestamp = new Date().toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            task.comments.push({
                userId: currentUser.id,
                userName: currentUser.name,
                role: currentUser.role,
                text,
                timestamp
            });
            input.value = '';
            saveState();
            renderApp(currentUser);
        }
    }
}


function renderRequest(req) {
    const requestEl = document.createElement('div');
    requestEl.className = 'request-card';
    const submitter = Object.values(USERS).find(u => u.id === req.submitterId);
    let requestHTML = `<h4>${req.title}</h4>
        <p><strong>Demandeur:</strong> ${submitter.name}</p>
        <p><strong>Statut:</strong> ${req.status}</p>
        <p>${req.details}</p>`;

    if (req.observations) {
        requestHTML += `<p><strong>Observations:</strong> ${req.observations}</p>`;
    }
    if (req.assignedToId) {
        const assignedUser = Object.values(USERS).find(u => u.id === req.assignedToId);
        requestHTML += `<p><strong>Réassigné à:</strong> ${assignedUser.name}</p>`;
    }
    requestEl.innerHTML = requestHTML;

    if (getCurrentUser().role === ROLES.ADMIN && req.status === 'En_attente') {
        const observationInput = document.createElement('textarea');
        observationInput.placeholder = "Ajouter une observation...";
        requestEl.appendChild(observationInput);

        const approveBtn = document.createElement('button');
        approveBtn.textContent = 'Approuver';
        approveBtn.onclick = () => updateRequestStatus(req.id, 'Approuve', observationInput.value);
        requestEl.appendChild(approveBtn);

        const rejectBtn = document.createElement('button');
        rejectBtn.textContent = 'Rejeter';
        rejectBtn.onclick = () => updateRequestStatus(req.id, 'Rejete', observationInput.value);
        requestEl.appendChild(rejectBtn);
    }

    if (getCurrentUser().role === ROLES.ADMIN && req.status === 'Approuve' && !req.assignedToId) {
        const reassignSelect = document.createElement('select');
        reassignSelect.innerHTML = '<option value="">Réassigner à...</option>';
        Object.values(USERS).forEach(user => {
            reassignSelect.innerHTML += `<option value="${user.id}">${user.name}</option>`;
        });
        requestEl.appendChild(reassignSelect);

        const reassignBtn = document.createElement('button');
        reassignBtn.textContent = 'Réassigner';
        reassignBtn.onclick = () => reassignRequest(req.id, reassignSelect.value);
        requestEl.appendChild(reassignBtn);
    }

    return requestEl;
}

function updateRequestStatus(reqId, newStatus, observations) {
    const request = REQUESTS.find(r => r.id === reqId);
    if (request) {
        request.status = newStatus;
        request.observations = observations;
        saveState();
        renderApp(getCurrentUser());
    }
}

function reassignRequest(reqId, assignedToId) {
    const request = REQUESTS.find(r => r.id === reqId);
    if (request && assignedToId) {
        request.assignedToId = assignedToId;
        saveState();
        renderApp(getCurrentUser());
    }
}


// --- FONCTIONNALITÉS DE RAPPORT DE TÂCHE ---
function openTaskReportModal(taskId) {
    document.getElementById('task-report-task-id').value = taskId;
    taskReportModal.classList.remove('hidden');
}

function closeTaskReportModal() {
    taskReportModal.classList.add('hidden');
    taskReportForm.reset();
}

closeModalButton.addEventListener('click', closeTaskReportModal);
window.addEventListener('click', (event) => {
    if (event.target == taskReportModal) {
        closeTaskReportModal();
    }
});

taskReportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskId = document.getElementById('task-report-task-id').value;
    const reportContent = document.getElementById('task-report-content').value;
    const attachmentInput = document.getElementById('task-attachment');

    const task = TASKS.find(t => t.id === taskId);
    if (task) {
        task.status = 'Termine';
        task.report = reportContent;
        if (attachmentInput.files.length > 0) {
            task.attachment = attachmentInput.files[0].name;
        }
        saveState();
        closeTaskReportModal();
        renderApp(getCurrentUser());
    }
});

// --- GESTIONNAIRES D'ÉVÉNEMENTS ---
showTaskFormBtn.addEventListener('click', () => {
    taskCreationForm.classList.toggle('hidden');
});

submitNewTaskBtn.addEventListener('click', () => {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const assignedToId = taskAssignedToSelect.value;
    const deadline = document.getElementById('task-deadline').value;
    const priority = document.getElementById('task-priority').value;

    // Validation
    if (!title || !assignedToId || !deadline || !priority) {
        showMessage('task-form-error', 'Veuillez remplir tous les champs obligatoires.');
        return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (deadline < today) {
        showMessage('task-form-error', 'La date limite ne peut pas être dans le passé.');
        return;
    }

    const newTask = {
        id: 't' + Date.now(),
        title,
        description,
        status: 'A_faire',
        assignedToId,
        deadline,
        creatorId: getCurrentUser().id,
        priority,
        comments: [],
        report: null,
        attachment: null
    };

    TASKS.push(newTask);
    saveState();

    // Reset and hide form
    taskCreationForm.classList.add('hidden');
    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    taskAssignedToSelect.value = '';
    document.getElementById('task-deadline').value = '';
    document.getElementById('task-priority').value = 'Normale';


    renderAdminDashboard();
    showMessage('task-form-error', 'Tâche créée avec succès!', false);
});

requestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('request-title').value;
    const type = document.getElementById('request-type').value;
    const details = document.getElementById('request-details').value;

    if (!title || !type) {
        showMessage('request-form-error', 'Le titre et le type de la demande sont requis.');
        return;
    }

    const newRequest = {
        id: 'r' + Date.now(),
        title,
        type,
        details,
        status: 'En_attente',
        submitterId: getCurrentUser().id,
        observations: null,
        assignedToId: null
    };

    REQUESTS.push(newRequest);
    saveState();
    requestForm.reset();
    renderEmployeDashboard();
    showMessage('request-form-error', 'Demande soumise avec succès!', false);
});

fabAddRequest.addEventListener('click', () => {
    requestForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('request-title').focus();
});


// --- GESTIONNAIRES D'ÉVÉNEMENTS ---
filterStatusSelect.addEventListener('change', renderAdminDashboard);
filterPrioritySelect.addEventListener('change', renderAdminDashboard);

showTaskFormBtn.addEventListener('click', () => {
    taskCreationForm.classList.toggle('hidden');
});

function renderSuperAdminDashboard() {
    newUserDepartmentSelect.innerHTML = '<option value="">Choisir un département...</option>';
    for (const key in DEPARTMENTS) {
        newUserDepartmentSelect.innerHTML += `<option value="${DEPARTMENTS[key]}">${DEPARTMENTS[key]}</option>`;
    }

    newUserRoleSelect.innerHTML = '<option value="">Choisir un rôle...</option>';
    newUserRoleSelect.innerHTML += `<option value="${ROLES.ADMIN}">${ROLES.ADMIN}</option>`;
    newUserRoleSelect.innerHTML += `<option value="${ROLES.EMPLOYE}">${ROLES.EMPLOYE}</option>`;

    superAdminUsersList.innerHTML = '';
    Object.values(USERS).forEach(user => {
        if (user.role !== ROLES.SUPER_ADMIN) {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <h4>${user.name}</h4>
                <p><strong>Email:</strong> ${Object.keys(USERS).find(key => USERS[key] === user)}</p>
                <p><strong>Rôle:</strong> ${user.role}</p>
                <p><strong>Département:</strong> ${user.department}</p>
            `;
            superAdminUsersList.appendChild(userCard);
        }
    });
}

createUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-user-name').value;
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const department = newUserDepartmentSelect.value;
    const role = newUserRoleSelect.value;

    if (!email.endsWith('@ibiocosmetics.com')) {
        showMessage('create-user-error', 'L\'email doit se terminer par @ibiocosmetics.com');
        return;
    }

    if (name && email && password && department && role) {
        USERS[email] = {
            id: 'u' + (Object.keys(USERS).length + 1),
            name,
            password,
            role,
            department
        };
        saveState();
        createUserForm.reset();
        renderSuperAdminDashboard();
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email.endsWith('@ibiocosmetics.com')) {
        showMessage('login-error', 'L\'email doit se terminer par @ibiocosmetics.com');
        return;
    }

    const user = USERS[email];
    if (user && user.password === password) {
        localStorage.setItem('currentUserEmail', email);
        renderApp(user);
    } else {
        showMessage('login-error', 'Email ou mot de passe incorrect.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = getCurrentUser();
    renderApp(currentUser);
});
