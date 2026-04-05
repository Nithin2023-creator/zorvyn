import { apiFetch } from './api.js';
import { formatDate, showToast, isAdmin } from './utils.js';

export async function renderUsers() {
    // Only Admin can view this page
    if (!isAdmin()) {
        window.location.hash = '#/dashboard';
        return;
    }

    const container = document.getElementById('page-content');

    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Team Management</h1>
        </div>

        <div class="toolbar">
            <button class="btn-primary" id="btn-add-user" style="width: auto;">+ Create Member</button>
        </div>

        <div class="data-table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody id="users-tbody">
                    <tr><td colspan="5" style="text-align: center;"><span class="loader"></span></td></tr>
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('btn-add-user').addEventListener('click', showUserModal);
    loadUsers();
}

async function loadUsers() {
    const res = await apiFetch('/users');
    const tbody = document.getElementById('users-tbody');

    if (res.success) {
        if (res.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No users found</td></tr>';
        } else {
            tbody.innerHTML = res.data.map(user => `
                <tr>
                    <td style="font-weight: 500;">${user.name}</td>
                    <td style="color: var(--text-muted);">${user.email}</td>
                    <td>
                        <select class="form-control role-select" data-id="${user.id}" style="width: 120px; padding: 4px 8px; font-size: 12px; height: auto;">
                            <option value="VIEWER" ${user.role === 'VIEWER' ? 'selected' : ''}>VIEWER</option>
                            <option value="ANALYST" ${user.role === 'ANALYST' ? 'selected' : ''}>ANALYST</option>
                            <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
                        </select>
                    </td>
                    <td>
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                            <input type="checkbox" class="status-toggle" data-id="${user.id}" ${user.isActive ? 'checked' : ''}>
                            <span class="badge ${user.isActive ? 'badge-INCOME' : 'badge-EXPENSE'}">
                                ${user.isActive ? 'ACTIVE' : 'DISABLED'}
                            </span>
                        </label>
                    </td>
                    <td style="font-size: 14px;">${formatDate(user.createdAt)}</td>
                </tr>
            `).join('');

            // Bind inline action events
            document.querySelectorAll('.role-select').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    const role = e.target.value;
                    e.target.disabled = true;
                    const result = await apiFetch(`/users/${id}/role`, {
                        method: 'PUT',
                        body: JSON.stringify({ role })
                    });
                    e.target.disabled = false;
                    if (result.success) {
                        showToast('User role updated', 'success');
                    } else {
                        showToast(result.error, 'error');
                        loadUsers(); // Revert UI
                    }
                });
            });

            document.querySelectorAll('.status-toggle').forEach(toggle => {
                toggle.addEventListener('change', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    const isActive = e.target.checked;
                    e.target.disabled = true;
                    const result = await apiFetch(`/users/${id}/status`, {
                        method: 'PUT',
                        body: JSON.stringify({ isActive })
                    });
                    e.target.disabled = false;
                    if (result.success) {
                        showToast(`User ${isActive ? 'activated' : 'disabled'}`, 'success');
                        loadUsers(); // Refresh to update badge styles
                    } else {
                        showToast(result.error, 'error');
                        loadUsers(); // Revert UI
                    }
                });
            });
        }
    } else {
        showToast(res.error, 'error');
    }
}

function showUserModal() {
    const modalContainer = document.getElementById('modal-container');

    modalContainer.innerHTML = `
        <div class="modal-overlay" id="user-modal">
            <div class="modal-content glass">
                <div class="modal-header">
                    <h2>Create New User</h2>
                    <button class="modal-close" id="close-user-modal">&times;</button>
                </div>
                <form id="user-form">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="usr-name" class="form-control" required placeholder="Alice">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="usr-email" class="form-control" required placeholder="member@zorvyn-ngo.org">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="usr-pwd" class="form-control" required placeholder="Min 8 chars, 1 uppercase, 1 num">
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select id="usr-role" class="form-control" required>
                            <option value="VIEWER">VIEWER</option>
                            <option value="ANALYST">ANALYST</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" id="cancel-user-modal">Cancel</button>
                        <button type="submit" class="btn-primary" id="btn-save-user">Create User</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const closeHandler = () => { modalContainer.innerHTML = ''; };
    document.getElementById('close-user-modal').addEventListener('click', closeHandler);
    document.getElementById('cancel-user-modal').addEventListener('click', closeHandler);

    document.getElementById('user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-user');
        btn.innerHTML = '<span class="loader"></span>';
        btn.disabled = true;

        const payload = {
            name: document.getElementById('usr-name').value.trim(),
            email: document.getElementById('usr-email').value.trim(),
            password: document.getElementById('usr-pwd').value,
            role: document.getElementById('usr-role').value
        };

        const res = await apiFetch('/users', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res.success) {
            showToast('User created successfully!', 'success');
            closeHandler();
            loadUsers(); // Re-fetch
        } else {
            if (res.details && res.details.length > 0) {
                showToast(res.details[0].message, 'error');
            } else {
                showToast(res.error || 'Failed to create user', 'error');
            }
            btn.innerHTML = 'Create User';
            btn.disabled = false;
        }
    });
}
