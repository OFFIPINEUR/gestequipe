import { supabase } from './supabase-config.js';

function onUsersUpdate(callback) {
    const channel = supabase
        .channel('users-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'users' },
            async () => {
                const { data, error } = await supabase
                    .from('users')
                    .select('*');

                if (error) {
                    console.error("Erreur lors de la récupération des utilisateurs:", error);
                    return;
                }

                const users = {};
                data.forEach(user => {
                    users[user.id] = { uid: user.id, ...user };
                });
                callback(users);
            }
        )
        .subscribe();

    supabase
        .from('users')
        .select('*')
        .then(({ data, error }) => {
            if (error) {
                console.error("Erreur lors de la récupération initiale des utilisateurs:", error);
                return;
            }
            const users = {};
            data.forEach(user => {
                users[user.id] = { uid: user.id, ...user };
            });
            callback(users);
        });

    return channel;
}

function onTasksUpdate(department, callback) {
    const channel = supabase
        .channel('tasks-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'tasks' },
            async () => {
                const { data, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('department', department);

                if (error) {
                    console.error("Erreur lors de la récupération des tâches:", error);
                    return;
                }

                callback(data || []);
            }
        )
        .subscribe();

    supabase
        .from('tasks')
        .select('*')
        .eq('department', department)
        .then(({ data, error }) => {
            if (error) {
                console.error("Erreur lors de la récupération initiale des tâches:", error);
                return;
            }
            callback(data || []);
        });

    return channel;
}

function onRequestsUpdate(department, callback) {
    const channel = supabase
        .channel('requests-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'requests' },
            async () => {
                const { data, error } = await supabase
                    .from('requests')
                    .select('*')
                    .eq('department', department);

                if (error) {
                    console.error("Erreur lors de la récupération des demandes:", error);
                    return;
                }

                callback(data || []);
            }
        )
        .subscribe();

    supabase
        .from('requests')
        .select('*')
        .eq('department', department)
        .then(({ data, error }) => {
            if (error) {
                console.error("Erreur lors de la récupération initiale des demandes:", error);
                return;
            }
            callback(data || []);
        });

    return channel;
}

async function addTask(taskData) {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .insert([taskData])
            .select()
            .single();

        if (error) {
            console.error("Erreur lors de l'ajout de la tâche:", error);
            return { success: false, message: error.message };
        }

        return { success: true, taskId: data.id };
    } catch (error) {
        console.error("Erreur lors de l'ajout de la tâche:", error);
        return { success: false, message: error.message };
    }
}

async function deleteTaskFromDb(taskId) {
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) {
            console.error("Erreur lors de la suppression de la tâche:", error);
            return { success: false, message: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la suppression de la tâche:", error);
        return { success: false, message: error.message };
    }
}

async function updateTask(taskId, updateData) {
    try {
        const { error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', taskId);

        if (error) {
            console.error("Erreur lors de la mise à jour de la tâche:", error);
            return { success: false, message: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la tâche:", error);
        return { success: false, message: error.message };
    }
}

async function addRequest(requestData) {
    try {
        const { error } = await supabase
            .from('requests')
            .insert([requestData]);

        if (error) {
            console.error("Erreur lors de l'ajout de la demande:", error);
            return { success: false, message: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de l'ajout de la demande:", error);
        return { success: false, message: error.message };
    }
}

async function updateRequest(requestId, updateData) {
    try {
        const { error } = await supabase
            .from('requests')
            .update(updateData)
            .eq('id', requestId);

        if (error) {
            console.error("Erreur lors de la mise à jour de la demande:", error);
            return { success: false, message: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la demande:", error);
        return { success: false, message: error.message };
    }
}

async function updateUserStatus(uid, isActive) {
    try {
        const { error } = await supabase
            .from('users')
            .update({ active: isActive })
            .eq('id', uid);

        if (error) {
            console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
            return { success: false, message: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
        return { success: false, message: error.message };
    }
}

window.onUsersUpdate = onUsersUpdate;
window.onTasksUpdate = onTasksUpdate;
window.onRequestsUpdate = onRequestsUpdate;
window.addTask = addTask;
window.deleteTaskFromDb = deleteTaskFromDb;
window.updateTask = updateTask;
window.addRequest = addRequest;
window.updateRequest = updateRequest;
window.updateUserStatus = updateUserStatus;
