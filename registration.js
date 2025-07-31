// ================================
// CONFIGURAZIONE SUPABASE
// ================================
const SUPABASE_URL = 'https://lycrgzptkdkksukcwrld.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...'; // la tua chiave anon

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
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inizializzazione applicazione...');
  let attempts = 0, maxAttempts = 20;
  const checkSupabase = () => {
    attempts++;
    console.log(`🔍 Tentativo ${attempts}: controllo Supabase...`);
    if (window.supabase?.createClient) {
      initializeSupabase();
      initializeForm();
      setupEventListeners();
      setupPasswordValidation();
    } else if (attempts < maxAttempts) {
      setTimeout(checkSupabase, 200);
    } else {
      console.error('❌ Impossibile caricare Supabase');
      showError('Errore di caricamento. Ricarica la pagina.');
    }
  };
  checkSupabase();
});

function initializeSupabase() {
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client creato');
  } catch (err) {
    console.error('❌ Errore init Supabase', err);
    showError('Errore di configurazione del servizio. Ricarica la pagina.');
  }
}

function initializeForm() {
  currentStep = 1;
  formData = {};
  showStep(1);
  updateStepIndicator();
  console.log('✅ Form inizializzato');
}

// ================================
// GESTIONE STEP DEL FORM
// ================================
function showStep(step) {
  console.log('🔄 Cambio step da ' + currentStep + ' a ' + step);
  document.querySelectorAll('.step-form').forEach(el => el.classList.add('hidden'));
  const stepEl = document.getElementById('step' + step + 'Form');
  if (stepEl) {
    stepEl.classList.remove('hidden');
    currentStep = step;
    updateStepIndicator();
    updateStepLabel();
    if (step === 3) updateSummary();
    console.log('✅ Step ' + step + ' mostrato');
  } else {
    console.error('❌ Step non trovato:', step);
  }
}

function updateStepIndicator() {
  const steps = ['step1','step2','step3'];
  const lines = ['line1','line2'];
  steps.forEach((id,i) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (i+1 < currentStep) {
      el.className = 'step-circle completed';
      el.innerHTML = '✓';
    } else if (i+1 === currentStep) {
      el.className = 'step-circle active';
      el.innerHTML = i+1;
    } else {
      el.className = 'step-circle';
      el.innerHTML = i+1;
    }
  });
  lines.forEach((id,i) => {
    const ln = document.getElementById(id);
    if (!ln) return;
    if (i+1 < currentStep) ln.classList.add('completed');
    else ln.classList.remove('completed');
  });
}

function updateStepLabel() {
  const labels = {1:'Dati Personali',2:'Password e Sicurezza',3:'Termini e Condizioni'};
  const el = document.getElementById('stepLabel');
  if (el) el.textContent = labels[currentStep];
}

function updateSummary() {
  const summary = {
    summaryNome: formData.nome||'-',
    summaryCognome: formData.cognome||'-',
    summaryEmail: formData.email||'-',
    summaryTelefono: formData.telefono||'Non fornito',
    summaryDataNascita: formData.dataNascita||'-',
    summaryLuogoNascita: formData.luogoNascita||'-'
  };
  Object.entries(summary).forEach(([id,val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

// ================================
// NAVIGAZIONE STEPS
// ================================
function nextStep() {
  console.log('▶️ Tentativo step:', currentStep);
  if (validateCurrentStep()) {
    if (currentStep < 3) {
      saveCurrentStepData();
      showStep(currentStep + 1);
    } else {
      handleRegistration();
    }
  } else {
    console.log('❌ Validazione fallita step', currentStep);
  }
}

function prevStep() {
  if (currentStep > 1) showStep(currentStep - 1);
}

// ================================
// SETUP EVENTI
// ================================
function setupEventListeners() {
  const form = document.getElementById('registrationForm');
  form?.addEventListener('submit', e => e.preventDefault());
  setupRealTimeValidation();
}

function setupRealTimeValidation() {
  document.getElementById('email')?.addEventListener('input', validateEmailRealTime);
  document.getElementById('confirmEmail')?.addEventListener('input', validateEmailConfirmRealTime);
  document.getElementById('telefono')?.addEventListener('input', validateTelefonoRealTime);
}

// ================================
// VALIDAZIONE
// ================================
function validateCurrentStep() {
  clearMessages();
  if (!currentStep) currentStep = 1;
  switch(currentStep) {
    case 1: return validateStep1();
    case 2: return validateStep2();
    case 3: return validateStep3();
    default: return false;
  }
}

function validateStep1() {
  let valid = true;
  const nome = getElementValue('nome');
  if (!nome || nome.length < 2) { showFieldError('nome','Nome obbligatorio (≥2 caratteri)'); valid = false;}
  else clearFieldError('nome');
  const cogn = getElementValue('cognome');
  if (!cogn || cogn.length <2) { showFieldError('cognome','Cognome obbligatorio'); valid = false;}
  else clearFieldError('cognome');
  const email = getElementValue('email');
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !re.test(email)) { showFieldError('email','Email valida obbligatoria'); valid = false;}
  else clearFieldError('email');
  const confirm = getElementValue('confirmEmail');
  if (!confirm || confirm !== email) { showFieldError('confirmEmail','Le email non coincidono'); valid = false;}
  else clearFieldError('confirmEmail');
  const tel = getElementValue('telefono');
  if (tel && !validateTelefono(tel)) { showFieldError('telefono','Formato telefono errato'); valid = false;}
  else clearFieldError('telefono');
  const dob = getElementValue('dataNascita');
  if (!dob || !validateDataNascita(dob)) { showFieldError('dataNascita','Data di nascita non valida o età <14'); valid = false;}
  else clearFieldError('dataNascita');
  const luogo = getElementValue('luogoNascita');
  if (!luogo || luogo.length<2) { showFieldError('luogoNascita','Luogo nascita obbligatorio'); valid = false;}
  else clearFieldError('luogoNascita');
  return valid;
}

function validateStep2() {
  let valid = true;
  const pwd = getElementValue('password');
  if (!pwd || !validatePassword(pwd)) { showFieldError('password','Password debole'); valid = false;}
  else clearFieldError('password');
  const cpwd = getElementValue('confirmPassword');
  if (!cpwd || cpwd !== pwd) { showFieldError('confirmPassword','Le password non coincidono'); valid = false;}
  else clearFieldError('confirmPassword');
  return valid;
}

function validateStep3() {
  const chk = document.getElementById('privacyAccept');
  if (!chk?.checked) { showError('Devi accettare privacy e termini'); return false;}
  return true;
}

function validatePassword(pwd) {
  return pwd.length>=8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd);
}
function validateTelefono(tel) {
  const clean = tel.replace(/[\s\-\(\)]/g,'');
  return /^(\+39|0039|39)?[0-9]{9,11}$/.test(clean);
}
function validateDataNascita(d) {
  const today = new Date(), bd = new Date(d);
  let age = today.getFullYear() - bd.getFullYear();
  const md = today.getMonth() - bd.getMonth();
  if (md<0 || (md===0 && today.getDate()<bd.getDate())) age--;
  return age>=14;
}
function validateEmailRealTime() {
  const e = getElementValue('email');
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  ok ? setFieldValid('email') : setFieldError('email');
}
function validateEmailConfirmRealTime() {
  (getElementValue('confirmEmail') === getElementValue('email')) ? setFieldValid('confirmEmail') : setFieldError('confirmEmail');
}
function validateTelefonoRealTime() {
  validateTelefono(getElementValue('telefono')) ? setFieldValid('telefono') : setFieldError('telefono');
}

// ================================
// PASSWORD STRENGTH
// ================================
function setupPasswordValidation() {
  document.getElementById('password')?.addEventListener('input', function() {
    updatePasswordStrength(this.value);
    updatePasswordRequirements(this.value);
  });
}
function updatePasswordStrength(pwd) {
  const bar = document.getElementById('strengthBar');
  const txt = document.getElementById('strengthText');
  if (!bar||!txt) return;
  const score = calculatePasswordStrength(pwd);
  bar.className = 'strength-bar';
  if (score<2) { bar.classList.add('strength-weak'); txt.textContent='Troppo debole'; txt.style.color='#ef4444'; }
  else if (score<3) { bar.classList.add('strength-medium'); txt.textContent='Debole'; txt.style.color='#f59e0b'; }
  else if (score<4) { bar.classList.add('strength-good'); txt.textContent='Buona'; txt.style.color='#eab308'; }
  else { bar.classList.add('strength-strong'); txt.textContent='Forte'; txt.style.color='#10b981'; }
}
function calculatePasswordStrength(pwd) {
  let s=0;
  if (pwd.length>=8) s++; if (pwd.length>=12) s++;
  if (/[a-z]/.test(pwd)) s++; if (/[A-Z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^a-zA-Z\d]/.test(pwd)) s++;
  return Math.min(s,4);
}
function updatePasswordRequirements(pwd) {
  const reqs = {
    'req-length': pwd.length>=8,
    'req-upper': /[A-Z]/.test(pwd),
    'req-lower': /[a-z]/.test(pwd),
    'req-number': /\d/.test(pwd)
  };
  Object.entries(reqs).forEach(([id,ok]) => {
    const ind = document.getElementById(id)?.querySelector('.requirement-indicator');
    if (ind) ok ? ind.classList.add('met') : ind.classList.remove('met');
  });
}

// ================================
// SALVATAGGIO DATI FORM
// ================================
function saveCurrentStepData() {
  if (currentStep === 1) {
    formData.nome = getElementValue('nome');
    formData.cognome = getElementValue('cognome');
    formData.email = getElementValue('email');
    formData.telefono = getElementValue('telefono');
    formData.dataNascita = getElementValue('dataNascita');
    formData.luogoNascita = getElementValue('luogoNascita');
  } else if (currentStep === 2) {
    formData.password = getElementValue('password');
  } else if (currentStep === 3) {
    formData.privacyAccepted = document.getElementById('privacyAccept')?.checked;
    formData.marketingConsent = document.getElementById('marketingAccept')?.checked;
  }
  console.log(`💾 Dati step ${currentStep} salvati:`, formData);
}

function validateAllData() {
  const required = ['nome','cognome','email','password','dataNascita','luogoNascita'];
  for (const f of required) {
    if (!formData[f]) return false;
  }
  if (!formData.privacyAccepted) return false;
  return true;
}

// ================================
// REGISTRAZIONE UTENTE
// ================================
async function handleRegistration() {
  console.log('🚀 Inizio registrazione...');
  const btn = document.querySelector('.btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading-spinner"></span>Registrazione...'; }
  try {
    saveCurrentStepData();
    if (!validateAllData()) throw new Error('Dati incompleti');
    console.log('👤 Auth.signup...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: {
        nome: formData.nome,
        cognome: formData.cognome,
        full_name: `${formData.nome} ${formData.cognome}`,
        telefono: formData.telefono||null,
        data_nascita: formData.dataNascita,
        luogo_nascita: formData.luogoNascita,
        privacy_accepted: formData.privacyAccepted,
        marketing_consent: formData.marketingConsent||false
      }}
    });
    if (authError) throw authError;
    console.log('✅ Registrazione Auth OK');
    if (authData.user) {
      const { data: exists } = await supabase.from('profiles').select('id').eq('id', authData.user.id).single();
      if (exists) await updateUserProfile(authData.user.id);
      else await createUserProfile(authData.user.id);
      console.log('🎫 Creazione tessera...');
      const tess = await createUserTessera(authData.user.id);
      console.log('✅ Tessera con scadenza:', tess.data_scadenza_europeo);
    }
    showSuccess('Registrazione completata! Controlla la tua email.');
    setTimeout(()=>window.location.href='login.html',3000);
  } catch (err) {
    console.error('❌ Errore registrazione:', err);
    showError(guessErrorMessage(err));
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '🚀 Registrati'; }
  }
}

function guessErrorMessage(err) {
  const msg = err?.message||'';
  if (msg.includes('already registered')) return 'Questa email è già registrata.';
  if (msg.includes('invalid email')) return 'Email non valida.';
  if (msg.includes('weak password')) return 'Password non sicura.';
  if (msg.includes('rate limit')) return 'Troppi tentativi. Riprova più avanti.';
  return 'Errore durante la registrazione.';
}

// ================================
// PROFILI: creazione e aggiornamento
// ================================
async function createUserProfile(userId) {
  console.log('👤 Creazione profilo per utente:', userId);
  const profileData = {
    id: userId,
    email: formData.email,
    nome: formData.nome,
    cognome: formData.cognome,
    telefono: formData.telefono?.trim()||null,
    data_nascita: formData.dataNascita,
    luogo_nascita: formData.luogoNascita,
    ruoli: ['USER'],
    newsletter_consent: formData.marketingConsent ? 'true':'false',
    marketing_consent: formData.marketingConsent||false,
    privacy_accepted: formData.privacyAccepted||false,
    privacy_accepted_at: new Date().toISOString(),
    ip_registrazione: await getUserIP(),
    user_agent: navigator.userAgent
  };
  console.log('📊 Profilo inserimento:', profileData);
  const { data, error } = await supabase.from('profiles').upsert([profileData],{ onConflict:'id',ignoreDuplicates:false }).select();
  if (error) throw error;
  console.log('✅ Profilo creato:', data);
  return data;
}

async function updateUserProfile(userId) {
  console.log('🔄 Aggiornamento profilo per:', userId);
  const profileData = {
    email: formData.email,
    nome: formData.nome,
    cognome: formData.cognome,
    telefono: formData.telefono?.trim()||null,
    data_nascita: formData.dataNascita,
    luogo_nascita: formData.luogoNascita,
    ruoli: ['USER'],
    newsletter_consent: formData.marketingConsent ? 'true':'false',
    marketing_consent: formData.marketingConsent||false,
    privacy_accepted: formData.privacyAccepted||false,
    privacy_ accepted_at: new Date().toISOString(),
    ip_registrazione: await getUserIP(),
    user_agent: navigator.userAgent,
    updated_at: new Date().toISOString()
  };
  console.log('📊 Profilo update:', profileData);
  const { data, error } = await supabase.from('profiles').update(profileData).eq('id',userId).select();
  if (error) throw error;
  console.log('✅ Profilo aggiornato:', data);
  return data;
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
  console.log('🎫 Controllo tessera esistente per', userId);
  const { data: existing, error: lookErr } = await supabase.from('tessere').select('id, data_scadenza').eq('id',userId).single();
  if (lookErr && lookErr.code!=='PGRST116') throw lookErr;
  if (existing) return existing;
  const numero = await generateNumeroTessera();
  const exp = calculateScadenzaTessera();
  const payload = {
    id: userId,
    numero_tessera: numero,
    stato: 'attiva',
    data_emissione: new Date().toISOString().slice(0,10),
    data_scadenza: exp.iso,
    tipo_tessera: 'standard',
    livello: 'bronze',
    punti_accumulati: 0,
    note: 'Tessera creata durante registrazione',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  console.log('📊 Inserimento tessera:', payload);
  const { data, error } = await supabase.from('tessere').insert([payload]).select();
  if (error) throw error;
  return { ...data[0], data_scadenza_europeo: exp.eu };
}

async function generateNumeroTessera() {
  const year = new Date().getFullYear();
  const num = Math.floor(1e7 + Math.random()*9e7);
  const candidate = `${year}-${num}`;
  const tables = ['tessere','cards','user_cards','membership_cards'];
  const exists = await Promise.any(tables.map(tbl =>
    supabase.from(tbl).select('numero_tessera').eq('numero_tessera',candidate).single().then(r=>!!r.data).catch(()=>false)
  )).catch(()=>false);
  if (exists) return generateNumeroTessera();
  return candidate;
}

// ================================
// UTILITÀ E UI MESSAGES
// ================================
async function getUserIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    return (await res.json()).ip;
  } catch (e) {
    console.warn('⚠️ IP fetch fallito', e);
    return null;
  }
}

function getElementValue(id) {
  return document.getElementById(id)?.value.trim() || '';
}

function showError(msg) {
  clearMessages();
  const div = document.getElementById('errorMessage');
  const text = document.getElementById('errorText');
  if (div && text) {
    text.textContent = msg;
    div.classList.remove('hidden');
    div.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  console.error('❌ Mostra errore:', msg);
}

function showSuccess(msg) {
  clearMessages();
  const div = document.getElementById('successMessage');
  const text = document.getElementById('successText');
  if (div && text) {
    text.textContent = msg;
    div.classList.remove('hidden');
    div.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  console.log('✅ Mostra successo:', msg);
}

function showInfo(msg) {
  clearMessages();
  const div = document.getElementById('infoMessage');
  const text = document.getElementById('infoText');
  if (div && text) {
    text.textContent = msg;
    div.classList.remove('hidden');
  }
  console.log('ℹ️ Mostra info:', msg);
}

function clearMessages() {
  ['errorMessage','successMessage','infoMessage'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
}

function showFieldError(fieldId,msg) {
  const ed = document.getElementById(fieldId + 'Error');
  const ip = document.getElementById(fieldId);
  if (ed) { ed.textContent = msg; ed.classList.remove('hidden'); }
  if (ip) { ip.classList.add('error'); ip.classList.remove('valid'); }
}

function clearFieldError(fieldId) {
  const ed = document.getElementById(fieldId + 'Error');
  const ip = document.getElementById(fieldId);
  ed?.classList.add('hidden');
  ip?.classList.remove('error'); ip?.classList.add('valid');
}

function setFieldValid(id) {
  document.getElementById(id)?.classList.add('valid');
  document.getElementById(id)?.classList.remove('error');
}

function setFieldError(id) {
  document.getElementById(id)?.classList.add('error');
  document.getElementById(id)?.classList.remove('valid');
}

function clearFieldValidation(id) {
  document.getElementById(id)?.classList.remove('error','valid');
}

// ================================
// BACK/BUTTON UTILITY
// ================================
function goBack() {
  currentStep>1 ? prevStep() : window.history.back();
}

// ================================
// COOLDOWN REGISTRAZIONE
// ================================
function startRegistrationCooldown(seconds) {
  const btn = document.getElementById('registerBtn') || document.querySelector('.btn-primary');
  if (!btn) return;
  let remaining = seconds;
  const update = () => {
    btn.disabled = true;
    btn.innerHTML = `⏳ Riprova tra ${remaining}s`;
  };
  update();
  const iv = setInterval(() => {
    remaining--;
    if (remaining<=0) {
      clearInterval(iv);
      btn.disabled = false;
      btn.innerHTML = '🚀 Completa Registrazione';
    } else update();
  }, 1000);
}
