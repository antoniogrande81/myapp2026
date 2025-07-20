import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://lycrgzptkdkksukcwrld.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...'
)

supabase.auth.getUser().then(({ data: { user } }) => {
  if (!user) {
    window.location.href = "/login.html"
  } else {
    console.log("Utente loggato:", user.email)
  }
})