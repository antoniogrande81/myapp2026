# 🚔 MyApp - Sindacato Carabinieri 2026

Progressive Web App per la gestione dei servizi del Sindacato Carabinieri.

**"Il tuo dirigente sempre con te"**

## ✨ Funzionalità Principali

- 🔐 **Autenticazione Sicura** - Login con Supabase e protezione dati
- 📱 **Progressive Web App** - Installabile su tutti i dispositivi
- 🆔 **Tessera Digitale** - Con QR Code personalizzato e download PDF
- 🤝 **Convenzioni Esclusive** - Sconti riservati agli iscritti
- 👥 **Elenco Dirigenti** - Contatti diretti con la dirigenza sindacale
- 📞 **Supporto 24/7** - Assistenza sempre disponibile
- 🔔 **Notifiche Push** - Aggiornamenti in tempo reale
- 🛡️ **Privacy GDPR** - Conformità alle normative europee

## 🚀 Demo Live

🔗 **[Visita l'App Online](https://antoniogrande81.github.io/la-mia-app2026/)**

## 📱 Installazione Mobile

1. Apri l'app nel browser mobile
2. Tocca "Installa App" o "Aggiungi alla schermata Home"
3. L'app si comporterà come un'app nativa

## 🛠️ Sviluppo Locale

```bash
# Clona il repository
git clone https://github.com/antoniogrande81/la-mia-app2026.git

# Entra nella cartella
cd la-mia-app2026

# Installa dipendenze
npm install

# Avvia server di sviluppo
npm run dev

# Apri http://localhost:3000
```

## 🏗️ Tecnologie Utilizzate

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Supabase (Database, Auth, Storage)
- **PWA**: Service Worker, Web App Manifest
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions (automatico)

## 📁 Struttura Progetto

```
myapp2026/
├── 📁 public/          # Pagine pubbliche
│   ├── index.html      # Homepage
│   ├── login.html      # Accesso
│   ├── convenzioni.html # Convenzioni
│   └── ...
├── 📁 app/             # Area riservata
│   ├── tessera.html    # Tessera digitale
│   ├── profilo.html    # Profilo utente
│   └── ...
├── 📁 js/              # Scripts condivisi
├── 📁 lib/             # Librerie (Supabase)
└── 📁 styles/          # Fogli di stile
```

## 🔧 Configurazione

1. **Supabase Setup**:
   - Crea progetto su [supabase.com](https://supabase.com)
   - Configura database e tabelle
   - Aggiorna credenziali in `lib/supabaseClient.js`

2. **Database Schema**:
   - `profiles` - Dati utenti
   - `tessere` - Tessere digitali
   - `convenzioni` - Partner convenzionati
   - `dirigenti` - Contatti dirigenza

## 📊 Features Avanzate

- ✅ **Offline First** - Funziona anche senza connessione
- ✅ **Responsive Design** - Ottimizzato per tutti i dispositivi
- ✅ **SEO Ottimizzato** - Meta tags e structured data
- ✅ **Sicurezza** - Row Level Security (RLS) su Supabase
- ✅ **Performance** - Caricamento veloce e cache intelligente

## 🚦 Status

- ✅ **Frontend** - Completo e funzionante
- ✅ **Backend** - Supabase configurato
- ✅ **PWA** - Service Worker attivo
- ✅ **Deploy** - GitHub Pages live
- 🔄 **Testing** - In corso
- 📋 **Docs** - In aggiornamento

## 📞 Supporto e Contatti

- **Sviluppatore**: Antonio Grande
- **Email**: antoniogrande81@example.com
- **GitHub**: [@antoniogrande81](https://github.com/antoniogrande81)
- **Issues**: [Segnala Problemi](https://github.com/antoniogrande81/la-mia-app2026/issues)

## 📄 Licenza

Questo progetto è licenziato sotto MIT License - vedi il file [LICENSE](LICENSE) per dettagli.

## 🙏 Riconoscimenti

- **Sindacato Carabinieri d'Italia** - Per la fiducia e collaborazione
- **Supabase** - Per l'infrastruttura backend
- **Tailwind CSS** - Per il framework UI
- **GitHub** - Per hosting e CI/CD

---

💙 **Sviluppato con ❤️ per il Sindacato Carabinieri d'Italia**

*Versione 2.0.0 - Gennaio 2025*