import { supabase } from '../lib/supabaseClient.js';

const { data: { user } } = await supabase.auth.getUser();

// Recupera nome, cognome e tessera
const { data: profile } = await supabase
  .from('profiles')
  .select('nome, cognome')
  .eq('id', user.id)
  .single();

const { data: tessera } = await supabase
  .from('tessere')
  .select('numero_tessera')
  .eq('user_id', user.id)
  .single();

// Mostra dati
document.getElementById('nomeCompleto').textContent = `${profile.nome} ${profile.cognome}`;
document.getElementById('numeroTessera').textContent = `Tessera N° ${tessera.numero_tessera}`;

// QR
QRCode.toCanvas(
  document.createElement("canvas"),
  tessera.numero_tessera,
  { width: 128 },
  function (err, canvas) {
    if (!err) {
      document.getElementById('qrcode').appendChild(canvas);
    }
  }
);
