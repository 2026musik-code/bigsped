// Definisi tipe untuk Cloudflare Workers Environment
type Bindings = {
  // Binding ke fitur Cloudflare Workers AI
  AI: any; 
};

export default {
  async fetch(request: Request, env: Bindings): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (request.method === 'GET' && url.pathname === '/api/health') {
      return Response.json({ status: 'ok' });
    }

    // Endpoint Chat menggunakan Cloudflare Workers AI
    if (request.method === 'POST' && url.pathname === '/api/chat') {
      try {
        const { messages } = await request.json() as any;

        const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            { role: 'system', content: 'You are Odysseus, a smart, versatile AI assistant.' },
            ...messages
          ]
        });

        return Response.json({ text: response.response });
      } catch (error: any) {
        console.error("Worker Error:", error);
        return Response.json({ error: "Sistem AI mengalami kendala teknis." }, { status: 500 });
      }
    }

    // Fallback error untuk endpoint API yang tidak valid
    if (url.pathname.startsWith('/api/')) {
        return Response.json({ error: "Not Found" }, { status: 404 });
    }

    // Jika bukan /api/*, kita akan membiarkan properti `[assets]` di wrangler.toml menangani file static Vite.
    // Jika eksekusi mencapai titik ini, kembalikan 404 (assets fallback diatur oleh Worker Assets)
    return new Response("Not Found", { status: 404 });
  }
};
