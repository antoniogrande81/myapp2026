// ================================
// CONVALORE: CONFIGURAZIONE SUPABASE
// ================================
const SUPABASE_URL = 'https://lycrgzptkdkksukcwrld.supabase.co';
const SUPABASE_ANON_KEY = '<la tua chiave anon>';

// ================================
// FUNZIONI GLOBALI USATE DA HTML
// ================================
function validateDataNascita(dataNascita) {
  const today = new Date(), bd = new Date(dataNascita);
  let age = today.getFullYear() - bd.getFullYear();
  const monthDiff = today.getMonth() - bd.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bd.getDate())) age--;
  return age >= 14;
}

function nextStep() {
  console.log('▶️ Tentativo prossimo step:', currentStep);
  if (validateCurrentStep()) {
    saveCurrentStepData();
    if (currentStep < 3) showStep(currentStep + 1);
    else handleRegistration();
  } else {
    console.log('❌ Validazione fallita in step', currentStep);
  }
}

// ================================
// VARIABILI GLOBALI
// ================================
let supabase = null;
let currentStep = 1;
let formData = {};
let resendTimer, resendInterval;

// ================================
// INIZIALIZZAZIONE
// ================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inizializzazione...');
  let attempts = 0, maxAttempts = 20;
  function checkSupabase() {
    attempts++;
    if (window.supabase?.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      initializeForm();
      setupEventListeners();
      setupPasswordValidation();
      console.log('✅ Supabase pronto');
    } else if (attempts < maxAttempts) {
      setTimeout(checkSupabase, 200);
    } else showError('Errore caricamento Supabase');
  }
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
// SISTEMA STEP
// ================================
function showStep(step) {
  document.querySelectorAll('.step-form').forEach(el => el.classList.add('hidden'));
  const el = document.getElementById('step' + step + 'Form');
  if (!el) return console.error('Step non trovato:', step);
  el.classList.remove('hidden');
  currentStep = step;
  updateStepIndicator();
  if (step === 3) updateSummary();
}

function updateStepIndicator() {
  ['step1','step2','step3'].forEach((id,i) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (i+1 < currentStep) el.className = 'step-circle completed', el.innerHTML = '✓';
    else if (i+1 === currentStep) el.className = 'step-circle active', el.innerHTML = i+1;
    else el.className = 'step-circle', el.innerHTML = i+1;
  });
  ['line1','line2'].forEach((id,i) => {
    document.getElementById(id)?.classList.toggle('completed', i+1 < currentStep);
  });
}

function updateStepLabel() {
  const labels = {1:'Dati Personali',2:'Password e Sicurezza',3:'Termini e Condizioni'};
  document.getElementById('stepLabel')?.textContent = labels[currentStep];
}

function updateSummary() {
  const map = {
    summaryNome: formData.nome||'-',
    summaryCognome: formData.cognome||'-',
    summaryEmail: formData.email||'-',
    summaryTelefono: formData.telefono||'Non fornito',
    summaryDataNascita: formData.dataNascita||'-',
    summaryLuogoNascita: formData.luogoNascita||'-'
  };
  Object.entries(map).forEach(([id,val]) => {
    document.getElementById(id)?.textContent = val;
  });
}

// ================================
// VALIDAZIONE
// ================================
function validateCurrentStep() {
  clearMessages();
  switch(currentStep) {
    case 1: return validateStep1();
    case 2: return validateStep2();
    case 3: return validateStep3();
    default: return false;
  }
}

function validateStep1() {
  let ok = true;
  const nome = getElementValue('nome');
  if (!nome || nome.length <2) { showFieldError('nome','Nome obbligatorio (≥2 char)'); ok=false; } else clearFieldError('nome');
  const cogn = getElementValue('cognome');
  if (!cogn || cogn.length <2) { showFieldError('cognome','Cognome obbligatorio'); ok=false; } else clearFieldError('cognome');
  const email = getElementValue('email'), confirm = getElementValue('confirmEmail');
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !re.test(email)) { showFieldError('email','Email valida obbligatoria'); ok=false; } else clearFieldError('email');
  if (!confirm || confirm !== email) { showFieldError('confirmEmail','Email non coincidono'); ok=false; } else clearFieldError('confirmEmail');
  const tel = getElementValue('telefono');
  if (tel && !validateTelefono(tel)) { showFieldError('telefono','Telefono non valido'); ok=false; } else clearFieldError('telefono');
  const dob = getElementValue('dataNascita');
  if (!dob || !validateDataNascita(dob)) { showFieldError('dataNascita','Data nascita non valida o <14 anni'); ok=false; } else clearFieldError('dataNascita');
  const luogo = getElementValue('luogoNascita');
  if (!luogo || luogo.length <2) { showFieldError('luogoNascita','Luogo nascita obbligatorio'); ok=false; } else clearFieldError('luogoNascita');
  return ok;
}

function validateStep2() {
  let ok = true;
  const pwd = getElementValue('password');
  if (!pwd || !validatePassword(pwd)) { showFieldError('password','Password debole'); ok=false; } else clearFieldError('password');
  const cpwd = getElementValue('confirmPassword');
  if (!cpwd || cpwd !== pwd) { showFieldError('confirmPassword','Le password non coincidono'); ok=false; } else clearFieldError('confirmPassword');
  return ok;
}

function validateStep3() {
  if (!document.getElementById('privacyAccept')?.checked) { showError('Accetta privacy e termini per proseguire'); return false; }
  return true;
}

function validateTelefono(t) {
  const clean = t.replace(/[\s\-\(\)]/g,'');
  return /^(\+39|0039|39)?\d{9,11}$/.test(clean);
}

function validateEmailRealTime() {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(getElementValue('email'));
  ok ? setFieldValid('email') : setFieldError('email');
}

function validateEmailConfirmRealTime() {
  getElementValue('confirmEmail') === getElementValue('email') ? setFieldValid('confirmEmail') : setFieldError('confirmEmail');
}

function validateTelefonoRealTime() {
  validateTelefono(getElementValue('telefono')) ? setFieldValid('telefono') : setFieldError('telefono');
}

// ================================
// PASSWORD STRENGTH
// ================================
function setupPasswordValidation() {
  document.getElementById('password')?.addEventListener('input', function(){
    updatePasswordStrength(this.value);
    updatePasswordRequirements(this.value);
  });
}

function calculatePasswordStrength(pwd) {
  let score = 0;
  if (pwd.length>=8) score++;
  if (pwd.length>=12) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z\d]/.test(pwd)) score++;
  return Math.min(score,4);
}

function updatePasswordStrength(pwd) {
  const bar = document.getElementById('strengthBar');
  const txt = document.getElementById('strengthText');
  if (!bar || !txt) return;
  const s = calculatePasswordStrength(pwd);
  bar.className = 'strength-bar';
  if (s<2) { bar.classList.add('strength-weak'); txt.textContent='Troppo debole'; txt.style.color='#ef4444'; }
  else if (s<3) { bar.classList.add('strength-medium'); txt.textContent='Debole'; txt.style.color='#f59e0b'; }
  else if (s<4) { bar.classList.add('strength-good'); txt.textContent='Buona'; txt.style.color='#eab308'; }
  else { bar.classList.add('strength-strong'); txt.textContent='Forte'; txt.style.color='#10b981'; }
}

function updatePasswordRequirements(pwd) {
  {'req-length':pwd.length>=8,'req-upper':/[A-Z]/.test(pwd),'req-lower':/[a-z]/.test(pwd),'req-number':/\d/.test(pwd)}
    ? Object.entries({...}).forEach(([id,met]) => {
        const el = document.getElementById(id)?.querySelector('.requirement-indicator');
        if (el) met ? el.classList.add('met') : el.classList.remove('met');
      }) : null;
}

// ================================
// SALVATAGGIO DATI
// ================================
function saveCurrentStepData() {
  if (currentStep === 1) {
    ['nome','cognome','email','telefono','dataNascita','luogoNascita'].forEach(f => formData[f] = getElementValue(f));
  } else if (currentStep === 2) {
    formData.password = getElementValue('password');
  } else {
    formData.privacyAccepted = document.getElementById('privacyAccept')?.checked;
    formData.marketingConsent = document.getElementById('marketingAccept')?.checked;
  }
}

// ================================
// UTILITY
// ================================
function getElementValue(id) {
  return document.getElementById(id)?.value.trim() || '';
}

function clearMessages() {
  ['errorMessage','successMessage','infoMessage'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
}

function showError(msg) {
  clearMessages();
  const div = document.getElementById('errorMessage'), txt = document.getElementById('errorText');
  if (div && txt) { txt.textContent = msg; div.classList.remove('hidden'); }
}

function showSuccess(msg) {
  clearMessages();
  const div = document.getElementById('successMessage'), txt = document.getElementById('successText');
  if (div && txt) { txt.textContent = msg; div.classList.remove('hidden'); }
}

function showInfo(msg) {
  clearMessages();
  const div = document.getElementById('infoMessage'), txt = document.getElementById('infoText');
  if (div && txt) { txt.textContent = msg; div.classList.remove('hidden'); }
}

function setFieldError(id) { document.getElementById(id)?.classList.add('error'); document.getElementById(id)?.classList.remove('valid'); }
function setFieldValid(id) { document.getElementById(id)?.classList.add('valid'); document.getElementById(id)?.classList.remove('error'); }
function showFieldError(fid,msg) { const ed = document.getElementById(fid+'Error'); if (ed) {ed.textContent=msg; ed.classList.remove('hidden');} setFieldError(fid); }
function clearFieldError(fid) { document.getElementById(fid+'Error')?.classList.add('hidden'); setFieldValid(fid); }

// ================================
// REGISTRAZIONE LOGICA PROFILO e TESSERA
// ================================
async function handleRegistration() {
  const btn = document.querySelector('.btn-primary');
  if (btn) btn.disabled = true, btn.innerHTML = '<span class="loading-spinner"></span>Registrazione...';
  try {
    saveCurrentStepData();
    if (!validateAllData()) throw new Error('Incomplete data');
    const { data: authData, error: authErr } = await supabase.auth.signUp({
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
    if (authErr) throw authErr;
    const userId = authData.user?.id;
    if (userId) {
      const { data: exists } = await supabase.from('profiles').select('id').eq('id',userId).single();
      exists ? await updateUserProfile(userId) : await createUserProfile(userId);
      const tess = await createUserTessera(userId);
      console.log('Tessera creata con scadenza:', tess.data_scadenza_europeo);
    }
    showSuccess('Registrazione completata! Controlla email.');
    setTimeout(() => window.location.href='login.html',3000);
  } catch(err) {
    console.error(err);
    showError(err.message || 'Errore registrazione');
  } finally {
    if (btn) btn.disabled = false, btn.innerHTML = '🚀 Registrati';
  }
}

async function createUserProfile(userId) {
  const profileData = {
    id: userId,
    email: formData.email,
    nome: formData.nome,
    cognome: formData.cognome,
    telefono: formData.telefono?.trim()||null,
    data_nascita: formData.dataNascita,
    luogo_nascita: formData.luogoNascita,
    ruoli: ['USER'],
    newsletter_consent: formData.marketingConsent?'true':'false',
    marketing_consent: formData.marketingConsent||false,
    privacy_accepted: formData.privacyAccepted||false,
    privacy_accepted_at: new Date().toISOString(),
    ip_registrazione: await getUserIP(),
    user_agent: navigator.userAgent
  };
  const { data, error } = await supabase.from('profiles').upsert([profileData],{ onConflict:'id',ignoreDuplicates:false }).select();
  if (error) throw error;
}

async function updateUserProfile(userId) {
  const profileData = {
    email: formData.email,
    nome: formData.nome,
    cognome: formData.cognome,
    telefono: formData.telefono?.trim()||null,
    data_nascita: formData.dataNascita,
    luogo_nascita: formData.luogoNascita,
    ruoli: ['USER'],
    newsletter_consent: formData.marketingConsent?'true':'false',
    marketing_consent: formData.marketingConsent||false,
    privacy_accepted: formData.privacyAccepted||false,
    privacy_accepted_at: new Date().toISOString(),
    ip_registrazione: await getUserIP(),
    user_agent: navigator.userAgent,
    updated_at: new Date().toISOString()
  };
  await supabase.from('profiles').update(profileData).eq('id',userId).select();
}

// ================================
// TESSERA
// ================================
function calculateScadenzaTessera() {
  const year = new Date().getFullYear();
  return { iso:`${year}-12-31`, eu:`31/12/${year}` };
}

async function createUserTessera(userId) {
  const { data: existing, error } = await supabase.from('tessere').select('id,data_scadenza').eq('id',userId).single();
  if (error && error.code!=='PGRST116') throw error;
  if (existing) return existing;
  const num = await generateNumeroTessera();
  const exp = calculateScadenzaTessera();
  const payload = {
    id: userId,
    numero_tessera: num,
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
  const { data } = await supabase.from('tessere').insert([payload]).select();
  return { ...data[0], data_scadenza_europeo: exp.eu };
}

async function generateNumeroTessera() {
  const year = new Date().getFullYear();
  const candidate = `${year}-${Math.floor(1e7 + Math.random()*9e7)}`;
  const exists = await Promise.any(['tessere','cards','user_cards','membership_cards'].map(tbl =>
    supabase.from(tbl).select('numero_tessera').eq('numero_tessera',candidate).single().then(r => !!r.data).catch(() => false)
  )).catch(() => false);
  return exists ? generateNumeroTessera() : candidate;
}

async function getUserIP() {
  try { const res = await fetch('https://api.ipify.org?format=json'); return (await res.json()).ip; }
  catch { return null; }
}

// ================================
// COOLDOWN / RESET BOTTONI
// ================================
function startRegistrationCooldown(seconds) {
  const btn = document.getElementById('registerBtn') || document.querySelector('.btn-primary');
  if (!btn) return;
  let rem = seconds;
  const tick = () => {
    btn.disabled = true;
    btn.innerHTML = `⏳ Riprova tra ${rem}s`;
  };
  tick();
  const interval = setInterval(() => {
    rem--;
    if (rem <= 0) {
      clearInterval(interval);
      btn.disabled = false;
      btn.innerHTML = '🚀 Completa Registrazione';
    } else tick();
  }, 1000);
}
