const { createClient } = supabase;

const SUPABASE_URL = 'https://lycrgzptkdkksukcwrld.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y3JnenB0a2Rra3N1a2N3cmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODQyMzAsImV4cCI6MjA2ODM2MDIzMH0.ZJGOXAMC3hKKrnwXHKEa2_Eh7ZpOKeLYvYlYneBiEfk';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadProfile() {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    alert("Devi fare login!");
    window.location.href = "../public/login.html";
    return;
  }

  const { data, error } = await supabaseClient
    .from("profili")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    alert("Errore nel caricamento profilo.");
    return;
  }

  document.getElementById("nome").textContent = data.nome;
  document.getElementById("cognome").textContent = data.cognome;
  document.getElementById("matricola").textContent = data.matricola || "—";
  document.getElementById("email").textContent = data.email;

  QRCode.toCanvas(document.getElementById("qr-code"), `Tessera ${data.matricola || user.id}`, { width: 150 });
}

document.getElementById("logout").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "../public/login.html";
});

loadProfile();