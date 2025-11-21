// scripts/chat.js
import { currentUser, USERS } from './app.js';
import { sendMessage, onMessagesUpdate } from './firestore.js';

const chatIcon = document.getElementById('chat-icon');
const chatContainer = document.getElementById('chat-container');
const closeChatBtn = document.getElementById('close-chat-btn');
const chatInputForm = document.getElementById('chat-input-form');
const chatMessageInput = document.getElementById('chat-message-input');
const chatMessagesContainer = document.getElementById('chat-messages');
const chatSidebar = document.getElementById('chat-sidebar');

let currentChatTarget = null; // UID de l'utilisateur avec qui on chat

// --- Fonctions UI ---
function toggleChatWindow(show) {
    if (show) {
        chatContainer.classList.remove('hidden');
        loadChatContacts();
    } else {
        chatContainer.classList.add('hidden');
    }
}

// --- Écouteurs d'événements ---
if(chatIcon) {
    chatIcon.addEventListener('click', () => toggleChatWindow(true));
}
if (closeChatBtn) {
    closeChatBtn.addEventListener('click', () => toggleChatWindow(false));
}


if (chatInputForm) {
    chatInputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const messageText = chatMessageInput.value.trim();
        if (messageText && currentChatTarget) {
            sendMessage(currentUser.uid, currentChatTarget, messageText);
            chatMessageInput.value = '';
        }
    });
}


// --- Logique métier ---

// Charger les contacts dans la sidebar
async function loadChatContacts() {
    if (!currentUser) return;

    // On récupère tous les utilisateurs sauf soi-même
    const allUsers = Object.values(USERS).filter(u => u.uid !== currentUser.uid && u.active);

    chatSidebar.innerHTML = '<h4>Contacts</h4>';
    allUsers.forEach(user => {
        const contactEl = document.createElement('div');
        contactEl.className = 'contact-item';
        contactEl.dataset.uid = user.uid;
        contactEl.innerHTML = `
            <div class="contact-item__avatar">${user.name.charAt(0)}</div>
            <div class="contact-item__name">${user.name}</div>
        `;
        contactEl.addEventListener('click', () => startChatWith(user.uid));
        chatSidebar.appendChild(contactEl);
    });
}

// Démarrer une conversation avec un utilisateur
function startChatWith(userId) {
    currentChatTarget = userId;

    // Mettre en surbrillance le contact actif
    document.querySelectorAll('.contact-item').forEach(el => {
        if (el.dataset.uid === userId) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    chatMessagesContainer.innerHTML = ''; // Vider les anciens messages
    listenForMessages(currentUser.uid, currentChatTarget);
}

// Écouter les messages en temps réel
function listenForMessages(userId1, userId2) {
    const chatId = [userId1, userId2].sort().join('_');
    onMessagesUpdate(chatId, (messages) => {
        renderMessages(messages);
    });
}

// Afficher les messages dans la fenêtre de chat
function renderMessages(messages) {
    chatMessagesContainer.innerHTML = '';
    messages.forEach(msg => {
        const messageEl = document.createElement('div');
        const sender = USERS[msg.senderId];

        messageEl.className = `message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`;
        messageEl.innerHTML = `
            <div class="message__sender">${sender ? sender.name : 'Inconnu'}</div>
            <div class="message__text">${msg.text}</div>
        `;
        chatMessagesContainer.appendChild(messageEl);
    });
    // Scroll vers le bas
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}
