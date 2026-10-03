/**
 * transacoes.js
 * Responsável por:
 *  - Listar TODAS as transações    (GET /transactions)
 *  - Filtrar localmente por tipo, categoria e busca por texto
 *  - Criar nova transação          (POST /transactions)
 *  - Editar transação              (PUT /transactions/{id})
 *  - Excluir transação             (DELETE /transactions/{id})
 *
 * Nota sobre filtros: os filtros NÃO fazem novas requisições à API.
 * Eles filtram o array que já foi carregado em memória. Isso é mais
 * eficiente para listas pequenas/médias e mais fácil de entender.
 */

// ─────────────────────────────────────────────
// CONFIGURAÇÃO
// ─────────────────────────────────────────────

const API_BASE = 'http://localhost:8080';

// ─────────────────────────────────────────────
// ESTADO LOCAL
// ─────────────────────────────────────────────

/**
 * Armazena todas as transações carregadas da API.
 * Os filtros trabalham sobre este array sem buscar novamente.
 */
let allTransactions = [];

// ─────────────────────────────────────────────
// REFERÊNCIAS AOS ELEMENTOS DO HTML
// ─────────────────────────────────────────────

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
const fieldType         = document.getElementById('fieldType');
const fieldCategory     = document.getElementById('fieldCategory');

const sidebarToggle     = document.getElementById('sidebarToggle');
const sidebarOverlay    = document.getElementById('sidebarOverlay');
const sidebar           = document.getElementById('sidebar');

// ─────────────────────────────────────────────
// SIDEBAR MOBILE
// ─────────────────────────────────────────────

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
});

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// FORMATADORES
// ─────────────────────────────────────────────

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('pt-BR');
}

function categoryLabel(category) {
    const labels = {
        FOOD:      '🍔 Alimentação',
        TRANSPORT: '🚗 Transporte',
        HOUSING:   '🏠 Moradia',
        HEALTH:    '💊 Saúde',
        LEISURE:   '🎮 Lazer',
        SALARY:    '💼 Salário',
        OTHER:     '📦 Outros'
    };
    return labels[category] || category;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

// ─────────────────────────────────────────────
// CARREGAR TRANSAÇÕES DA API
// ─────────────────────────────────────────────

/**
 * Busca todas as transações em GET /transactions,
 * armazena em allTransactions e renderiza a tabela.
 */
async function loadTransactions() {
    try {
        const response = await fetch(`${API_BASE}/transactions`);

        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

        allTransactions = await response.json();

        // Ordena da mais recente para a mais antiga
        allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Renderiza com os filtros atuais (que começam em branco)
        applyFilters();

    } catch (error) {
        console.error('Erro ao carregar transações:', error);
        transactionsBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <span class="empty-icon">⚠️</span>
                    Não foi possível conectar à API.<br />
                    <small>Verifique se o Spring Boot está rodando em <code>localhost:8080</code>.</small>
                </td>
            </tr>
        `;
        showToast('Não foi possível conectar à API.', 'error', 6000);
    }
}

// ─────────────────────────────────────────────
// FILTROS LOCAIS
// ─────────────────────────────────────────────

/**
 * Aplica os filtros ao array allTransactions (sem nova requisição)
 * e re-renderiza a tabela com o subconjunto filtrado.
 *
 * Filtros disponíveis:
 *  - Tipo (INCOME / EXPENSE / todos)
 *  - Categoria (enum / todos)
 *  - Busca por texto na descrição (case-insensitive)
 */
function applyFilters() {
    const typeVal     = filterType.value;
    const catVal      = filterCategory.value;
    const searchVal   = filterSearch.value.trim().toLowerCase();

    const filtered = allTransactions.filter(tx => {
        const matchType   = !typeVal   || tx.type === typeVal;
        const matchCat    = !catVal    || tx.category === catVal;
        const matchSearch = !searchVal || tx.description.toLowerCase().includes(searchVal);
        return matchType && matchCat && matchSearch;
    });

    // Atualiza o contador de registros exibidos
    const total = allTransactions.length;
    const shown = filtered.length;
    txCount.textContent = total === shown
        ? `(${total} registros)`
        : `(${shown} de ${total} registros)`;

    renderTable(filtered);
}

// Ouve mudanças nos filtros em tempo real
filterType.addEventListener('change', applyFilters);
filterCategory.addEventListener('change', applyFilters);
filterSearch.addEventListener('input', applyFilters);  // reage a cada tecla digitada

// Botão limpar filtros
btnClearFilters.addEventListener('click', () => {
    filterType.value     = '';
    filterCategory.value = '';
    filterSearch.value   = '';
    applyFilters();
});

// ─────────────────────────────────────────────
// RENDERIZAR TABELA
// ─────────────────────────────────────────────

function renderTable(transactions) {
    if (transactions.length === 0) {
        const msg = allTransactions.length === 0
            ? `<span class="empty-icon">📋</span>
               Nenhuma transação cadastrada.<br />
               <small>Clique em <strong>"+ Nova transação"</strong> para começar.</small>`
            : `<span class="empty-icon">🔍</span>
               Nenhuma transação encontrada para os filtros aplicados.<br />
               <small>Tente limpar os filtros ou alterar a busca.</small>`;

        transactionsBody.innerHTML = `<tr class="empty-row"><td colspan="7">${msg}</td></tr>`;
        return;
    }

    transactionsBody.innerHTML = transactions.map(tx => {
        const isIncome    = tx.type === 'INCOME';
        const typeBadge   = isIncome
            ? '<span class="badge badge-income">📈 Receita</span>'
            : '<span class="badge badge-expense">📉 Despesa</span>';
        const amountClass = isIncome ? 'amount-income' : 'amount-expense';
        const amountSign  = isIncome ? '+' : '-';

        return `
            <tr>
                <td class="text-muted text-small">${tx.id}</td>
                <td>${escapeHtml(tx.description)}</td>
                <td><span class="badge badge-category">${categoryLabel(tx.category)}</span></td>
                <td class="${amountClass}">${amountSign} ${formatCurrency(tx.amount)}</td>
                <td>${typeBadge}</td>
                <td class="text-muted text-small">${formatDate(tx.createdAt)}</td>
                <td>
                    <div class="table-actions">
                        <button
                            class="btn btn-secondary btn-sm"
                            onclick="openEditModal(${tx.id})"
                            title="Editar"
                        >✏️ Editar</button>
                        <button
                            class="btn btn-danger btn-sm"
                            onclick="confirmDelete(${tx.id}, '${escapeHtml(tx.description)}')"
                            title="Excluir"
                        >🗑️ Excluir</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ─────────────────────────────────────────────
// MODAL — ABRIR / FECHAR
// ─────────────────────────────────────────────

function openCreateModal() {
    modalTitle.textContent   = 'Nova transação';
    btnSaveLabel.textContent = 'Salvar';
    fieldId.value            = '';
    fieldDescription.value  = '';
    fieldAmount.value        = '';
    fieldType.value          = '';
    fieldCategory.value      = '';
    clearFieldErrors();
    modalOverlay.classList.add('active');
    fieldDescription.focus();
}

async function openEditModal(id) {
    try {
        const response = await fetch(`${API_BASE}/transactions/${id}`);
        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

        const tx = await response.json();

        modalTitle.textContent   = 'Editar transação';
        btnSaveLabel.textContent = 'Atualizar';
        fieldId.value            = tx.id;
        fieldDescription.value  = tx.description;
        fieldAmount.value        = tx.amount;
        fieldType.value          = tx.type;
        fieldCategory.value      = tx.category;

        clearFieldErrors();
        modalOverlay.classList.add('active');
        fieldDescription.focus();

    } catch (error) {
        console.error('Erro ao buscar transação:', error);
        showToast('Erro ao buscar os dados da transação.', 'error');
    }
}

function closeModal() {
    modalOverlay.classList.remove('active');
    clearFieldErrors();
}

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

btnCancel.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
btnNewTransaction.addEventListener('click', openCreateModal);

// ─────────────────────────────────────────────
// VALIDAÇÃO
// ─────────────────────────────────────────────

function clearFieldErrors() {
    [fieldDescription, fieldAmount, fieldType, fieldCategory].forEach(f => {
        f.classList.remove('error');
    });
}

function validateForm() {
    clearFieldErrors();
    let valid = true;

    if (!fieldDescription.value.trim()) { fieldDescription.classList.add('error'); valid = false; }
    if (!fieldAmount.value || parseFloat(fieldAmount.value) <= 0) { fieldAmount.classList.add('error'); valid = false; }
    if (!fieldType.value)    { fieldType.classList.add('error');    valid = false; }
    if (!fieldCategory.value){ fieldCategory.classList.add('error'); valid = false; }

    if (!valid) showToast('Preencha todos os campos obrigatórios.', 'error');
    return valid;
}

// ─────────────────────────────────────────────
// SALVAR (criar ou atualizar)
// ─────────────────────────────────────────────

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
        let response;

        if (isEditing) {
            // PUT /transactions/{id}
            response = await fetch(`${API_BASE}/transactions/${fieldId.value}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else {
            // POST /transactions
            response = await fetch(`${API_BASE}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || errData.error || `Erro HTTP ${response.status}`);
        }

        closeModal();

        // Recarrega a lista completa para refletir a alteração
        await loadTransactions();

        showToast(
            isEditing ? 'Transação atualizada com sucesso!' : 'Transação cadastrada com sucesso!',
            'success'
        );

    } catch (error) {
        console.error('Erro ao salvar:', error);
        showToast(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'}: ${error.message}`, 'error');
    } finally {
        btnSaveLabel.textContent = isEditing ? 'Atualizar' : 'Salvar';
        btnSave.disabled = false;
    }
});

// ─────────────────────────────────────────────
// EXCLUIR
// ─────────────────────────────────────────────

async function confirmDelete(id, description) {
    const confirmed = confirm(`Excluir a transação "${description}"?\n\nEsta ação não pode ser desfeita.`);
    if (!confirmed) return;

    try {
        // DELETE /transactions/{id}
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

        await loadTransactions();
        showToast('Transação excluída com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao excluir:', error);
        showToast(`Erro ao excluir: ${error.message}`, 'error');
    }
}

// ─────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', loadTransactions);
