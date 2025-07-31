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
    
    // Validazione Telefono