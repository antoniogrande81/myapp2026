// auth.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://lycrgzptkdkksukcwrld.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // tronco per brevità

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Recupera il ruolo dell'utente autenticato da Supabase (tabella `profiles`)
 * @returns {Promise<string|null>} ruolo es. "user", "dirigente", "admin"
 */
export async function getUserRole() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("Errore utente:", userError);
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('ruolo') // o 'role', in base a come l'hai chiamata
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error("Errore nel recupero profilo:", profileError);
    return null;
  }

  localStorage.setItem('ruolo', profile.ruolo);
  return profile.ruolo;
}

/**
 * Restituisce la home corretta in base al ruolo
 * @param {string} ruolo 
 * @returns {string} percorso (es. "/home-dirigente")
 */
export function getHomeRouteByRole(ruolo) {
  switch (ruolo) {
    case 'admin':
      return '/home-admin';
    case 'dirigente':
      return '/home-dirigente';
    case 'user':
    default:
      return '/home-user';
  }
}

/**
 * Effettua il redirect alla home corretta in base al ruolo salvato
 */
export function redirectToHome() {
  const ruolo = localStorage.getItem('ruolo') || 'user';
  const home = getHomeRouteByRole(ruolo);
  window.location.href = home;
} 
