/**
 * 🚀 SISTEMA REGISTRAZIONE MINIMALISTA v3.0
 * Con conferma email - Solo dati essenziali
 * Utilizzando lo stile Aurora Boreale
 */

// ========================================
// 🔧 CONFIGURAZIONE
// ========================================

const CONFIG = {
    // Supabase (aggiorna con i tuoi dati)
    SUPABASE_URL: 'https://lycrgzptkdkksukcwrld.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3JnenB0a2Rra3N1a2N3cmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMDQwNjYsImV4cCI6MjA0OTY4MDA2Nn0.cU73nwcSrPMu88dHKZf3LpQwKD6yTcWLiWWL2eLNMhU',
    
    // Validazione
    MIN_PASSWORD_LENGTH: 8,
    MIN_AGE: 16,
    MAX_AGE: 100,
    
    // URL conferma
    CONFIRMATION_URL: window.location.origin + '/conferma-email.html',
    
    // UI
    TOTAL_STEPS: 3
};

// ========================================
// 🔌 GLOBALI
// ========================================

let supabase;
let currentStep = 1;
let formData = {};

// ========================================
// 🚀 INIZIALIZZAZIONE
// ========================================

function initializeSupabase() {
    try {
        if (!window.supabase) {
            throw new Error('Supabase library non caricata');
        }
        
        supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        console.log('✅ Supabase inizializzato');
        return true;
    } catch (error) {
        console.error('❌ Errore inizializzazione Supabase:', error);
        return false;
    }
}

// ========================================
// 🎨 GESTIONE UI
// ========================================

function showStep(stepNumber) {
    // Nascondi tutti gli step
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Mostra step target
    const targetStep = document.querySelector(`[data-step="${stepNumber}"]`);
    if (targetStep) {
        targetStep.classList.add('active');
        currentStep = stepNumber;
        updateProgress();
        hideMessages();
        
        // Se step 3, mostra riepilogo
        if (stepNumber === 3) {
            showDataSummary();
        }
        
        console.log(`📄 Step ${stepNumber} mostrato`);
    }
}

function updateProgress() {
    const percentage = (currentStep / CONFIG.TOTAL_STEPS) * 100;
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    
    if (progressText) {
        progressText.textContent = `Step ${currentStep} di ${CONFIG.TOTAL_STEPS}`;
    }
}

function showMessage(text, type = 'info') {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };
    
    container.innerHTML = `
        <div class="message-${type}">
            <div class="flex items-center">
                <div class="flex-shrink-0 mr-3 text-xl">
                    ${icons[type] || 'ℹ️'}
                </div>
                <div>
                    <p class="font-semibold">${text}</p>
                </div>
            </div>
        </div>
    `;
    
    // Scroll al messaggio
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideMessages() {
    const container = document.getElementById('messagesContainer');
    if (container) {
        container.innerHTML = '';
    }
}

function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    const submitBtn = document.getElementById('submitBtn');
    
    if (show) {
        if (overlay) overlay.style.display = 'flex';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; margin: 0 auto;"></div>';
        }
    } else {
        if (overlay) overlay.style.display = 'none';
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '🚀 Registrati';
        }
    }
}

function showDataSummary() {
    collectCurrentStepData();
    const summary = document.getElementById('dataSummary');
    if (!summary) return;
    
    summary.innerHTML = `
        <div><strong>Nome:</strong> ${formData.nome || '-'} ${formData.cognome || '-'}</div>
        <div><strong>Data nascita:</strong> ${formData.data_nascita ? new Date(formData.data_nascita).toLocaleDateString('it-IT') : '-'}</div>
        <div><strong>Luogo nascita:</strong> ${formData.luogo_nascita || '-'}</div>
        <div><strong>Email:</strong> ${formData.email || '-'}</div>
        <div><strong>Cellulare:</strong> ${formData.cellulare || '-'}</div>
    `;
}

// ========================================
// 📝 GESTIONE FORM
// ========================================

function collectCurrentStepData() {
    const currentStepEl = document.querySelector(`[data-step="${currentStep}"]`);
    if (!currentStepEl) return;

    currentStepEl.querySelectorAll('input, select, textarea').forEach(field => {
        const name = field.name;
        if (name) {
            if (field.type === 'checkbox') {
                formData[name] = field.checked;
            } else {
                formData[name] = field.value.trim();
            }
        }
    });

    console.log(`💾 Dati step ${currentStep} salvati:`, formData);
}

// ========================================
// 🛡️ VALIDAZIONE
// ========================================

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
    const errors = [];
    
    // Nome
    if (!formData.nome || formData.nome.length < 2) {
        errors.push('Nome obbligatorio (min 2 caratteri)');
    }
    
    // Cognome
    if (!formData.cognome || formData.cognome.length < 2) {
        errors.push('Cognome obbligatorio (min 2 caratteri)');
    }
    
    // Data nascita
    if (!formData.data_nascita) {
        errors.push('Data di nascita obbligatoria');
    } else {
        const birthDate = new Date(formData.data_nascita);
        const today = new Date();
        const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        
        if (age < CONFIG.MIN_AGE) {
            errors.push(`Età minima ${CONFIG.MIN_AGE} anni`);
        }
        if (age > CONFIG.MAX_AGE) {
            errors.push('Età non valida');
        }
    }
    
    // Luogo nascita
    if (!formData.luogo_nascita || formData.luogo_nascita.length < 2) {
        errors.push('Luogo di nascita obbligatorio');
    }
    
    return { valid: errors.length === 0, errors };
}

function validateStep2() {
    const errors = [];
    
    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
        errors.push('Email obbligatoria');
    } else if (!emailRegex.test(formData.email)) {
        errors.push('Email non valida');
    }
    
    // Cellulare
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
    if (!formData.cellulare) {
        errors.push('Cellulare obbligatorio');
    } else if (!phoneRegex.test(formData.cellulare)) {
        errors.push('Numero di cellulare non valido');
    }
    
    // Password
    if (!formData.password) {
        errors.push('Password obbligatoria');
    } else if (formData.password.length < CONFIG.MIN_PASSWORD_LENGTH) {
        errors.push(`Password minimo ${CONFIG.MIN_PASSWORD_LENGTH} caratteri`);
    }
    
    return { valid: errors.length === 0, errors };
}

function validateStep3() {
    const errors = [];
    
    if (!formData.privacy_accepted) {
        errors.push('Accettazione privacy obbligatoria');
    }
    
    return { valid: errors.length === 0, errors };
}

// ========================================
// 🚀 NAVIGAZIONE
// ========================================

function nextStep() {
    const validation = validateCurrentStep();
    
    if (!validation.valid) {
        showMessage(validation.errors.join('<br>'), 'error');
        return;
    }
    
    if (currentStep < CONFIG.TOTAL_STEPS) {
        showStep(currentStep + 1);
    }
}

function prevStep() {
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

// ========================================
// 📧 REGISTRAZIONE CON CONFERMA EMAIL
// ========================================

async function submitRegistration() {
    console.log('🚀 Inizio registrazione con conferma email...');
    
    // Validazione finale
    const validation = validateCurrentStep();
    if (!validation.valid) {
        showMessage(validation.errors.join('<br>'), 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Step 1: Registrazione Auth con email confirmation
        console.log('🔐 Creazione utente Auth...');
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
        
        if (authError) {
            console.error('❌ Errore Auth:', authError);
            throw authError;
        }
        
        if (!authData.user) {
            throw new Error('Utente non creato correttamente');
        }
        
        console.log('✅ Utente Auth creato:', authData.user.id);
        
        // Step 2: Creazione profilo (stato: in_attesa)
        console.log('👤 Creazione profilo...');
        const profileData = {
            user_id: authData.user.id,
            nome: formData.nome,
            cognome: formData.cognome,
            email: formData.email,
            data_nascita: formData.data_nascita,
            luogo_nascita: formData.luogo_nascita,
            cellulare: formData.cellulare,
            email_confermata: false,
            stato: 'in_attesa'
        };
        
        const { data: profileResult, error: profileError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();
        
        if (profileError) {
            console.error('❌ Errore creazione profilo:', profileError);
            throw profileError;
        }
        
        console.log('✅ Profilo creato:', profileResult.id);
        
        // Step 3: Creazione tessera (stato: in_attesa)
        console.log('🎫 Generazione tessera...');
        
        // Prima generiamo il numero tessera
        const { data: numeroTessera, error: numeroError } = await supabase
            .rpc('generate_tessera_number');
        
        if (numeroError) {
            console.error('❌ Errore generazione numero:', numeroError);
            throw numeroError;
        }
        
        const tesseraData = {
            user_id: authData.user.id,
            profile_id: profileResult.id,
            numero_tessera: numeroTessera,
            stato_tessera: 'in_attesa'
        };
        
        const { data: tesseraResult, error: tesseraError } = await supabase
            .from('tessere')
            .insert(tesseraData)
            .select()
            .single();
        
        if (tesseraError) {
            console.error('❌ Errore creazione tessera:', tesseraError);
            throw tesseraError;
        }
        
        console.log('✅ Tessera creata:', tesseraResult.numero_tessera);
        
        // Success!
        showLoading(false);
        showRegistrationSuccess(tesseraResult.numero_tessera);
        
    } catch (error) {
        console.error('❌ Errore registrazione:', error);
        showLoading(false);
        
        const errorMessage = getErrorMessage(error);
        showMessage(errorMessage, 'error');
    }
}

function showRegistrationSuccess(numeroTessera) {
    const container = document.querySelector('.glass-card');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center">
            <div class="text-6xl mb-6">🎉</div>
            <h2 class="text-3xl font-black text-gray-800 mb-4">
                Registrazione Completata!
            </h2>
            
            <div class="glass-morphism rounded-2xl p-6 mb-6">
                <h3 class="text-white font-bold mb-3">📧 Controlla la tua email</h3>
                <p class="text-white text-sm mb-4">
                    Ti abbiamo inviato un'email di conferma a:<br>
                    <strong>${formData.email}</strong>
                </p>
                <p class="text-white text-sm">
                    Clicca il link nell'email per attivare il tuo account e la tessera.
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
                <button onclick="window.location.reload()" class="btn-aurora w-full">
                    🔄 Nuova Registrazione
                </button>
                <a href="/login.html" class="btn-aurora w-full block text-center" 
                   style="background: rgba(255,255,255,0.2);">
                    🔑 Vai al Login
                </a>
            </div>
        </div>
    `;
}

function getErrorMessage(error) {
    const errorMessages = {
        'User already registered': 'Email già registrata nel sistema',
        'Invalid email': 'Email non valida',
        'Password too short': 'Password troppo corta',
        'Invalid credentials': 'Credenziali non valide',
        'duplicate key value': 'Utente già esistente',
        'connection timeout': 'Errore di connessione. Riprova.',
        'network error': 'Errore di rete. Controlla la connessione.'
    };
    
    // Cerca messaggio specifico
    for (const [key, message] of Object.entries(errorMessages)) {
        if (error.message && error.message.toLowerCase().includes(key.toLowerCase())) {
            return message;
        }
    }
    
    return error.message || 'Errore durante la registrazione. Riprova.';
}

// ========================================
// 🚀 INIZIALIZZAZIONE APP
// ========================================

function initializeApp() {
    console.log('🚀 Inizializzazione app registrazione...');
    
    // Controlla dipendenze
    if (!window.supabase) {
        showMessage('Librerie mancanti. Ricarica la pagina.', 'error');
        return false;
    }
    
    // Inizializza Supabase
    if (!initializeSupabase()) {
        showMessage('Errore di connessione. Ricarica la pagina.', 'error');
        return false;
    }
    
    // Binding eventi
    bindEvents();
    
    // Mostra primo step
    showStep(1);
    
    console.log('✅ App inizializzata');
    return true;
}

function bindEvents() {
    // Auto-save su input blur
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('blur', collectCurrentStepData);
    });
    
    // Prevenzione submit form
    const form = document.getElementById('registrationForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    }
    
    // Gestione Enter key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            if (currentStep < CONFIG.TOTAL_STEPS) {
                nextStep();
            } else {
                submitRegistration();
            }
        }
    });
    
    // Auto-save su visibilità pagina
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            collectCurrentStepData();
            console.log('💾 Auto-save prima di nascondere pagina');
        }
    });
    
    // Prevenzione perdita dati su refresh
    window.addEventListener('beforeunload', (event) => {
        if (Object.keys(formData).length > 0 && currentStep > 1) {
            collectCurrentStepData();
            event.preventDefault();
            event.returnValue = 'Hai dati non salvati. Sei sicuro di voler uscire?';
            return event.returnValue;
        }
    });
}

// ========================================
// 🌐 FUNZIONI GLOBALI (per HTML inline)
// ========================================

// Esporta funzioni per uso nel HTML
window.nextStep = nextStep;
window.prevStep = prevStep;
window.submitRegistration = submitRegistration;

// ========================================
// 🚀 AVVIO AUTOMATICO
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Piccolo delay per assicurarsi che tutto sia caricato
    setTimeout(() => {
        initializeApp();
    }, 100);
});

// ========================================
// 🔧 GESTIONE ERRORI GLOBALI
// ========================================

window.addEventListener('error', (event) => {
    console.error('🚨 Errore JavaScript globale:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        error: event.error
    });
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Promise rifiutata:', event.reason);
});

// ========================================
// 📊 UTILITÀ DEBUG (solo sviluppo)
// ========================================

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Funzioni debug disponibili solo in locale
    window.debugFormData = () => {
        console.log('🔍 Form Data:', formData);
        return formData;
    };
    
    window.debugStep = (step) => {
        if (step) {
            showStep(step);
        }
        console.log('🔍 Current Step:', currentStep);
        return currentStep;
    };
    
    window.debugSupabase = () => {
        console.log('🔍 Supabase:', supabase);
        return supabase;
    };
    
    console.log('🔧 Debug functions available: debugFormData(), debugStep(), debugSupabase()');
}

// ========================================
// 📝 EXPORT per TEST (se necessario)
// ========================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateStep1,
        validateStep2,
        validateStep3,
        getErrorMessage,
        CONFIG
    };
}
