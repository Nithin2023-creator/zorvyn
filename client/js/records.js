import { apiFetch } from './api.js';
import { formatCurrency, formatDate, showToast, isAdmin, isAnalyst } from './utils.js';

let currentPage = 1;

export async function renderRecords() {
    const container = document.getElementById('page-content');

    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Fund Records</h1>
        </div>

        <div class="toolbar" style="flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; gap: 12px; flex: 1; min-width: 300px;">
                <select id="filter-type" class="form-control" style="width: 140px;">
                    <option value="">All Types</option>
                    <option value="INCOME">Donation</option>
                    <option value="EXPENSE">Expenditure</option>
                </select>
                <input type="text" id="filter-category" class="form-control" style="flex: 1;" placeholder="Category...">
            </div>

            <div style="display: flex; gap: 12px; flex: 1; min-width: 300px;">
                <input type="date" id="filter-start-date" class="form-control" style="width: 150px;" title="Start Date">
                <input type="date" id="filter-end-date" class="form-control" style="width: 150px;" title="End Date">
            </div>

            <div style="display: flex; gap: 12px; align-items: center;">
                <select id="sort-by" class="form-control" style="width: 120px;">
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="createdAt">Created</option>
                </select>
                <select id="sort-order" class="form-control" style="width: 100px;">
                    <option value="desc">DESC</option>
                    <option value="asc">ASC</option>
                </select>
                ${(isAdmin() || isAnalyst()) ? '<button class="btn-primary" id="btn-add-record" style="width: auto;">+ New</button>' : ''}
            </div>
        </div>

        <div class="data-table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Notes</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="records-tbody">
                    <tr><td colspan="6" style="text-align: center;"><span class="loader"></span></td></tr>
                </tbody>
            </table>
            <div class="pagination">
                <div class="pagination-info" id="pagination-info">Loading pagination...</div>
                <div class="pagination-controls">
                    <button class="btn-page" id="btn-prev">Previous</button>
                    <button class="btn-page" id="btn-next">Next</button>
                </div>
            </div>
        </div>
    `;

    bindRecordEvents();
    loadRecords();
}

function bindRecordEvents() {
    document.getElementById('filter-type').addEventListener('change', () => { currentPage = 1; loadRecords(); });

    // Debounce for filter text
    let timeout = null;
    document.getElementById('filter-category').addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            currentPage = 1;
            loadRecords();
        }, 500);
    });

    document.getElementById('filter-start-date').addEventListener('change', () => { currentPage = 1; loadRecords(); });
    document.getElementById('filter-end-date').addEventListener('change', () => { currentPage = 1; loadRecords(); });
    document.getElementById('sort-by').addEventListener('change', () => { currentPage = 1; loadRecords(); });
    document.getElementById('sort-order').addEventListener('change', () => { currentPage = 1; loadRecords(); });

    document.getElementById('btn-prev').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadRecords();
        }
    });

    document.getElementById('btn-next').addEventListener('click', () => {
        currentPage++;
        loadRecords();
    });

    const addBtn = document.getElementById('btn-add-record');
    if (addBtn) {
        addBtn.addEventListener('click', () => showRecordModal());
    }
}

async function loadRecords() {
    const type = document.getElementById('filter-type').value;
    const category = document.getElementById('filter-category').value;
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;
    const sortBy = document.getElementById('sort-by').value;
    const sortOrder = document.getElementById('sort-order').value;

    let url = `/records?page=${currentPage}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    if (type) url += `&type=${type}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const res = await apiFetch(url);
    const tbody = document.getElementById('records-tbody');

    if (res.success) {
        const canEdit = isAdmin() || isAnalyst();
        const canDelete = isAdmin();

        if (res.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No records found</td></tr>';
        } else {
            tbody.innerHTML = res.data.map(record => `
                <tr>
                    <td>${formatDate(record.date)}</td>
                    <td style="font-weight: 500;">${record.category}</td>
                    <td><span class="badge badge-${record.type}">${record.type}</span></td>
                    <td style="color: ${record.type === 'INCOME' ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                        ${formatCurrency(record.amount)}
                    </td>
                    <td style="color: var(--text-muted); font-size: 14px;">${record.notes || '-'}</td>
                    <td>
                        ${canEdit ? `<button class="action-btn edit-btn" data-id="${record.id}" data-record='${JSON.stringify(record).replace(/'/g, "&#39;")}' >✏️</button>` : ''}
                        ${canDelete ? `<button class="action-btn delete delete-btn" data-id="${record.id}">🗑️</button>` : ''}
                        ${(!canEdit && !canDelete) ? '<span style="color: var(--text-muted); font-size: 12px;">Read-only</span>' : ''}
                    </td>
                </tr>
            `).join('');

            // Attach event listeners to dynamic buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const data = JSON.parse(e.currentTarget.getAttribute('data-record').replace(/&#39;/g, "'"));
                    showRecordModal(data);
                });
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    deleteRecord(id);
                });
            });
        }

        // Update pagination
        const meta = res.meta;
        document.getElementById('pagination-info').innerText = `Page ${meta.page} of ${meta.totalPages || 1} (${meta.total} total records)`;

        document.getElementById('btn-prev').disabled = meta.page <= 1;
        document.getElementById('btn-next').disabled = meta.page >= meta.totalPages;

        // Ensure UI stays synced with boundary limits
        if (currentPage > meta.totalPages && meta.totalPages > 0) {
            currentPage = meta.totalPages;
            loadRecords(); // Re-fetch at valid max page
        }

    } else {
        showToast(res.error, 'error');
    }
}

function showRecordModal(record = null) {
    const modalContainer = document.getElementById('modal-container');
    const isEdit = !!record;

    // Convert date string for the native datepicker input format (YYYY-MM-DD)
    let formattedDate = new Date().toISOString().split('T')[0];
    if (isEdit && record.date) {
        formattedDate = new Date(record.date).toISOString().split('T')[0];
    }

    modalContainer.innerHTML = `
        <div class="modal-overlay" id="record-modal">
            <div class="modal-content glass">
                <div class="modal-header">
                    <h2>${isEdit ? 'Edit Fund Entry' : 'Add Fund Entry'}</h2>
                    <button class="modal-close" id="close-modal">&times;</button>
                </div>
                <form id="record-form">
                    <div class="form-group">
                        <label>Amount (₹)</label>
                        <input type="number" id="rec-amount" class="form-control" step="0.01" required value="${isEdit ? record.amount : ''}">
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="rec-type" class="form-control" required>
                            <option value="INCOME" ${isEdit && record.type === 'INCOME' ? 'selected' : ''}>Donation</option>
                            <option value="EXPENSE" ${isEdit && record.type === 'EXPENSE' ? 'selected' : ''}>Expenditure</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <input type="text" id="rec-category" class="form-control" required placeholder="Education, Healthcare, Grant..." value="${isEdit ? record.category : ''}">
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="rec-date" class="form-control" required value="${formattedDate}">
                    </div>
                    <div class="form-group">
                        <label>Notes (Optional)</label>
                        <input type="text" id="rec-notes" class="form-control" placeholder="Any additional context..." value="${isEdit ? (record.notes || '') : ''}">
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" id="cancel-modal">Cancel</button>
                        <button type="submit" class="btn-primary" id="btn-save">${isEdit ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const closeHandler = () => { modalContainer.innerHTML = ''; };
    document.getElementById('close-modal').addEventListener('click', closeHandler);
    document.getElementById('cancel-modal').addEventListener('click', closeHandler);

    document.getElementById('record-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save');
        btn.innerHTML = '<span class="loader"></span>';
        btn.disabled = true;

        const payload = {
            amount: parseFloat(document.getElementById('rec-amount').value),
            type: document.getElementById('rec-type').value,
            category: document.getElementById('rec-category').value.trim(),
            date: new Date(document.getElementById('rec-date').value).toISOString(),
            notes: document.getElementById('rec-notes').value.trim() || undefined
        };

        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `/records/${record.id}` : `/records`;

        const res = await apiFetch(url, {
            method,
            body: JSON.stringify(payload)
        });

        if (res.success) {
            showToast(isEdit ? 'Record updated!' : 'Record created!', 'success');
            closeHandler();
            loadRecords(); // Re-fetch
        } else {
            showToast(res.error, 'error');
            btn.innerHTML = isEdit ? 'Update' : 'Create';
            btn.disabled = false;
        }
    });
}

async function deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;

    const res = await apiFetch(`/records/${id}`, { method: 'DELETE' });
    if (res.success) {
        showToast('Record deleted logically', 'success');
        loadRecords();
    } else {
        showToast(res.error, 'error');
    }
}
