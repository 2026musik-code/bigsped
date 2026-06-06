import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("API_KEY_MISSING");
    }
    aiClient = new GoogleGenAI({ 
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return aiClient;
}

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Jika tidak ada API key, simulasikan respons dari model lokal gratis (Ollama/llama.cpp)
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "YOUR_API_KEY") {
      const lastMessage = messages?.[messages.length - 1]?.content || "";
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulasi jeda komputasi lokal
      
      const simulateLocalText = `**[Simulasi Mode Lokal]**\n\nSaya telah menerima pesan Anda: *"${lastMessage}"*\n\nSeperti proyek [Odysseus di GitHub](https://github.com/pewdiepie-archdaemon/odysseus), sistem ini dapat dikonfigurasi untuk berjalan **100% secara lokal dan gratis** menggunakan model seperti **Ollama**, **vLLM**, atau **llama.cpp**. Tidak ada data yang dikirim ke internet, dan tidak diperlukan API Key berbayar.\n\nDalam versi pratinjau antarmuka web ini, saya menggunakan server simulasi lokal untuk membalas pesan Anda.`;
      
      return res.json({ text: simulateLocalText });
    }

    const ai = getAiClient();
    
    let resultText = "";
    if (messages && messages.length > 0) {
      const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));
      
      const lastMessage = messages[messages.length - 1].content;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          ...history,
          { role: "user", parts: [{ text: lastMessage }] }
        ],
        config: {
          systemInstruction: "You are Odysseus, a smart, versatile AI assistant. Answer intelligently using markdown formatting where useful.",
        }
      });
      resultText = response.text || "";
    }

    res.json({ text: resultText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error.message === "API_KEY_MISSING") {
      return res.status(400).json({ error: "API Key belum dikonfigurasi. Silakan tambahkan Gemini API Key Anda di menu Settings (ikon gembok)." });
    }
    
    // Check if it's an invalid API key error
    if (error.status === "INVALID_ARGUMENT" || error.message?.includes("API key not valid")) {
       return res.status(400).json({ error: "Gemini API Key tidak valid. Silakan periksa kembali konfigurasi API Key di menu Settings." });
    }

    res.status(500).json({ error: "Maaf, saya mengalami kendala teknis saat memproses pesan Anda." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
