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
let totalSteps = 4;

// ================================
// INIZIALIZZAZIONE
// ================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inizializzazione applicazione...');
    
    // Inizializza Supabase
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase inizializzato');
        
        // Inizializza il form
        initializeForm();
        setupEventListeners();
        setupPasswordValidation();
    } else {
        console.error('❌ Supabase non disponibile');
        showError('Errore di caricamento. Ricarica la pagina.');
    }
});

function initializeForm() {
    currentStep = 1;
    formData = {};
    showStep(1);
    updateStepIndicator();
    console.log('✅ Form inizializzato');
}

// ================================
// GESTIONE STEP
// ================================

function showStep(step) {
    console.log('🔄 Cambio step:', currentStep, '→', step);
    
    // Nascondi tutti gli step
    document.querySelectorAll('.step-form').forEach(form => {
        form.classList.add('hidden');
    });
    
    // Mostra step richiesto
    const stepElement = document.getElementById('step' + step + 'Form');
    if (stepElement) {
        stepElement.classList.remove('hidden');
        currentStep = step;
        updateStepIndicator();
        updateStepLabel();
        
        if (step === 4) {
            updateSummary();
        }
    }
}

function updateStepIndicator() {
    const steps = ['step1', 'step2', 'step3', 'step4'];
    const lines = ['line1', 'line2', 'line3'];
    
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
        'summaryIndirizzo': createAddressString() || 'Non fornito',
        'summaryProfessione': formData.professione || 'Non specificata'
    };
    
    Object.entries(summaryData).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    });
}

function createAddressString() {
    const parts = [
        formData.indirizzoVia,
        formData.indirizzoCivico,
        formData.indirizzoCap,
        formData.indirizzoCitta,
        formData.indirizzoProvincia
    ].filter(part => part && part.trim());
    
    return parts.length > 0 ? parts.join(', ') : '';
}

// ================================
// NAVIGAZIONE
// ================================

function nextStep() {
    console.log('▶️ Tentativo prossimo step. Step corrente:', currentStep);
    
    if (validateCurrentStep()) {
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
    console.log('◀️ Step precedente. Step corrente:', currentStep);
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

function goBack() {
    if (currentStep > 1) {
        prevStep();
    } else {
        history.back();
    }
}

// ================================
// VALIDAZIONE
// ================================

function validateCurrentStep() {
    console.log('🔍 Validazione step', currentStep);
    clearMessages();
    
    switch (currentStep) {
        case 1: return validateStep1();
        case 2: return validateStep2();
        case 3: return validateStep3();
        case 4: return validateStep4();
        default: return false;
    }
}

function validateStep1() {
    let isValid = true;
    
    // Nome
    const nome = getElementValue('nome');
    if (!nome || nome.length < 2) {
        showFieldError('nome', 'Il nome deve contenere almeno 2 caratteri');
        isValid = false;
    } else {
        clearFieldError('nome');
    }
    
    // Cognome
    const cognome = getElementValue('cognome');
    if (!cognome || cognome.length < 2) {
        showFieldError('cognome', 'Il cognome deve contenere almeno 2 caratteri');
        isValid = false;
    } else {
        clearFieldError('cognome');
    }
    
    // Email
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
    
    // Conferma Email
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
    
    // Data di Nascita
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
    
    // Luogo di Nascita
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
    
    // Codice Fiscale (opzionale ma se presente deve essere valido)
    const codiceFiscale = getElementValue('codiceFiscale');
    if (codiceFiscale && !validateCodiceFiscale(codiceFiscale)) {
        showFieldError('codiceFiscale', 'Inserisci un codice fiscale valido');
        isValid = false;
    } else {
        clearFieldError('codiceFiscale');
    }
    
    // Telefono (opzionale ma se presente deve essere valido)
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
    
    // Password
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
    
    // Conferma Password
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
    const privacyAccept = document.getElementById('privacyAccept');
    if (!privacyAccept || !privacyAccept.checked) {
        showError('Devi accettare i Termini e Condizioni per procedere');
        return false;
    }
    return true;
}

// ================================
// FUNZIONI DI VALIDAZIONE SPECIFICHE
// ================================

function validatePassword(password) {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /\d/.test(password);
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
            formData.indirizzoRegione = getElementValue('indirizzoRegione');
            formData.professione = getElementValue('professione');
            formData.titoloStudio = getElementValue('titoloStudio');
            formData.emailSecondaria = getElementValue('emailSecondaria');
            formData.sitoWeb = getElementValue('sitoWeb');
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
    
    console.log('💾 Dati step salvati:', formData);
}

// ================================
// REGISTRAZIONE UTENTE AGGIORNATA
// ================================

async function handleRegistration() {
    console.log('🚀 Inizio registrazione...');
    
    const registerButton = document.getElementById('registerBtn');
    if (registerButton) {
        registerButton.disabled = true;
        registerButton.innerHTML = '<span class="loading-spinner"></span>Registrazione in corso...';
    }
    
    try {
        // Salva dati ultimo step
        saveCurrentStepData();
        
        // Verifica dati completi
        if (!validateAllData()) {
            throw new Error('Dati incompleti');
        }
        
        console.log('📤 Invio dati a Supabase...');
        console.log('📋 Dati completi:', formData);
        
        // Prepara metadata con NOMI CORRETTI per il trigger
        const metadata = {
            // Campi obbligatori
            nome: formData.nome,
            cognome: formData.cognome,
            data_nascita: formData.dataNascita, // formato YYYY-MM-DD
            luogo_nascita: formData.luogoNascita,
            privacy_accepted: formData.privacyAccepted,
            
            // Campi opzionali
            codice_fiscale: formData.codiceFiscale || null,
            telefono: formData.telefono || null,
            telefono_emergenza: formData.telefonoEmergenza || null,
            indirizzo_via: formData.indirizzoVia || null,
            indirizzo_civico: formData.indirizzoCivico || null,
            indirizzo_cap: formData.indirizzoCap || null,
            indirizzo_citta: formData.indirizzoCitta || null,
            indirizzo_provincia: formData.indirizzoProvincia || null,
            indirizzo_regione: formData.indirizzoRegione || null,
            professione: formData.professione || null,
            titolo_studio: formData.titoloStudio || null,
            email_secondaria: formData.emailSecondaria || null,
            sito_web: formData.sitoWeb || null,
            marketing_consent: formData.marketingConsent || false,
            newsletter_consent: formData.newsletterConsent || false
        };
        
        console.log('📋 Metadata preparati per il trigger:', metadata);
        
        // Registrazione Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: metadata
            }
        });
        
        if (authError) {
            console.error('❌ Errore Supabase Auth:', authError);
            throw authError;
        }
        
        console.log('✅ Utente registrato in auth.users:', authData.user?.id);
        console.log('⏳ Il trigger dovrebbe ora popolare profiles, ruoli_log e tessere...');
        
        // Attendi che il trigger completi (aumentato il tempo)
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Verifica che tutto sia stato creato correttamente
        let profileCreated = false;
        let tesseraCreated = false;
        let numeroTessera = null;
        
        if (authData.user) {
            try {
                // Controlla profilo
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, nome, cognome, ruolo, created_at')
                    .eq('id', authData.user.id)
                    .single();
                
                profileCreated = !profileError && profileData;
                console.log('👤 Profilo:', profileCreated ? '✅ Creato' : '❌ Non trovato', profileData);
                
                // Controlla tessera (cerca per nome/cognome dato che non c'è relazione diretta)
                const { data: tesseraData, error: tesseraError } = await supabase
                    .from('tessere')
                    .select('id, numero_tessera, stato, created_at')
                    .eq('nome', formData.nome)
                    .eq('cognome', formData.cognome)
                    .single();
                
                tesseraCreated = !tesseraError && tesseraData;
                if (tesseraCreated) {
                    numeroTessera = tesseraData.numero_tessera;
                }
                console.log('🎫 Tessera:', tesseraCreated ? '✅ Creata' : '❌ Non trovata', tesseraData);
                
                // Controlla log ruolo
                const { data: logData } = await supabase
                    .from('ruoli_log')
                    .select('ruolo_nuovo, created_at')
                    .eq('utente_id', authData.user.id)
                    .single();
                
                console.log('📝 Log ruolo:', logData ? '✅ Creato' : '❌ Non trovato', logData);
                
            } catch (verificationError) {
                console.warn('⚠️ Errore durante verifica:', verificationError);
            }
        }
        
        // Mostra messaggio di successo basato su cosa è stato creato
        if (profileCreated && tesseraCreated) {
            showSuccess(`🎉 Registrazione completata con successo!
                
                ✅ Account creato e confermato
                ✅ Profilo utente configurato
                ✅ Tessera ${numeroTessera} generata
                📧 Email di conferma inviata
                
                Verrai reindirizzato al login tra pochi secondi...`);
        } else if (profileCreated) {
            showSuccess(`🎉 Registrazione completata!
                
                ✅ Account e profilo creati
                ⚠️ Tessera in elaborazione
                📧 Controlla la tua email per confermare l'account
                
                Verrai reindirizzato al login tra pochi secondi...`);
        } else {
            showSuccess(`🎉 Registrazione in elaborazione...
                
                ✅ Account creato
                ⏳ Profilo e tessera in elaborazione
                📧 Controlla la tua email per confermare l'account
                
                Verrai reindirizzato al login tra pochi secondi...`);
        }
        
        // Reindirizza dopo 5 secondi
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 5000);
        
    } catch (error) {
        console.error('❌ Errore registrazione:', error);
        
        let errorMessage = 'Si è verificato un errore durante la registrazione.';
        const errorMsg = error?.message || '';
        
        if (errorMsg.includes('User already registered') || errorMsg.includes('already been registered')) {
            errorMessage = '⚠️ Questa email è già registrata. Prova ad effettuare il login o usa un\'altra email.';
        } else if (errorMsg.includes('Invalid email')) {
            errorMessage = '❌ Formato email non valido.';
        } else if (errorMsg.includes('Password should be at least')) {
            errorMessage = '❌ La password deve contenere almeno 6 caratteri.';
        } else if (errorMsg.includes('Email not confirmed')) {
            errorMessage = '📧 Controlla la tua email per confermare l\'account prima di effettuare il login.';
        } else if (errorMsg.includes('Invalid login credentials')) {
            errorMessage = '❌ Credenziali non valide.';
        }
        
        showError(errorMessage);
        
        // Se l'utente è già registrato, reindirizza al login
        if (errorMsg.includes('already been registered')) {
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        }
        
    } finally {
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
            console.error('❌ Campo obbligatorio mancante:', field, 'Valore:', formData[field]);
            showError(`Campo obbligatorio mancante: ${field}`);
            return false;
        }
    }
    
    if (!formData.privacyAccepted) {
        console.error('❌ Privacy non accettata');
        showError('Devi accettare i Termini e Condizioni per procedere');
        return false;
    }
    
    console.log('✅ Tutti i dati obbligatori sono presenti');
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
        errorText.innerHTML = message.replace(/\n/g, '<br>');
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
        successText.innerHTML = message.replace(/\n/g, '<br>');
        successDiv.classList.remove('hidden');
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    console.log('✅ Successo mostrato:', message);
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
