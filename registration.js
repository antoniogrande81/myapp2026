// ================================
// CONFIGURAZIONE SUPABASE
// ================================
const SUPABASE_URL = 'https://lycrgzptkdkksukcwrld.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3JnenB0a2Rra3N1a2N3cmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODQyMzAsImV4cCI6MjA2ODM2MDIzMH0.ZJGOXAMC3hKKrnwXHKEa2_Eh7ZpOKeLYvYlYneBiEfk';

// ================================
// FUNZIONI GLOBALI USATE DA HTML
// ================================
function validateDataNascita(dateStr) {
    const today = new Date();
    const bd = new Date(dateStr);
    let age = today.getFullYear() - bd.getFullYear();
    const md = today.getMonth() - bd.getMonth();
    if (md < 0 || (md === 0 && today.getDate() < bd.getDate())) age--;
    return age >= 14;
}

function validateTelefono(telefono) {
    if (!telefono) return true; // Il telefono è opzionale
    // Espressione regolare per numeri italiani e internazionali
    const telefonoRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return telefonoRegex.test(telefono.replace(/[\s\-\(\)]/g, ''));
}

function nextStep() {
    console.log('▶️ Tentativo step:', currentStep);
    if (validateCurrentStep()) {
        saveCurrentStepData();
        currentStep < 3 ? showStep(currentStep + 1) : handleRegistration();
    } else {
        console.log('❌ Validazione fallita allo step', currentStep);
    }
}

// ================================
// VARIABILI GLOBALI
// ================================
let supabase, currentStep = 1, formData = {}, resendTimer, resendInterval;

// ================================
// INIZIALIZZAZIONE
// ================================
document.addEventListener('DOMContentLoaded', () => {
    let attempts = 0, maxAttempts = 20;
    const checkSupabase = () => {
        attempts++;
        if (window.supabase?.createClient) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            initializeForm();
            setupEventListeners();
            setupPasswordValidation();
            console.log('✅ Supabase pronto');
        } else if (attempts < maxAttempts) {
            setTimeout(checkSupabase, 200);
        } else {
            showError('Errore caricamento Supabase');
        }
    };
    checkSupabase();
});

function initializeForm() {
    currentStep = 1;
    formData = {};
    showStep(1);
    updateStepIndicator();
}

function setupEventListeners() {
    document.getElementById('registrationForm')?.addEventListener('submit', e => e.preventDefault());
    document.getElementById('email')?.addEventListener('input', validateEmailRealTime);
    document.getElementById('confirmEmail')?.addEventListener('input', validateEmailConfirmRealTime);
    document.getElementById('telefono')?.addEventListener('input', validateTelefonoRealTime);
}

// ================================
// STEP LOGIC
// ================================
function showStep(step) {
    document.querySelectorAll('.step-form').forEach(el => el.classList.add('hidden'));
    const stepElement = document.getElementById(`step${step}Form`);
    if (!stepElement) {
        console.error('Step non trovato:', step);
        return;
    }
    stepElement.classList.remove('hidden');
    currentStep = step;
    updateStepIndicator();
    if (step === 3) updateSummary();
}

function updateStepIndicator() {
    ['step1', 'step2', 'step3'].forEach((id, i) => {
        const stepElement = document.getElementById(id);
        if (!stepElement) return;
        if (i + 1 < currentStep) {
            stepElement.className = 'step-circle completed';
            stepElement.innerHTML = '✓';
        } else if (i + 1 === currentStep) {
            stepElement.className = 'step-circle active';
            stepElement.innerHTML = i + 1;
        } else {
            stepElement.className = 'step-circle';
            stepElement.innerHTML = i + 1;
        }
    });

    ['line1', 'line2'].forEach((id, i) => {
        document.getElementById(id)?.classList.toggle('completed', i + 1 < currentStep);
    });
}

function updateSummary() {
    const summary = {
        summaryNome: formData.nome || '-',
        summaryCognome: formData.cognome || '-',
        summaryEmail: formData.email || '-',
        summaryTelefono: formData.telefono || 'Non fornito',
        summaryDataNascita: formData.dataNascita || '-',
        summaryLuogoNascita: formData.luogoNascita || '-'
    };
    Object.entries(summary).forEach(([id, val]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = val;
        }
    });
}

// ================================
// VALIDAZIONE
// ================================
function validateCurrentStep() {
    clearMessages();
    switch (currentStep) {
        case 1: return validateStep1();
        case 2: return validateStep2();
        case 3: return validateStep3();
        default: return false;
    }
}

function validateStep1() {
    let isValid = true;
    const nome = getElementValue('nome');
    if (!nome || nome.length < 2) {
        showFieldError('nome', 'Nome obbligatorio (≥2 char)');
        isValid = false;
    } else {
        clearFieldError('nome');
    }

    const cognome = getElementValue('cognome');
    if (!cognome || cognome.length < 2) {
        showFieldError('cognome', 'Cognome obbligatorio');
        isValid = false;
    } else {
        clearFieldError('cognome');
    }

    const email = getElementValue('email');
    const confirmEmail = getElementValue('confirmEmail');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showFieldError('email', 'Email valida richiesta');
        isValid = false;
    } else {
        clearFieldError('email');
    }

    if (!confirmEmail || confirmEmail !== email) {
        showFieldError('confirmEmail', 'Email non coincidono');
        isValid = false;
    } else {
        clearFieldError('confirmEmail');
    }

    const telefono = getElementValue('telefono');
    if (telefono && !validateTelefono(telefono)) {
        showFieldError('telefono', 'Formato telefono errato');
        isValid = false;
    } else {
        clearFieldError('telefono');
    }

    const dataNascita = getElementValue('dataNascita');
    if (!dataNascita || !validateDataNascita(dataNascita)) {
        showFieldError('dataNascita', 'Età minima 14 anni');
        isValid = false;
    } else {
        clearFieldError('dataNascita');
    }

    const luogoNascita = getElementValue('luogoNascita');
    if (!luogoNascita || luogoNascita.length < 2) {
        showFieldError('luogoNascita', 'Luogo di nascita obbligatorio');
        isValid = false;
    } else {
        clearFieldError('luogoNascita');
    }

    return isValid;
}

function validateStep2() {
    let isValid = true;
    const password = getElementValue('password');
    if (!password || !validatePassword(password)) {
        showFieldError('password', 'Password debole');
        isValid = false;
    } else {
        clearFieldError('password');
    }

    const confirmPassword = getElementValue('confirmPassword');
    if (!confirmPassword || confirmPassword !== password) {
        showFieldError('confirmPassword', 'Le password non coincidono');
        isValid = false;
    } else {
        clearFieldError('confirmPassword');
    }

    return isValid;
}

function validateStep3() {
    if (!document.getElementById('privacyAccept')?.checked) {
        showError('Accetta privacy e termini per procedere');
        return false;
    }
    return true;
}

function validatePassword(password) {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
}

function validateEmailRealTime() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = getElementValue('email');
    if (emailRegex.test(email)) {
        setFieldValid('email');
    } else {
        setFieldError('email');
    }
}

function validateEmailConfirmRealTime() {
    const email = getElementValue('email');
    const confirmEmail = getElementValue('confirmEmail');
    if (confirmEmail === email) {
        setFieldValid('confirmEmail');
    } else {
        setFieldError('confirmEmail');
    }
}

function validateTelefonoRealTime() {
    const telefono = getElementValue('telefono');
    if (validateTelefono(telefono)) {
        setFieldValid('telefono');
    } else {
        setFieldError('telefono');
    }
}

// ================================
// PASSWORD STRENGTH
// ================================
function setupPasswordValidation() {
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.addEventListener('input', function() {
            updatePasswordStrength(this.value);
            updatePasswordRequirements(this.value);
        });
    }
}

function calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    return Math.min(score, 4);
}

function updatePasswordStrength(password) {
    const bar = document.getElementById('strengthBar');
    const text = document.getElementById('strengthText');
    if (!bar || !text) return;

    const strength = calculatePasswordStrength(password);
    bar.className = 'strength-bar';
    if (strength < 2) {
        bar.classList.add('strength-weak');
        text.textContent = 'Troppo debole';
        text.style.color = '#ef4444';
    } else if (strength < 3) {
        bar.classList.add('strength-medium');
        text.textContent = 'Debole';
        text.style.color = '#f59e0b';
    } else if (strength < 4) {
        bar.classList.add('strength-good');
        text.textContent = 'Buona';
        text.style.color = '#eab308';
    } else {
        bar.classList.add('strength-strong');
        text.textContent = 'Forte';
        text.style.color = '#10b981';
    }
}

function updatePasswordRequirements(password) {
    const requirements = {
        'req-length': password.length >= 8,
        'req-upper': /[A-Z]/.test(password),
        'req-lower': /[a-z]/.test(password),
        'req-number': /\d/.test(password)
    };
    Object.entries(requirements).forEach(([id, met]) => {
        const element = document.getElementById(id)?.querySelector('.requirement-indicator');
        if (element) {
            if (met) {
                element.classList.add('met');
            } else {
                element.classList.remove('met');
            }
        }
    });
}

// ================================
// SALVATAGGIO DATI FORM
// ================================
function saveCurrentStepData() {
    if (currentStep === 1) {
        ['nome', 'cognome', 'email', 'telefono', 'dataNascita', 'luogoNascita'].forEach(field => {
            formData[field] = getElementValue(field);
        });
    } else if (currentStep === 2) {
        formData.password = getElementValue('password');
    } else if (currentStep === 3) {
        formData.privacyAccepted = document.getElementById('privacyAccept')?.checked;
        formData.marketingConsent = document.getElementById('marketingAccept')?.checked;
    }
}

// ================================
// UTILITY FUNZIONI UI
// ================================
function getElementValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

function clearMessages() {
    ['errorMessage', 'successMessage', 'infoMessage'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
}

function showError(message) {
    clearMessages();
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

function showSuccess(message) {
    clearMessages();
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    if (successDiv && successText) {
        successText.textContent = message;
        successDiv.classList.remove('hidden');
    }
}

function showInfo(message) {
    clearMessages();
    const infoDiv = document.getElementById('infoMessage');
    const infoText = document.getElementById('infoText');
    if (infoDiv && infoText) {
        infoText.textContent = message;
        infoDiv.classList.remove('hidden');
    }
}

function setFieldError(id) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.add('error');
        element.classList.remove('valid');
    }
}

function setFieldValid(id) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove('error');
        element.classList.add('valid');
    }
}

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
    setFieldError(fieldId);
}

function clearFieldError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
    setFieldValid(fieldId);
}

// ================================
// REGISTRAZIONE E PROFILI
// ================================
async function handleRegistration() {
    const button = document.querySelector('.btn-primary');
    if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span>Registrazione...';
    }
    try {
        saveCurrentStepData();
        if (!validateCurrentStep()) {
            throw new Error('Dati mancanti');
        }
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    nome: formData.nome,
                    cognome: formData.cognome,
                    full_name: `${formData.nome} ${formData.cognome}`,
                    telefono: formData.telefono || null,
                    data_nascita: formData.dataNascita,
                    luogo_nascita: formData.luogoNascita,
                    privacy_accepted: formData.privacyAccepted,
                    marketing_consent: formData.marketingConsent || false
                }
            }
        });
        
        if (authError) throw authError;
        
        const userId = authData.user?.id;
        if (!userId) throw new Error('ID utente mancante');
        
        // Controlla se il profilo esiste già
        const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', userId).single();
        
        if (existingProfile) {
            await updateUserProfile(userId);
        } else {
            await createUserProfile(userId);
        }
        
        const tessera = await createUserTessera(userId);
        console.log('Tessera scadenza:', tessera.data_scadenza_europeo);
        
        showSuccess('Registrazione completata! Controlla la tua email.');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
        
    } catch (error) {
        console.error(error);
        showError(error.message || 'Errore registrazione');
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = '🚀 Registrati';
        }
    }
}

async function createUserProfile(userId) {
    const profileData = {
        id: userId,
        email: formData.email,
        nome: formData.nome,
        cognome: formData.cognome,
        telefono: formData.telefono?.trim() || null,
        data_nascita: formData.dataNascita,
        luogo_nascita: formData.luogoNascita,
        ruoli: ['USER'],
        newsletter_consent: formData.marketingConsent ? 'true' : 'false',
        marketing_consent: formData.marketingConsent || false,
        privacy_accepted: formData.privacyAccepted || false,
        privacy_accepted_at: new Date().toISOString(),
        ip_registrazione: await getUserIP(),
        user_agent: navigator.userAgent
    };
    
    const { error } = await supabase.from('profiles').upsert([profileData], { 
        onConflict: 'id', 
        ignoreDuplicates: false 
    }).select();
    
    if (error) throw error;
}

async function updateUserProfile(userId) {
    const profileData = {
        email: formData.email,
        nome: formData.nome,
        cognome: formData.cognome,
        telefono: formData.telefono?.trim() || null,
        data_nascita: formData.dataNascita,
        luogo_nascita: formData.luogoNascita,
        ruoli: ['USER'],
        newsletter_consent: formData.marketingConsent ? 'true' : 'false',
        marketing_consent: formData.marketingConsent || false,
        privacy_accepted: formData.privacyAccepted || false,
        privacy_accepted_at: new Date().toISOString(),
        ip_registrazione: await getUserIP(),
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('profiles').update(profileData).eq('id', userId).select();
    if (error) throw error;
}

// ================================
// TESSERE LOGICA
// ================================
function calculateScadenzaTessera() {
    const year = new Date().getFullYear();
    return { 
        iso: `${year}-12-31`, 
        eu: `31/12/${year}` 
    };
}

async function createUserTessera(userId) {
    // Controlla se la tessera esiste già
    const { data: existingTessera, error } = await supabase.from('tessere').select('id,data_scadenza').eq('id', userId).single();
    
    if (error && error.code !== 'PGRST116') throw error;
    if (existingTessera) return existingTessera;

    const numeroTessera = await generateNumeroTessera();
    const scadenza = calculateScadenzaTessera();
    
    const tesseraData = {
        id: userId,
        numero_tessera: numeroTessera,
        stato: 'attiva',
        data_emissione: new Date().toISOString().slice(0, 10),
        data_scadenza: scadenza.iso,
        tipo_tessera: 'standard',
        livello: 'bronze',
        punti_accumulati: 0,
        note: 'Tessera creata durante registrazione',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    const { data, error: insertError } = await supabase.from('tessere').insert([tesseraData]).select();
    if (insertError) throw insertError;
    
    return { 
        ...data[0], 
        data_scadenza_europeo: scadenza.eu 
    };
}

async function generateNumeroTessera() {
    const year = new Date().getFullYear();
    const candidate = `${year}-${Math.floor(1e7 + Math.random() * 9e7)}`;
    
    // Verifica se il numero esiste già
    const tables = ['tessere', 'cards', 'user_cards', 'membership_cards'];
    
    for (const table of tables) {
        try {
            const { data } = await supabase.from(table).select('numero_tessera').eq('numero_tessera', candidate).single();
            if (data) {
                // Il numero esiste già, genera uno nuovo
                return await generateNumeroTessera();
            }
        } catch (error) {
            // Tabella non esiste o numero non trovato, continua
            continue;
        }
    }
    
    return candidate;
}

async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.warn('Impossibile ottenere IP:', error);
        return null;
    }
}

// ================================
// COOLDOWN BOTTONI
// ================================
function startRegistrationCooldown(seconds) {
    const button = document.getElementById('registerBtn') || document.querySelector('.btn-primary');
    if (!button) return;

    let remaining = seconds;
    const updateButton = () => {
        button.disabled = true;
        button.innerHTML = `⏳ Riprova tra ${remaining}s`;
    };

    updateButton();
    const interval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(interval);
            button.disabled = false;
            button.innerHTML = '🚀 Completa Registrazione';
        } else {
            updateButton();
        }
    }, 1000);
}
