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
    
    // Controllo Supabase con retry
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
    
    // Nascondi tutti gli step
    const stepForms = document.querySelectorAll('.step-form');
    for (let i = 0; i < stepForms.length; i++) {
        stepForms[i].classList.add('hidden');
    }
    
    // Mostra lo step corrente
    const stepElement = document.getElementById('step' + step + 'Form');
    if (stepElement) {
        stepElement.classList.remove('hidden');
        currentStep = step;
        updateStepIndicator();
        updateStepLabel();
        
        // Aggiorna il riepilogo se siamo al terzo step
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
        summaryTelefono: formData.telefono || 'Non fornito'
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
    
    // Validazione Telefono (opzionale)
    const telefono = getElementValue('telefono');
    if (telefono) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/;
        if (!phoneRegex.test(telefono)) {
            showFieldError('telefono', 'Inserisci un numero di telefono valido');
            isValid = false;
        } else {
            clearFieldError('telefono');
        }
    }
    
    return isValid;
}

function validateStep2() {
    let isValid = true;
    
    const password = getElementValue('password', false);
    const confirmPassword = getElementValue('confirmPassword', false);
    
    if (!password) {
        showFieldError('password', 'La password è obbligatoria');
        isValid = false;
    } else if (!isPasswordStrong(password)) {
        showFieldError('password', 'La password non soddisfa i requisiti di sicurezza');
        isValid = false;
    } else {
        clearFieldError('password');
    }
    
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
    const privacyAccept = document.getElementById('privacyAccept');
    
    if (!privacyAccept || !privacyAccept.checked) {
        showError('Devi accettare i termini e condizioni per procedere');
        return false;
    }
    
    return true;
}

// ================================
// VALIDAZIONE PASSWORD
// ================================

function setupPasswordValidation() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const emailInput = document.getElementById('email');
    const confirmEmailInput = document.getElementById('confirmEmail');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
            updatePasswordRequirements(this.value);
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            validatePasswordMatch();
        });
    }
    
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            validateEmailMatch();
        });
    }
    
    if (confirmEmailInput) {
        confirmEmailInput.addEventListener('input', function() {
            validateEmailMatch();
        });
    }
}

function validateEmailMatch() {
    const email = getElementValue('email');
    const confirmEmail = getElementValue('confirmEmail');
    
    if (confirmEmail && email !== confirmEmail) {
        showFieldError('confirmEmail', 'Le email non coincidono');
    } else {
        clearFieldError('confirmEmail');
    }
}

function updatePasswordStrength(password) {
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthBar || !strengthText) return;
    
    const strength = calculatePasswordStrength(password);
    
    strengthBar.className = 'strength-bar';
    
    switch (strength.level) {
        case 0:
            strengthBar.classList.add('strength-weak');
            strengthText.textContent = 'Troppo debole';
            strengthText.style.color = '#ef4444';
            break;
        case 1:
            strengthBar.classList.add('strength-medium');
            strengthText.textContent = 'Debole';
            strengthText.style.color = '#f59e0b';
            break;
        case 2:
            strengthBar.classList.add('strength-good');
            strengthText.textContent = 'Buona';
            strengthText.style.color = '#eab308';
            break;
        case 3:
            strengthBar.classList.add('strength-strong');
            strengthText.textContent = 'Forte';
            strengthText.style.color = '#10b981';
            break;
    }
}

function updatePasswordRequirements(password) {
    const requirements = {
        'req-length': password.length >= 8,
        'req-upper': /[A-Z]/.test(password),
        'req-lower': /[a-z]/.test(password),
        'req-number': /\d/.test(password)
    };
    
    for (const reqId in requirements) {
        const indicator = document.querySelector('#' + reqId + ' .requirement-indicator');
        if (indicator) {
            if (requirements[reqId]) {
                indicator.classList.add('met');
            } else {
                indicator.classList.remove('met');
            }
        }
    }
}

function calculatePasswordStrength(password) {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    for (const check in checks) {
        if (checks[check]) score++;
    }
    
    let level;
    if (score < 2) level = 0;
    else if (score < 3) level = 1;
    else if (score < 4) level = 2;
    else level = 3;
    
    return { score: score, level: level, checks: checks };
}

function isPasswordStrong(password) {
    const strength = calculatePasswordStrength(password);
    return strength.checks.length && strength.checks.upper && 
           strength.checks.lower && strength.checks.number;
}

function validatePasswordMatch() {
    const password = getElementValue('password', false);
    const confirmPassword = getElementValue('confirmPassword', false);
    
    if (confirmPassword && password !== confirmPassword) {
        showFieldError('confirmPassword', 'Le password non coincidono');
    } else {
        clearFieldError('confirmPassword');
    }
}

// ================================
// GESTIONE DATI FORM
// ================================

function saveCurrentStepData() {
    switch (currentStep) {
        case 1:
            formData.nome = getElementValue('nome');
            formData.cognome = getElementValue('cognome');
            formData.email = getElementValue('email');
            formData.telefono = getElementValue('telefono');
            break;
        case 2:
            formData.password = getElementValue('password', false);
            break;
        case 3:
            const privacyElement = document.getElementById('privacyAccept');
            const marketingElement = document.getElementById('marketingAccept');
            formData.privacyAccept = privacyElement ? privacyElement.checked : false;
            formData.marketingAccept = marketingElement ? marketingElement.checked : false;
            break;
    }
    console.log('💾 Dati step ' + currentStep + ' salvati:', formData);
}

// ================================
// REGISTRAZIONE UTENTE
// ================================

async function handleRegistration() {
    try {
        console.log('🚀 Inizio processo di registrazione');
        
        if (!supabase) {
            throw new Error('Supabase non inizializzato correttamente');
        }
        
        saveCurrentStepData();
        showLoading();
        
        console.log('📧 Registrazione per email:', formData.email);
        
        // 1. Registra l'utente in Supabase Auth
        const authResult = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    nome: formData.nome,
                    cognome: formData.cognome,
                    telefono: formData.telefono || null,
                    marketing_consent: formData.marketingAccept || false
                }
            }
        });
        
        if (authResult.error) {
            throw new Error('Errore registrazione: ' + getErrorMessage(authResult.error));
        }
        
        console.log('✅ Utente registrato:', authResult.data.user?.id);
        
        // 2. Crea record nella tabella tessere
        if (authResult.data.user) {
            const numeroTessera = await generateNextTesseraNumber();
            
            const dataScadenza = new Date();
            dataScadenza.setFullYear(dataScadenza.getFullYear() + 1);
            
            const tessereData = {
                user_id: authResult.data.user.id,
                numero_tessera: numeroTessera,
                data_scadenza: dataScadenza.toISOString().split('T')[0],
                attiva: false,
                qr_code: null,
                nome: formData.nome,
                cognome: formData.cognome,
                email: formData.email,
                telefono: formData.telefono || null,
                marketing_consent: formData.marketingAccept || false
            };
            
            console.log('💳 Creazione tessera:', tessereData);
            
            const tessereResult = await supabase
                .from('tessere')
                .insert([tessereData])
                .select();
            
            if (tessereResult.error) {
                console.error('❌ Errore creazione tessera:', tessereResult.error);
                
                if (tessereResult.error.message.includes('duplicate') || tessereResult.error.message.includes('tessere_numero_tessera_key')) {
                    console.log('🔄 Numero tessera duplicato, rigenerazione...');
                    
                    tessereData.numero_tessera = Date.now().toString().slice(-6);
                    
                    const tessereResult2 = await supabase
                        .from('tessere')
                        .insert([tessereData])
                        .select();
                    
                    if (tessereResult2.error) {
                        console.error('❌ Errore anche con numero alternativo:', tessereResult2.error);
                        showInfo('Utente creato, ma errore nella creazione della tessera. Contatta il supporto.');
                    } else {
                        console.log('✅ Tessera creata con numero alternativo:', tessereResult2.data);
                    }
                } else {
                    showInfo('Utente creato, ma errore nella creazione della tessera. Contatta il supporto.');
                }
            } else {
                console.log('✅ Tessera creata:', tessereResult.data);
                if (tessereResult.data && tessereResult.data[0]) {
                    console.log('🎫 Numero tessera assegnato:', tessereResult.data[0].numero_tessera);
                }
            }
        }
        
        hideLoading();
        showEmailConfirmation();
        startResendTimer();
        
        console.log('🎉 Registrazione completata con successo');
        
    } catch (error) {
        hideLoading();
        console.error('❌ Errore durante la registrazione:', error);
        showError(error.message || 'Errore durante la registrazione. Riprova.');
    }
}

function getErrorMessage(error) {
    switch (error.message) {
        case 'User already registered':
            return 'Questo indirizzo email è già registrato';
        case 'Invalid email':
            return 'Indirizzo email non valido';
        case 'Password should be at least 6 characters':
            return 'La password deve contenere almeno 6 caratteri';
        case 'Signup is disabled':
            return 'La registrazione è temporaneamente disabilitata';
        default:
            return error.message;
    }
}

// Funzione per generare numero tessera
async function generateNextTesseraNumber() {
    try {
        console.log('🔢 Generazione numero tessera...');
        
        const result = await supabase
            .from('tessere')
            .select('numero_tessera')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (result.error) {
            console.error('Errore nel recuperare numeri tessera:', result.error);
            return Date.now().toString().slice(-6);
        }
        
        let maxNumber = 300;
        
        if (result.data && result.data.length > 0) {
            for (let i = 0; i < result.data.length; i++) {
                const num = parseInt(result.data[i].numero_tessera);
                if (!isNaN(num) && num > maxNumber) {
                    maxNumber = num;
                }
            }
        }
        
        const nextNumber = maxNumber + 1;
        console.log('🎯 Prossimo numero tessera:', nextNumber);
        
        return nextNumber.toString();
        
    } catch (error) {
        console.error('Errore nella generazione numero tessera:', error);
        return (Date.now() % 1000000).toString();
    }
}

// ================================
// CONFERMA EMAIL
// ================================

function showEmailConfirmation() {
    const registrationSection = document.getElementById('registrationSection');
    if (registrationSection) {
        registrationSection.classList.add('hidden');
    }
    
    const confirmationHTML = '<div class="email-confirmation-container">' +
        '<div class="email-icon">✉️</div>' +
        '<h2 class="text-2xl font-black text-primary mb-4">Controlla la tua email!</h2>' +
        '<p class="text-lg text-gray-700 mb-6">' +
        'Abbiamo inviato un link di conferma a<br>' +
        '<strong class="text-primary">' + formData.email + '</strong>' +
        '</p>' +
        '<p class="text-gray-600 mb-8">' +
        'Clicca sul link nell\'email per attivare il tuo account. ' +
        'Se non vedi l\'email, controlla la cartella spam.' +
        '</p>' +
        '<div class="space-y-4">' +
        '<button id="resendButton" class="btn-ghost w-full" onclick="resendConfirmationEmail()" disabled>' +
        'Invia di nuovo' +
        '</button>' +
        '<div id="resendTimer" class="resend-timer">' +
        'Puoi inviare di nuovo l\'email tra <span id="timerCount">60</span> secondi' +
        '</div>' +
        '</div>' +
        '<div class="mt-8 pt-6 border-t border-gray-200">' +
        '<a href="login.html" class="btn-secondary w-full text-center block">' +
        'Torna al Login' +
        '</a>' +
        '</div>' +
        '</div>';
    
    const mainContainer = document.querySelector('main .max-w-lg');
    if (mainContainer) {
        mainContainer.innerHTML = confirmationHTML;
    }
}

async function resendConfirmationEmail() {
    try {
        showInfo('Invio email in corso...');
        
        if (!supabase) {
            throw new Error('Servizio non disponibile');
        }
        
        const result = await supabase.auth.resend({
            type: 'signup',
            email: formData.email
        });
        
        if (result.error) {
            throw result.error;
        }
        
        showSuccess('Email di conferma inviata nuovamente!');
        startResendTimer();
        
    } catch (error) {
        console.error('❌ Errore riinvio email:', error);
        showError('Errore nell\'invio dell\'email. Riprova più tardi.');
    }
}

function startResendTimer() {
    resendTimer = 60;
    const resendButton = document.getElementById('resendButton');
    const timerElement = document.getElementById('timerCount');
    const timerContainer = document.getElementById('resendTimer');
    
    if (resendButton) {
        resendButton.disabled = true;
        resendButton.textContent = 'Attendi...';
    }
    
    if (timerContainer) {
        timerContainer.classList.remove('hidden');
    }
    
    resendInterval = setInterval(function() {
        resendTimer--;
        if (timerElement) {
            timerElement.textContent = resendTimer;
        }
        
        if (resendTimer <= 0) {
            clearInterval(resendInterval);
            if (resendButton) {
                resendButton.disabled = false;
                resendButton.textContent = 'Invia di nuovo';
            }
            if (timerContainer) {
                timerContainer.classList.add('hidden');
            }
        }
    }, 1000);
}

// ================================
// UTILITY FUNCTIONS
// ================================

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        if (button) button.textContent = '🙈';
    } else {
        input.type = 'password';
        if (button) button.textContent = '👁️';
    }
}

function setupRealTimeValidation() {
    const inputs = document.querySelectorAll('.form-input');
    
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('blur', function() {
            validateField(this);
        });
        
        inputs[i].addEventListener('input', function() {
            clearFieldError(this.id);
            updateFieldState(this);
        });
    }
}

function validateField(input) {
    const fieldId = input.id;
    const value = input.value.trim();
    
    switch (fieldId) {
        case 'nome':
        case 'cognome':
            if (!value) {
                showFieldError(fieldId, 'Il ' + fieldId + ' è obbligatorio');
                return false;
            } else if (value.length < 2) {
                showFieldError(fieldId, 'Il ' + fieldId + ' deve contenere almeno 2 caratteri');
                return false;
            }
            break;
            
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) {
                showFieldError(fieldId, 'L\'email è obbligatoria');
                return false;
            } else if (!emailRegex.test(value)) {
                showFieldError(fieldId, 'Inserisci un\'email valida');
                return false;
            }
            break;
            
        case 'confirmEmail':
            const originalEmail = getElementValue('email');
            if (!value) {
                showFieldError(fieldId, 'Conferma l\'email è obbligatoria');
                return false;
            } else if (value !== originalEmail) {
                showFieldError(fieldId, 'Le email non coincidono');
                return false;
            }
            break;
            
        case 'telefono':
            if (value) {
                const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/;
                if (!phoneRegex.test(value)) {
                    showFieldError(fieldId, 'Inserisci un numero di telefono valido');
                    return false;
                }
            }
            break;
    }
    
    clearFieldError(fieldId);
    return true;
}

function updateFieldState(input) {
    if (input.value.trim()) {
        if (validateField(input)) {
            input.classList.remove('error');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
            input.classList.add('error');
        }
    } else {
        input.classList.remove('valid', 'error');
    }
}

function getElementValue(elementId, trim) {
    const element = document.getElementById(elementId);
    if (!element) return '';
    return (trim !== false) ? element.value.trim() : element.value;
}

// ================================
// GESTIONE MESSAGGI
// ================================

function showError(message) {
    console.log('❌ Errore:', message);
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(function() {
            errorDiv.classList.add('hidden');
        }, 8000);
    }
}

function showSuccess(message) {
    console.log('✅ Successo:', message);
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    
    if (successDiv && successText) {
        successText.textContent = message;
        successDiv.classList.remove('hidden');
        
        setTimeout(function() {
            successDiv.classList.add('hidden');
        }, 4000);
    }
}

function showInfo(message) {
    console.log('ℹ️ Info:', message);
    const infoDiv = document.getElementById('infoMessage');
    const infoText = document.getElementById('infoText');
    
    if (infoDiv && infoText) {
        infoText.textContent = message;
        infoDiv.classList.remove('hidden');
        
        setTimeout(function() {
            infoDiv.classList.add('hidden');
        }, 5000);
    }
}

function clearMessages() {
    const messages = ['errorMessage', 'successMessage', 'infoMessage'];
    for (let i = 0; i < messages.length; i++) {
        const msgDiv = document.getElementById(messages[i]);
        if (msgDiv) {
            msgDiv.classList.add('hidden');
        }
    }
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
    }
}

function showLoading() {
    console.log('⏳ Mostrando loading...');
    
    const allButtons = document.querySelectorAll('button');
    for (let i = 0; i < allButtons.length; i++) {
        allButtons[i].disabled = true;
    }
    
    const registerButton = document.querySelector('button[onclick="handleRegistration()"]');
    if (registerButton) {
        registerButton.innerHTML = '<span class="loading-spinner"></span>Registrazione in corso...';
    }
}

function hideLoading() {
    console.log('✅ Nascondendo loading...');
    
    const allButtons = document.querySelectorAll('button');
    for (let i = 0; i < allButtons.length; i++) {
        allButtons[i].disabled = false;
    }
    
    const registerButton = document.querySelector('button[onclick="handleRegistration()"]');
    if (registerButton) {
        registerButton.innerHTML = '🚀 Registrati';
    }
}

// ================================
// UTILITY GENERALI
// ================================

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}

// Esporta funzioni globali
window.nextStep = nextStep;
window.prevStep = prevStep;
window.handleRegistration = handleRegistration;
window.togglePassword = togglePassword;
window.resendConfirmationEmail = resendConfirmationEmail;
window.goBack = goBack;
