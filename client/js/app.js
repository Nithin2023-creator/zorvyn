import { renderAuth } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderRecords } from './records.js';
import { renderUsers } from './users.js';
import { getUserRole, isAdmin } from './utils.js';

// Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');

// Auth State Check
function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
}

// Router
function handleRoute() {
    const hash = window.location.hash || '#/dashboard';

    // Auth Guard
    if (!isAuthenticated()) {
        if (hash !== '#/login') {
            window.location.hash = '#/login';
            return;
        }

        // Show Login UI
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        renderAuth();
        return;
    }

    // Authenticated logic
    if (hash === '#/login') {
        window.location.hash = '#/dashboard';
        return;
    }

    // Show App UI
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');

    initLayout(); // Update sidebar user info

    // Highlight active nav link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === hash) link.classList.add('active');
    });

    // Content Router
    switch (hash) {
        case '#/dashboard':
            renderDashboard();
            break;
        case '#/records':
            renderRecords();
            break;
        case '#/users':
            if (isAdmin()) {
                renderUsers();
            } else {
                window.location.hash = '#/dashboard';
            }
            break;
        default:
            window.location.hash = '#/dashboard';
    }
}

// Global Nav & Logout Injection
function initLayout() {
    if (isAuthenticated()) {
        const user = JSON.parse(localStorage.getItem('user'));
        const userName = user.name || 'User';
        document.getElementById('user-name').innerText = userName;
        document.getElementById('user-avatar').innerText = userName.substring(0, 2).toUpperCase();

        const roleBadge = document.getElementById('user-role');
        roleBadge.innerText = user.role;
        roleBadge.className = `badge badge-${user.role}`;

        // Role-based Nav filtering
        if (isAdmin()) {
            document.querySelector('.admin-only').classList.remove('hidden');
        } else {
            document.querySelector('.admin-only').classList.add('hidden');
        }

        // Logout
        document.getElementById('btn-logout').addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.hash = '#/login';
            window.location.reload();
        });
    }
}

// Bootstrap
window.addEventListener('hashchange', handleRoute);

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        initLayout();
        handleRoute();
    });
} else {
    initLayout();
    handleRoute();
}
