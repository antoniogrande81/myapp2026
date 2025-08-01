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
let totalSteps = 4; // Aumentato a 4 step

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
            setupFormValidation();
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
        
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client creato con successo');
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
    
    // Nascondi tutti gli step
    const stepForms = document.querySelectorAll('.step-form');
    stepForms.forEach(form => form.classList.add('hidden'));
    
    // Mostra lo step richiesto
    const stepElement = document.getElementById('step' + step + 'Form');
    if (stepElement) {
        stepElement.classList.remove('hidden');
        currentStep = step;
        updateStepIndicator();
        updateStepLabel();
        
        // Aggiorna il riepilogo per gli ultimi step
        if (step === 4) {
            updateSummary();
        }
        
        console.log('✅ Step ' + step + ' mostrato correttamente');
    } else {
        console.error('❌ Elemento step non trovato: step' + step + 'Form');
    }
}

function updateStepIndicator() {
    const steps = ['step1', 'step2', 'step3', 'step4'];
    const lines = ['line1', 'line2', 'line3'];
    
    // Aggiorna gli indicatori degli step
    steps.forEach((stepId, index) => {
        const stepElement = document.getElementById(stepId);
        const stepNumber = index + 1;
        
        if (stepElement) {
            stepElement.className = 'step-circle';
            
            if (stepNumber < currentStep) {
                stepElement.classList.add('completed');
                stepElement.innerHTML = '✓';
            } else if (stepNumber === currentStep) {
                stepElement.classList.add('active');
                stepElement.innerHTML = stepNumber;
            } else {
                stepElement.innerHTML = stepNumber;
            }
        }
    });
    
    // Aggiorna le linee di connessione
    lines.forEach((lineId, index) => {
        const lineElement = document.getElementById(lineId);
        if (lineElement) {
            if (index + 1 < currentStep) {
                lineElement.classList.add('completed');
            } else {
                lineElement.classList.remove('completed');
            }
        }
    });
}

function updateStepLabel() {
    const labels = {
        1: 'Dati Personali',
        2: 'Dati di Contatto',
        3: 'Password e Sicurezza',
        4: 'Riepilogo e Conferma'
    };
    
    const labelElement = document.getElementById('stepLabel');
    if (labelElement) {
        labelElement.textContent = labels[currentStep];
    }
}

function updateSummary() {
    const summaryData = {
        'summaryNome': formData.nome || '-',
        'summaryCognome': formData.cognome || '-',
        'summaryEmail': formData.email || '-',
        'summaryDataNascita': formData.dataNascita || '-',
        'summaryLuogoNascita': formData.luogoNascita || '-',
        'summaryCodiceFiscale': formData.codiceFiscale || 'Non fornito',
        'summaryTelefono': formData.telefono || 'Non fornito',
        'summaryIndirizzo': formData.indirizzoCompleto || 'Non fornito',
        'summaryProfessione': formData.professione || 'Non specificata'
    };
    
    Object.entries(summaryData).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    });
}

async function nextStep() {
    console.log('▶️ Tentativo di andare al prossimo step. Step corrente:', currentStep);
    
    if (await validateCurrentStep()) {
        if (currentStep < totalSteps) {
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
// VALIDAZIONE COMPLETA
// ================================

async function validateCurrentStep() {
    console.log('🔍 Validazione step', currentStep);
    clearMessages();
    
    switch (currentStep) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        case 4:
            return validateStep4();
        default:
            console.error('❌ Step non valido:', currentStep);
            return false;
    }
}

function validateStep1() {
    let isValid = true;
    
    // Validazione Nome
    const nome = getElementValue('nome');
    if (!nome || nome.length < 2) {
        showFieldError('nome', 'Il nome deve contenere almeno 2 caratteri');
        isValid = false;
    } else {
        clearFieldError('nome');
    }
    
    // Validazione Cognome
    const cognome = getElementValue('cognome');
    if (!cognome || cognome.length < 2) {
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
        showFieldError('confirmEmail', 'Conferma l\'email');
        isValid = false;
    } else if (email !== confirmEmail) {
        showFieldError('confirmEmail', 'Le email non coincidono');
        isValid = false;
    } else {
        clearFieldError('confirmEmail');
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
    if (!luogoNascita || luogoNascita.length < 2) {
        showFieldError('luogoNascita', 'Il luogo di nascita è obbligatorio');
        isValid = false;
    } else {
        clearFieldError('luogoNascita');
    }
    
    return isValid;
}

function validateStep2() {
    let isValid = true;
    
    // Validazione Codice Fiscale (opzionale ma se presente deve essere valido)
    const codiceFiscale = getElementValue('codiceFiscale');
    if (codiceFiscale && !validateCodiceFiscale(codiceFiscale)) {
        showFieldError('codiceFiscale', 'Inserisci un codice fiscale valido');
        isValid = false;
    } else {
        clearFieldError('codiceFiscale');
    }
    
    // Validazione Telefono (opzionale ma se presente deve essere valido)
    const telefono = getElementValue('telefono');
    if (telefono && !validateTelefono(telefono)) {
        showFieldError('telefono', 'Inserisci un numero di telefono valido');
        isValid = false;
    } else {
        clearFieldError('telefono');
    }
    
    return isValid;
}

function validateStep3() {
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

function validateStep4() {
    // Validazione accettazione privacy
    const privacyAccept = document.getElementById('privacyAccept');
    if (!privacyAccept || !privacyAccept.checked) {
        showError('Devi accettare i Termini e Condizioni e l\'Informativa sulla Privacy per procedere');
        return false;
    }
    
    return true;
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
    const cleanPhone = telefono.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+39|0039|39)?[0-9]{9,11}$/;
    return phoneRegex.test(cleanPhone);
}

function validateCodiceFiscale(cf) {
    if (!cf || cf.length !== 16) return false;
    
    const cfRegex = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;
    return cfRegex.test(cf.toUpperCase());
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
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
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
    
    Object.entries(requirements).forEach(([reqId, isMet]) => {
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
    });
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
// VALIDAZIONE IN TEMPO REALE
// ================================

function setupFormValidation() {
    // Validazione email in tempo reale
    const emailInput = document.getElementById('email');
    const confirmEmailInput = document.getElementById('confirmEmail');
    
    if (emailInput) {
        emailInput.addEventListener('input', validateEmailRealTime);
    }
    
    if (confirmEmailInput) {
        confirmEmailInput.addEventListener('input', validateEmailConfirmRealTime);
    }
    
    // Validazione telefono in tempo reale
    const telefonoInput = document.getElementById('telefono');
    if (telefonoInput) {
        telefonoInput.addEventListener('input', validateTelefonoRealTime);
    }
    
    // Validazione codice fiscale in tempo reale
    const cfInput = document.getElementById('codiceFiscale');
    if (cfInput) {
        cfInput.addEventListener('input', validateCodiceFiscaleRealTime);
    }
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

function validateCodiceFiscaleRealTime() {
    const cf = getElementValue('codiceFiscale');
    
    if (cf && validateCodiceFiscale(cf)) {
        setFieldValid('codiceFiscale');
    } else if (cf) {
        setFieldError('codiceFiscale');
    } else {
        clearFieldValidation('codiceFiscale');
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
            formData.dataNascita = getElementValue('dataNascita');
            formData.luogoNascita = getElementValue('luogoNascita');
            break;
        case 2:
            formData.codiceFiscale = getElementValue('codiceFiscale');
            formData.telefono = getElementValue('telefono');
            formData.telefonoEmergenza = getElementValue('telefonoEmergenza');
            formData.indirizzoVia = getElementValue('indirizzoVia');
            formData.indirizzoCivico = getElementValue('indirizzoCivico');
            formData.indirizzoCap = getElementValue('indirizzoCap');
            formData.indirizzoCitta = getElementValue('indirizzoCitta');
            formData.indirizzoProvincia = getElementValue('indirizzoProvincia');
            formData.professione = getElementValue('professione');
            formData.titoloStudio = getElementValue('titoloStudio');
            
            // Crea indirizzo completo per il riepilogo
            const indirizzoParts = [
                formData.indirizzoVia,
                formData.indirizzoCivico,
                formData.indirizzoCap,
                formData.indirizzoCitta,
                formData.indirizzoProvincia
            ].filter(part => part && part.trim());
            
            formData.indirizzoCompleto = indirizzoParts.length > 0 ? indirizzoParts.join(', ') : '';
            break;
        case 3:
            formData.password = getElementValue('password');
            break;
        case 4:
            formData.privacyAccepted = document.getElementById('privacyAccept')?.checked || false;
            formData.marketingConsent = document.getElementById('marketingAccept')?.checked || false;
            formData.newsletterConsent = document.getElementById('newsletterAccept')?.checked || false;
            break;
    }
    
    console.log('💾 Dati step ' + currentStep + ' salvati:', formData);
}

// ================================
// REGISTRAZIONE UTENTE
// ================================

async function handleRegistration() {
    console.log('🚀 Inizio processo di registrazione...');
    
    const registerButton = document.querySelector('#registerBtn');
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
        
        console.log('👤 Registrazione utente con email:', formData.email);
        
        // Prepara i metadati per Supabase
        const metadata = {
            nome: formData.nome,
            cognome: formData.cognome,
            full_name: `${formData.nome} ${formData.cognome}`,
            data_nascita: formData.dataNascita,
            luogo_nascita: formData.luogoNascita,
            codice_fiscale: formData.codiceFiscale || null,
            telefono: formData.telefono || null,
            telefono_emergenza: formData.telefonoEmergenza || null,
            indirizzo_via: formData.indirizzoVia || null,
            indirizzo_civico: formData.indirizzoCivico || null,
            indirizzo_cap: formData.indirizzoCap || null,
            indirizzo_citta: formData.indirizzoCitta || null,
            indirizzo_provincia: formData.indirizzoProvincia || null,
            professione: formData.professione || null,
            titolo_studio: formData.titoloStudio || null,
            privacy_accepted: formData.privacyAccepted,
            marketing_consent: formData.marketingConsent,
            newsletter_consent: formData.newsletterConsent
        };
        
        // Registrazione con Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: metadata
            }
        });
        
        if (authError) {
            console.error('❌ Errore registrazione Auth:', authError);
            throw authError;
        }
        
        console.log('✅ Utente registrato con successo:', authData.user?.id);
        
        // Attendi un momento per permettere ai trigger di completare
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verifica che profilo e tessera siano stati creati
        try {
            if (authData.user) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, nome, cognome')
                    .eq('id', authData.user.id)
                    .single();
                
                const { data: tesseraData, error: tesseraError } = await supabase
                    .from('tessere')
                    .select('numero_tessera, data_scadenza')
                    .eq('id', authData.user.id)
                    .single();
                
                if (profileData && tesseraData) {
                    showSuccess(`🎉 Registrazione completata con successo!
                        
                        ✅ Profilo creato
                        ✅ Tessera ${tesseraData.numero_tessera} generata
                        📧 Email di conferma inviata a: ${formData.email}
                        
                        Controlla la tua email per attivare l'account.`);
                } else {
                    showSuccess(`🎉 Registrazione completata!
                        📧 Controlla la tua email per confermare l'account.
                        Il profilo e la tessera saranno disponibili dopo la conferma.`);
                }
            }
        } catch (verificationError) {
            console.warn('⚠️ Impossibile verificare creazione profilo/tessera:', verificationError);
            showSuccess(`🎉 Registrazione completata!
                📧 Controlla la tua email per confermare l'account.`);
        }
        
        // Reindirizza dopo qualche secondo
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 5000);
        
    } catch (error) {
        console.error('❌ Errore durante la registrazione:', error);
        
        let errorMessage = 'Si è verificato un errore durante la registrazione.';
        const errorMsg = error?.message || error?.error_description || error?.msg || '';
        
        if (errorMsg.includes('duplicate key') || 
            errorMsg.includes('already registered') ||
            errorMsg.includes('User already registered')) {
            errorMessage = `⚠️ Questa email è già registrata nel sistema.
                Prova ad effettuare il login o utilizza un'email diversa.`;
        } else if (errorMsg.includes('invalid email')) {
            errorMessage = '❌ L\'indirizzo email non è valido.';
        } else if (errorMsg.includes('weak password')) {
            errorMessage = '❌ La password non è sufficientemente sicura.';
        } else if (errorMsg.includes('rate limit') || errorMsg.includes('Too Many Requests')) {
            errorMessage = '⏳ Troppi tentativi. Riprova tra qualche minuto.';
        }
        
        showError(errorMessage);
        
    } finally {
        // Ripristina il bottone
        if (registerButton) {
            registerButton.disabled = false;
            registerButton.innerHTML = '🚀 Completa Registrazione';
        }
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
// FORMATTAZIONE AUTOMATICA
// ================================

document.addEventListener('DOMContentLoaded', function() {
    // Formattazione automatica telefono
    const telefonoInputs = ['telefono', 'telefonoEmergenza'];
    telefonoInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.startsWith('39')) {
                    value = '+' + value;
                } else if (value.startsWith('3') && value.length >= 3) {
                    value = '+39 ' + value;
                }
                
                if (value.startsWith('+39')) {
                    value = value.replace(/(\+39)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
                }
                
                e.target.value = value;
            });
        }
    });
    
    // Formattazione automatica codice fiscale
    const cfInput = document.getElementById('codiceFiscale');
    if (cfInput) {
        cfInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }
    
    // Formattazione automatica CAP
    const capInput = document.getElementById('indirizzoCap');
    if (capInput) {
        capInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            e.target.value = value.substring(0, 5);
        });
    }
});
