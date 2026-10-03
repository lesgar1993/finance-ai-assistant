/**
 * dashboard.js
 * Responsável por:
 *  - Carregar o resumo financeiro (GET /transactions/summary)
 *  - Listar as últimas transações (GET /transactions)
 *  - Criar uma nova transação   (POST /transactions)
 *  - Editar uma transação       (PUT /transactions/{id})
 *  - Excluir uma transação      (DELETE /transactions/{id})
 */

// ─────────────────────────────────────────────
// CONFIGURAÇÃO
// ─────────────────────────────────────────────

/**
 * API_BASE vazio = chamadas relativas à mesma origem.
 * Como o frontend está em src/main/resources/static, o Spring Boot
 * serve tudo em http://localhost:8080, então /transactions resolve
 * para http://localhost:8080/transactions automaticamente.
 */
const API_BASE = '';

// Quantas transações mostrar no dashboard (as mais recentes)
const DASHBOARD_LIMIT = 10;

// ─────────────────────────────────────────────
// REFERÊNCIAS AOS ELEMENTOS DO HTML
// ─────────────────────────────────────────────

const cardBalance      = document.getElementById('cardBalance');
const cardIncome       = document.getElementById('cardIncome');
const cardExpense      = document.getElementById('cardExpense');
const transactionsBody = document.getElementById('transactionsBody');

const modalOverlay     = document.getElementById('modalOverlay');
const modalTitle       = document.getElementById('modalTitle');
const btnNewTransaction= document.getElementById('btnNewTransaction');
const btnSave          = document.getElementById('btnSave');
const btnSaveLabel     = document.getElementById('btnSaveLabel');
const btnCancel        = document.getElementById('btnCancel');
const modalClose       = document.getElementById('modalClose');

const fieldId          = document.getElementById('fieldId');
const fieldDescription = document.getElementById('fieldDescription');
const fieldAmount      = document.getElementById('fieldAmount');
const fieldType        = document.getElementById('fieldType');
const fieldCategory    = document.getElementById('fieldCategory');

const sidebarToggle    = document.getElementById('sidebarToggle');
const sidebarOverlay   = document.getElementById('sidebarOverlay');
const sidebar          = document.getElementById('sidebar');

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
// TOAST — mensagens de feedback visual
// ─────────────────────────────────────────────

/**
 * Exibe uma mensagem flutuante no canto superior direito.
 * @param {string} message - Texto da mensagem
 * @param {'success'|'error'|'info'} type - Tipo visual
 * @param {number} duration - Tempo em ms antes de sumir (padrão 3500)
 */
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

    // Remove automaticamente após o tempo configurado
    setTimeout(() => toast.remove(), duration);
}

// ─────────────────────────────────────────────
// FORMATADORES
// ─────────────────────────────────────────────

/**
 * Formata um número como moeda brasileira.
 * Exemplo: 1500.5 → "R$ 1.500,50"
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Formata uma data ISO (ex: "2025-06-15T10:30:00") para "15/06/2025".
 */
function formatDate(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR');
}

/**
 * Retorna o rótulo em português para cada categoria do enum.
 */
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

// ─────────────────────────────────────────────
// CARREGAR RESUMO FINANCEIRO
// ─────────────────────────────────────────────

/**
 * Chama GET /transactions/summary e atualiza os 3 cards do topo.
 * A API retorna: { totalIncome, totalExpense, balance }
 */
async function loadSummary() {
    try {
        const response = await fetch(`${API_BASE}/transactions/summary`);

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }

        const data = await response.json();

        // Atualiza os cards com os valores formatados
        cardBalance.textContent = formatCurrency(data.balance);
        cardIncome.textContent  = formatCurrency(data.totalIncome);
        cardExpense.textContent = formatCurrency(data.totalExpense);

    } catch (error) {
        console.error('Erro ao carregar resumo:', error);
        cardBalance.textContent = 'Erro';
        cardIncome.textContent  = 'Erro';
        cardExpense.textContent = 'Erro';
        showToast('Não foi possível conectar à API. Verifique se o Spring Boot está rodando.', 'error', 6000);
    }
}

// ─────────────────────────────────────────────
// CARREGAR TRANSAÇÕES
// ─────────────────────────────────────────────

/**
 * Chama GET /transactions e renderiza as últimas DASHBOARD_LIMIT transações
 * na tabela do dashboard, ordenadas da mais recente para a mais antiga.
 */
async function loadTransactions() {
    try {
        const response = await fetch(`${API_BASE}/transactions`);

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }

        const all = await response.json();

        // Ordena por data decrescente (mais recente primeiro)
        const sorted = all.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Pega só as últimas DASHBOARD_LIMIT
        const transactions = sorted.slice(0, DASHBOARD_LIMIT);

        renderTable(transactions);

    } catch (error) {
        console.error('Erro ao carregar transações:', error);
        transactionsBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <span class="empty-icon">⚠️</span>
                    Não foi possível conectar à API. Verifique se o Spring Boot está rodando na porta 8080.
                </td>
            </tr>
        `;
        showToast('Não foi possível conectar à API.', 'error', 6000);
    }
}

/**
 * Renderiza um array de transações no tbody da tabela.
 * @param {Array} transactions - Array de objetos Transaction da API
 */
function renderTable(transactions) {
    if (transactions.length === 0) {
        transactionsBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <span class="empty-icon">📋</span>
                    Nenhuma transação cadastrada ainda.<br />
                    <small>Clique em <strong>"+ Nova transação"</strong> para começar.</small>
                </td>
            </tr>
        `;
        return;
    }

    // Constrói as linhas HTML e injeta no tbody de uma vez (mais performático)
    transactionsBody.innerHTML = transactions.map(tx => {
        const isIncome = tx.type === 'INCOME';

        const typeBadge = isIncome
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
                            title="Editar transação"
                        >✏️ Editar</button>
                        <button
                            class="btn btn-danger btn-sm"
                            onclick="confirmDelete(${tx.id}, '${escapeHtml(tx.description)}')"
                            title="Excluir transação"
                        >🗑️ Excluir</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Escapa caracteres HTML para evitar XSS ao inserir dados da API no DOM.
 * Importante: nunca confie em dados vindos de fora sem escapar.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

// ─────────────────────────────────────────────
// MODAL — ABRIR / FECHAR
// ─────────────────────────────────────────────

/** Abre o modal para criar uma nova transação (campos vazios). */
function openCreateModal() {
    modalTitle.textContent    = 'Nova transação';
    btnSaveLabel.textContent  = 'Salvar';
    fieldId.value             = '';
    fieldDescription.value   = '';
    fieldAmount.value         = '';
    fieldType.value           = '';
    fieldCategory.value       = '';

    // Remove erros visuais de validações anteriores
    clearFieldErrors();

    modalOverlay.classList.add('active');
    fieldDescription.focus();
}

/**
 * Abre o modal preenchido com os dados de uma transação existente.
 * Faz GET /transactions/{id} para obter os dados atuais.
 * @param {number} id - ID da transação
 */
async function openEditModal(id) {
    try {
        const response = await fetch(`${API_BASE}/transactions/${id}`);

        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

        const tx = await response.json();

        modalTitle.textContent    = 'Editar transação';
        btnSaveLabel.textContent  = 'Atualizar';
        fieldId.value             = tx.id;
        fieldDescription.value   = tx.description;
        fieldAmount.value         = tx.amount;
        fieldType.value           = tx.type;
        fieldCategory.value       = tx.category;

        clearFieldErrors();
        modalOverlay.classList.add('active');
        fieldDescription.focus();

    } catch (error) {
        console.error('Erro ao buscar transação:', error);
        showToast('Erro ao buscar os dados da transação.', 'error');
    }
}

/** Fecha o modal e limpa os campos. */
function closeModal() {
    modalOverlay.classList.remove('active');
    clearFieldErrors();
}

// Fecha clicando fora do modal
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

btnCancel.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
btnNewTransaction.addEventListener('click', openCreateModal);

// ─────────────────────────────────────────────
// VALIDAÇÃO DO FORMULÁRIO
// ─────────────────────────────────────────────

/** Limpa os estados de erro de todos os campos do formulário. */
function clearFieldErrors() {
    [fieldDescription, fieldAmount, fieldType, fieldCategory].forEach(f => {
        f.classList.remove('error');
    });
}

/**
 * Valida os campos do formulário antes de enviar.
 * Retorna true se válido, false se houver algum campo inválido.
 * Aplica a classe CSS 'error' nos campos problemáticos.
 */
function validateForm() {
    clearFieldErrors();
    let valid = true;

    if (!fieldDescription.value.trim()) {
        fieldDescription.classList.add('error');
        valid = false;
    }

    if (!fieldAmount.value || parseFloat(fieldAmount.value) <= 0) {
        fieldAmount.classList.add('error');
        valid = false;
    }

    if (!fieldType.value) {
        fieldType.classList.add('error');
        valid = false;
    }

    if (!fieldCategory.value) {
        fieldCategory.classList.add('error');
        valid = false;
    }

    if (!valid) {
        showToast('Preencha todos os campos obrigatórios.', 'error');
    }

    return valid;
}

// ─────────────────────────────────────────────
// SALVAR (criar ou atualizar)
// ─────────────────────────────────────────────

btnSave.addEventListener('click', async () => {
    if (!validateForm()) return;

    // Monta o objeto que a API espera (mesmo formato do TransactionDTO)
    const body = {
        description: fieldDescription.value.trim(),
        amount:      parseFloat(fieldAmount.value),
        type:        fieldType.value,      // "INCOME" ou "EXPENSE"
        category:    fieldCategory.value   // "FOOD", "SALARY", etc.
    };

    const isEditing = fieldId.value !== '';

    // Feedback visual no botão
    btnSaveLabel.textContent = isEditing ? 'Atualizando...' : 'Salvando...';
    btnSave.disabled = true;

    try {
        let response;

        if (isEditing) {
            // ── PUT /transactions/{id} ──
            response = await fetch(`${API_BASE}/transactions/${fieldId.value}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else {
            // ── POST /transactions ──
            response = await fetch(`${API_BASE}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }

        if (!response.ok) {
            // Tenta extrair mensagem de erro do Spring Boot
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.message || errData.error || `Erro HTTP ${response.status}`;
            throw new Error(errMsg);
        }

        closeModal();

        // Atualiza a tabela e os cards
        await Promise.all([loadSummary(), loadTransactions()]);

        showToast(
            isEditing ? 'Transação atualizada com sucesso!' : 'Transação cadastrada com sucesso!',
            'success'
        );

    } catch (error) {
        console.error('Erro ao salvar transação:', error);
        showToast(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} transação: ${error.message}`, 'error');
    } finally {
        // Restaura o botão independente de sucesso ou erro
        btnSaveLabel.textContent = isEditing ? 'Atualizar' : 'Salvar';
        btnSave.disabled = false;
    }
});

// ─────────────────────────────────────────────
// EXCLUIR
// ─────────────────────────────────────────────

/**
 * Pede confirmação e deleta a transação.
 * Usa confirm() nativo do browser (simples para fins de estudo).
 * @param {number} id - ID da transação
 * @param {string} description - Descrição para exibir na confirmação
 */
async function confirmDelete(id, description) {
    const confirmed = confirm(`Excluir a transação "${description}"?\n\nEsta ação não pode ser desfeita.`);
    if (!confirmed) return;

    try {
        // ── DELETE /transactions/{id} ──
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }

        // Atualiza a interface após deletar
        await Promise.all([loadSummary(), loadTransactions()]);

        showToast('Transação excluída com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao excluir transação:', error);
        showToast(`Erro ao excluir transação: ${error.message}`, 'error');
    }
}

// ─────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────

/**
 * Ponto de entrada: carrega os dados ao abrir a página.
 * Usa Promise.all para buscar resumo e transações em paralelo,
 * o que é mais rápido do que buscar um após o outro.
 */
async function init() {
    await Promise.all([loadSummary(), loadTransactions()]);
}

// Executa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
