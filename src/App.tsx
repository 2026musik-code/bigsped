import React, { useState, useRef, useEffect } from "react";
import { 
  GraduationCap, 
  Palette, 
  Mic2, 
  Send,
  Loader2,
  Sparkles,
  Download,
  PlaySquare,
  BookOpen,
  Menu,
  Settings,
  X
} from "lucide-react";
import Markdown from "react-markdown";

type Tab = "tutor" | "image" | "voice" | "settings";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("tutor");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("eduai_api_key") || "";
    }
    return "";
  });
  
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("eduai_api_key", key);
  };
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Selamat datang di **EduAI Premier**. Saya adalah asisten pintar sekolah Anda yang siap membantu dalam pembelajaran, kreativitas seni, maupun konversi teks ke suara. Apa yang ingin kita kerjakan hari ini?"
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Image State
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Voice State
  const [voiceText, setVoiceText] = useState("");
  const [generatedVoice, setGeneratedVoice] = useState("");
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const newMsg: Message = { role: "user", content: inputVal.trim() };
    setMessages(prev => [...prev, newMsg]);
    setInputVal("");
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(apiKey ? { "x-gemini-api-key": apiKey } : {})
        },
        body: JSON.stringify({ messages: [...messages, newMsg] })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal mendapatkan respons dari server.");

      setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!imagePrompt.trim() || isGeneratingImage) return;

    setIsGeneratingImage(true);
    setErrorMsg("");
    setGeneratedImage("");

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(apiKey ? { "x-gemini-api-key": apiKey } : {})
        },
        body: JSON.stringify({ prompt: imagePrompt.trim() })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal membuat gambar.");

      setGeneratedImage(data.imageUrl);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVoice = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!voiceText.trim() || isGeneratingVoice) return;

    setIsGeneratingVoice(true);
    setErrorMsg("");
    setGeneratedVoice("");

    try {
      const res = await fetch("/api/generate-voice", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(apiKey ? { "x-gemini-api-key": apiKey } : {})
        },
        body: JSON.stringify({ text: voiceText.trim() })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal membuat suara.");

      setGeneratedVoice(data.audioUrl);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-[#388bfd] selection:text-white">
      {/* Mobile Top Header (Garisan Tiga) */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#30363d] bg-[#161b22] shadow-md z-20 relative">
        <div className="flex items-center space-x-2">
          <GraduationCap size={20} className="text-amber-500" />
          <h1 className="font-serif text-lg font-semibold text-[#e6edf3]">EduAI Premier</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 hover:text-white bg-[#0d1117] rounded-lg">
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Overlay Mobile */}
      {isSidebarOpen && (
         <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 w-72 border-r border-[#30363d] bg-[#161b22] flex flex-col shrink-0 shadow-2xl md:shadow-none z-30 transition-transform duration-300 ease-in-out`}>
        <div className="hidden md:flex p-6 border-b border-[#30363d] items-center space-x-3">
          <div className="bg-gradient-to-br from-amber-200 to-amber-500 p-2 rounded-xl text-black shrink-0">
            <GraduationCap size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold text-[#e6edf3] tracking-wide">EduAI</h1>
            <p className="text-xs text-amber-500 font-medium tracking-widest uppercase mt-0.5">Premier</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col p-4 space-y-2 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 px-2 mt-4 md:mt-0">Layanan AI</div>
          
          <button 
            onClick={() => { setActiveTab("tutor"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeTab === "tutor" ? "bg-[#1f242c] text-[#e6edf3] shadow-sm border border-[#30363d]" : "text-gray-400 hover:text-gray-200 hover:bg-[#1f242c]"
            }`}
          >
            <BookOpen size={18} />
            <span className="font-medium text-sm">Tutor Pintar</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab("image"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeTab === "image" ? "bg-[#1f242c] text-[#e6edf3] shadow-sm border border-[#30363d]" : "text-gray-400 hover:text-gray-200 hover:bg-[#1f242c]"
            }`}
          >
            <Palette size={18} />
            <span className="font-medium text-sm">Studio Seni</span>
          </button>

          <button 
            onClick={() => { setActiveTab("voice"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeTab === "voice" ? "bg-[#1f242c] text-[#e6edf3] shadow-sm border border-[#30363d]" : "text-gray-400 hover:text-gray-200 hover:bg-[#1f242c]"
            }`}
          >
            <Mic2 size={18} />
            <span className="font-medium text-sm">Suara AI</span>
          </button>

          <div className="my-4 border-t border-[#30363d]"></div>
          
          <button 
            onClick={() => { setActiveTab("settings"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeTab === "settings" ? "bg-[#1f242c] text-[#e6edf3] shadow-sm border border-[#30363d]" : "text-gray-400 hover:text-gray-200 hover:bg-[#1f242c]"
            }`}
          >
            <Settings size={18} />
            <span className="font-medium text-sm">Pengaturan</span>
          </button>
        </div>

        <div className="p-4 border-t border-[#30363d] text-xs text-center text-gray-500">
          EduAI Premier © {new Date().getFullYear()}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-full h-[calc(100vh-65px)] md:h-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#161b22] via-[#0d1117] to-[#0d1117]">
        
        {/* Error Banner */}
        {errorMsg && (
          <div className="absolute top-0 left-0 right-0 z-50 bg-red-900/40 border-b border-red-700 p-3 flex justify-between items-center text-red-200 text-sm animate-in slide-in-from-top-2">
            <p>{errorMsg}</p>
            <button onClick={() => setErrorMsg("")} className="hover:text-white">✕</button>
          </div>
        )}

        {/* Tab Content: Tutor Pintar */}
        {activeTab === "tutor" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
              <div className="max-w-3xl mx-auto mb-8 border-b border-[#30363d] pb-6">
                <h2 className="text-3xl font-serif text-[#e6edf3] mb-2 flex items-center">
                  <Sparkles size={24} className="text-amber-500 mr-3" />
                  Tutor Pintar
                </h2>
                <p className="text-gray-400 text-sm">Bertanya mengenai mata pelajaran, analisis esai, hingga pemecahan masalah rumit.</p>
              </div>

              <div className="max-w-3xl mx-auto space-y-6 pb-20">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl p-5 shadow-sm text-sm ${
                      m.role === "user" 
                        ? "bg-gradient-to-br from-gray-800 to-gray-700 text-[#e6edf3] border border-gray-600 rounded-br-none" 
                        : "bg-[#161b22] text-[#c9d1d9] border border-[#30363d] rounded-bl-none"
                    }`}>
                      {m.role === "assistant" ? (
                        <div className="markdown-body text-sm">
                          <Markdown>{m.content}</Markdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-bl-none p-5 bg-[#161b22] border border-[#30363d] text-gray-400 flex items-center space-x-3">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm font-medium">Sedang berpikir...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-4 bg-[#0d1117] border-t border-[#30363d] absolute bottom-0 w-full left-0">
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSendChat} className="relative flex items-center group">
                  <input
                    type="text"
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-[#e6edf3] placeholder:text-gray-600 shadow-sm"
                    placeholder="Tanyakan hal apa pun yang membingungkan Anda..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputVal.trim()}
                    className="absolute right-2 p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Tab Content: Studio Seni */}
        {activeTab === "image" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8 border-b border-[#30363d] pb-6">
                <h2 className="text-3xl font-serif text-[#e6edf3] mb-2 flex items-center">
                  <Palette size={24} className="text-amber-500 mr-3" />
                  Studio Seni
                </h2>
                <p className="text-gray-400 text-sm">Hasilkan ilustrasi berkualitas tinggi untuk materi presentasi atau karya seni digital Anda.</p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl mb-8">
                <form onSubmit={handleGenerateImage} className="space-y-4">
                  <label className="block text-sm font-medium text-gray-300">Deskripsikan ide karya seni Anda</label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-[#e6edf3] placeholder:text-gray-600 resize-none shadow-inner"
                    placeholder="Contoh: Lukisan potret pahlawan proklamasi dengan gaya cat minyak klasik yang mewah..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    disabled={isGeneratingImage}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isGeneratingImage || !imagePrompt.trim()}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-medium py-2.5 px-6 rounded-lg transition-all disabled:opacity-50 flex items-center space-x-2"
                    >
                      {isGeneratingImage ? (
                        <><Loader2 size={16} className="animate-spin" /> <span>Menggambar...</span></>
                      ) : (
                        <><Sparkles size={16} /> <span>Hasilkan Gambar</span></>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {generatedImage && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-serif text-lg text-[#e6edf3]">Hasil Mahakarya</h3>
                    <a 
                      href={generatedImage} 
                      download="EduAI_Art.png"
                      className="text-amber-500 hover:text-amber-400 flex items-center space-x-1 text-sm bg-amber-500/10 px-3 py-1.5 rounded-md"
                    >
                      <Download size={14} /> <span>Unduh HD</span>
                    </a>
                  </div>
                  <div className="bg-[#0d1117] p-2 rounded-2xl border border-[#30363d] shadow-2xl">
                    <img 
                      src={generatedImage} 
                      alt="Generated Artwork" 
                      className="w-full h-auto rounded-xl object-contain bg-[#161b22] border border-[#30363d]/50" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Suara AI */}
        {activeTab === "voice" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8 border-b border-[#30363d] pb-6">
                <h2 className="text-3xl font-serif text-[#e6edf3] mb-2 flex items-center">
                  <Mic2 size={24} className="text-amber-500 mr-3" />
                  Sintesis Suara
                </h2>
                <p className="text-gray-400 text-sm">Konversi narasi tertulis Anda ke format narasi suara (Audio) secara ekspresif.</p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl mb-8">
                <form onSubmit={handleGenerateVoice} className="space-y-4">
                  <label className="block text-sm font-medium text-gray-300">Teks yang akan dibacakan</label>
                  <textarea
                    rows={4}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-[#e6edf3] placeholder:text-gray-600 resize-none shadow-inner"
                    placeholder="Tuliskan naskah pidato, materi narasi, atau puisi di sini..."
                    value={voiceText}
                    onChange={(e) => setVoiceText(e.target.value)}
                    disabled={isGeneratingVoice}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isGeneratingVoice || !voiceText.trim()}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-medium py-2.5 px-6 rounded-lg transition-all disabled:opacity-50 flex items-center space-x-2"
                    >
                      {isGeneratingVoice ? (
                        <><Loader2 size={16} className="animate-spin" /> <span>Memproses Audio...</span></>
                      ) : (
                        <><PlaySquare size={16} /> <span>Sintesis Suara</span></>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {generatedVoice && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4">
                   <h3 className="font-serif text-lg text-[#e6edf3] mb-4 flex items-center">
                    <Sparkles size={16} className="text-amber-500 mr-2" />
                    Hasil Suara
                  </h3>
                  <div className="bg-[#0d1117] p-4 py-8 rounded-xl border border-[#30363d] flex items-center justify-center shadow-inner">
                    <audio controls src={generatedVoice} className="w-full max-w-md accent-amber-500 outline-none">
                       Browser Anda tidak mendukung elemen audio.
                    </audio>
                  </div>
                  <div className="mt-4 flex justify-end">
                     <a 
                      href={generatedVoice} 
                      download="EduAI_Voice.wav"
                      className="text-amber-500 hover:text-amber-400 flex items-center space-x-1 text-sm bg-amber-500/10 px-4 py-2 rounded-lg transition-colors border border-amber-500/20"
                    >
                      <Download size={14} /> <span>Unduh File Audio</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Pengaturan */}
        {activeTab === "settings" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8 border-b border-[#30363d] pb-6">
                <h2 className="text-3xl font-serif text-[#e6edf3] mb-2 flex items-center">
                  <Settings size={24} className="text-amber-500 mr-3" />
                  Pengaturan Keamanan
                </h2>
                <p className="text-gray-400 text-sm">Kelola kunci akses API Gemini untuk pengalaman asisten pribadi yang eksklusif.</p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl mb-8">
                <h3 className="font-serif text-lg text-[#e6edf3] mb-4">Integrasi Kunci API (R2 / Local Storage)</h3>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  Masukkan Gemini API Key pribadi Anda untuk mengaktifkan fitur AI. Key Anda akan disimpan secara lokal di keamanan peramban ini (Local Storage) dan digunakan pada setiap permintaan.
                </p>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-300">Gemini API Key</label>
                  <input
                    type="password"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-[#e6edf3] placeholder:text-gray-600 shadow-inner"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => handleSaveApiKey(e.target.value)}
                  />
                  {apiKey && (
                    <div className="mt-2 text-xs text-green-400 flex items-center">
                      <Sparkles size={14} className="mr-1.5" /> API Key berhasil disimpan untuk sesi operasional ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
