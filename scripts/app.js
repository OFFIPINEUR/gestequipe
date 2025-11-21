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

// --- DONNÉES DE L'APPLICATION ---
let currentUser = null; // L'objet utilisateur connecté sera stocké ici

// Données temporaires en attendant Firestore
let USERS = {};
let TASKS = [];
let REQUESTS = [];

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
const adminTasksListView = document.getElementById('admin-tasks-list-view');
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
    currentUser = user; // Met à jour l'utilisateur courant global
    hideAllViews();

    if (!currentUser) {
        views.login.classList.remove('hidden');
        document.getElementById('user-info').classList.add('hidden');
        return;
    }

    document.getElementById('user-info').classList.remove('hidden');
    document.getElementById('user-role').textContent = `${currentUser.name} (${currentUser.role})`;

    if (currentUser.role === ROLES.SUPER_ADMIN) {
        views.superAdmin.classList.remove('hidden');
        onUsersUpdate(users => {
            USERS = users;
            renderSuperAdminDashboard();
        });
    } else if (currentUser.role === ROLES.ADMIN) {
        views.admin.classList.remove('hidden');
        onUsersUpdate(users => {
            USERS = users;
            onTasksUpdate(currentUser.department, tasks => {
                TASKS = tasks;
                onRequestsUpdate(currentUser.department, requests => {
                    REQUESTS = requests;
                    renderAdminDashboard();
                });
            });
        });
    } else { // EMPLOYE
        views.member.classList.remove('hidden');
        onTasksUpdate(currentUser.department, tasks => {
            TASKS = tasks.filter(t => t.assignedToId === currentUser.uid);
            onRequestsUpdate(currentUser.department, requests => {
                REQUESTS = requests.filter(r => r.submitterId === currentUser.uid);
                renderEmployeDashboard();
            });
        });
    }
}

function renderAdminDashboard() {
    const departmentMembers = Object.values(USERS).filter(u => u.department === currentUser.department && u.active);

    let departmentTasks = TASKS; // Déjà filtré par département dans onTasksUpdate

    // Metrics
    const tasksInProgress = departmentTasks.filter(t => t.status === 'En_cours').length;
    const overdueTasks = departmentTasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Termine').length;
    const pendingRequests = REQUESTS.filter(r => r.status === 'En_attente').length;
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

    const adminTasksListView = document.getElementById('admin-tasks-list-view');
    adminTasksListView.innerHTML = '';
    departmentTasks.forEach(task => adminTasksListView.appendChild(renderTask(task, ROLES.ADMIN)));

    // Mettre à jour la vue Kanban si elle est visible
    if (!document.getElementById('admin-tasks-kanban-view').classList.contains('hidden')) {
        renderKanbanView(departmentTasks);
    }

    const adminRequestsList = document.getElementById('admin-requests-list');
    adminRequestsList.innerHTML = '';
    REQUESTS.forEach(req => adminRequestsList.appendChild(renderRequest(req)));

    taskAssignedToSelect.innerHTML = '<option value="">Assigner à...</option>';
    filterAssigneeSelect.innerHTML = '<option value="all">Tous les membres</option>';
    departmentMembers.filter(u => u.role === ROLES.EMPLOYE).forEach(emp => {
        taskAssignedToSelect.innerHTML += `<option value="${emp.uid}">${emp.name}</option>`;
        filterAssigneeSelect.innerHTML += `<option value="${emp.uid}">${emp.name}</option>`;
    });
}

function renderEmployeDashboard() {
    const myTasks = TASKS; // Déjà filtré dans onTasksUpdate

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
    REQUESTS.forEach(req => {
        const reqEl = document.createElement('div');
        reqEl.className = 'request-card';
        reqEl.innerHTML = `<h4>${req.title}</h4><p>Statut: ${req.status}</p>`;
        memberRequestsList.appendChild(reqEl);
    });
}

function renderTask(task, userRole) {
    const taskEl = document.createElement('div');
    taskEl.className = `task-card status-${task.status} priority-${task.priority}`;
    const creator = USERS[task.creatorId];
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
    taskHTML += `
        <div class="subtasks-section">
            <h5>Sous-tâches</h5>
            <div class="subtasks-list">
                ${(task.subtasks || []).map((sub, index) => `
                    <div class="subtask-item">
                        <input type="checkbox" id="subtask-${task.id}-${index}" ${sub.done ? 'checked' : ''} onchange="toggleSubtask('${task.id}', ${index})">
                        <label for="subtask-${task.id}-${index}">${sub.text}</label>
                    </div>
                `).join('')}
            </div>
            <div class="add-subtask-form">
                <input type="text" id="new-subtask-${task.id}" class="form__input--inline" placeholder="Ajouter une sous-tâche...">
                <button onclick="addSubtask('${task.id}')" class="button button--primary button--sm">+</button>
            </div>
        </div>
    </div>`;
    taskEl.innerHTML = taskHTML;

    taskEl.querySelector('h4').addEventListener('click', () => taskEl.querySelector('.task-details').classList.toggle('hidden'));

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
            ${(task.comments || []).map(c => `<p class="${c.role === ROLES.ADMIN ? 'admin-comment' : ''}">
                <strong>${c.userName}:</strong> ${c.htmlText || c.text}
                <span class="chat-timestamp">(${c.timestamp || ''})</span>
            </p>`).join('')}
        </div>
        <input type="text" id="comment-${task.id}" placeholder="Ajouter un commentaire..." class="form__input">
        <button onclick="addComment('${task.id}')" class="button button--primary">Envoyer</button>
    `;
    taskEl.appendChild(chatSection);

    return taskEl;
}

async function addSubtask(taskId) {
    const input = document.getElementById(`new-subtask-${taskId}`);
    const text = input.value.trim();
    if (text) {
        const task = TASKS.find(t => t.id === taskId);
        if (task) {
            const newSubtask = { text, done: false };
            const updatedSubtasks = [...(task.subtasks || []), newSubtask];
            await updateTask(taskId, { subtasks: updatedSubtasks });
            input.value = '';
        }
    }
}

async function toggleSubtask(taskId, subtaskIndex) {
    const task = TASKS.find(t => t.id === taskId);
    if (task && task.subtasks && task.subtasks[subtaskIndex]) {
        const updatedSubtasks = [...task.subtasks];
        updatedSubtasks[subtaskIndex].done = !updatedSubtasks[subtaskIndex].done;
        await updateTask(taskId, { subtasks: updatedSubtasks });
    }
}

async function addComment(taskId) {
    const input = document.getElementById(`comment-${taskId}`);
    let text = input.value.trim();
    if (text && currentUser) {
        const task = TASKS.find(t => t.id === taskId);
        if (task) {
            // Détection des mentions
            const mentions = text.match(/@(\w+)/g);
            if (mentions) {
                mentions.forEach(mention => {
                    const userName = mention.substring(1);
                    const user = Object.values(USERS).find(u => u.name.toLowerCase() === userName.toLowerCase());
                    if (user) {
                        console.log(`Notification simulée: L'utilisateur ${currentUser.name} vous a mentionné dans la tâche "${task.title}"`);
                        text = text.replace(mention, `<strong>${mention}</strong>`);
                    }
                });
            }

            const timestamp = new Date().toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            const newComment = {
                userId: currentUser.uid,
                userName: currentUser.name,
                role: currentUser.role,
                htmlText: text, // Stocker le texte avec HTML
                timestamp
            };
            const updatedComments = [...task.comments, newComment];
            const result = await updateTask(taskId, { comments: updatedComments });
            if (result.success) {
                input.value = '';
                // Le rendu se met à jour automatiquement
            } else {
                showMessage(`comment-error-${taskId}`, 'Erreur envoi commentaire.');
            }
        }
    }
}

function renderRequest(req) {
    const requestEl = document.createElement('div');
    requestEl.className = 'request-card';
    const submitter = USERS[req.submitterId];
    let requestHTML = `<h4>${req.title}</h4>
        <p><strong>Demandeur:</strong> ${submitter ? submitter.name : 'Inconnu'}</p>
        <p><strong>Statut:</strong> ${req.status}</p>
        <p>${req.details}</p>`;

    if (req.observations) {
        requestHTML += `<p><strong>Observations:</strong> ${req.observations}</p>`;
    }
    if (req.assignedToId) {
        const assignedUser = USERS[req.assignedToId];
        requestHTML += `<p><strong>Réassigné à:</strong> ${assignedUser ? assignedUser.name : 'Inconnu'}</p>`;
    }
    requestEl.innerHTML = requestHTML;

    if (currentUser.role === ROLES.ADMIN && req.status === 'En_attente') {
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

    if (currentUser.role === ROLES.ADMIN && req.status === 'Approuve' && !req.assignedToId) {
        const reassignSelect = document.createElement('select');
        reassignSelect.className = 'form__input';
        reassignSelect.innerHTML = '<option value="">Réassigner à...</option>';
        Object.values(USERS).filter(u => u.department === currentUser.department).forEach(user => {
            reassignSelect.innerHTML += `<option value="${user.uid}">${user.name}</option>`;
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

async function updateRequestStatus(reqId, newStatus, observations) {
    await updateRequest(reqId, { status: newStatus, observations });
    // Le rendu se met à jour automatiquement grâce à onSnapshot
}

async function reassignRequest(reqId, assignedToId) {
    if (assignedToId) {
        await updateRequest(reqId, { assignedToId });
        // Le rendu se met à jour automatiquement grâce à onSnapshot
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

taskReportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId = document.getElementById('task-report-task-id').value;
    const reportContent = document.getElementById('task-report-content').value;
    const attachmentInput = document.getElementById('task-attachment');

    const updateData = {
        status: 'Termine',
        report: reportContent
    };
    if (attachmentInput.files.length > 0) {
        updateData.attachment = attachmentInput.files[0].name;
        // Ici, il faudrait uploader le fichier sur Firebase Storage,
        // pour l'instant on ne stocke que le nom.
    }
    await updateTask(taskId, updateData);
    closeTaskReportModal();
});

editTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId = document.getElementById('edit-task-id').value;
    const updatedData = {
        title: document.getElementById('edit-task-title').value,
        description: document.getElementById('edit-task-description').value,
        deadline: document.getElementById('edit-task-deadline').value,
        priority: document.getElementById('edit-task-priority').value
    };
    await updateTask(taskId, updatedData);
    closeEditTaskModal();
});

showTaskFormBtn.addEventListener('click', () => {
    taskCreationForm.classList.toggle('hidden');
});

submitNewTaskBtn.addEventListener('click', async () => {
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
        title,
        description,
        status: 'A_faire',
        assignedToId,
        deadline,
        creatorId: currentUser.uid,
        department: currentUser.department,
        priority,
        comments: [],
        report: null,
        attachment: null
    };

    const result = await addTask(newTask);
    if (result.success) {
        taskCreationForm.classList.add('hidden');
        document.getElementById('new-task-form').reset();
        showMessage('task-form-error', 'Tâche créée avec succès!', false);
        // Le rendu se met à jour automatiquement
    } else {
        showMessage('task-form-error', `Erreur: ${result.message}`);
    }
});

requestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('request-title').value;
    const type = document.getElementById('request-type').value;
    const details = document.getElementById('request-details').value;

    if (!title || !type) {
        showMessage('request-form-error', 'Le titre et le type de la demande sont requis.');
        return;
    }

    const newRequest = {
        title,
        type,
        details,
        status: 'En_attente',
        submitterId: currentUser.uid,
        department: currentUser.department,
        observations: null,
        assignedToId: null
    };

    const result = await addRequest(newRequest);
    if (result.success) {
        requestForm.reset();
        showMessage('request-form-error', 'Demande soumise avec succès!', false);
        // Le rendu se met à jour automatiquement
    } else {
        showMessage('request-form-error', `Erreur: ${result.message}`);
    }
});

fabAddRequest.addEventListener('click', () => {
    requestForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('request-title').focus();
});

filterStatusSelect.addEventListener('change', renderAdminDashboard);
filterPrioritySelect.addEventListener('change', renderAdminDashboard);
filterAssigneeSelect.addEventListener('change', renderAdminDashboard);
filterKeywordInput.addEventListener('input', renderAdminDashboard);

document.getElementById('view-toggle-list').addEventListener('click', () => {
    document.getElementById('view-toggle-list').classList.add('active');
    document.getElementById('view-toggle-kanban').classList.remove('active');
    document.getElementById('admin-tasks-list-view').classList.remove('hidden');
    document.getElementById('admin-tasks-kanban-view').classList.add('hidden');
});

document.getElementById('view-toggle-kanban').addEventListener('click', () => {
    document.getElementById('view-toggle-kanban').classList.add('active');
    document.getElementById('view-toggle-list').classList.remove('active');
    document.getElementById('admin-tasks-kanban-view').classList.remove('hidden');
    document.getElementById('admin-tasks-list-view').classList.add('hidden');
    renderKanbanView(TASKS);
});

function renderKanbanView(tasks) {
    const columns = {
        'A_faire': document.querySelector('.kanban-column[data-status="A_faire"] .kanban-column__tasks'),
        'En_cours': document.querySelector('.kanban-column[data-status="En_cours"] .kanban-column__tasks'),
        'Termine': document.querySelector('.kanban-column[data-status="Termine"] .kanban-column__tasks'),
    };
    Object.values(columns).forEach(col => col.innerHTML = ''); // Clear columns
    tasks.forEach(task => {
        if (columns[task.status]) {
            const taskCard = renderTask(task, currentUser.role);
            taskCard.setAttribute('draggable', true);
            taskCard.dataset.taskId = task.id;
            columns[task.status].appendChild(taskCard);
        }
    });

    addDragAndDropListeners();
}

function addDragAndDropListeners() {
    const tasks = document.querySelectorAll('.kanban-column__tasks .task-card');
    tasks.forEach(task => {
        task.addEventListener('dragstart', () => {
            task.classList.add('dragging');
        });
        task.addEventListener('dragend', () => {
            task.classList.remove('dragging');
        });
    });

    const columns = document.querySelectorAll('.kanban-column__tasks');
    columns.forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(column, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                column.appendChild(draggable);
            } else {
                column.insertBefore(draggable, afterElement);
            }
        });
        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            const taskId = document.querySelector('.dragging').dataset.taskId;
            const newStatus = column.parentElement.dataset.status;
            await updateTask(taskId, { status: newStatus });
            // Le rendu se met à jour automatiquement
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function renderSuperAdminDashboard() {
    newUserDepartmentSelect.innerHTML = '<option value="">Choisir un département...</option>';
    Object.values(DEPARTMENTS).forEach(dep => newUserDepartmentSelect.innerHTML += `<option value="${dep}">${dep}</option>`);

    newUserRoleSelect.innerHTML = '<option value="">Choisir un rôle...</option>';
    [ROLES.ADMIN, ROLES.EMPLOYE].forEach(role => newUserRoleSelect.innerHTML += `<option value="${role}">${role}</option>`);

    superAdminUsersList.innerHTML = '';
    Object.values(USERS).forEach(user => {
        if (user.role !== ROLES.SUPER_ADMIN) {
            const userCard = document.createElement('div');
            userCard.className = `user-card ${user.active ? '' : 'disabled'}`;
            userCard.innerHTML = `
                <h4>${user.name}</h4>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Rôle:</strong> ${user.role}</p>
                <p><strong>Département:</strong> ${user.department}</p>
                <button onclick="toggleUserStatus('${user.uid}', ${user.active})" class="button button--outline">${user.active ? 'Désactiver' : 'Activer'}</button>
            `;
            superAdminUsersList.appendChild(userCard);
        }
    });
}

async function toggleUserStatus(uid, isActive) {
    await updateUserStatus(uid, !isActive);
    // Le rendu se met à jour automatiquement
}

createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-user-name').value;
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const department = newUserDepartmentSelect.value;
    const role = newUserRoleSelect.value;

    if (!email.endsWith('@ibiocosmetics.com')) {
        return showMessage('create-user-error', "L'email doit se terminer par @ibiocosmetics.com");
    }
    if (!name || !password || !department || !role) {
        return showMessage('create-user-error', "Veuillez remplir tous les champs.");
    }

    const result = await signUp(email, password, name, role, department);
    if (result.success) {
        createUserForm.reset();
        showMessage('create-user-error', 'Utilisateur créé avec succès!', false);
        renderSuperAdminDashboard();
    } else {
        showMessage('create-user-error', `Erreur: ${result.message}`);
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email.endsWith('@ibiocosmetics.com')) {
        showMessage('login-error', "L'email doit se terminer par @ibiocosmetics.com");
        return;
    }
    signIn(email, password);
});

logoutBtn.addEventListener('click', () => {
    signOutUser();
});

// Le rendu initial est maintenant géré par onAuthStateChanged dans auth.js
// document.addEventListener('DOMContentLoaded', () => { ... });
