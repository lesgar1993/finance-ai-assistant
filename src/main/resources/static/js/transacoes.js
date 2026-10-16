/**
 * transacoes.js — Finance AI v2
 */

const API_BASE = '';
let allTransactions = [];

// ── DOM refs ──
const transactionsBody  = document.getElementById('transactionsBody');
const txCount           = document.getElementById('txCount');
const filterType        = document.getElementById('filterType');
const filterCategory    = document.getElementById('filterCategory');
const filterSearch      = document.getElementById('filterSearch');
const btnClearFilters   = document.getElementById('btnClearFilters');
const modalOverlay      = document.getElementById('modalOverlay');
const modalTitle        = document.getElementById('modalTitle');
const btnNewTransaction = document.getElementById('btnNewTransaction');
const btnSave           = document.getElementById('btnSave');
const btnSaveLabel      = document.getElementById('btnSaveLabel');
const btnCancel         = document.getElementById('btnCancel');
const modalClose        = document.getElementById('modalClose');
const fieldId           = document.getElementById('fieldId');
const fieldDescription  = document.getElementById('fieldDescription');
const fieldAmount       = document.getElementById('fieldAmount');
const fieldDate         = document.getElementById('fieldDate');
const fieldType         = document.getElementById('fieldType');
const fieldCategory     = document.getElementById('fieldCategory');

// ── Toast ──
function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-msg">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

// ── Formatadores ──
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('pt-BR');
}

function todayISO() {
    return new Date().toISOString().substring(0, 10);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

const CATEGORIES = {
    SALARY:    { cls: 'badge-cat-salary',    label: 'Salário',      icon: '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' },
    FOOD:      { cls: 'badge-cat-food',      label: 'Alimentação',  icon: '<svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>' },
    TRANSPORT: { cls: 'badge-cat-transport', label: 'Transporte',   icon: '<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>' },
    HOUSING:   { cls: 'badge-cat-housing',   label: 'Moradia',      icon: '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    HEALTH:    { cls: 'badge-cat-health',    label: 'Saúde',        icon: '<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
    LEISURE:   { cls: 'badge-cat-leisure',   label: 'Lazer',        icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>' },
    OTHER:     { cls: 'badge-cat-other',     label: 'Outros',       icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
};

function categoryBadge(category) {
    const cat = CATEGORIES[category] || CATEGORIES.OTHER;
    return `<span class="badge ${cat.cls}">${cat.icon}${cat.label}</span>`;
}

// ── Type selector ──
document.querySelectorAll('.type-option').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.type-option').forEach(b => b.classList.remove('selected-income','selected-expense'));
        const val = btn.dataset.value;
        fieldType.value = val;
        btn.classList.add(val === 'INCOME' ? 'selected-income' : 'selected-expense');
    });
});

// ── Category grid ──
document.querySelectorAll('.cat-option').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        fieldCategory.value = btn.dataset.value;
    });
});

// ── Carregar transações ──
async function loadTransactions() {
    try {
        const res = await fetch(`${API_BASE}/transactions`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        allTransactions = await res.json();
        allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        applyFilters();
    } catch (err) {
        console.error(err);
        transactionsBody.innerHTML = `
            <tr class="empty-row"><td colspan="7">
                <div class="empty-state">
                    <div class="empty-state-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
                    <p>Não foi possível conectar à API</p>
                    <small>Verifique se o Spring Boot está rodando em localhost:8080</small>
                </div>
            </td></tr>`;
        showToast('Não foi possível conectar à API.', 'error', 6000);
    }
}

// ── Filtros ──
function applyFilters() {
    const typeVal   = filterType.value;
    const catVal    = filterCategory.value;
    const searchVal = filterSearch.value.trim().toLowerCase();

    const filtered = allTransactions.filter(tx => {
        return (!typeVal   || tx.type === typeVal)
            && (!catVal    || tx.category === catVal)
            && (!searchVal || tx.description.toLowerCase().includes(searchVal));
    });

    const total = allTransactions.length;
    const shown = filtered.length;
    txCount.textContent = total === shown ? `(${total})` : `(${shown} de ${total})`;

    renderTable(filtered);
}

filterType.addEventListener('change', applyFilters);
filterCategory.addEventListener('change', applyFilters);
filterSearch.addEventListener('input', applyFilters);

btnClearFilters.addEventListener('click', () => {
    filterType.value = '';
    filterCategory.value = '';
    filterSearch.value = '';
    applyFilters();
});

// ── Render tabela ──
function renderTable(transactions) {
    const incomeIcon  = `<svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;
    const expenseIcon = `<svg viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`;
    const editIcon    = `<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const deleteIcon  = `<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;

    if (transactions.length === 0) {
        const isFiltered = allTransactions.length > 0;
        transactionsBody.innerHTML = `
            <tr class="empty-row"><td colspan="7">
                <div class="empty-state">
                    <div class="empty-state-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
                    <p>${isFiltered ? 'Nenhum resultado para os filtros' : 'Nenhuma transação cadastrada'}</p>
                    <small>${isFiltered ? 'Tente limpar os filtros' : 'Clique em Nova transação para começar'}</small>
                </div>
            </td></tr>`;
        return;
    }

    transactionsBody.innerHTML = transactions.map(tx => {
        const isIncome = tx.type === 'INCOME';
        const typeBadge = isIncome
            ? `<span class="badge badge-income">${incomeIcon}Receita</span>`
            : `<span class="badge badge-expense">${expenseIcon}Despesa</span>`;

        return `
            <tr>
                <td class="text-muted text-small">${tx.id}</td>
                <td style="font-weight:500;">${escapeHtml(tx.description)}</td>
                <td>${categoryBadge(tx.category)}</td>
                <td class="${isIncome ? 'amount-income' : 'amount-expense'}">${isIncome ? '+' : '-'} ${formatCurrency(tx.amount)}</td>
                <td>${typeBadge}</td>
                <td class="text-muted text-small">${formatDate(tx.createdAt)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-table-action edit" onclick="openEditModal(${tx.id})" title="Editar">${editIcon}</button>
                        <button class="btn-table-action delete" onclick="confirmDelete(${tx.id}, '${escapeHtml(tx.description)}')" title="Excluir">${deleteIcon}</button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

// ── Modal ──
function resetModal() {
    fieldId.value = '';
    fieldDescription.value = '';
    fieldAmount.value = '';
    fieldDate.value = todayISO();
    fieldType.value = '';
    fieldCategory.value = '';
    document.querySelectorAll('.type-option').forEach(b => {
        b.classList.remove('selected-income','selected-expense');
        b.style.borderColor = '';
    });
    document.querySelectorAll('.cat-option').forEach(b => {
        b.classList.remove('selected');
        b.style.borderColor = '';
    });
    clearFieldErrors();
}

function openCreateModal() {
    modalTitle.textContent   = 'Nova transação';
    btnSaveLabel.textContent = 'Salvar';
    resetModal();
    modalOverlay.classList.add('active');
    fieldDescription.focus();
}

async function openEditModal(id) {
    try {
        const res = await fetch(`${API_BASE}/transactions/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const tx = await res.json();

        modalTitle.textContent   = 'Editar transação';
        btnSaveLabel.textContent = 'Atualizar';
        resetModal();

        fieldId.value          = tx.id;
        fieldDescription.value = tx.description;
        fieldAmount.value      = tx.amount;
        fieldDate.value        = tx.createdAt ? tx.createdAt.substring(0, 10) : todayISO();
        fieldType.value        = tx.type;
        fieldCategory.value    = tx.category;

        const typeBtn = document.querySelector(`.type-option[data-value="${tx.type}"]`);
        if (typeBtn) typeBtn.classList.add(tx.type === 'INCOME' ? 'selected-income' : 'selected-expense');

        const catBtn = document.querySelector(`.cat-option[data-value="${tx.category}"]`);
        if (catBtn) catBtn.classList.add('selected');

        modalOverlay.classList.add('active');
        fieldDescription.focus();
    } catch (err) {
        showToast('Erro ao buscar a transação.', 'error');
    }
}

function closeModal() {
    modalOverlay.classList.remove('active');
    clearFieldErrors();
}

modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
btnCancel.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
btnNewTransaction.addEventListener('click', openCreateModal);

// ── Validação ──
function clearFieldErrors() {
    [fieldDescription, fieldAmount, fieldDate].forEach(f => f.classList.remove('error'));
    document.querySelectorAll('.type-option').forEach(b => b.style.borderColor = '');
    document.querySelectorAll('.cat-option').forEach(b => b.style.borderColor = '');
}

function validateForm() {
    clearFieldErrors();
    let valid = true;
    if (!fieldDescription.value.trim()) { fieldDescription.classList.add('error'); valid = false; }
    if (!fieldAmount.value || parseFloat(fieldAmount.value) <= 0) { fieldAmount.classList.add('error'); valid = false; }
    if (!fieldDate.value) { fieldDate.classList.add('error'); valid = false; }
    if (!fieldType.value) {
        document.querySelectorAll('.type-option').forEach(b => b.style.borderColor = 'var(--red-expense)');
        valid = false;
    }
    if (!fieldCategory.value) {
        document.querySelectorAll('.cat-option').forEach(b => b.style.borderColor = 'var(--red-expense)');
        valid = false;
    }
    if (!valid) showToast('Preencha todos os campos obrigatórios.', 'error');
    return valid;
}

// ── Salvar ──
btnSave.addEventListener('click', async () => {
    if (!validateForm()) return;

    const body = {
        description: fieldDescription.value.trim(),
        amount:      parseFloat(fieldAmount.value),
        type:        fieldType.value,
        category:    fieldCategory.value
    };

    const isEditing = fieldId.value !== '';
    btnSaveLabel.textContent = isEditing ? 'Atualizando...' : 'Salvando...';
    btnSave.disabled = true;

    try {
        const url    = isEditing ? `${API_BASE}/transactions/${fieldId.value}` : `${API_BASE}/transactions`;
        const method = isEditing ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || err.error || `HTTP ${res.status}`);
        }

        closeModal();
        await loadTransactions();
        showToast(isEditing ? 'Transação atualizada!' : 'Transação cadastrada!', 'success');
    } catch (err) {
        showToast(`Erro: ${err.message}`, 'error');
    } finally {
        btnSaveLabel.textContent = isEditing ? 'Atualizar' : 'Salvar';
        btnSave.disabled = false;
    }
});

// ── Excluir ──
async function confirmDelete(id, description) {
    if (!confirm(`Excluir "${description}"?\n\nEsta ação não pode ser desfeita.`)) return;
    try {
        const res = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await loadTransactions();
        showToast('Transação excluída.', 'success');
    } catch (err) {
        showToast(`Erro ao excluir: ${err.message}`, 'error');
    }
}

document.addEventListener('DOMContentLoaded', loadTransactions);
