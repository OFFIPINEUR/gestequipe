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
    'super.admin@ibiocosmetics.com': { id: 'u0', name: 'Super Admin', role: ROLES.SUPER_ADMIN, password: 'password', department: null, active: true },
    'admin.tech@ibiocosmetics.com': { id: 'u1', name: 'Admin Tech', role: ROLES.ADMIN, password: 'password', department: DEPARTMENTS.TECH, active: true },
    'employe.tech@ibiocosmetics.com': { id: 'u2', name: 'Employé Tech', role: ROLES.EMPLOYE, password: 'password', department: DEPARTMENTS.TECH, active: true },
    'comptable@ibiocosmetics.com': { id: 'u3', name: 'Comptable Finance', role: ROLES.EMPLOYE, password: 'password', department: DEPARTMENTS.FINANCE, active: true },
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
const logoutBtn = document.getElementById('logout-btn');
const createUserForm = document.getElementById('create-user-form');
const newUserDepartmentSelect = document.getElementById('new-user-department');
const newUserRoleSelect = document.getElementById('new-user-role');
const superAdminUsersList = document.getElementById('super-admin-users-list');
const memberTasksList = document.getElementById('member-tasks-list');
const adminRequestsList = document.getElementById('admin-requests-list');
const adminTasksList = document.getElementById('admin-tasks-list');
const taskReportModal = document.getElementById('task-report-modal');
const taskReportForm = document.getElementById('task-report-form');
const editTaskModal = document.getElementById('edit-task-modal');
const editTaskForm = document.getElementById('edit-task-form');
const closeModalButtons = document.querySelectorAll('.modal__close-button');
const showTaskFormBtn = document.getElementById('show-task-form');
const taskCreationForm = document.getElementById('task-creation-form');
const submitNewTaskBtn = document.getElementById('submit-new-task');
const taskAssignedToSelect = document.getElementById('task-assigned-to');
const requestForm = document.getElementById('request-form');
const memberRequestsList = document.getElementById('member-requests-list');
const fabAddRequest = document.getElementById('fab-add-request');
const filterStatusSelect = document.getElementById('filter-status');
const filterPrioritySelect = document.getElementById('filter-priority');
const filterKeywordInput = document.getElementById('filter-keyword');
const filterAssigneeSelect = document.getElementById('filter-assignee');
const adminDashboardMetrics = document.getElementById('admin-dashboard-metrics');
const memberPriorities = document.getElementById('member-priorities');

// --- FONCTIONS UTILITAIRES ---
function saveState() {
    localStorage.setItem('users', JSON.stringify(USERS));
    localStorage.setItem('tasks', JSON.stringify(TASKS));
    localStorage.setItem('requests', JSON.stringify(REQUESTS));
}

function getCurrentUser() {
    const email = localStorage.getItem('currentUserEmail');
    const user = USERS[email];
    return user && user.active ? user : null;
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
    const departmentMembers = Object.values(USERS).filter(u => u.department === currentUser.department && u.active);
    const departmentMemberIds = departmentMembers.map(u => u.id);

    let departmentTasks = Object.values(TASKS).filter(t => departmentMemberIds.includes(t.assignedToId));

    // Metrics
    const tasksInProgress = departmentTasks.filter(t => t.status === 'En_cours').length;
    const overdueTasks = departmentTasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Termine').length;
    const pendingRequests = Object.values(REQUESTS).filter(r => departmentMemberIds.includes(r.submitterId) && r.status === 'En_attente').length;
    adminDashboardMetrics.innerHTML = `
        <div class="metric-card">
            <h4>Tâches en cours</h4>
            <p>${tasksInProgress}</p>
        </div>
        <div class="metric-card">
            <h4>Tâches en retard</h4>
            <p>${overdueTasks}</p>
        </div>
        <div class="metric-card">
            <h4>Demandes en attente</h4>
            <p>${pendingRequests}</p>
        </div>
    `;

    // Filtering logic...
    const statusFilter = filterStatusSelect.value;
    const priorityFilter = filterPrioritySelect.value;
    const keywordFilter = filterKeywordInput.value.toLowerCase();
    const assigneeFilter = filterAssigneeSelect.value;

    if (statusFilter !== 'all') departmentTasks = departmentTasks.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'all') departmentTasks = departmentTasks.filter(t => t.priority === priorityFilter);
    if (assigneeFilter !== 'all') departmentTasks = departmentTasks.filter(t => t.assignedToId === assigneeFilter);
    if (keywordFilter) departmentTasks = departmentTasks.filter(t => t.title.toLowerCase().includes(keywordFilter) || t.description.toLowerCase().includes(keywordFilter));

    adminTasksList.innerHTML = '';
    departmentTasks.forEach(task => adminTasksList.appendChild(renderTask(task, ROLES.ADMIN)));

    adminRequestsList.innerHTML = '';
    const departmentRequests = Object.values(REQUESTS).filter(r => departmentMemberIds.includes(r.submitterId));
    departmentRequests.forEach(req => adminRequestsList.appendChild(renderRequest(req)));

    taskAssignedToSelect.innerHTML = '<option value="">Assigner à...</option>';
    filterAssigneeSelect.innerHTML = '<option value="all">Tous les membres</option>';
    departmentMembers.filter(u => u.role === ROLES.EMPLOYE).forEach(emp => {
        taskAssignedToSelect.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
        filterAssigneeSelect.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
    });
}

function renderEmployeDashboard() {
    const currentUser = getCurrentUser();
    const myTasks = Object.values(TASKS).filter(t => t.assignedToId === currentUser.id);

    // Priorities
    const today = new Date();
    const urgentTasks = myTasks.filter(t => {
        const deadline = new Date(t.deadline);
        const diffDays = (deadline - today) / (1000 * 60 * 60 * 24);
        return diffDays <= 3 && t.status !== 'Termine';
    });
    memberPriorities.innerHTML = '<h4>Mes priorités du jour</h4>';
    if (urgentTasks.length > 0) {
        urgentTasks.forEach(task => {
            const priorityEl = document.createElement('div');
            priorityEl.className = 'priority-card';
            priorityEl.innerHTML = `<p>${task.title} - <strong>Date limite: ${task.deadline}</strong></p>`;
            memberPriorities.appendChild(priorityEl);
        });
    } else {
        memberPriorities.innerHTML += '<p>Aucune tâche urgente pour le moment.</p>';
    }

    memberTasksList.innerHTML = '';
    myTasks.forEach(task => memberTasksList.appendChild(renderTask(task, ROLES.EMPLOYE)));

    memberRequestsList.innerHTML = '';
    const myRequests = Object.values(REQUESTS).filter(r => r.submitterId === currentUser.id);
    myRequests.forEach(req => {
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
        completeBtn.className = 'button button--primary';
        completeBtn.textContent = 'Marquer Terminé';
        completeBtn.onclick = (e) => {
            e.stopPropagation();
            openTaskReportModal(task.id);
        };
        taskEl.appendChild(completeBtn);
    }

    if (userRole === ROLES.ADMIN) {
        const editBtn = document.createElement('button');
        editBtn.className = 'button button--outline';
        editBtn.textContent = 'Modifier';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            openEditTaskModal(task.id);
        };
        taskEl.appendChild(editBtn);
    }

    const chatSection = document.createElement('div');
    chatSection.className = 'chat-section';
    chatSection.innerHTML = `
        <div class="comments-list">
            ${task.comments.map(c => `<p class="${c.role === ROLES.ADMIN ? 'admin-comment' : ''}">
                <strong>${c.userName}:</strong> ${c.text}
                <span class="chat-timestamp">(${c.timestamp || ''})</span>
            </p>`).join('')}
        </div>
        <input type="text" id="comment-${task.id}" placeholder="Ajouter un commentaire..." class="form__input">
        <button onclick="addComment('${task.id}')" class="button button--primary">Envoyer</button>
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
        observationInput.className = 'form__input';
        requestEl.appendChild(observationInput);

        const approveBtn = document.createElement('button');
        approveBtn.className = 'button button--primary';
        approveBtn.textContent = 'Approuver';
        approveBtn.onclick = () => updateRequestStatus(req.id, 'Approuve', observationInput.value);
        requestEl.appendChild(approveBtn);

        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'button button--outline';
        rejectBtn.textContent = 'Rejeter';
        rejectBtn.onclick = () => updateRequestStatus(req.id, 'Rejete', observationInput.value);
        requestEl.appendChild(rejectBtn);
    }

    if (getCurrentUser().role === ROLES.ADMIN && req.status === 'Approuve' && !req.assignedToId) {
        const reassignSelect = document.createElement('select');
        reassignSelect.className = 'form__input';
        reassignSelect.innerHTML = '<option value="">Réassigner à...</option>';
        Object.values(USERS).forEach(user => {
            reassignSelect.innerHTML += `<option value="${user.id}">${user.name}</option>`;
        });
        requestEl.appendChild(reassignSelect);

        const reassignBtn = document.createElement('button');
        reassignBtn.className = 'button button--primary';
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

function openTaskReportModal(taskId) {
    document.getElementById('task-report-task-id').value = taskId;
    taskReportModal.classList.remove('hidden');
}

function closeTaskReportModal() {
    taskReportModal.classList.add('hidden');
    taskReportForm.reset();
}

function openEditTaskModal(taskId) {
    const task = TASKS.find(t => t.id === taskId);
    if (task) {
        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-description').value = task.description;
        document.getElementById('edit-task-deadline').value = task.deadline;
        document.getElementById('edit-task-priority').value = task.priority;
        editTaskModal.classList.remove('hidden');
    }
}

function closeEditTaskModal() {
    editTaskModal.classList.add('hidden');
    editTaskForm.reset();
}

closeModalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        closeTaskReportModal();
        closeEditTaskModal();
    });
});

window.addEventListener('click', (event) => {
    if (event.target == taskReportModal) {
        closeTaskReportModal();
    }
    if (event.target == editTaskModal) {
        closeEditTaskModal();
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

editTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskId = document.getElementById('edit-task-id').value;
    const task = TASKS.find(t => t.id === taskId);
    if (task) {
        task.title = document.getElementById('edit-task-title').value;
        task.description = document.getElementById('edit-task-description').value;
        task.deadline = document.getElementById('edit-task-deadline').value;
        task.priority = document.getElementById('edit-task-priority').value;
        saveState();
        closeEditTaskModal();
        renderApp(getCurrentUser());
    }
});

showTaskFormBtn.addEventListener('click', () => {
    taskCreationForm.classList.toggle('hidden');
});

submitNewTaskBtn.addEventListener('click', () => {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const assignedToId = taskAssignedToSelect.value;
    const deadline = document.getElementById('task-deadline').value;
    const priority = document.getElementById('task-priority').value;

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
    taskCreationForm.classList.add('hidden');
    document.getElementById('new-task-form').reset();
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

filterStatusSelect.addEventListener('change', renderAdminDashboard);
filterPrioritySelect.addEventListener('change', renderAdminDashboard);
filterAssigneeSelect.addEventListener('change', renderAdminDashboard);
filterKeywordInput.addEventListener('input', renderAdminDashboard);

function renderSuperAdminDashboard() {
    newUserDepartmentSelect.innerHTML = '<option value="">Choisir un département...</option>';
    Object.values(DEPARTMENTS).forEach(dep => newUserDepartmentSelect.innerHTML += `<option value="${dep}">${dep}</option>`);

    newUserRoleSelect.innerHTML = '<option value="">Choisir un rôle...</option>';
    [ROLES.ADMIN, ROLES.EMPLOYE].forEach(role => newUserRoleSelect.innerHTML += `<option value="${role}">${role}</option>`);

    superAdminUsersList.innerHTML = '';
    Object.entries(USERS).forEach(([email, user]) => {
        if (user.role !== ROLES.SUPER_ADMIN) {
            const userCard = document.createElement('div');
            userCard.className = `user-card ${user.active ? '' : 'disabled'}`;
            userCard.innerHTML = `
                <h4>${user.name}</h4>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Rôle:</strong> ${user.role}</p>
                <p><strong>Département:</strong> ${user.department}</p>
                <button onclick="toggleUserStatus('${email}')" class="button button--outline">${user.active ? 'Désactiver' : 'Activer'}</button>
            `;
            superAdminUsersList.appendChild(userCard);
        }
    });
}

function toggleUserStatus(email) {
    if (USERS[email]) {
        USERS[email].active = !USERS[email].active;
        saveState();
        renderSuperAdminDashboard();
    }
}

createUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-user-name').value;
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const department = newUserDepartmentSelect.value;
    const role = newUserRoleSelect.value;

    if (!email.endsWith('@ibiocosmetics.com')) {
        return showMessage('create-user-error', 'L\'email doit se terminer par @ibiocosmetics.com');
    }
    if (USERS[email]) {
        return showMessage('create-user-error', 'Cet utilisateur existe déjà.');
    }

    if (name && email && password && department && role) {
        USERS[email] = {
            id: 'u' + Date.now(),
            name,
            password,
            role,
            department,
            active: true
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
        if (!user.active) {
            showMessage('login-error', 'Ce compte a été désactivé.');
            return;
        }
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

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = getCurrentUser();
    renderApp(currentUser);
});
