import { apiFetch } from './api.js';
import { formatCurrency, formatDate } from './utils.js';

export async function renderDashboard() {
    const container = document.getElementById('page-content');

    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Dashboard</h1>
        </div>

        <div class="dashboard-grid">
            <div class="stat-card glass">
                <div class="stat-icon">🤝</div>
                <div class="stat-details">
                    <h3>Total Donations</h3>
                    <p id="dash-income"><span class="loader"></span></p>
                </div>
            </div>
            <div class="stat-card glass">
                <div class="stat-icon">📊</div>
                <div class="stat-details">
                    <h3>Total Expenditures</h3>
                    <p id="dash-expense"><span class="loader"></span></p>
                </div>
            </div>
            <div class="stat-card glass">
                <div class="stat-icon">💰</div>
                <div class="stat-details">
                    <h3>Fund Balance</h3>
                    <p id="dash-net"><span class="loader"></span></p>
                </div>
            </div>
        </div>

        <div class="app-layout" style="display:flex; flex-direction: column; gap: 40px; min-height: unset; padding: 0;">
            <div class="glass" style="width: 100%; padding: 24px; border-radius: var(--radius-lg);">
                <h3 style="margin-bottom: 24px; font-weight: 500;">Monthly Fund Trends</h3>
                <div id="dash-trends" class="trends-container">
                    <div style="text-align: center; padding: 40px;"><span class="loader"></span></div>
                </div>
                <div class="trends-legend" style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 12px; height: 12px; background: var(--success); border-radius: 2px;"></div>
                        <span style="font-size: 14px; color: var(--text-muted);">Donations</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 12px; height: 12px; background: var(--danger); border-radius: 2px;"></div>
                        <span style="font-size: 14px; color: var(--text-muted);">Expenditures</span>
                    </div>
                </div>
            </div>

            <div style="display:flex; gap: 40px; width: 100%;">
                <div class="glass" style="flex:1; padding: 24px; border-radius: var(--radius-lg);">
                    <h3 style="margin-bottom: 24px; font-weight: 500;">Recent Activities</h3>
                    <div class="data-table-wrapper" style="border: none; background: transparent;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody id="dash-recent-tbody">
                                <tr><td colspan="4" style="text-align: center;"><span class="loader"></span></td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="glass" style="width: 350px; padding: 24px; border-radius: var(--radius-lg);">
                    <h3 style="margin-bottom: 24px; font-weight: 500;">Category Breakdown</h3>
                    <div class="category-bars" id="dash-categories">
                        <div style="text-align: center; padding: 20px;"><span class="loader"></span></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Fetch data concurrently
    loadSummary();
    loadTrends();
    loadRecent();
    loadCategories();
}

async function loadSummary() {
    const res = await apiFetch('/dashboard/summary');
    if (res.success) {
        document.getElementById('dash-income').innerText = formatCurrency(res.data.totalIncome);
        document.getElementById('dash-expense').innerText = formatCurrency(res.data.totalExpenses);
        const netEl = document.getElementById('dash-net');
        netEl.innerText = formatCurrency(Math.abs(res.data.netBalance));
        if (res.data.netBalance < 0) {
            netEl.style.color = 'var(--danger)';
            netEl.innerText = '-' + netEl.innerText;
        } else {
            netEl.style.color = 'var(--text-main)';
        }
    } else {
        document.getElementById('dash-income').innerText = '₹0';
        document.getElementById('dash-expense').innerText = '₹0';
        document.getElementById('dash-net').innerText = '₹0';
    }
}

async function loadRecent() {
    const res = await apiFetch('/dashboard/recent');
    const tbody = document.getElementById('dash-recent-tbody');

    if (res.success && res.data.length > 0) {
        tbody.innerHTML = res.data.map(record => `
            <tr>
                <td>${formatDate(record.date)}</td>
                <td style="font-weight: 500;">${record.category}</td>
                <td><span class="badge badge-${record.type}">${record.type}</span></td>
                <td style="color: ${record.type === 'INCOME' ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                    ${record.type === 'INCOME' ? '+' : '-'}${formatCurrency(record.amount)}
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No recent transactions</td></tr>';
    }
}

async function loadCategories() {
    const res = await apiFetch('/dashboard/category-totals');
    const container = document.getElementById('dash-categories');

    if (res.success && res.data.length > 0) {
        // Find max total for proportional bar rendering
        const max = Math.max(...res.data.map(item => item.total));

        container.innerHTML = res.data.map(item => {
            const barClass = item.type === 'INCOME' ? 'income' : 'expense';
            return `
                <div class="category-bar-item">
                    <div class="bar-header">
                        <span>${item.category}</span>
                        <span style="color: var(--text-muted);">${formatCurrency(item.total)}</span>
                    </div>
                    <div class="bar-track">
                        <div class="bar-fill ${barClass}" style="width: 0%"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Trigger animation
        setTimeout(() => {
            const fills = document.querySelectorAll('.bar-fill');
            res.data.forEach((item, i) => {
                const percentage = Math.max((item.total / max) * 100, 2);
                fills[i].style.width = percentage + '%';
            });
        }, 10);

    } else {
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted);">No category data</div>';
    }
}

async function loadTrends() {
    const res = await apiFetch('/dashboard/trends');
    const container = document.getElementById('dash-trends');

    if (res.success && res.data.length > 0) {
        const maxVal = Math.max(...res.data.flatMap(d => [d.income, d.expense])) || 1;

        container.innerHTML = `
            <div class="trends-chart">
                ${res.data.map(item => `
                    <div class="trend-group">
                        <div class="trend-bars">
                            <div class="trend-bar income" style="height: 0%" title="Income: ${formatCurrency(item.income)}"></div>
                            <div class="trend-bar expense" style="height: 0%" title="Expense: ${formatCurrency(item.expense)}"></div>
                        </div>
                        <span class="trend-label">${item.month}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Trigger animation with a slight delay to ensure DOM is ready and transition registers
        setTimeout(() => {
            const incomeBars = container.querySelectorAll('.trend-bar.income');
            const expenseBars = container.querySelectorAll('.trend-bar.expense');

            // Force reflow for reliable animation trigger
            if (incomeBars.length > 0) incomeBars[0].offsetHeight;

            res.data.forEach((item, i) => {
                const incomePercent = Math.max((item.income / maxVal) * 100, 2);
                const expensePercent = Math.max((item.expense / maxVal) * 100, 2);

                if (incomeBars[i]) incomeBars[i].style.height = incomePercent + '%';
                if (expenseBars[i]) expenseBars[i].style.height = expensePercent + '%';
            });
        }, 30);

    } else {
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">Insufficient data for trends</div>';
    }
}
