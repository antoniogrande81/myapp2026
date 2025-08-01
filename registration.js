
/**
 * 🚀 SISTEMA REGISTRAZIONE MINIMALISTA v3.0 - CON EDGE FUNCTION
 * Con conferma email e tessera automatica
 */

const CONFIG = {
 SUPABASE_URL: 'https://lycrgzptkdkksukcwrld.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3JnenB0a2Rra3N1a2N3cmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODQyMzAsImV4cCI6MjA2ODM2MDIzMH0.ZJGOXAMC3hKKrnwXHKEa2_Eh7ZpOKeLYvYlYneBiEfk',
    MIN_PASSWORD_LENGTH: 8,
    MIN_AGE: 16,
    MAX_AGE: 100,
    CONFIRMATION_URL: window.location.origin + '/conferma-email.html',
    TOTAL_STEPS: 3
};

let supabase;
let currentStep = 1;
let formData = {};

function initializeSupabase() {
    try {
        if (!window.supabase) throw new Error('Supabase non caricato');
        supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        return true;
    } catch (error) {
        console.error('Errore inizializzazione:', error);
        return false;
    }
}

function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    const targetStep = document.querySelector(`[data-step="${stepNumber}"]`);
    if (targetStep) {
        targetStep.classList.add('active');
        currentStep = stepNumber;
        updateProgress();
        hideMessages();
        if (stepNumber === 3) showDataSummary();
    }
}

function updateProgress() {
    const percent = (currentStep / CONFIG.TOTAL_STEPS) * 100;
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    if (fill) fill.style.width = percent + '%';
    if (text) text.textContent = `Step ${currentStep} di ${CONFIG.TOTAL_STEPS}`;
}

function showMessage(msg, type = 'info') {
    const c = document.getElementById('messagesContainer');
    if (!c) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    c.innerHTML = `
        <div class="message-${type}">
            <div class="flex items-center">
                <div class="flex-shrink-0 mr-3 text-xl">${icons[type]}</div>
                <div><p class="font-semibold">${msg}</p></div>
            </div>
        </div>`;
    c.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideMessages() {
    const c = document.getElementById('messagesContainer');
    if (c) c.innerHTML = '';
}

function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    const btn = document.getElementById('submitBtn');
    if (show) {
        if (overlay) overlay.style.display = 'flex';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div>';
        }
    } else {
        if (overlay) overlay.style.display = 'none';
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '🚀 Registrati';
        }
    }
}

function collectCurrentStepData() {
    const el = document.querySelector(`[data-step="${currentStep}"]`);
    if (!el) return;
    el.querySelectorAll('input, select, textarea').forEach(f => {
        const name = f.name;
        if (name) formData[name] = f.type === 'checkbox' ? f.checked : f.value.trim();
    });
}

function showDataSummary() {
    collectCurrentStepData();
    const summary = document.getElementById('dataSummary');
    if (!summary) return;
    summary.innerHTML = `
        <div><strong>Nome:</strong> ${formData.nome || '-'} ${formData.cognome || '-'}</div>
        <div><strong>Data nascita:</strong> ${formData.data_nascita || '-'}</div>
        <div><strong>Luogo nascita:</strong> ${formData.luogo_nascita || '-'}</div>
        <div><strong>Email:</strong> ${formData.email || '-'}</div>
        <div><strong>Cellulare:</strong> ${formData.cellulare || '-'}</div>
    `;
}

function validateCurrentStep() {
    collectCurrentStepData();
    switch (currentStep) {
        case 1: return validateStep1();
        case 2: return validateStep2();
        case 3: return validateStep3();
        default: return { valid: true };
    }
}

function validateStep1() {
    const e = [];
    if (!formData.nome || formData.nome.length < 2) e.push('Nome obbligatorio');
    if (!formData.cognome || formData.cognome.length < 2) e.push('Cognome obbligatorio');
    if (!formData.data_nascita) e.push('Data di nascita obbligatoria');
    else {
        const d = new Date(formData.data_nascita);
        const age = Math.floor((new Date() - d) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < CONFIG.MIN_AGE) e.push('Età minima 16 anni');
        if (age > CONFIG.MAX_AGE) e.push('Età non valida');
    }
    if (!formData.luogo_nascita || formData.luogo_nascita.length < 2) e.push('Luogo obbligatorio');
    return { valid: e.length === 0, errors: e };
}

function validateStep2() {
    const e = [];
    const emailR = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telR = /^[+]?\d{8,15}$/;
    if (!formData.email) e.push('Email obbligatoria');
    else if (!emailR.test(formData.email)) e.push('Email non valida');
    if (!formData.cellulare) e.push('Cellulare obbligatorio');
    else if (!telR.test(formData.cellulare)) e.push('Cellulare non valido');
    if (!formData.password || formData.password.length < CONFIG.MIN_PASSWORD_LENGTH) e.push('Password troppo corta');
    return { valid: e.length === 0, errors: e };
}

function validateStep3() {
    const e = [];
    if (!formData.privacy_accepted) e.push('Accettazione privacy obbligatoria');
    return { valid: e.length === 0, errors: e };
}

function nextStep() {
    const v = validateCurrentStep();
    if (!v.valid) showMessage(v.errors.join('<br>'), 'error');
    else if (currentStep < CONFIG.TOTAL_STEPS) showStep(currentStep + 1);
}

function prevStep() {
    if (currentStep > 1) showStep(currentStep - 1);
}

async function submitRegistration() {
    console.log('🚀 Inizio registrazione...');
    const validation = validateCurrentStep();
    if (!validation.valid) {
        showMessage(validation.errors.join('<br>'), 'error');
        return;
    }

    showLoading(true);

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                emailRedirectTo: CONFIG.CONFIRMATION_URL,
                data: {
                    nome: formData.nome,
                    cognome: formData.cognome
                }
            }
        });

        if (authError || !authData.user) {
            throw authError || new Error("Errore nella creazione dell'utente");
        }

        const response = await fetch('https://lycrgzptkdkksukcwrld.functions.supabase.co/registra_utente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                user_id: authData.user.id,
                nome: formData.nome,
                cognome: formData.cognome,
                email: formData.email,
                data_nascita: formData.data_nascita,
                luogo_nascita: formData.luogo_nascita,
                cellulare: formData.cellulare
            })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Errore funzione');

        showLoading(false);
        showRegistrationSuccess(result.result.numero_tessera);

    } catch (error) {
        console.error('Errore:', error);
        showLoading(false);
        showMessage(error.message || 'Errore durante la registrazione', 'error');
    }
}

function showRegistrationSuccess(numeroTessera) {
    const container = document.querySelector('.glass-card');
    if (!container) return;
    container.innerHTML = `
        <div class="text-center">
            <div class="text-6xl mb-6">🎉</div>
            <h2 class="text-3xl font-black text-gray-800 mb-4">Registrazione Completata!</h2>
            <div class="glass-morphism rounded-2xl p-6 mb-6">
                <h3 class="text-white font-bold mb-3">📧 Controlla la tua email</h3>
                <p class="text-white text-sm mb-4">
                    Ti abbiamo inviato un'email a:<br><strong>${formData.email}</strong>
                </p>
                <p class="text-white text-sm">
                    Clicca il link nell'email per attivare il tuo account.
                </p>
            </div>
            <div class="glass-morphism rounded-2xl p-6 mb-6">
                <h3 class="text-white font-bold mb-3">🎫 La tua tessera</h3>
                <p class="text-white text-sm">
                    Numero tessera: <strong>${numeroTessera}</strong><br>
                    <span class="text-yellow-300">⏳ In attesa di attivazione</span>
                </p>
            </div>
            <div class="space-y-4">
                <button onclick="window.location.reload()" class="btn-aurora w-full">🔄 Nuova Registrazione</button>
                <a href="/login.html" class="btn-aurora w-full block text-center" style="background: rgba(255,255,255,0.2);">🔑 Vai al Login</a>
            </div>
        </div>
    `;
}

window.nextStep = nextStep;
window.prevStep = prevStep;
window.submitRegistration = submitRegistration;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!initializeSupabase()) {
            showMessage('Errore di inizializzazione Supabase', 'error');
            return;
        }
        bindEvents();
        showStep(1);
    }, 100);
});

function bindEvents() {
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('blur', collectCurrentStepData);
    });

    const form = document.getElementById('registrationForm');
    if (form) form.addEventListener('submit', e => e.preventDefault());

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            if (currentStep < CONFIG.TOTAL_STEPS) nextStep();
            else submitRegistration();
        }
    });
}
