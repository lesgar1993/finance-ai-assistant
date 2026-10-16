/**
 * ai.js — Finance AI v2
 * Renderiza respostas com formatação rica (markdown light)
 */

const API_BASE = '';

const chatWindow  = document.getElementById('chatWindow');
const chatInput   = document.getElementById('chatInput');
const btnSend     = document.getElementById('btnSend');
const suggestions = document.getElementById('suggestions');

// ── Toast ──
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

// ── Timestamp ──
function nowTime() {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ── Timestamp da mensagem de boas-vindas ──
const welcomeTime = document.getElementById('welcomeTime');
if (welcomeTime) welcomeTime.textContent = nowTime();

// ── Auto-resize textarea ──
chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
});

// ── Formatador de markdown leve ──
/**
 * Converte texto plano com markdown leve em HTML formatado.
 * Suporta: **negrito**, *itálico*, - listas, ## títulos, R$ valores, \n
 */
function formatAiMessage(text) {
    let html = escapeHtml(text);

    // Negrito **texto** ou __texto__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Itálico *texto* ou _texto_
    html = html.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+?)_/g, '<em>$1</em>');

    // Títulos ## e ###
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');

    // Valores monetários — detecta padrões tipo "R$ 1.234,56" ou "R$1234"
    html = html.replace(/(R\$\s?[\d.,]+)/g, (match) => {
        // Tenta detectar se é receita ou despesa pelo contexto próximo
        return `<span class="ai-money">${match}</span>`;
    });

    // Listas com - ou •
    html = html.replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>(\n|$))+/g, (match) => `<ul>${match}</ul>`);

    // Listas numeradas
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Linha horizontal ---
    html = html.replace(/^---+$/gm, '<hr>');

    // Quebras de linha — preserva parágrafos mas remove dupla quebra desnecessária
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    // Envolve em parágrafo se não começar com tag
    if (!html.startsWith('<')) {
        html = `<p>${html}</p>`;
    }

    // Dicas (linhas que começam com 💡 ou "Dica:")
    html = html.replace(/(💡[^<\n]+)/g, '<div class="ai-tip">$1</div>');

    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(text)));
    return div.innerHTML;
}

// ── Avatar SVGs ──
const AI_AVATAR_SVG = `<svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><circle cx="9" cy="14" r="1" fill="white" stroke="none"/><circle cx="15" cy="14" r="1" fill="white" stroke="none"/></svg>`;
const USER_AVATAR_SVG = `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

// ── Renderizar mensagens ──
function appendUserMessage(text) {
    const time = nowTime();
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg-user';
    msg.innerHTML = `
        <div class="msg-avatar msg-avatar-user">${USER_AVATAR_SVG}</div>
        <div>
            <div class="msg-bubble msg-bubble-user">${escapeHtml(text)}</div>
            <span class="msg-time">${time}</span>
        </div>
    `;
    chatWindow.appendChild(msg);
    scrollToBottom();
}

function appendAiMessage(text) {
    const time = nowTime();
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg-ai';
    msg.innerHTML = `
        <div class="msg-avatar msg-avatar-ai">${AI_AVATAR_SVG}</div>
        <div>
            <div class="msg-bubble msg-bubble-ai">${formatAiMessage(text)}</div>
            <span class="msg-time">${time}</span>
        </div>
    `;
    chatWindow.appendChild(msg);
    scrollToBottom();
}

function appendErrorMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg-ai';
    msg.innerHTML = `
        <div class="msg-avatar msg-avatar-ai">${AI_AVATAR_SVG}</div>
        <div>
            <div class="msg-bubble msg-bubble-ai" style="border-left:3px solid var(--red-expense);">
                <strong style="color:var(--red-expense);">Ops, algo deu errado</strong><br>
                <span style="color:var(--gray-600);font-size:13px;">${escapeHtml(text)}</span>
            </div>
        </div>
    `;
    chatWindow.appendChild(msg);
    scrollToBottom();
}

// ── Typing indicator ──
let typingIndicator = null;

function showTypingIndicator() {
    typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-msg chat-msg-ai';
    typingIndicator.id = 'typingIndicator';
    typingIndicator.innerHTML = `
        <div class="msg-avatar msg-avatar-ai">${AI_AVATAR_SVG}</div>
        <div class="msg-bubble msg-bubble-ai" style="padding:14px 16px;">
            <div class="typing-dots"><span></span><span></span><span></span></div>
        </div>
    `;
    chatWindow.appendChild(typingIndicator);
    scrollToBottom();
}

function removeTypingIndicator() {
    if (typingIndicator) { typingIndicator.remove(); typingIndicator = null; }
}

// ── Scroll ──
function scrollToBottom() {
    setTimeout(() => { chatWindow.scrollTop = chatWindow.scrollHeight; }, 50);
}

// ── Enviar mensagem ──
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) { chatInput.focus(); return; }

    if (suggestions) suggestions.style.display = 'none';

    appendUserMessage(text);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    btnSend.disabled = true;
    showTypingIndicator();

    try {
        const url = `${API_BASE}/ai?message=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        removeTypingIndicator();

        if (!response.ok) throw new Error(`HTTP ${response.status} — ${response.statusText}`);

        const aiResponse = await response.text();
        if (!aiResponse || aiResponse.trim() === '') {
            appendAiMessage('Recebi sua mensagem, mas a resposta veio vazia. Tente novamente.');
        } else {
            appendAiMessage(aiResponse);
        }
    } catch (error) {
        removeTypingIndicator();
        console.error(error);
        appendErrorMessage('Verifique se o Spring Boot e o Ollama estão rodando corretamente.');
        showToast('Erro ao consultar o Assistente Pessoal.', 'error');
    } finally {
        btnSend.disabled = false;
        chatInput.focus();
    }
}

// ── Event listeners ──
btnSend.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        chatInput.value = chip.getAttribute('data-msg');
        chatInput.dispatchEvent(new Event('input'));
        sendMessage();
    });
});

// ── Init ──
document.addEventListener('DOMContentLoaded', () => { chatInput.focus(); });
