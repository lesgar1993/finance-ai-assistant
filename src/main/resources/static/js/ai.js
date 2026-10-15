/**
 * ai.js
 * Responsável por:
 *  - Enviar perguntas para a IA  (GET /ai?message=...)
 *  - Renderizar mensagens do usuário e da IA no chat
 *  - Mostrar indicador de "digitando..." enquanto aguarda resposta
 *  - Lidar com chips de sugestão
 *  - Auto-resize do textarea conforme o usuário digita
 *
 * Endpoint usado: GET /ai?message={texto}
 * A API retorna uma string com a resposta da IA (texto puro).
 */

// ─────────────────────────────────────────────
// CONFIGURAÇÃO
// ─────────────────────────────────────────────

// API_BASE vazio = mesma origem (Spring Boot em localhost:8080)
const API_BASE = '';

// ─────────────────────────────────────────────
// REFERÊNCIAS AOS ELEMENTOS DO HTML
// ─────────────────────────────────────────────

const chatWindow  = document.getElementById('chatWindow');
const chatInput   = document.getElementById('chatInput');
const btnSend     = document.getElementById('btnSend');
const suggestions = document.getElementById('suggestions');

const sidebarToggle  = document.getElementById('sidebarToggle');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebar        = document.getElementById('sidebar');

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

function showToast(message, type = 'info', duration = 4000) {
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
// AUTO-RESIZE DO TEXTAREA
// ─────────────────────────────────────────────

/**
 * Ajusta a altura do textarea dinamicamente conforme o conteúdo cresce.
 * Limita a altura máxima via CSS (max-height: 120px definido no style.css).
 */
chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
});

// ─────────────────────────────────────────────
// RENDERIZAR MENSAGENS NO CHAT
// ─────────────────────────────────────────────

/**
 * Adiciona uma mensagem do USUÁRIO ao chat.
 * @param {string} text - Texto digitado pelo usuário
 */
function appendUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg-user';
    msg.innerHTML = `
        <div class="msg-avatar msg-avatar-user">👤</div>
        <div class="msg-bubble msg-bubble-user">${escapeHtml(text)}</div>
    `;
    chatWindow.appendChild(msg);
    scrollToBottom();
}

/**
 * Adiciona uma mensagem da IA ao chat.
 * Converte quebras de linha em <br> para melhor legibilidade.
 * @param {string} text - Texto da resposta da IA
 */
function appendAiMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg-ai';

    // Converte \n em <br> para respeitar parágrafos na resposta
    const formatted = escapeHtml(text).replace(/\n/g, '<br />');

    msg.innerHTML = `
        <div class="msg-avatar msg-avatar-ai">🤖</div>
        <div class="msg-bubble msg-bubble-ai">${formatted}</div>
    `;
    chatWindow.appendChild(msg);
    scrollToBottom();
}

/**
 * Adiciona uma mensagem de ERRO da IA ao chat,
 * visualmente diferenciada com tom vermelho.
 * @param {string} text - Mensagem de erro
 */
function appendErrorMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg-ai';
    msg.innerHTML = `
        <div class="msg-avatar msg-avatar-ai">🤖</div>
        <div class="msg-bubble msg-bubble-ai" style="border-left: 3px solid var(--red-expense); color: var(--red-expense);">
            ⚠️ ${escapeHtml(text)}
        </div>
    `;
    chatWindow.appendChild(msg);
    scrollToBottom();
}

// ─────────────────────────────────────────────
// INDICADOR DE "DIGITANDO..."
// ─────────────────────────────────────────────

/** Referência ao elemento de typing indicator (para poder removê-lo depois). */
let typingIndicator = null;

/** Mostra os três pontos animados enquanto a IA processa a resposta. */
function showTypingIndicator() {
    typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-msg chat-msg-ai';
    typingIndicator.id = 'typingIndicator';
    typingIndicator.innerHTML = `
        <div class="msg-avatar msg-avatar-ai">🤖</div>
        <div class="msg-bubble msg-bubble-ai">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatWindow.appendChild(typingIndicator);
    scrollToBottom();
}

/** Remove o indicador de "digitando..." após receber a resposta. */
function removeTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.remove();
        typingIndicator = null;
    }
}

// ─────────────────────────────────────────────
// SCROLL AUTOMÁTICO
// ─────────────────────────────────────────────

/** Rola o chat para mostrar sempre a mensagem mais recente. */
function scrollToBottom() {
    // Pequeno delay para garantir que o DOM foi atualizado antes do scroll
    setTimeout(() => {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 50);
}

// ─────────────────────────────────────────────
// ESCAPE HTML (segurança)
// ─────────────────────────────────────────────

function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(text)));
    return div.innerHTML;
}

// ─────────────────────────────────────────────
// ENVIAR MENSAGEM PARA A IA
// ─────────────────────────────────────────────

/**
 * Ponto central do chat:
 *  1. Pega o texto do input
 *  2. Valida que não está vazio
 *  3. Renderiza a mensagem do usuário
 *  4. Mostra o indicador de typing
 *  5. Faz GET /ai?message={texto}
 *  6. Remove o typing e mostra a resposta (ou erro)
 *
 * O endpoint /ai retorna texto puro (não JSON), por isso usamos
 * response.text() em vez de response.json().
 */
async function sendMessage() {
    const text = chatInput.value.trim();

    if (!text) {
        chatInput.focus();
        return;
    }

    // Esconde os chips de sugestão após a primeira mensagem enviada
    // (deixa o chat mais limpo)
    if (suggestions) suggestions.style.display = 'none';

    // Renderiza a mensagem do usuário imediatamente
    appendUserMessage(text);

    // Limpa e redefine o textarea
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Desabilita o envio durante o processamento
    btnSend.disabled = true;

    // Mostra "digitando..."
    showTypingIndicator();

    try {
        /**
         * GET /ai?message={texto}
         *
         * Usamos encodeURIComponent para garantir que caracteres especiais
         * (acentos, espaços, ?, &) sejam codificados corretamente na URL.
         *
         * Exemplo: "Quanto gastei?" → "Quanto%20gastei%3F"
         */
        const url = `${API_BASE}/ai?message=${encodeURIComponent(text)}`;
        const response = await fetch(url);

        removeTypingIndicator();

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status} — ${response.statusText}`);
        }

        // A API retorna texto puro (String), não JSON
        const aiResponse = await response.text();

        if (!aiResponse || aiResponse.trim() === '') {
            appendAiMessage('Recebi sua mensagem, mas a resposta veio vazia. Tente novamente.');
        } else {
            appendAiMessage(aiResponse);
        }

    } catch (error) {
        removeTypingIndicator();
        console.error('Erro ao consultar a Finance AI:', error);

        // Exibe o erro no próprio chat (mais amigável que só um toast)
        appendErrorMessage(
            'Erro ao consultar a Finance AI. Verifique se o Spring Boot e o Ollama estão rodando.'
        );

        showToast('Erro ao consultar a Finance AI.', 'error');
    } finally {
        // Sempre reabilita o botão de envio
        btnSend.disabled = false;
        chatInput.focus();
    }
}

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────

// Clique no botão "Enviar"
btnSend.addEventListener('click', sendMessage);

/**
 * Teclado no textarea:
 *  - Enter puro → envia a mensagem
 *  - Shift + Enter → insere uma nova linha (comportamento padrão)
 */
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // impede a quebra de linha
        sendMessage();
    }
});

/**
 * Chips de sugestão: ao clicar, preenche o input e envia automaticamente.
 * O atributo data-msg no HTML contém o texto da sugestão.
 */
document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const msg = chip.getAttribute('data-msg');
        chatInput.value = msg;
        // Aciona o auto-resize para mostrar o texto no textarea
        chatInput.dispatchEvent(new Event('input'));
        sendMessage();
    });
});

// ─────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Foca no campo de input ao abrir a página
    chatInput.focus();
});
