// ====== GEMINI CHAT ======
// Módulo separado para comunicação com a API do Google Gemini

class GeminiChat {
    constructor() {
        this.history = [];
        this.apiKey = '';
        this.model = 'gemini-2.5-flash'; // Atualizado para a série 2.5
        this.abortController = null;
        this.lastMessageTime = 0;
        this.dailyQuotaLimit = 50;
    }

    // Gerencia cota diária no localStorage
    checkDailyQuota() {
        const today = new Date().toDateString();
        const quotaData = JSON.parse(localStorage.getItem('sp_gemini_quota') || '{"date":"","count":0}');

        if (quotaData.date !== today) {
            quotaData.date = today;
            quotaData.count = 0;
        }

        if (quotaData.count >= this.dailyQuotaLimit) {
            return { ok: false, count: quotaData.count };
        }

        return { ok: true, count: quotaData.count };
    }

    incrementQuota() {
        const today = new Date().toDateString();
        const quotaData = JSON.parse(localStorage.getItem('sp_gemini_quota') || `{"date":"${today}","count":0}`);
        quotaData.count++;
        localStorage.setItem('sp_gemini_quota', JSON.stringify(quotaData));
    }

    // Para a geração atual
    stopGeneration() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
            return true;
        }
        return false;
    }

    // Carrega config do localStorage (chamado a cada envio para pegar atualizações)
    loadConfig() {
        try {
            const saved = localStorage.getItem('sp_config');
            if (saved) {
                const cfg = JSON.parse(saved);
                this.apiKey = cfg.geminiApiKey || '';
                this.model = cfg.geminiModel || 'gemini-2.0-flash';
            }
        } catch (e) {
            console.warn('Erro ao carregar config Gemini:', e);
        }
    }

    // Envia mensagem para a API do Gemini
    async sendMessage(userMessage) {
        this.loadConfig();

        if (!this.apiKey) {
            throw new Error('API_KEY_MISSING');
        }

        // 1. Limite de Caracteres (Input)
        if (userMessage.length > 2000) {
            throw new Error('Mensagem muito longa (máx: 2000 caracteres)');
        }

        // 2. Rate Limiting (Cooldown de 5 segundos)
        const now = Date.now();
        if (now - this.lastMessageTime < 5000) {
            const wait = Math.ceil((5000 - (now - this.lastMessageTime)) / 1000);
            throw new Error(`Aguarde ${wait}s para enviar outra mensagem.`);
        }

        // 3. Cota Diária
        const quota = this.checkDailyQuota();
        if (!quota.ok) {
            throw new Error(`Cota diária atingida (${this.dailyQuotaLimit} msgs).`);
        }

        // Configurar AbortController para permitir cancelar
        this.abortController = new AbortController();

        // Adicionar mensagem do usuário ao histórico
        this.history.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });

        // LIMITADOR DE CUSTOS (SEGURANÇA):
        // 1. Limita o histórico das últimas mensagens enviadas para economizar tokens de input
        const MAX_HISTORY = 10;
        if (this.history.length > MAX_HISTORY) {
            this.history = this.history.slice(-MAX_HISTORY);
            // A API do Gemini exige que o array contents comece com papel 'user'
            if (this.history[0].role === 'model') {
                this.history.shift();
            }
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        const body = {
            contents: this.history,
            systemInstruction: {
                parts: [{ text: "Responda de forma completa, mas o mais concisa e direta possível, sem enrolar." }]
            },
            generationConfig: {
                temperature: 0.7,
                // 2. Limita a quantidade de tokens gerados na saída para conter gastos com respostas imensas
                maxOutputTokens: 2048
            }
        };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: this.abortController.signal
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const errMsg = errData?.error?.message || `Erro ${res.status}`;
                // Remover a mensagem do usuário do histórico em caso de erro
                this.history.pop();
                throw new Error(errMsg);
            }

            const data = await res.json();

            // Sucesso! Atualizar trackers de segurança
            this.lastMessageTime = Date.now();
            this.incrementQuota();
            this.abortController = null;

            // Extrair texto da resposta
            const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';

            // Adicionar resposta da IA ao histórico
            this.history.push({
                role: 'model',
                parts: [{ text: aiText }]
            });

            return aiText;
        } catch (e) {
            this.abortController = null;
            if (e.name === 'AbortError') {
                // Usuário cancelou
                if (this.history.length > 0 && this.history[this.history.length - 1].role === 'user') {
                    this.history.pop();
                }
                throw new Error('Geração interrompida.');
            }
            if (e.message === 'API_KEY_MISSING') throw e;
            // Remover mensagem do usuário se deu erro na rede
            if (this.history.length > 0 && this.history[this.history.length - 1].role === 'user') {
                this.history.pop();
            }
            throw e;
        }
    }

    // Limpa histórico de conversa
    clearHistory() {
        this.history = [];
    }
}

// Instância global
const geminiChat = new GeminiChat();

// ====== INICIALIZAÇÃO DO CHAT UI ======
function initGeminiChat() {
    const chatToggle = document.getElementById('chat-toggle');
    const chatOverlay = document.getElementById('chat-overlay');
    const chatClose = document.getElementById('chat-close-btn');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatClear = document.getElementById('chat-clear-btn');
    const chatStop = document.getElementById('chat-stop-btn');
    const chatModelLabel = document.getElementById('chat-model-label');

    let chatOpen = false;

    function updateModelLabel() {
        geminiChat.loadConfig();
        const modelNames = {
            'gemini-3.1-pro-preview': '3.1 Pro Preview',
            'gemini-3-flash': '3 Flash',
            'gemini-2.5-pro': '2.5 Pro',
            'gemini-2.5-flash': '2.5 Flash',
            'gemini-2.5-flash-lite': '2.5 Flash Lite'
        };
        chatModelLabel.textContent = modelNames[geminiChat.model] || geminiChat.model;
    }

    // Abrir/Fechar chat
    chatToggle.addEventListener('click', () => {
        geminiChat.loadConfig();

        // Verificar API Key
        if (!geminiChat.apiKey) {
            chatMessages.innerHTML = `
                <div class="chat-empty">
                    <i class="fa-solid fa-key"></i>
                    <h3>Configure sua API Key do Inai</h3>
                    <p>Vá em Configurações → Chave API do Inai</p>
                    <button id="chat-goto-settings" class="glass-btn">
                        <i class="fa-solid fa-gear"></i> Abrir Configurações
                    </button>
                </div>
            `;
            chatOverlay.classList.add('active');
            chatOpen = true;
            updateModelLabel();

            // Botão para ir às configurações
            const gotoBtn = document.getElementById('chat-goto-settings');
            if (gotoBtn) {
                gotoBtn.addEventListener('click', () => {
                    chatOverlay.classList.remove('active');
                    chatOpen = false;
                    document.getElementById('settings-btn').click();
                });
            }
            return;
        }

        chatOverlay.classList.add('active');
        chatOpen = true;
        updateModelLabel();
        chatInput.focus();
    });

    chatClose.addEventListener('click', () => {
        chatOverlay.classList.remove('active');
        chatOpen = false;
    });

    // Fechar ao clicar fora
    chatOverlay.addEventListener('click', (e) => {
        if (e.target === chatOverlay) {
            chatOverlay.classList.remove('active');
            chatOpen = false;
        }
    });

    // Formatação simples de markdown para a resposta
    function formatResponse(text) {
        // Escapar HTML básico
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Blocos de código multilinhas
        html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
        });

        // Títulos (h1-h3)
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Negrito e Itálico
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Listas (ul)
        html = html.replace(/^\s*[\-\*] (.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
        html = html.replace(/<\/ul>\s*<ul>/gim, ''); // Unir listas consecutivas

        // Código inline
        html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        // Separadores
        html = html.replace(/^---$/gm, '<hr class="chat-hr">');

        // Parágrafos: envolver em <p> tudo que não for tag
        const lines = html.split('\n');
        const processedLines = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed === '') return '';
            if (trimmed.startsWith('<')) return trimmed;
            return `<p>${trimmed}</p>`;
        });

        return processedLines.join('');
    }

    // Adicionar mensagem ao chat
    function appendMessage(role, text) {
        // Remover a mensagem de "vazio" se existir
        const emptyMsg = chatMessages.querySelector('.chat-empty');
        if (emptyMsg) emptyMsg.remove();

        const msgDiv = document.createElement('div');
        msgDiv.className = role === 'user' ? 'chat-msg chat-msg-user' : 'chat-msg chat-msg-ai';

        if (role === 'user') {
            msgDiv.textContent = text;
        } else {
            msgDiv.innerHTML = formatResponse(text);
        }

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Mostrar indicador de "digitando"
    function showTyping() {
        const emptyMsg = chatMessages.querySelector('.chat-empty');
        if (emptyMsg) emptyMsg.remove();

        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-msg chat-msg-ai chat-typing';
        typingDiv.id = 'chat-typing-indicator';
        typingDiv.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTyping() {
        const typing = document.getElementById('chat-typing-indicator');
        if (typing) typing.remove();
    }

    // Enviar mensagem
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';
        appendMessage('user', text);
        showTyping();

        chatInput.disabled = true;
        chatInput.focus();

        try {
            if (chatStop) chatStop.style.display = 'flex';
            const response = await geminiChat.sendMessage(text);
            removeTyping();
            appendMessage('ai', response);
        } catch (e) {
            removeTyping();
            let errorText = 'Erro ao enviar mensagem.';
            if (e.message === 'API_KEY_MISSING') {
                errorText = '⚠️ API Key não configurada. Vá em Configurações.';
            } else if (e.message === 'Geração interrompida.') {
                errorText = '⏹️ Geração interrompida por você.';
            } else {
                errorText = `❌ ${e.message}`;
            }
            appendMessage('ai', errorText);
        } finally {
            if (chatStop) chatStop.style.display = 'none';
            chatInput.disabled = false;
            chatSend.disabled = false;
            chatInput.focus();
        }
    }

    if (chatStop) {
        chatStop.addEventListener('click', () => {
            if (geminiChat.stopGeneration()) {
                if (typeof showToast === 'function') showToast('Interrompendo...');
            }
        });
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Limpar conversa
    chatClear.addEventListener('click', () => {
        geminiChat.clearHistory();
        chatMessages.innerHTML = `
            <div class="chat-empty">
                <i class="fa-solid fa-comments" style="font-size:2rem; opacity:0.2; margin-bottom:10px;"></i>
                <p>Envie uma mensagem para começar</p>
            </div>
        `;
        if (typeof showToast === 'function') showToast('Conversa limpa!');
    });

    // Atalho Escape para fechar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatOpen) {
            chatOverlay.classList.remove('active');
            chatOpen = false;
        }
    });
}
