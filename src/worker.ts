import { Hono } from 'hono';

// Definisi tipe untuk Cloudflare Workers Environment
type Bindings = {
  // Binding ke fitur Cloudflare Workers AI
  AI: any; 
};

const app = new Hono<{ Bindings: Bindings }>();

// Health check endpoint
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Endpoint Chat menggunakan Cloudflare Workers AI
app.post('/api/chat', async (c) => {
  try {
    const { messages } = await c.req.json();

    // Di dalam ekosistem Cloudflare, Anda tidak perlu mengunduh model 4GB.
    // Anda bisa memanggil model LLM Open-Source secara gratis (seperti Llama-3) 
    // langsung melalui network Cloudflare Edge!
    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'You are Odysseus, a smart, versatile AI assistant.' },
        ...messages
      ]
    });

    return c.json({ text: response.response });
  } catch (error: any) {
    console.error("Worker Error:", error);
    return c.json({ error: "Sistem AI mengalami kendala teknis." }, 500);
  }
});

export default app;
