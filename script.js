// ====== ESTADO E CONFIGURAÇÕES ======
const DEFAULT_CONFIG = {
    name: 'Visitante',
    theme: 'dark', // light, dark, auto
    timeTheme: false, // tema por horário
    city: 'São Paulo',
    searchEngine: 'google', // google, duckduckgo, bing, youtube
    clockFormat: '24', // 12, 24
    showSeconds: true,
    bgCategory: 'auto',
    showBgImage: true,
    bgProvider: 'picsum', // picsum, unsplash, pexels, pixabay
    bgApiKey: '',
    overlayOpacity: 50,
    bgBlur: 5,
    maxLinksPerRow: 10,
    showGreeting: false,
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash'
};

const DEFAULT_LINKS = [
    { id: '1', name: 'YouTube', url: 'https://youtube.com', category: 'Lazer' },
    { id: '2', name: 'GitHub', url: 'https://github.com', category: 'Dev' },
    { id: '3', name: 'Gmail', url: 'https://mail.google.com', category: 'Geral' },
    { id: '4', name: 'Reddit', url: 'https://reddit.com', category: 'Lazer' },
    { id: '5', name: 'ChatGPT', url: 'https://chat.openai.com', category: 'Dev' }
];

let config = { ...DEFAULT_CONFIG };
let links = [...DEFAULT_LINKS];
let todos = [];
let editModeLinks = false;

// ====== INICIALIZAÇÃO ======
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initClock();
    initWeather();
    initBackground();
    initLinks();
    initSearch();
    initNotesAndTodos();
    initSettings();
    initPomodoro();
    initStopwatch();
    initCalendar();
    initConverter();
    initZenMode();
    initFavBg();
    if (typeof initGeminiChat === 'function') initGeminiChat();
    applyConfig();

    // Mensagem de Boas-vindas na instalação da Extensão
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('installed') === 'true') {
        setTimeout(() => {
            showToast("🎉 Bem-vindo(a) ao Initia! Sua nova startpage foi instalada com sucesso.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 800);
    }

    // Dica de rodapé do Chrome na primeira abertura (independente se veio do background install ou F5)
    if (!localStorage.getItem('sp_footer_tip_shown')) {
        setTimeout(() => {
            const tipModal = document.getElementById('footer-tip-modal');
            if (tipModal) tipModal.classList.add('active');
            localStorage.setItem('sp_footer_tip_shown', 'true');
        }, 1500);
    }

    const closeTipBtn = document.getElementById('close-tip-btn');
    if (closeTipBtn) {
        closeTipBtn.addEventListener('click', () => {
            document.getElementById('footer-tip-modal').classList.remove('active');
        });
    }
});

// ====== GERENCIAMENTO DE DADOS ======
function loadData() {
    const savedConfig = localStorage.getItem('sp_config');
    if (savedConfig) config = { ...config, ...JSON.parse(savedConfig) };

    const savedLinks = localStorage.getItem('sp_links');
    if (savedLinks) links = JSON.parse(savedLinks);

    const savedNotes = localStorage.getItem('sp_notes');
    if (savedNotes) {
        document.getElementById('quick-notes').value = savedNotes;
    }

    const savedTodos = localStorage.getItem('sp_todos');
    if (savedTodos) todos = JSON.parse(savedTodos);
}

function saveData() {
    localStorage.setItem('sp_config', JSON.stringify(config));
}

function saveLinks() {
    localStorage.setItem('sp_links', JSON.stringify(links));
}

function saveTodos() {
    localStorage.setItem('sp_todos', JSON.stringify(todos));
}

// ====== FUNÇÕES UTILITÁRIAS ======
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ====== AVALIADOR MATEMÁTICO SEGURO (V3 COMPLIANT) ======
function evaluateMath(expression) {
    const tokens = expression.match(/(?:\d+\.\d+|\d+|[\+\-\*\/\(\)])/g);
    if (!tokens) throw new Error("Expressão vazia");

    let pos = 0;

    function parseExpression() {
        let value = parseTerm();
        while (pos < tokens.length) {
            const op = tokens[pos];
            if (op === '+' || op === '-') {
                pos++;
                value = (op === '+') ? value + parseTerm() : value - parseTerm();
            } else break;
        }
        return value;
    }

    function parseTerm() {
        let value = parseFactor();
        while (pos < tokens.length) {
            const op = tokens[pos];
            if (op === '*' || op === '/') {
                pos++;
                value = (op === '*') ? value * parseFactor() : value / parseFactor();
            } else break;
        }
        return value;
    }

    function parseFactor() {
        if (pos >= tokens.length) throw new Error("Faltando operando");
        let token = tokens[pos++];
        if (token === '(') {
            const value = parseExpression();
            if (pos >= tokens.length || tokens[pos++] !== ')') throw new Error("Parênteses");
            return value;
        } else if (token === '-') {
            return -parseFactor();
        } else if (token === '+') {
            return parseFactor();
        } else {
            const val = parseFloat(token);
            if (isNaN(val)) throw new Error("Invalido");
            return val;
        }
    }

    const res = parseExpression();
    if (pos < tokens.length) throw new Error("Sintaxe extra");
    return res;
}

// ====== RELÓGIO E DATA ======
function initClock() {
    const updateTime = () => {
        const now = new Date();
        const hoursEl = document.getElementById('clock');
        const secondsEl = document.getElementById('seconds');
        const dateEl = document.getElementById('date');
        const greetingEl = document.getElementById('greeting');
        const nameEl = config.name ? `, ${config.name}` : '';

        // Horas e Minutos
        let h = now.getHours();
        const m = now.getMinutes().toString().padStart(2, '0');
        const s = now.getSeconds().toString().padStart(2, '0');

        let ampm = '';
        if (config.clockFormat === '12') {
            ampm = h >= 12 ? ' PM' : ' AM';
            h = h % 12 || 12;
        }
        h = h.toString().padStart(2, '0');

        hoursEl.textContent = `${h}:${m}${ampm}`;

        // Segundos
        secondsEl.style.display = config.showSeconds ? 'inline' : 'none';
        secondsEl.textContent = s;

        // Data
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('pt-BR', options);

        // Barra de progresso do dia
        const dayProgress = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400 * 100;
        document.getElementById('day-progress-bar').style.width = dayProgress.toFixed(1) + '%';

        // Saudação
        const greetingEl2 = document.getElementById('greeting');
        if (config.showGreeting === false) {
            greetingEl2.style.display = 'none';
        } else {
            greetingEl2.style.display = '';
            const hour24 = now.getHours();
            let greetingStr = 'Olá';
            let iconStr = '<i class="fa-solid fa-hand-wave"></i>';
            if (hour24 >= 5 && hour24 <= 11) { greetingStr = 'Bom dia'; iconStr = '<i class="fa-solid fa-sun" style="color: #ffd43b;"></i>'; }
            else if (hour24 >= 12 && hour24 <= 17) { greetingStr = 'Boa tarde'; iconStr = '<i class="fa-solid fa-cloud-sun"></i>'; }
            else { greetingStr = 'Boa noite'; iconStr = '<i class="fa-solid fa-moon"></i>'; }

            greetingEl2.innerHTML = `${greetingStr}${nameEl} <span style="font-size:0.8em; margin-left: 8px;">${iconStr}</span>`;
        }
    };

    updateTime();
    setInterval(updateTime, 1000);
}

// ====== IMAGEM DE FUNDO ======
const TIME_BG_KEYWORDS = {
    dawn: 'sunrise,dawn,morning sky',
    morning: 'morning light,golden hour,sunlight',
    noon: 'blue sky,sunny day,clear sky',
    afternoon: 'afternoon,golden hour,warm light',
    evening: 'sunset,dusk,twilight',
    night: 'night sky,stars,city night'
};

const RANDOM_CATEGORIES = ['nature,landscape', 'city,urban', 'ocean,beach', 'mountain,forest', 'space,galaxy', 'minimal,abstract', 'dark,moody', 'sunrise,sunset', 'architecture'];

function getBgKeywords() {
    const cat = config.bgCategory || 'auto';

    if (cat === 'auto') {
        const hour = new Date().getHours();
        let period;
        if (hour >= 5 && hour < 7) period = 'dawn';
        else if (hour >= 7 && hour < 12) period = 'morning';
        else if (hour >= 12 && hour < 15) period = 'noon';
        else if (hour >= 15 && hour < 18) period = 'afternoon';
        else if (hour >= 18 && hour < 21) period = 'evening';
        else period = 'night';
        return TIME_BG_KEYWORDS[period];
    }

    if (cat === 'random') {
        return RANDOM_CATEGORIES[Math.floor(Math.random() * RANDOM_CATEGORIES.length)];
    }

    return cat;
}

function initBackground() {
    const bgImage = document.getElementById('bg-image');
    const refreshBtn = document.getElementById('refresh-bg-btn');
    const creditEl = document.getElementById('bg-credit');

    // Buscar imagem de um provedor específico
    async function fetchFromProvider(provider, apiKey, keywords) {
        switch (provider) {
            case 'unsplash': {
                if (!apiKey) throw new Error('Chave API necessária para Unsplash');
                const res = await fetch(`https://api.unsplash.com/photos/random?client_id=${apiKey}&query=${encodeURIComponent(keywords)}&orientation=landscape&content_filter=high`);
                if (!res.ok) throw new Error(`Unsplash: ${res.status}`);
                const data = await res.json();
                return {
                    url: data.urls.regular || data.urls.full,
                    credit: `Foto por <a href="${data.user.links.html}?utm_source=initia&utm_medium=referral" target="_blank">${data.user.name}</a> no <a href="https://unsplash.com?utm_source=initia&utm_medium=referral" target="_blank">Unsplash</a>`
                };
            }
            case 'pexels': {
                if (!apiKey) throw new Error('Chave API necessária para Pexels');
                const page = Math.floor(Math.random() * 30) + 1;
                const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keywords)}&orientation=landscape&per_page=1&page=${page}`, {
                    headers: { 'Authorization': apiKey }
                });
                if (!res.ok) throw new Error(`Pexels: ${res.status}`);
                const data = await res.json();
                if (!data.photos || !data.photos.length) throw new Error('Pexels: sem resultados');
                const photo = data.photos[0];
                return {
                    url: photo.src.landscape || photo.src.large2x,
                    credit: `Foto por <a href="${photo.photographer_url}" target="_blank">${photo.photographer}</a> no <a href="https://pexels.com" target="_blank">Pexels</a>`
                };
            }
            case 'pixabay': {
                if (!apiKey) throw new Error('Chave API necessária para Pixabay');
                const page = Math.floor(Math.random() * 10) + 1;
                const res = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(keywords)}&image_type=photo&orientation=horizontal&per_page=5&page=${page}&safesearch=true&min_width=1920`);
                if (!res.ok) throw new Error(`Pixabay: ${res.status}`);
                const data = await res.json();
                if (!data.hits || !data.hits.length) throw new Error('Pixabay: sem resultados');
                const hit = data.hits[Math.floor(Math.random() * data.hits.length)];
                return {
                    url: hit.largeImageURL,
                    credit: `Foto por <a href="https://pixabay.com/users/${hit.user}-${hit.user_id}/" target="_blank">${hit.user}</a> no <a href="https://pixabay.com" target="_blank">Pixabay</a>`
                };
            }
            case 'picsum':
            default: {
                const seed = Date.now() + Math.floor(Math.random() * 100000);
                return {
                    url: `https://picsum.photos/seed/${seed}/1920/1080`,
                    credit: `<a href="https://picsum.photos" target="_blank" rel="noopener">Imagem por Lorem Picsum</a>`
                };
            }
        }
    }

    window._loadBg = async (forceNew = false) => {
        // Se imagem de fundo desativada, esconder tudo
        if (config.showBgImage === false) {
            bgImage.style.opacity = '0';
            bgImage.style.backgroundImage = 'none';
            if (creditEl) creditEl.style.display = 'none';
            return;
        }
        if (creditEl) creditEl.style.display = '';

        // Verificar se tem imagem favoritada
        if (!forceNew) {
            const favBg = localStorage.getItem('sp_fav_bg');
            if (favBg) {
                try {
                    const fav = JSON.parse(favBg);
                    bgImage.style.backgroundImage = `url('${fav.url}')`;
                    bgImage.style.opacity = '1';
                    if (creditEl) creditEl.innerHTML = fav.credit;
                    window._currentBg = fav;
                    updateFavBtn(true);
                    return;
                } catch (e) { /* ignora e busca nova */ }
            }
        }

        bgImage.style.opacity = '0';

        const provider = config.bgProvider || 'picsum';
        const apiKey = config.bgApiKey || '';
        const keywords = getBgKeywords();

        try {
            const result = await fetchFromProvider(provider, apiKey, keywords);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                bgImage.style.backgroundImage = `url('${img.src}')`;
                bgImage.style.opacity = '1';
                if (creditEl) {
                    creditEl.innerHTML = result.credit;
                }
                window._currentBg = { url: img.src, credit: result.credit };
                updateFavBtn(!!localStorage.getItem('sp_fav_bg'));
            };
            img.onerror = () => {
                // Fallback para picsum se o provedor falhar
                const fallbackSeed = Date.now();
                const fbUrl = `https://picsum.photos/seed/${fallbackSeed}/1920/1080`;
                const fbCredit = `<a href="https://picsum.photos" target="_blank">Imagem por Lorem Picsum</a>`;
                bgImage.style.backgroundImage = `url('${fbUrl}')`;
                bgImage.style.opacity = '1';
                if (creditEl) {
                    creditEl.innerHTML = fbCredit;
                }
                window._currentBg = { url: fbUrl, credit: fbCredit };
            };
            img.src = result.url;
        } catch (e) {
            console.warn('Erro ao carregar imagem de fundo:', e.message);
            // Fallback para picsum
            const fallbackSeed = Date.now();
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                bgImage.style.backgroundImage = `url('${img.src}')`;
                bgImage.style.opacity = '1';
                if (creditEl) {
                    creditEl.innerHTML = `<a href="https://picsum.photos" target="_blank">Imagem por Lorem Picsum</a> <span style="opacity:0.5">(fallback: ${e.message})</span>`;
                }
                window._currentBg = { url: img.src, credit: creditEl.innerHTML };
            };
            img.src = `https://picsum.photos/seed/${fallbackSeed}/1920/1080`;
        }
    };

    // Função global para atualizar o botão favorito
    window.updateFavBtn = function (isFav) {
        const favBtn = document.getElementById('fav-bg-btn');
        if (!favBtn) return;
        const icon = favBtn.querySelector('i');
        if (isFav) {
            icon.className = 'fa-solid fa-heart';
            favBtn.classList.add('fav-active');
        } else {
            icon.className = 'fa-regular fa-heart';
            favBtn.classList.remove('fav-active');
        }
    };

    // Estado inicial do botão favorito
    updateFavBtn(!!localStorage.getItem('sp_fav_bg'));

    window._loadBg();

    refreshBtn.addEventListener('click', () => {
        // Ao trocar imagem, desfavorita
        localStorage.removeItem('sp_fav_bg');
        updateFavBtn(false);
        window._loadBg(true);
    });

    // Atalho Alt+R
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 'r') {
            localStorage.removeItem('sp_fav_bg');
            updateFavBtn(false);
            window._loadBg(true);
        }
    });
}

// ====== FAVORITAR IMAGEM DE FUNDO ======
function initFavBg() {
    const favBtn = document.getElementById('fav-bg-btn');

    favBtn.addEventListener('click', () => {
        const currentFav = localStorage.getItem('sp_fav_bg');

        if (currentFav) {
            // Desfavoritar
            localStorage.removeItem('sp_fav_bg');
            updateFavBtn(false);
            showToast('Imagem desfavoritada');
        } else {
            // Favoritar a imagem atual
            if (window._currentBg && window._currentBg.url) {
                localStorage.setItem('sp_fav_bg', JSON.stringify(window._currentBg));
                updateFavBtn(true);
                showToast('Imagem favoritada! ❤️');
            } else {
                showToast('Aguarde a imagem carregar...');
            }
        }
    });
}

// ====== CLIMA (OPEN-METEO) ======
const WMO_CODES = {
    0: { desc: 'Céu limpo', icon: '<i class="fa-solid fa-sun"></i>' },
    1: { desc: 'Predominantemente limpo', icon: '<i class="fa-solid fa-cloud-sun"></i>' },
    2: { desc: 'Parcialmente nublado', icon: '<i class="fa-solid fa-cloud-sun"></i>' },
    3: { desc: 'Nublado', icon: '<i class="fa-solid fa-cloud"></i>' },
    45: { desc: 'Neblina', icon: '<i class="fa-solid fa-smog"></i>' },
    48: { desc: 'Névoa congelante', icon: '<i class="fa-solid fa-smog"></i>' },
    51: { desc: 'Garoa leve', icon: '<i class="fa-solid fa-cloud-rain"></i>' },
    53: { desc: 'Garoa moderada', icon: '<i class="fa-solid fa-cloud-rain"></i>' },
    55: { desc: 'Garoa densa', icon: '<i class="fa-solid fa-cloud-rain"></i>' },
    56: { desc: 'Garoa congelante leve', icon: '<i class="fa-solid fa-cloud-rain"></i>' },
    57: { desc: 'Garoa congelante densa', icon: '<i class="fa-solid fa-cloud-rain"></i>' },
    61: { desc: 'Chuva fraca', icon: '<i class="fa-solid fa-cloud-showers-heavy"></i>' },
    63: { desc: 'Chuva moderada', icon: '<i class="fa-solid fa-cloud-showers-heavy"></i>' },
    65: { desc: 'Chuva forte', icon: '<i class="fa-solid fa-cloud-showers-heavy"></i>' },
    66: { desc: 'Chuva congelante fraca', icon: '<i class="fa-solid fa-cloud-showers-heavy"></i>' },
    67: { desc: 'Chuva congelante forte', icon: '<i class="fa-solid fa-cloud-showers-heavy"></i>' },
    71: { desc: 'Queda de neve fraca', icon: '<i class="fa-regular fa-snowflake"></i>' },
    73: { desc: 'Queda de neve moderada', icon: '<i class="fa-regular fa-snowflake"></i>' },
    75: { desc: 'Queda de neve forte', icon: '<i class="fa-regular fa-snowflake"></i>' },
    77: { desc: 'Grãos de neve', icon: '<i class="fa-regular fa-snowflake"></i>' },
    80: { desc: 'Pancadas de chuva fracas', icon: '<i class="fa-solid fa-cloud-sun-rain"></i>' },
    81: { desc: 'Pancadas de chuva moderadas', icon: '<i class="fa-solid fa-cloud-showers-heavy"></i>' },
    82: { desc: 'Pancadas de chuva violentas', icon: '<i class="fa-solid fa-cloud-bolt"></i>' },
    85: { desc: 'Pancadas de neve fracas', icon: '<i class="fa-regular fa-snowflake"></i>' },
    86: { desc: 'Pancadas de neve fortes', icon: '<i class="fa-regular fa-snowflake"></i>' },
    95: { desc: 'Trovoada', icon: '<i class="fa-solid fa-cloud-bolt"></i>' },
    96: { desc: 'Trovoada com granizo fraco', icon: '<i class="fa-solid fa-cloud-bolt"></i>' },
    99: { desc: 'Trovoada com granizo forte', icon: '<i class="fa-solid fa-cloud-bolt"></i>' }
};

async function initWeather() {
    const weatherContent = document.getElementById('weather-content');

    // Check Cache
    const cached = localStorage.getItem('sp_weather');
    if (cached) {
        const { data, timestamp, city } = JSON.parse(cached);
        if (Date.now() - timestamp < 30 * 60 * 1000 && city === config.city.trim().toLowerCase()) {
            renderWeather(data, timestamp);
            return;
        }
    }

    fetchWeather();
}

async function fetchWeather() {
    const weatherContent = document.getElementById('weather-content');
    weatherContent.innerHTML = '<span class="spin"><i class="fa-solid fa-spinner fa-spin"></i></span> Carregando clima...';

    let cityQuery = config.city ? config.city.trim() : 'São Paulo';

    try {
        // 1. Geocoding
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=1&language=pt`);
        if (!geoRes.ok) throw new Error('Erro na API Geo');
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('Cidade não encontrada');
        }

        const loc = geoData.results[0];
        const lat = loc.latitude;
        const lon = loc.longitude;
        const cityName = loc.name;

        // 2. Weather
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code&timezone=auto`);
        if (!weatherRes.ok) throw new Error('Erro na API Weather');
        const weatherData = await weatherRes.json();

        const data = {
            current: weatherData.current,
            city: cityName
        };

        const currentTimestamp = Date.now();
        localStorage.setItem('sp_weather', JSON.stringify({
            data,
            timestamp: currentTimestamp,
            city: cityQuery.toLowerCase()
        }));

        renderWeather(data, currentTimestamp);
    } catch (e) {
        weatherContent.innerHTML = `
            <div style="opacity:0.8; text-align:center;">
               <div style="margin-bottom: 5px; font-size: 1.5rem;"><i class="fa-solid fa-cloud-showers-heavy"></i></div>
               <div style="margin-bottom: 5px;">Clima indisponível</div>
               <div style="font-size: 0.75rem; margin-bottom: 8px;">(${e.message})</div>
               <button id="retry-weather-btn" class="glass-btn btn-small">Tentar novamente</button>
            </div>
        `;
        document.getElementById('retry-weather-btn').addEventListener('click', fetchWeather);
    }
}

function renderWeather(data, timestamp) {
    const content = document.getElementById('weather-content');

    if (!data || !data.current) return;

    const current = data.current;
    const code = current.weather_code;

    const weatherInfo = WMO_CODES[code] || { desc: 'Desconhecido', icon: '<i class="fa-solid fa-cloud"></i>' };
    const descPt = weatherInfo.desc;
    const icon = weatherInfo.icon;

    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const humidity = current.relative_humidity_2m;
    const city = data.city;

    let timeStr = '';
    if (timestamp) {
        const date = new Date(timestamp);
        timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    content.innerHTML = `
        ${timeStr ? `<span class="weather-update-time" id="weather-refresh-btn" title="Atualizar clima">
            <i class="fa-solid fa-rotate"></i> ${timeStr}
        </span>` : ''}
        <div class="weather-info">
            <div class="weather-main">
                <div class="weather-icon">${icon}</div>
                <div class="weather-temp">${temp}°C</div>
            </div>
            <div class="weather-desc">${descPt}</div>
            <div class="weather-details" style="opacity: 0.9;">
                <span class="weather-city" style="font-weight: 500; margin-bottom: 2px;"><i class="fa-solid fa-location-dot" style="margin-right: 4px;"></i>${city}</span>
                <span>Sensação: ${feelsLike}°C &nbsp;|&nbsp; Umidade: ${humidity}%</span>
            </div>
        </div>
    `;
    content.classList.remove('weather-loading');

    const refreshBtn = document.getElementById('weather-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            this.querySelector('i').classList.add('loading');
            fetchWeather();
        });
    }

    applyWeatherEffects(code);
}

// Efeitos climáticos animados no fundo
function applyWeatherEffects(code) {
    const layer = document.getElementById('weather-overlay-layer');
    if (!layer) return;

    // Limpar efeitos atuais
    layer.innerHTML = '';
    layer.classList.remove('active');

    if (!config.liveWeather) return;

    // Determinar o tipo de efeito com base no código WMO
    let effect = 'none';
    let count = 0;

    // Chuva: 51-67, 80-82, 95-99
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) {
        effect = 'rain';
        count = (code >= 63 || code >= 81 || code >= 95) ? 100 : 40; // Chuva forte vs fraca
    }
    // Neve: 71-77, 85-86
    else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
        effect = 'snow';
        count = (code === 75 || code === 86) ? 80 : 30;
    }
    // Neblina/Névoa: 45, 48
    else if (code === 45 || code === 48) {
        effect = 'fog';
        count = 1;
    }

    if (effect === 'none') return;

    layer.classList.add('active');

    if (effect === 'fog') {
        const fog = document.createElement('div');
        fog.className = 'weather-fog';
        layer.appendChild(fog);
    } else {
        // Criar gotas ou flocos
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = effect === 'rain' ? 'weather-drop' : 'weather-snow';

            // Posição aleatória na tela (0 a 100vw)
            const left = Math.random() * 100;
            // Delay e duração aleatória
            const delay = Math.random() * 5;
            const duration = effect === 'rain' ? (Math.random() * 0.5 + 0.5) : (Math.random() * 3 + 3);

            el.style.left = `${left}vw`;
            el.style.animationDelay = `${delay}s`;
            el.style.animationDuration = `${duration}s`;

            if (effect === 'snow') {
                const size = Math.random() * 4 + 2;
                el.style.width = `${size}px`;
                el.style.height = `${size}px`;
                el.style.opacity = Math.random() * 0.5 + 0.3;
            }

            layer.appendChild(el);
        }
    }
}

// ====== LINKS RÁPIDOS ======
function initLinks() {
    renderLinks();

    const addBtn = document.getElementById('add-link-btn');
    const modal = document.getElementById('manage-links-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const addNewBtn = document.getElementById('add-new-link-btn');

    addBtn.addEventListener('click', () => {
        renderManageLinks();
        modal.classList.add('active');
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    addNewBtn.addEventListener('click', () => {
        const nameInp = document.getElementById('new-link-name');
        const urlInp = document.getElementById('new-link-url');
        const catInp = document.getElementById('new-link-category');

        const name = nameInp.value.trim();
        let url = urlInp.value.trim();
        const category = catInp.value || 'Geral';

        if (!name || !url) return showToast("Preencha os campos!");
        if (!url.startsWith('http')) url = 'https://' + url;

        links.push({ id: Date.now().toString(), name, url, category });
        saveLinks();
        renderLinks();
        renderManageLinks();

        nameInp.value = ''; urlInp.value = '';
        showToast("Link adicionado!");
    });
}

const CATEGORY_COLORS = {
    'Geral': '#a0a0a0',
    'Trabalho': '#4facfe',
    'Estudo': '#43e97b',
    'Lazer': '#f093fb',
    'Social': '#fa709a',
    'Dev': '#fee140'
};

function renderLinks() {
    const container = document.getElementById('links-grid');
    container.innerHTML = '';
    const maxPerRow = config.maxLinksPerRow || 10;
    container.style.setProperty('--max-links', maxPerRow);

    links.forEach(link => container.appendChild(createLinkCard(link)));
}

function createLinkCard(link) {
    const a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'link-card';

    const cat = link.category || 'Geral';
    const color = CATEGORY_COLORS[cat] || '#a0a0a0';

    const domain = new URL(link.url).hostname;
    const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    a.innerHTML = `
        <img src="${iconUrl}" alt="${link.name}" class="link-icon" onerror="this.outerHTML='<i class=\\'fa-solid fa-globe link-icon\\' style=\\'font-size:32px; padding:4px;\\'></i>'">
        <span class="link-name">${link.name}</span>
        <span class="link-cat-dot" style="background:${color};" title="${cat}"></span>
    `;
    return a;
}

function renderManageLinks() {
    const list = document.getElementById('manage-links-list');
    list.innerHTML = '';

    links.forEach(link => {
        const li = document.createElement('li');
        li.className = 'manage-link-item';

        const domain = new URL(link.url).hostname;
        const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

        li.innerHTML = `
            <div class="manage-link-info">
                <img src="${iconUrl}" alt="icon" onerror="this.outerHTML='<i class=\\'fa-solid fa-globe\\' style=\\'width:20px; text-align:center;\\'></i>'">
                <span>${link.name}</span>
                <span style="opacity:0.3; font-size:0.7rem;">${link.category || 'Geral'}</span>
            </div>
            <button class="icon-btn danger btn-small" style="width:30px;height:30px;font-size:12px;" data-id="${link.id}"><i class="fa-solid fa-trash"></i></button>
        `;

        li.querySelector('button').addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            links = links.filter(l => l.id !== id);
            saveLinks();
            renderLinks();
            renderManageLinks();
        });

        list.appendChild(li);
    });
}

// ====== BUSCA ======
function initSearch() {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');

    const SEARCH_URLS = {
        google: q => `https://www.google.com/search?q=${q}`,
        bing: q => `https://www.bing.com/search?q=${q}`,
        youtube: q => `https://www.youtube.com/results?search_query=${q}`,
        yahoo: q => `https://search.yahoo.com/search?p=${q}`,
        duckduckgo: q => `https://duckduckgo.com/?q=${q}`,
        startpage: q => `https://www.startpage.com/sp/search?query=${q}`,
        brave: q => `https://search.brave.com/search?q=${q}`,
        searxng: q => `https://searx.be/search?q=${q}`,
        qwant: q => `https://www.qwant.com/?q=${q}`,
        mojeek: q => `https://www.mojeek.com/search?q=${q}`,
        ecosia: q => `https://www.ecosia.org/search?q=${q}`,
        wikipedia: q => `https://pt.wikipedia.org/w/index.php?search=${q}`,
        reddit: q => `https://www.reddit.com/search/?q=${q}`,
        github: q => `https://github.com/search?q=${q}`
    };

    const ENGINE_NAMES = {
        google: 'Google', bing: 'Bing', youtube: 'YouTube', yahoo: 'Yahoo',
        duckduckgo: 'DuckDuckGo', startpage: 'Startpage', brave: 'Brave Search',
        searxng: 'SearXNG', qwant: 'Qwant', mojeek: 'Mojeek',
        ecosia: 'Ecosia', wikipedia: 'Wikipedia', reddit: 'Reddit', github: 'GitHub'
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = input.value.trim();
        if (!query) return;

        const engine = config.searchEngine || 'google';
        const buildUrl = SEARCH_URLS[engine] || SEARCH_URLS.google;
        window.location.href = buildUrl(encodeURIComponent(query));
    });

    // Atalho "/"
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== input && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            input.focus();
        }
    });

    // Atualizar placeholder
    input.placeholder = `Pesquisar no ${ENGINE_NAMES[config.searchEngine] || 'Google'}...`;

    // Lógica da Calculadora Integrada
    const mathResultDiv = document.getElementById('search-math-result');
    const mathOutputEl = document.getElementById('math-output');

    input.addEventListener('input', (e) => {
        const val = e.target.value.trim().replace(/,/g, '.');

        // Verifica se contém números/operadores e se tem pelo menos um operador (para não ativar com números puros)
        if (/^[\d\s\+\-\*\/\(\)\.]+$/.test(val) && /[\+\-\*\/]/.test(val)) {
            try {
                // Cálculo 100% seguro compliance com Manifest V3
                const result = evaluateMath(val);
                if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                    mathOutputEl.textContent = `= ${result}`;
                    mathResultDiv.style.display = 'flex';
                    mathResultDiv.dataset.result = result;
                    return;
                }
            } catch (err) { }
        }
        mathResultDiv.style.display = 'none';
    });

    mathResultDiv.addEventListener('click', () => {
        const res = mathResultDiv.dataset.result;
        if (res) {
            navigator.clipboard.writeText(res).then(() => {
                showToast("Resultado copiado!");
                mathResultDiv.style.display = 'none';
                input.value = ''; // opcional: limpar a barra ou manter o campo? vamos limpar
                input.focus();
            }).catch(() => {
                showToast("Erro ao copiar.");
            });
        }
    });

    // Esconder a calculadora ao clicar fora da área de busca
    document.addEventListener('click', (e) => {
        if (!form.contains(e.target)) {
            mathResultDiv.style.display = 'none';
        }
    });
}

// ====== NOTAS E TAREFAS ======
function initNotesAndTodos() {
    const notesArea = document.getElementById('quick-notes');
    let timeoutId;

    notesArea.addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            localStorage.setItem('sp_notes', notesArea.value);
            showToast("Notas salvas!");
        }, 1000);
    });

    // Todos
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = todoInput.value.trim();
        if (!text) return;

        todos.push({ id: Date.now().toString(), text, completed: false });
        saveTodos();
        renderTodos();
        todoInput.value = '';
    });

    renderTodos();
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';

    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

        li.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
            <span>${todo.text}</span>
            <button class="del-todo" data-id="${todo.id}"><i class="fa-solid fa-xmark"></i></button>
        `;

        li.querySelector('input').addEventListener('change', (e) => {
            const id = e.target.getAttribute('data-id');
            const t = todos.find(t => t.id === id);
            if (t) t.completed = e.target.checked;
            saveTodos();
            renderTodos();
        });

        li.querySelector('.del-todo').addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            todos = todos.filter(t => t.id !== id);
            saveTodos();
            renderTodos();
        });

        list.appendChild(li);
    });
}

// ====== CONFIGURAÇÕES ======
function initSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const closeBtn = document.getElementById('close-settings-btn');
    const sidebar = document.getElementById('settings-sidebar');

    settingsBtn.addEventListener('click', () => {
        populateSettingsForm();
        sidebar.classList.add('open');
    });

    closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));

    // Listeners pros inputs
    const ids = ['set-name', 'set-theme', 'set-time-theme', 'set-city', 'set-search-engine', 'set-clock-format', 'set-show-seconds', 'set-show-greeting', 'set-bg-category', 'set-show-bg-image', 'set-live-weather', 'set-bg-provider', 'set-bg-api-key', 'set-overlay-opacity', 'set-bg-blur', 'set-max-links-per-row', 'set-gemini-api-key', 'set-gemini-model'];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener('change', (e) => {
            const key = id.replace('set-', '').replace(/-([a-z])/g, g => g[1].toUpperCase());

            if (el.type === 'checkbox') {
                config[key] = el.checked;
            } else {
                config[key] = el.value;
            }

            saveData();
            applyConfig();

            if (key === 'city' || key === 'liveWeather') {
                fetchWeather(); // Redesenha com tempo se liveWeather for recém ativado/desativado
            }
            if (key === 'bgCategory' || key === 'showBgImage' || key === 'bgProvider' || key === 'bgApiKey') {
                if (key === 'bgProvider') updateProviderUI(el.value);
                if (window._loadBg) window._loadBg();
            }
            if (key === 'maxLinksPerRow') renderLinks();

            showToast("Configuração salva");
        });

        if (el.type === 'range') {
            el.addEventListener('input', (e) => {
                const key = id.replace('set-', '').replace(/-([a-z])/g, g => g[1].toUpperCase());
                config[key] = e.target.value;
                const isBlur = id === 'set-bg-blur';
                document.getElementById(isBlur ? 'blur-value' : 'opacity-value').textContent = e.target.value + (isBlur ? 'px' : '%');
                applyConfig(); // Apply immediately for feeling
            });
        }
    });

    document.getElementById('manage-links-btn').addEventListener('click', () => {
        sidebar.classList.remove('open');
        document.getElementById('manage-links-modal').classList.add('active');
        renderManageLinks();
    });

    document.getElementById('reset-all-btn').addEventListener('click', () => {
        if (confirm("Tem certeza que deseja apagar todas as configurações, links e notas?")) {
            localStorage.clear();
            location.reload();
        }
    });

    // Exportar configurações
    document.getElementById('export-btn').addEventListener('click', () => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('sp_')) {
                data[key] = localStorage.getItem(key);
            }
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `initia_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Backup exportado com sucesso!");
    });

    // Importar configurações
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');

    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                let count = 0;
                for (const key in data) {
                    if (key.startsWith('sp_')) {
                        localStorage.setItem(key, data[key]);
                        count++;
                    }
                }
                if (count > 0) {
                    showToast("Configurações importadas!");
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showToast("Nenhuma configuração válida encontrada no arquivo.");
                }
            } catch (err) {
                showToast("Erro ao ler o arquivo. Certifique-se que é o backup correto.");
            }
            importFile.value = ''; // Reset the input
        };
        reader.readAsText(file);
    });
}

function populateSettingsForm() {
    document.getElementById('set-name').value = config.name;
    document.getElementById('set-theme').value = config.theme;
    document.getElementById('set-city').value = config.city;
    document.getElementById('set-search-engine').value = config.searchEngine;
    document.getElementById('set-clock-format').value = config.clockFormat;
    document.getElementById('set-show-seconds').checked = config.showSeconds;
    document.getElementById('set-bg-category').value = config.bgCategory;
    document.getElementById('set-show-bg-image').checked = config.showBgImage !== false;

    const liveWeatherEl = document.getElementById('set-live-weather');
    if (liveWeatherEl) liveWeatherEl.checked = config.liveWeather === true;

    document.getElementById('set-bg-provider').value = config.bgProvider || 'picsum';
    document.getElementById('set-bg-api-key').value = config.bgApiKey || '';
    document.getElementById('set-time-theme').checked = config.timeTheme;

    const opa = document.getElementById('set-overlay-opacity');
    opa.value = config.overlayOpacity;
    document.getElementById('opacity-value').textContent = config.overlayOpacity + '%';

    const blurObj = document.getElementById('set-bg-blur');
    blurObj.value = config.bgBlur;
    document.getElementById('blur-value').textContent = config.bgBlur + 'px';

    document.getElementById('set-max-links-per-row').value = config.maxLinksPerRow || 10;
    document.getElementById('set-show-greeting').checked = config.showGreeting !== false;

    // Atualizar UI do provedor
    updateProviderUI(config.bgProvider || 'picsum');

    // Gemini
    document.getElementById('set-gemini-api-key').value = config.geminiApiKey || '';
    document.getElementById('set-gemini-model').value = config.geminiModel || 'gemini-2.5-flash';
}

function updateProviderUI(provider) {
    const apiKeyGroup = document.getElementById('bg-api-key-group');
    const apiKeyHint = document.getElementById('bg-api-key-hint');
    const categoryHint = document.getElementById('bg-category-hint');
    const needsKey = provider !== 'picsum';

    apiKeyGroup.style.display = needsKey ? '' : 'none';
    categoryHint.style.display = provider === 'picsum' ? '' : 'none';

    const hints = {
        unsplash: 'Obtenha sua chave grátis em <a href="https://unsplash.com/developers" target="_blank">unsplash.com/developers</a>',
        pexels: 'Obtenha sua chave grátis em <a href="https://www.pexels.com/api/" target="_blank">pexels.com/api</a>',
        pixabay: 'Obtenha sua chave grátis em <a href="https://pixabay.com/api/docs/" target="_blank">pixabay.com/api/docs</a>',
    };
    apiKeyHint.innerHTML = hints[provider] || '';
}

function applyConfig() {
    // Opacidade Overlay e Desfoque
    document.documentElement.style.setProperty('--overlay-opacity', config.overlayOpacity / 100);
    document.documentElement.style.setProperty('--bg-blur', config.bgBlur + 'px');

    // Tema
    if (config.theme === 'auto') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', config.theme);
    }

    // Tema por horário
    applyTimeTheme();

    // Placeholder do buscador
    const input = document.getElementById('search-input');
    if (input) {
        const engines = {
            google: 'Google', bing: 'Bing', youtube: 'YouTube', yahoo: 'Yahoo',
            duckduckgo: 'DuckDuckGo', startpage: 'Startpage', brave: 'Brave Search',
            searxng: 'SearXNG', qwant: 'Qwant', mojeek: 'Mojeek',
            ecosia: 'Ecosia', wikipedia: 'Wikipedia', reddit: 'Reddit', github: 'GitHub'
        };
        input.placeholder = `Pesquisar no ${engines[config.searchEngine] || 'Google'}...`;
    }
}

// Detectar mudança no tema do sistema
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (config.theme === 'auto') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
});

// ====== TEMA POR HORÁRIO ======
function applyTimeTheme() {
    if (!config.timeTheme) {
        document.body.removeAttribute('data-time-theme');
        return;
    }

    const hour = new Date().getHours();
    let period;

    if (hour >= 5 && hour < 7) period = 'dawn';          // Amanhecer: roxo escuro
    else if (hour >= 7 && hour < 12) period = 'morning';  // Manhã: rosa quente → dourado
    else if (hour >= 12 && hour < 15) period = 'noon';    // Meio-dia: azul céu
    else if (hour >= 15 && hour < 18) period = 'afternoon';// Tarde: rosa → amarelo
    else if (hour >= 18 && hour < 21) period = 'evening'; // Entardecer: lilás → pêssego
    else period = 'night';                                 // Noite: azul escuro profundo

    document.body.setAttribute('data-time-theme', period);
}

// Atualizar tema por horário a cada minuto
setInterval(() => {
    if (config.timeTheme) applyTimeTheme();
}, 60000);

// ====== POMODORO TIMER ======
let pomodoroInterval = null;
let pomodoroSeconds = 25 * 60;
let pomodoroRunning = false;
let pomodoroTotal = 25 * 60;
let pomodoroAlarmInterval = null;
let pomodoroCycles = 0;
let pomodoroCurrentPhase = 'focus'; // focus, break, long-break
let pomodoroAudioCtx = null;

// Configurações do Pomodoro salvas em localStorage
function loadPomodoroConfig() {
    const saved = localStorage.getItem('sp_pomodoro');
    if (saved) {
        const data = JSON.parse(saved);
        pomodoroCycles = data.cycles || 0;
        document.getElementById('pomo-focus-min').value = data.focusMin || 25;
        document.getElementById('pomo-break-min').value = data.breakMin || 5;
        document.getElementById('pomo-long-min').value = data.longMin || 15;
    }
    updateCyclesDisplay();
}

function savePomodoroConfig() {
    localStorage.setItem('sp_pomodoro', JSON.stringify({
        cycles: pomodoroCycles,
        focusMin: parseInt(document.getElementById('pomo-focus-min').value) || 25,
        breakMin: parseInt(document.getElementById('pomo-break-min').value) || 5,
        longMin: parseInt(document.getElementById('pomo-long-min').value) || 15
    }));
}

function getPhaseMinutes(phase) {
    if (phase === 'focus') return parseInt(document.getElementById('pomo-focus-min').value) || 25;
    if (phase === 'break') return parseInt(document.getElementById('pomo-break-min').value) || 5;
    if (phase === 'long-break') return parseInt(document.getElementById('pomo-long-min').value) || 15;
    return 25;
}

function getPhaseLabel(phase) {
    if (phase === 'focus') return 'Foco';
    if (phase === 'break') return 'Pausa';
    if (phase === 'long-break') return 'Pausa Longa';
    return 'Foco';
}

function updateCyclesDisplay() {
    const el = document.getElementById('pomodoro-cycles');
    if (el) el.textContent = `🍅 ${pomodoroCycles} pomodoro${pomodoroCycles !== 1 ? 's' : ''}`;
}

function selectPhase(phase) {
    pomodoroCurrentPhase = phase;
    const minutes = getPhaseMinutes(phase);
    pomodoroTotal = minutes * 60;
    pomodoroSeconds = pomodoroTotal;

    document.getElementById('pomodoro-mode').textContent = getPhaseLabel(phase);

    // Atualizar visual dos botões
    document.querySelectorAll('.pomodoro-phase').forEach(p => {
        p.classList.toggle('active', p.dataset.type === phase);
    });

    updatePomodoroDisplay();
}

// Beep com Web Audio API
function playBeep() {
    try {
        if (!pomodoroAudioCtx) pomodoroAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = pomodoroAudioCtx;

        // Tom 1
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.value = 880;
        gain1.gain.setValueAtTime(0.3, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.3);

        // Tom 2 (mais alto, com delay)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = 1100;
        gain2.gain.setValueAtTime(0, ctx.currentTime + 0.15);
        gain2.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.5);
    } catch (e) {
        // Web Audio não disponível
    }
}

function startAlarm() {
    playBeep();
    pomodoroAlarmInterval = setInterval(playBeep, 1500);

    // Mostrar botão de dismiss e abrir overlay
    document.getElementById('pomodoro-dismiss').style.display = 'inline-flex';
    document.getElementById('pomodoro-overlay').classList.add('active');
}

function stopAlarm() {
    clearInterval(pomodoroAlarmInterval);
    pomodoroAlarmInterval = null;
    document.getElementById('pomodoro-dismiss').style.display = 'none';
}

function initPomodoro() {
    const toggleBtn = document.getElementById('pomodoro-toggle');
    const overlay = document.getElementById('pomodoro-overlay');
    const closeBtn = document.getElementById('pomodoro-close-btn');
    const startBtn = document.getElementById('pomodoro-start');
    const resetBtn = document.getElementById('pomodoro-reset');
    const dismissBtn = document.getElementById('pomodoro-dismiss');

    // Timer tabs
    document.querySelectorAll('.timer-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.timer-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.timer-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });

    loadPomodoroConfig();
    selectPhase('focus');

    // Abrir/fechar
    toggleBtn.addEventListener('click', () => {
        overlay.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
        if (!pomodoroAlarmInterval) overlay.classList.remove('active');
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay && !pomodoroAlarmInterval) overlay.classList.remove('active');
    });

    // Dismiss alarm
    dismissBtn.addEventListener('click', () => {
        stopAlarm();

        // Auto-avançar para próxima fase
        if (pomodoroCurrentPhase === 'focus') {
            pomodoroCycles++;
            updateCyclesDisplay();
            savePomodoroConfig();
            // A cada 4 ciclos, pausa longa
            const nextPhase = (pomodoroCycles % 4 === 0) ? 'long-break' : 'break';
            selectPhase(nextPhase);
            showToast(`🍅 ${pomodoroCycles}º pomodoro! Hora da ${getPhaseLabel(nextPhase).toLowerCase()}.`);
        } else {
            selectPhase('focus');
            showToast('💪 Pronto para mais um ciclo de foco!');
        }

        document.getElementById('pomodoro-start').innerHTML = '<i class="fa-solid fa-play"></i>';
        document.getElementById('pomodoro-toggle').classList.remove('active');
    });

    // Start/Pause
    startBtn.addEventListener('click', () => {
        if (pomodoroAlarmInterval) return; // ignorar se alarme tocando

        if (pomodoroRunning) {
            pausePomodoro();
            startBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        } else {
            startPomodoro();
            startBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        }
    });

    // Reset
    resetBtn.addEventListener('click', () => {
        stopAlarm();
        pausePomodoro();
        selectPhase(pomodoroCurrentPhase);
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        toggleBtn.classList.remove('active');
    });

    // Seleção de fase via click no botão (não no input)
    document.querySelectorAll('.pomodoro-phase').forEach(phase => {
        phase.addEventListener('click', (e) => {
            if (e.target.classList.contains('phase-input')) return; // Deixar editar o input
            stopAlarm();
            pausePomodoro();
            selectPhase(phase.dataset.type);
            startBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            toggleBtn.classList.remove('active');
        });
    });

    // Salvar duração customizada quando mudar o input
    document.querySelectorAll('.phase-input').forEach(input => {
        input.addEventListener('change', () => {
            savePomodoroConfig();
            // Se editou a fase ativa, atualizar o timer
            const parentPhase = input.closest('.pomodoro-phase').dataset.type;
            if (parentPhase === pomodoroCurrentPhase && !pomodoroRunning) {
                selectPhase(pomodoroCurrentPhase);
            }
        });
        // Impedir propagação do click pro botão pai
        input.addEventListener('click', (e) => e.stopPropagation());
    });

    // Atalho Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (pomodoroAlarmInterval) {
                dismissBtn.click();
            } else if (overlay.classList.contains('active')) {
                overlay.classList.remove('active');
            }
        }
    });
}

function startPomodoro() {
    pomodoroRunning = true;
    document.getElementById('pomodoro-toggle').classList.add('active');

    pomodoroInterval = setInterval(() => {
        pomodoroSeconds--;
        updatePomodoroDisplay();

        if (pomodoroSeconds <= 0) {
            pausePomodoro();
            pomodoroSeconds = 0;
            updatePomodoroDisplay();

            // Alarme contínuo
            startAlarm();

            // Notificação do browser
            if (Notification.permission === 'granted') {
                new Notification('⏰ Pomodoro', { body: `${getPhaseLabel(pomodoroCurrentPhase)} finalizado!` });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }, 1000);
}

function pausePomodoro() {
    pomodoroRunning = false;
    clearInterval(pomodoroInterval);
}

function updatePomodoroDisplay() {
    const m = Math.floor(pomodoroSeconds / 60).toString().padStart(2, '0');
    const s = (pomodoroSeconds % 60).toString().padStart(2, '0');
    document.getElementById('pomodoro-display').textContent = `${m}:${s}`;

    // Atualizar título da aba quando rodando
    if (pomodoroRunning || pomodoroAlarmInterval) {
        const phase = getPhaseLabel(pomodoroCurrentPhase);
        document.title = `${m}:${s} — ${phase}`;
    } else {
        document.title = 'Nova Guia';
    }
}

// ====== CRONÔMETRO (STOPWATCH) ======
let swInterval = null;
let swElapsed = 0;
let swRunning = false;
let swLaps = [];

function initStopwatch() {
    const startBtn = document.getElementById('sw-start');
    const lapBtn = document.getElementById('sw-lap');
    const resetBtn = document.getElementById('sw-reset');

    startBtn.addEventListener('click', () => {
        if (swRunning) {
            clearInterval(swInterval);
            swRunning = false;
            startBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            lapBtn.disabled = true;
        } else {
            swRunning = true;
            startBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            lapBtn.disabled = false;
            const startTime = Date.now() - swElapsed;
            swInterval = setInterval(() => {
                swElapsed = Date.now() - startTime;
                updateSwDisplay();
            }, 30);
        }
    });

    lapBtn.addEventListener('click', () => {
        if (!swRunning) return;
        swLaps.unshift(swElapsed);
        renderSwLaps();
    });

    resetBtn.addEventListener('click', () => {
        clearInterval(swInterval);
        swRunning = false;
        swElapsed = 0;
        swLaps = [];
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        lapBtn.disabled = true;
        updateSwDisplay();
        document.getElementById('sw-laps').innerHTML = '';
    });
}

function updateSwDisplay() {
    const totalMs = swElapsed;
    const m = Math.floor(totalMs / 60000).toString().padStart(2, '0');
    const s = Math.floor((totalMs % 60000) / 1000).toString().padStart(2, '0');
    const ms = Math.floor((totalMs % 1000) / 10).toString().padStart(2, '0');
    document.getElementById('stopwatch-display').innerHTML = `${m}:${s}<span class="stopwatch-ms">.${ms}</span>`;
}

function renderSwLaps() {
    const container = document.getElementById('sw-laps');
    container.innerHTML = '';
    swLaps.forEach((elapsed, i) => {
        const m = Math.floor(elapsed / 60000).toString().padStart(2, '0');
        const s = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
        const ms = Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0');
        const li = document.createElement('li');
        li.innerHTML = `<span>Volta ${swLaps.length - i}</span><span>${m}:${s}.${ms}</span>`;
        container.appendChild(li);
    });
}

// ====== CALENDÁRIO + FERIADOS ======
let calYear, calMonth;
let holidaysCache = {};

function initCalendar() {
    const overlay = document.getElementById('calendar-overlay');
    const openBtn = document.getElementById('calendar-toggle');
    const closeBtn = document.getElementById('calendar-close-btn');
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');

    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();

    openBtn.addEventListener('click', () => {
        overlay.classList.add('active');
        renderCalendar();
    });

    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });

    prevBtn.addEventListener('click', () => {
        calMonth--;
        if (calMonth < 0) { calMonth = 11; calYear--; }
        renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
        calMonth++;
        if (calMonth > 11) { calMonth = 0; calYear++; }
        renderCalendar();
    });
}

async function fetchHolidays(year) {
    if (holidaysCache[year]) return holidaysCache[year];

    try {
        const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
        if (!res.ok) throw new Error('Erro');
        const data = await res.json();
        holidaysCache[year] = data;
        return data;
    } catch {
        return [];
    }
}

async function renderCalendar() {
    const grid = document.getElementById('cal-grid');
    const title = document.getElementById('cal-title');
    const holidaysList = document.getElementById('cal-holidays');

    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    title.textContent = `${months[calMonth]} ${calYear}`;

    // Fetch holidays
    const holidays = await fetchHolidays(calYear);
    const holidayDates = {};
    holidays.forEach(h => {
        const d = new Date(h.date + 'T00:00:00');
        if (d.getMonth() === calMonth) {
            holidayDates[d.getDate()] = h.name;
        }
    });

    // Build grid
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrev = new Date(calYear, calMonth, 0).getDate();
    const today = new Date();

    grid.innerHTML = '';

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const div = document.createElement('div');
        div.className = 'cal-day other-month';
        div.textContent = daysInPrev - i;
        grid.appendChild(div);
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        const div = document.createElement('div');
        div.className = 'cal-day';
        div.textContent = d;

        if (d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()) {
            div.classList.add('today');
        }
        if (holidayDates[d]) {
            div.classList.add('holiday');
            div.title = holidayDates[d];
        }
        grid.appendChild(div);
    }

    // Next month days to fill grid
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
        const div = document.createElement('div');
        div.className = 'cal-day other-month';
        div.textContent = i;
        grid.appendChild(div);
    }

    // Holiday list for current month
    holidaysList.innerHTML = '';
    const monthHolidays = holidays.filter(h => {
        const d = new Date(h.date + 'T00:00:00');
        return d.getMonth() === calMonth;
    });

    if (monthHolidays.length === 0) {
        holidaysList.innerHTML = '<div style="font-size:0.7rem; opacity:0.3; text-align:center;">Nenhum feriado neste mês</div>';
    } else {
        monthHolidays.forEach(h => {
            const d = new Date(h.date + 'T00:00:00');
            const day = d.getDate().toString().padStart(2, '0');
            const item = document.createElement('div');
            item.className = 'cal-holiday-item';
            item.innerHTML = `<span class="cal-holiday-date">${day}/${(calMonth + 1).toString().padStart(2, '0')}</span> ${h.name}`;
            holidaysList.appendChild(item);
        });
    }
}

// ====== CONVERSOR ======
let convRates = { usd: null, eur: null };

function initConverter() {
    const overlay = document.getElementById('converter-overlay');
    const openBtn = document.getElementById('converter-toggle');
    const closeBtn = document.getElementById('converter-close-btn');

    openBtn.addEventListener('click', () => {
        overlay.classList.add('active');
        if (!convRates.usd) fetchExchangeRates();
    });

    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });

    // Conv tabs
    document.querySelectorAll('.conv-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.conv-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.conv-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('conv-' + tab.dataset.conv).classList.add('active');
        });
    });

    // Currency input
    document.getElementById('conv-brl').addEventListener('input', convertCurrency);

    // Temperature input
    document.getElementById('conv-celsius').addEventListener('input', convertTemp);
    convertTemp();

    // Length inputs
    document.getElementById('conv-km').addEventListener('input', convertLength);
    document.getElementById('conv-cm').addEventListener('input', convertLength);
    convertLength();
}

async function fetchExchangeRates() {
    const info = document.getElementById('conv-rate-info');
    info.textContent = 'Carregando câmbio...';

    try {
        const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL');
        if (!res.ok) throw new Error('Erro no câmbio');
        const data = await res.json();

        convRates.usd = parseFloat(data.USDBRL.bid);
        convRates.eur = parseFloat(data.EURBRL.bid);

        const dateStr = data.USDBRL.create_date || '';
        info.textContent = `1 USD = R$ ${convRates.usd.toFixed(2)} | 1 EUR = R$ ${convRates.eur.toFixed(2)} — ${dateStr.split(' ')[0] || ''}`;

        convertCurrency();
    } catch {
        info.textContent = 'Erro ao buscar câmbio. Tente novamente mais tarde.';
    }
}

function convertCurrency() {
    const brl = parseFloat(document.getElementById('conv-brl').value) || 0;
    if (convRates.usd) {
        document.getElementById('conv-usd').value = (brl / convRates.usd).toFixed(4);
    }
    if (convRates.eur) {
        document.getElementById('conv-eur').value = (brl / convRates.eur).toFixed(4);
    }
}

function convertTemp() {
    const c = parseFloat(document.getElementById('conv-celsius').value) || 0;
    document.getElementById('conv-fahr').value = ((c * 9 / 5) + 32).toFixed(2);
    document.getElementById('conv-kelvin').value = (c + 273.15).toFixed(2);
}

function convertLength() {
    const km = parseFloat(document.getElementById('conv-km').value) || 0;
    const cm = parseFloat(document.getElementById('conv-cm').value) || 0;
    document.getElementById('conv-mi').value = (km * 0.621371).toFixed(4);
    document.getElementById('conv-in').value = (cm / 2.54).toFixed(4);
}

// ====== MODO ZEN ======
function initZenMode() {
    const zenBtn = document.getElementById('zen-toggle');

    // Restaurar estado do zen do localStorage
    const savedZen = localStorage.getItem('sp_zen_mode');
    if (savedZen === 'true') {
        document.body.classList.add('zen-mode');
    }

    zenBtn.addEventListener('click', () => {
        document.body.classList.toggle('zen-mode');
        const isZen = document.body.classList.contains('zen-mode');
        localStorage.setItem('sp_zen_mode', isZen);
    });

    // Escape para sair do zen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('zen-mode')) {
            document.body.classList.remove('zen-mode');
            localStorage.setItem('sp_zen_mode', 'false');
        }
    });
}
