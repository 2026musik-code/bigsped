import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for images
app.use(express.json({ limit: "50mb" }));

let aiClient: GoogleGenAI | null = null;
function getAiClient(req: express.Request) {
  const customKey = req.headers["x-gemini-api-key"] as string;
  if (customKey) {
    return new GoogleGenAI({ 
      apiKey: customKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }

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

// 1. Text & Chat Feature
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    const ai = getAiClient(req);
    
    let resultText = "";
    if (messages && messages.length > 0) {
      const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));
      
      const lastMessage = messages[messages.length - 1].content;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...history,
          { role: "user", parts: [{ text: lastMessage }] }
        ],
        config: {
          systemInstruction: "Anda adalah EduAI Premier, asisten intelektual sekolah yang mewah dan cerdas. Gunakan bahasa Indonesia yang sopan, elegan, dan sangat membantu.",
        }
      });
      resultText = response.text || "";
    }

    res.json({ text: resultText });
  } catch (error: any) {
    if (error?.message === "API_KEY_MISSING") {
      return res.status(400).json({ error: "Gemini API Key belum dikonfigurasi di Settings. Silakan tambahkan API key Anda." });
    }
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Maaf, sistem EduAI Premier mengalami kendala teknis." });
  }
});

// 2. Image Generation Feature
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt gambar diperlukan." });

    const ai = getAiClient(req);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    let imageUrl = "";
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
        throw new Error("Tidak ada gambar yang dihasilkan.");
    }

    res.json({ imageUrl });

  } catch (error: any) {
    if (error?.message === "API_KEY_MISSING") {
      return res.status(400).json({ error: "Gemini API Key belum dikonfigurasi di Settings. Silakan tambahkan API key Anda." });
    }
    console.error("Image Gen Error:", error);
    res.status(500).json({ error: `Gagal membuat gambar: ${error.message || "Unknown error"}` });
  }
});

// 3. Audio (TTS) Generation Feature
app.post("/api/generate-voice", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Teks untuk suara diperlukan." });

    const ai = getAiClient(req);
    
    // We import dynamically or just use string "AUDIO"
    return await new Promise(async (resolve) => {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-tts-preview",
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: ["AUDIO" as any], 
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });
            
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioUrl = `data:audio/pcm;rate=24000;base64,${base64Audio}`;
                res.json({ audioUrl });
                resolve(null);
            } else {
                throw new Error("Tidak ada audio yang dihasilkan.");
            }
        } catch(e:any) {
             console.error(e);
             res.status(500).json({ error: `Gagal membuat suara: ${e.message || "Unknown error"}` });
             resolve(null);
        }
    });
    
  } catch (error: any) {
    if (error?.message === "API_KEY_MISSING") {
      return res.status(400).json({ error: "Gemini API Key belum dikonfigurasi di Settings. Silakan tambahkan API key Anda." });
    }
    console.error("Voice Gen Error:", error);
    res.status(500).json({ error: "Gagal membuat suara: " + error.message });
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
