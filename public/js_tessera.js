import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(
  'https://lycrgzptkdkksukcwrld.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3JnenB0a2Rra3N1a2N3cmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODQyMzAsImV4cCI6MjA2ODM2MDIzMH0.ZJGOXAMC3hKKrnwXHKEa2_Eh7ZpOKeLYvYlYneBiEfk'
);

const { data: { user } } = await supabase.auth.getUser();

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

document.getElementById('nomeCompleto').textContent = `${profile.nome} ${profile.cognome}`;
document.getElementById('numeroTessera').textContent = `Tessera N° ${tessera.numero_tessera}`;

// QRCode generation
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

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = '/login.html'; // cambia se login è altrove
});

// Download
document.getElementById('downloadBtn').addEventListener('click', () => {
  const card = document.getElementById('tessera');
  html2canvas(card).then(canvas => {
    const link = document.createElement('a');
    link.download = 'tessera.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
});
