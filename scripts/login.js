import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://lycrgzptkdkksukcwrld.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...'
)

document.querySelector("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Credenziali errate");
  } else {
    window.location.href = "/home.html";
  }
});