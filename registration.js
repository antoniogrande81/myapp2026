// ================================
// CONFIGURAZIONE SUPABASE
// ================================

const SUPABASE_URL = 'https://lycrgzptkdkksukcwrld.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3JnenB0a2Rra3N1a2N3cmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODQyMzAsImV4cCI6MjA2ODM2MDIzMH0.ZJGOXAMC3hKKrnwXHKEa2_Eh7ZpOKeLYvYlYneBiEfk';

// ================================
// VARIABILI GLOBALI
// ================================

let supabase = null;
let currentStep = 1;
let formData = {};
let resendTimer = 0;
let resendInterval;

// ================================
// INIZIALIZZAZIONE
// ================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inizializzazione applicazione...');
    
    let attempts = 0;
    const maxAttempts = 20;
    
    function checkSupabase() {
        attempts++;
        console.log('🔍 Tentativo ' + attempts + ': controllo Supabase...');
        
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            console.log('✅ Supabase trovato, inizializzazione...');
            initializeSupabase();
            initializeForm();
            setupEventListeners();
            setupPasswordValidation();
        } else if (attempts < maxAttempts) {
            console.log('⏳ Supabase non ancora disponibile, riprovo...');
            setTimeout(checkSupabase, 200);
        } else {
            console.error('❌ Impossibile caricare Supabase dopo ' + maxAttempts + ' tentativi');
            showError('Errore di caricamento. Ricarica la pagina.');
        }
    }
    
    checkSupabase();
});

function initializeSupabase() {
    try {
        console.log('🔧 Inizializzazione Supabase...');
        console.log('📍 URL:', SUPABASE_URL);
        console.log('🔑 Key presente:', SUPABASE_ANON_KEY ? 'Sì' : 'No');
        
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client creato con successo');
        } else {
            throw new Error('window.supabase.createClient non disponibile');
        }
    } catch (error) {
        console.error('❌ Errore inizializzazione Supabase:', error);
        showError('Errore di configurazione del servizio. Ricarica la pagina.');
    }
}

function initializeForm() {
    currentStep = 1;
    formData = {};
    showStep(1);
    updateStepIndicator();
    console.log('✅ Form inizializzato - Step corrente:', currentStep);
}

// ================================
// GESTIONE STEP DEL FORM
// ================================

function showStep(step) {
    console.log('🔄 Cambio step da ' + currentStep + ' a ' + step);
    
    const stepForms = document.querySelectorAll('.step-form');
    for (let i = 0; i < stepForms.length; i++) {
        stepForms[i].classList.add('hidden');
    }
    
    const stepElement = document.getElementById('step' + step + 'Form');
    if (stepElement) {
        stepElement.classList.remove('hidden');
        currentStep = step;
        updateStepIndicator();
        updateStepLabel();
        
        if (step === 3) {
            updateSummary();
        }
        
        console.log('✅ Step ' + step + ' mostrato correttamente');
    } else {
        console.error('❌ Elemento step non trovato: step' + step + 'Form');
    }
}

function updateStepIndicator() {
    const steps = ['step1', 'step2', 'step3'];
    const lines = ['line1', 'line2'];
    
    for (let i = 0; i < steps.length; i++) {
        const stepElement = document.getElementById(steps[i]);
        const stepNumber = i + 1;
        
        if (stepElement) {
            if (stepNumber < currentStep) {
                stepElement.className = 'step-circle completed';
                stepElement.innerHTML = '✓';
            } else if (stepNumber === currentStep) {
                stepElement.className = 'step-circle active';
                stepElement.innerHTML = stepNumber;
            } else {
                stepElement.className = 'step-circle';
                stepElement.innerHTML = stepNumber;
            }
        }
    }
    
    for (let i = 0; i < lines.length; i++) {
        const lineElement = document.getElementById(lines[i]);
        if (lineElement) {
            if (i + 1 < currentStep) {
                lineElement.classList.add('completed');
            } else {
                lineElement.classList.remove('completed');
            }
        }
    }
}

function updateStepLabel() {
    const labels = {
        1: 'Dati Personali',
        2: 'Password e Sicurezza',
        3: 'Termini e Condizioni'
    };
    
    const labelElement = document.getElementById('stepLabel');
    if (labelElement) {
        labelElement.textContent = labels[currentStep];
    }
}

function updateSummary() {
    const summaryElements = {
        summaryNome: formData.nome || '-',
        summaryCognome: formData.cognome || '-',
        summaryEmail: formData.email || '-',
        summaryTelefono: formData.telefono || 'Non fornito',
        summaryDataNascita: formData.dataNascita || '-',
        summaryLuogoNascita: formData.luogoNascita || '-'
    };
    
    for (const elementId in summaryElements) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = summaryElements[elementId];
        }
    }
}

function nextStep() {
    console.log('▶️ Tentativo di andare al prossimo step. Step corrente:', currentStep);
    
    if (validateCurrentStep()) {
        if (currentStep < 3) {
            saveCurrentStepData();
            showStep(currentStep + 1);
        } else {
            console.log('🚀 Avvio registrazione...');
            handleRegistration();
        }
    } else {
        console.log('❌ Validazione fallita per step', currentStep);
    }
}

function prevStep() {
    console.log('◀️ Tornando al step precedente. Step corrente:', currentStep);
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

// ================================
// GESTIONE EVENTI
// ================================

function setupEventListeners() {
    const form = document.getElementById('registrationForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    }
    
    setupRealTimeValidation();
}

function setupRealTimeValidation() {
    // Validazione in tempo reale per email
    const emailInput = document.getElementById('email');
    const confirmEmailInput = document.getElementById('confirmEmail');
    
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            validateEmailRealTime();
        });
    }
    
    if (confirmEmailInput) {
        confirmEmailInput.addEventListener('input', function() {
            validateEmailConfirmRealTime();
        });
    }
    
    // Validazione telefono
    const telefonoInput = document.getElementById('telefono');
    if (telefonoInput) {
        telefonoInput.addEventListener('input', function() {
            validateTelefonoRealTime();
        });
    }
}

// ================================
// VALIDAZIONE
// ================================

function validateCurrentStep() {
    console.log('🔍 Validazione step', currentStep);
    clearMessages();
    
    if (typeof currentStep === 'undefined') {
        console.error('❌ currentStep non definito!');
        currentStep = 1;
    }
    
    switch (currentStep) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        default:
            console.error('❌ Step non valido:', currentStep);
            return false;
    }
}

function validateStep1() {
    let isValid = true;
    
    // Validazione Nome
    const nome = getElementValue('nome');
    if (!nome) {
        showFieldError('nome', 'Il nome è obbligatorio');
        isValid = false;
    } else if (nome.length < 2) {
        showFieldError('nome', 'Il nome deve contenere almeno 2 caratteri');
        isValid = false;
    } else {
        clearFieldError('nome');
    }
    
    // Validazione Cognome
    const cognome = getElementValue('cognome');
    if (!cognome) {
        showFieldError('cognome', 'Il cognome è obbligatorio');
        isValid = false;
    } else if (cognome.length < 2) {
        showFieldError('cognome', 'Il cognome deve contenere almeno 2 caratteri');
        isValid = false;
    } else {
        clearFieldError('cognome');
    }
    
    // Validazione Email
    const email = getElementValue('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        showFieldError('email', 'L\'email è obbligatoria');
        isValid = false;
    } else if (!emailRegex.test(email)) {
        showFieldError('email', 'Inserisci un\'email valida');
        isValid = false;
    } else {
        clearFieldError('email');
    }
    
    // Validazione Conferma Email
    const confirmEmail = getElementValue('confirmEmail');
    if (!confirmEmail) {
        showFieldError('confirmEmail', 'Conferma l\'email è obbligatoria');
        isValid = false;
    } else if (email !== confirmEmail) {
        showFieldError('confirmEmail', 'Le email non coincidono');
        isValid = false;
    } else {
        clearFieldError('confirmEmail');
    }
    
    // Validazione Telefono (opzionale ma se presente deve essere valido)
    const telefono = getElementValue('telefono');
    if (telefono && !validateTelefono(telefono)) {
        showFieldError('telefono', 'Inserisci un numero di telefono valido (es: +39 123 456 7890)');
        isValid = false;
    } else {
        clearFieldError('telefono');
    }
    
    // Validazione Data di Nascita
    const dataNascita = getElementValue('dataNascita');
    if (!dataNascita) {
        showFieldError('dataNascita', 'La data di nascita è obbligatoria');
        isValid = false;
    } else if (!validateDataNascita(dataNascita)) {
        showFieldError('dataNascita', 'Devi avere almeno 14 anni per registrarti');
        isValid = false;
    } else {
        clearFieldError('dataNascita');
    }
    
    // Validazione Luogo di Nascita
    const luogoNascita = getElementValue('luogoNascita');
    if (!luogoNascita) {
        showFieldError('luogoNascita', 'Il luogo di nascita è obbligatorio');
        isValid = false;
    } else if (luogoNascita.length < 2) {
        showFieldError('luogoNascita', 'Il luogo di nascita deve contenere almeno 2 caratteri');
        isValid = false;
    } else {
        clearFieldError('luogoNascita');
    }
    
    return isValid;
}

function validateStep2() {
    let isValid = true;
    
    // Validazione Password
    const password = getElementValue('password');
    if (!password) {
        showFieldError('password', 'La password è obbligatoria');
        isValid = false;
    } else if (!validatePassword(password)) {
        showFieldError('password', 'La password non soddisfa i requisiti di sicurezza');
        isValid = false;
    } else {
        clearFieldError('password');
    }
    
    // Validazione Conferma Password
    const confirmPassword = getElementValue('confirmPassword');
    if (!confirmPassword) {
        showFieldError('confirmPassword', 'Conferma la password');
        isValid = false;
    } else if (password !== confirmPassword) {
        showFieldError('confirmPassword', 'Le password non coincidono');
        isValid = false;
    } else {
        clearFieldError('confirmPassword');
    }
    
    return isValid;
}

function validateStep3() {
    let isValid = true;
    
    // Validazione accettazione privacy
    const privacyAccept = document.getElementById('privacyAccept');
    if (!privacyAccept || !privacyAccept.checked) {
        showError('Devi accettare i Termini e Condizioni e l\'Informativa sulla Privacy per procedere');
        isValid = false;
    }
    
    return isValid;
}

// ================================
// FUNZIONI DI VALIDAZIONE SPECIFICHE
// ================================

function validatePassword(password) {
    const requirements = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /\d/.test(password)
    };
    
    return requirements.length && requirements.upper && requirements.lower && requirements.number;
}

function validateTelefono(telefono) {
    // Rimuove spazi, trattini e parentesi
    const cleanPhone = telefono.replace(/[\s\-\(\)]/g, '');
    // Verifica formato italiano (+39 seguito da 9-10 cifre) o internazionale
    const phoneRegex = /^(\+39|0039|39)?[0-9]{9,11}$/;
    return phoneRegex.test(cleanPhone);
}

function validateDataNascita(dataNascita) {
    const today = new Date();
    const birthDate = new Date(dataNascita);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= 14;
    }
    return age >= 14;
}

function validateEmailRealTime() {
    const email = getElementValue('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && emailRegex.test(email)) {
        setFieldValid('email');
    } else if (email) {
        setFieldError('email');
    } else {
        clearFieldValidation('email');
    }
}

function validateEmailConfirmRealTime() {
    const email = getElementValue('email');
    const confirmEmail = getElementValue('confirmEmail');
    
    if (confirmEmail && email === confirmEmail) {
        setFieldValid('confirmEmail');
    } else if (confirmEmail) {
        setFieldError('confirmEmail');
    } else {
        clearFieldValidation('confirmEmail');
    }
}

function validateTelefonoRealTime() {
    const telefono = getElementValue('telefono');
    
    if (telefono && validateTelefono(telefono)) {
        setFieldValid('telefono');
    } else if (telefono) {
        setFieldError('telefono');
    } else {
        clearFieldValidation('telefono');
    }
}

// ================================
// GESTIONE PASSWORD
// ================================

function setupPasswordValidation() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
            updatePasswordRequirements(this.value);
        });
    }
}

function updatePasswordStrength(password) {
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthBar || !strengthText) return;
    
    const score = calculatePasswordStrength(password);
    
    strengthBar.className = 'strength-bar';
    
    if (score < 2) {
        strengthBar.classList.add('strength-weak');
        strengthText.textContent = 'Troppo debole';
        strengthText.style.color = '#ef4444';
    } else if (score < 3) {
        strengthBar.classList.add('strength-medium');
        strengthText.textContent = 'Debole';
        strengthText.style.color = '#f59e0b';
    } else if (score < 4) {
        strengthBar.classList.add('strength-good');
        strengthText.textContent = 'Buona';
        strengthText.style.color = '#eab308';
    } else {
        strengthBar.classList.add('strength-strong');
        strengthText.textContent = 'Forte';
        strengthText.style.color = '#10b981';
    }
}

function calculatePasswordStrength(password) {
    let score = 0;
    
    // Lunghezza
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Caratteri
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    
    return Math.min(score, 4);
}

function updatePasswordRequirements(password) {
    const requirements = {
        'req-length': password.length >= 8,
        'req-upper': /[A-Z]/.test(password),
        'req-lower': /[a-z]/.test(password),
        'req-number': /\d/.test(password)
    };
    
    for (const [reqId, isMet] of Object.entries(requirements)) {
        const reqElement = document.getElementById(reqId);
        if (reqElement) {
            const indicator = reqElement.querySelector('.requirement-indicator');
            if (indicator) {
                if (isMet) {
                    indicator.classList.add('met');
                } else {
                    indicator.classList.remove('met');
                }
            }
        }
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

// ================================
// SALVATAGGIO DATI
// ================================

function saveCurrentStepData() {
    switch (currentStep) {
        case 1:
            formData.nome = getElementValue('nome');
            formData.cognome = getElementValue('cognome');
            formData.email = getElementValue('email');
            formData.telefono = getElementValue('telefono');
            formData.dataNascita = getElementValue('dataNascita');
            formData.luogoNascita = getElementValue('luogoNascita');
            break;
        case 2:
            formData.password = getElementValue('password');
            break;
        case 3:
            formData.privacyAccepted = document.getElementById('privacyAccept').checked;
            formData.marketingConsent = document.getElementById('marketingAccept').checked;
            break;
    }
    
    console.log('💾 Dati step ' + currentStep + ' salvati:', formData);
}

// ================================
// REGISTRAZIONE UTENTE
// ================================

async function handleRegistration() {
    console.log('🚀 Inizio processo di registrazione...');
    
    const registerButton = document.querySelector('.btn-primary');
    if (registerButton) {
        registerButton.disabled = true;
        registerButton.innerHTML = '<span class="loading-spinner"></span>Registrazione in corso...';
    }
    
    try {
        // Salva i dati dell'ultimo step
        saveCurrentStepData();
        
        // Verifica che tutti i dati necessari siano presenti
        if (!validateAllData()) {
            throw new Error('Dati incompleti per la registrazione');
        }
        
        // 1. Registra l'utente in Supabase Auth
        console.log('👤 Registrazione utente in Auth...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    nome: formData.nome,
                    cognome: formData.cognome,
                    full_name: formData.nome + ' ' + formData.cognome
                }
            }
        });
        
        if (authError) {
            console.error('❌ Errore registrazione Auth:', authError);
            throw authError;
        }
        
        console.log('✅ Utente registrato in Auth:', authData);
        
        // 2. Salva il profilo nella tabella personalizzata
        if (authData.user) {
            console.log('📝 Creazione profilo utente...');
            try {
                await createUserProfile(authData.user.id);
                console.log('✅ Profilo utente creato con successo');
                
                // 3. Crea la tessera per l'utente
                console.log('🎫 Creazione tessera utente...');
                await createUserTessera(authData.user.id);
                console.log('✅ Tessera creata con successo');
                
            } catch (profileError) {
                console.error('❌ Errore creazione profilo/tessera:', profileError);
                // Non bloccare il processo - l'utente è già registrato in Auth
                showInfo('Account creato! Il profilo e la tessera saranno completati automaticamente al primo accesso.');
            }
        }
        
        // 3. Mostra messaggio di successo
        showSuccess('Registrazione completata! Controlla la tua email per confermare l\'account.');
        
        // 4. Reindirizza dopo un breve delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
        
    } catch (error) {
        console.error('❌ Errore durante la registrazione:', error);
        
        let errorMessage = 'Si è verificato un errore durante la registrazione.';
        
        // Verifica che error.message esista prima di usare includes
        const errorMsg = error?.message || error?.error_description || error?.msg || '';
        
        if (errorMsg.includes('already registered') || errorMsg.includes('User already registered')) {
            errorMessage = 'Questa email è già registrata. Prova ad effettuare il login.';
        } else if (errorMsg.includes('invalid email')) {
            errorMessage = 'L\'indirizzo email non è valido.';
        } else if (errorMsg.includes('weak password')) {
            errorMessage = 'La password non è sufficientemente sicura.';
        } else if (errorMsg.includes('For security purposes') || errorMsg.includes('Too Many Requests')) {
            const match = errorMsg.match(/after (\d+) seconds/);
            const seconds = match ? match[1] : '60';
            errorMessage = `Troppi tentativi di registrazione. Riprova tra ${seconds} secondi per motivi di sicurezza.`;
            
            // Disabilita il bottone per il tempo specificato
            startRegistrationCooldown(parseInt(seconds));
        } else if (errorMsg.includes('rate limit')) {
            errorMessage = 'Hai fatto troppi tentativi. Aspetta qualche minuto prima di riprovare.';
            startRegistrationCooldown(60); // 1 minuto di default
        } else if (errorMsg.includes('relation') && errorMsg.includes('does not exist')) {
            errorMessage = 'Errore di configurazione del database. Contatta il supporto tecnico.';
        }
        
        showError(errorMessage);
        
    } finally {
        // Ripristina il bottone
        if (registerButton) {
            registerButton.disabled = false;
            registerButton.innerHTML = '🚀 Registrati';
        }
    }
}

async function createUserProfile(userId) {
    console.log('👤 Creazione profilo per utente:', userId);
    
    // Prepara i dati per il profilo
    const profileData = {
        id: userId,
        nome: formData.nome,
        cognome: formData.cognome,
        email: formData.email,
        telefono: formData.telefono && formData.telefono.trim() !== '' ? formData.telefono.trim() : null,
        data_nascita: formData.dataNascita,
        luogo_nascita: formData.luogoNascita,
        marketing_consent: formData.marketingConsent || false,
        privacy_accepted: formData.privacyAccepted || false,
        privacy_accepted_at: new Date().toISOString(),
        ip_registrazione: await getUserIP(),
        user_agent: navigator.userAgent
    };
    
    console.log('📊 Dati profilo da inserire:', profileData);
    
    // Lista di possibili nomi per la tabella profili
    const possibleProfileTables = [
        'profili',        // Nome italiano
        'profiles',       // Nome inglese
        'users',          // Nome generico
        'user_profiles',  // Nome composto
        'utenti',         // Nome italiano alternativo
        'membri',         // Nome per membri
        'accounts'        // Nome per account
    ];
    
    for (const tableName of possibleProfileTables) {
        try {
            console.log(`🔄 Tentativo inserimento in tabella "${tableName}"...`);
            
            const { data, error } = await supabase
                .from(tableName)
                .insert([profileData]);
            
            if (!error) {
                console.log(`✅ Profilo creato con successo in "${tableName}":`, data);
                return data;
            }
            
            console.warn(`⚠️ Errore tabella "${tableName}":`, error.message);
            
        } catch (err) {
            console.warn(`⚠️ Eccezione tabella "${tableName}":`, err.message);
        }
    }
    
    // Se tutti i tentativi falliscono
    const errorMsg = `Impossibile trovare la tabella corretta per i profili. Tabelle provate: ${possibleProfileTables.join(', ')}`;
    console.error('❌ Creazione profilo fallita:', errorMsg);
    throw new Error(errorMsg);
}

async function createUserTessera(userId) {
    console.log('🎫 Creazione tessera per utente:', userId);
    
    // Genera il numero tessera univoco
    const numeroTessera = await generateNumeroTessera();
    
    // Prepara i dati per la tessera
    const tesseraData = {
        id: userId, // Collega la tessera all'utente
        numero_tessera: numeroTessera,
        stato: 'attiva', // o 'pending' se deve essere attivata manualmente
        data_emissione: new Date().toISOString(),
        data_scadenza: calculateScadenzaTessera(), // Calcola data scadenza (es. 1 anno)
        tipo_tessera: 'standard', // o 'premium', 'basic', etc.
        punti_accumulati: 0,
        livello: 'bronze', // bronze, silver, gold, platinum
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    console.log('📊 Dati tessera da inserire:', tesseraData);
    
    // Lista di possibili nomi per la tabella tessere
    const possibleTessereTables = [
        'tessere',        // Nome italiano
        'tessere_utenti', // Nome italiano composto
        'cards',          // Nome inglese
        'user_cards',     // Nome inglese composto
        'membership_cards', // Nome descrittivo
        'loyalty_cards',  // Nome per fedeltà
        'badges',         // Nome alternativo
        'membership'      // Nome per appartenenza
    ];
    
    for (const tableName of possibleTessereTables) {
        try {
            console.log(`🔄 Tentativo inserimento in tabella "${tableName}"...`);
            
            const { data, error } = await supabase
                .from(tableName)
                .insert([tesseraData]);
            
            if (!error) {
                console.log(`✅ Tessera creata con successo in "${tableName}":`, data);
                return data;
            }
            
            console.warn(`⚠️ Errore tabella "${tableName}":`, error.message);
            
        } catch (err) {
            console.warn(`⚠️ Eccezione tabella "${tableName}":`, err.message);
        }
    }
    
    // Se tutti i tentativi falliscono
    const errorMsg = `Impossibile trovare la tabella corretta per le tessere. Tabelle provate: ${possibleTessereTables.join(', ')}`;
    console.error('❌ Creazione tessera fallita:', errorMsg);
    throw new Error(errorMsg);
}

async function generateNumeroTessera() {
    console.log('🔢 Generazione numero tessera univoco...');
    
    // Genera un numero tessera nel formato: YYYY-XXXXXXXX (anno + 8 cifre random)
    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000000 + Math.random() * 90000000); // 8 cifre
    const numeroTessera = `${year}-${randomNum}`;
    
    try {
        // Verifica che il numero non esista già
        const { data: existing, error } = await supabase
            .from('tessere') // Prova prima con tessere
            .select('numero_tessera')
            .eq('numero_tessera', numeroTessera)
            .single();
        
        if (existing) {
            console.log('🔄 Numero tessera già esistente, genero un nuovo numero...');
            return await generateNumeroTessera(); // Ricorsivo fino a trovare un numero univoco
        }
        
        console.log('✅ Numero tessera generato:', numeroTessera);
        return numeroTessera;
        
    } catch (error) {
        // Se la tabella non esiste o il numero non è trovato, va bene
        console.log('✅ Numero tessera generato (no check):', numeroTessera);
        return numeroTessera;
    }
}

function calculateScadenzaTessera() {
    // Calcola la data di scadenza (1 anno dalla data di emissione)
    const scadenza = new Date();
    scadenza.setFullYear(scadenza.getFullYear() + 1);
    return scadenza.toISOString().split('T')[0]; // Formato YYYY-MM-DD
}

async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.warn('⚠️ Impossibile ottenere IP:', error);
        return null;
    }
}

function validateAllData() {
    const required = ['nome', 'cognome', 'email', 'password', 'dataNascita', 'luogoNascita'];
    
    for (const field of required) {
        if (!formData[field]) {
            console.error('❌ Campo mancante:', field);
            return false;
        }
    }
    
    if (!formData.privacyAccepted) {
        console.error('❌ Privacy non accettata');
        return false;
    }
    
    return true;
}

// ================================
// UTILITY FUNCTIONS
// ================================

function getElementValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value.trim() : '';
}

function showError(message) {
    clearMessages();
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    console.error('❌ Errore mostrato:', message);
}

function showSuccess(message) {
    clearMessages();
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    
    if (successDiv && successText) {
        successText.textContent = message;
        successDiv.classList.remove('hidden');
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    console.log('✅ Successo mostrato:', message);
}

function showInfo(message) {
    clearMessages();
    const infoDiv = document.getElementById('infoMessage');
    const infoText = document.getElementById('infoText');
    
    if (infoDiv && infoText) {
        infoText.textContent = message;
        infoDiv.classList.remove('hidden');
    }
    
    console.log('ℹ️ Info mostrata:', message);
}

function clearMessages() {
    const messages = ['errorMessage', 'successMessage', 'infoMessage'];
    messages.forEach(messageId => {
        const element = document.getElementById(messageId);
        if (element) {
            element.classList.add('hidden');
        }
    });
}

function showFieldError(fieldId, message) {
    const errorDiv = document.getElementById(fieldId + 'Error');
    const input = document.getElementById(fieldId);
    
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
    
    if (input) {
        input.classList.add('error');
        input.classList.remove('valid');
    }
}

function clearFieldError(fieldId) {
    const errorDiv = document.getElementById(fieldId + 'Error');
    const input = document.getElementById(fieldId);
    
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
    
    if (input) {
        input.classList.remove('error');
        input.classList.add('valid');
    }
}

function setFieldValid(fieldId) {
    const input = document.getElementById(fieldId);
    if (input) {
        input.classList.remove('error');
        input.classList.add('valid');
    }
}

function setFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    if (input) {
        input.classList.add('error');
        input.classList.remove('valid');
    }
}

function clearFieldValidation(fieldId) {
    const input = document.getElementById(fieldId);
    if (input) {
        input.classList.remove('error', 'valid');
    }
}

// ================================
// FUNZIONI GLOBALI PER HTML
// ================================

function goBack() {
    if (currentStep > 1) {
        prevStep();
    } else {
        window.history.back();
    }
}

// ================================
// GESTIONE COOLDOWN REGISTRAZIONE
// ================================

function startRegistrationCooldown(seconds) {
    const registerButton = document.getElementById('registerBtn') || document.querySelector('.btn-primary');
    if (!registerButton) return;
    
    let remainingSeconds = seconds;
    
    const updateButton = () => {
        registerButton.disabled = true;
        registerButton.innerHTML = `⏳ Riprova tra ${remainingSeconds}s`;
    };
    
    updateButton();
    
    const interval = setInterval(() => {
        remainingSeconds--;
        
        if (remainingSeconds <= 0) {
            clearInterval(interval);
            registerButton.disabled = false;
            registerButton.innerHTML = '🚀 Completa Registrazione';
        } else {
            updateButton();
        }
    }, 1000);
}
