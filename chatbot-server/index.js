import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// --- INIZIALIZZAZIONE ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// --- ROUTE DI SALUTE ---
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- ROUTE CHAT ---
app.post('/api/chat', async (req, res) => {
  try {
    // 1. Verifica token Supabase
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token mancante' });

    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData.user) return res.status(401).json({ error: 'Non autorizzato' });

    // 2. Leggi messaggi dal body
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messaggi non validi' });
    }

    // 3. Salva domanda nel DB
    const userMessage = messages.slice(-1)[0]?.content;
    if (userMessage) {
      await supabase.from('chat_messages').insert({
        user_id: userData.user.id,
        user_message: userMessage,
        bot_response: '',
        created_at: new Date().toISOString()
      });
    }

    // 4. Prepara system prompt
    const systemPrompt = {
      role: 'system',
      content:
        'Sei Virgilio, assistente sindacale per i Carabinieri. Rispondi in italiano, con tono professionale ma amichevole. Non divulgare dati sensibili.'
    };

    // 5. Chiama OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemPrompt, ...messages.slice(-8)], // usa solo ultimi 8 messaggi
      temperature: 0.7,
      max_tokens: 500
    });

    const botReply = completion.choices[0].message.content;

    // 6. Aggiorna risposta nel DB
    if (userMessage) {
      const { error: updateErr } = await supabase
        .from('chat_messages')
        .update({ bot_response: botReply })
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (updateErr) console.warn('Update error:', updateErr);
    }

    // 7. Restituisci risposta
    res.json({
      choices: [{ message: { role: 'assistant', content: botReply } }],
      usage: completion.usage
    });
  } catch (err) {
    console.error('Errore chat:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// --- AVVIO ---
app.listen(PORT, () => {
  console.log(`🚀 Chatbot server avviato su http://localhost:${PORT}`);
});