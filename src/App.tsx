/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";
import workerCode from "../worker_single.js?raw";

export default function App() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(workerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center py-6 px-4">
      <div className="max-w-5xl w-full flex flex-col flex-1 h-full gap-4">
        
        <div className="bg-blue-900/40 border border-blue-500/50 p-4 rounded-xl text-center shadow-lg">
          <h1 className="text-2xl font-bold text-white mb-2">PENTING! Ini Bukan Proxy-nya</h1>
          <p className="text-blue-100 text-sm md:text-base max-w-3xl mx-auto">
            Halaman ini hanya alat untuk memberikan kode kepada Anda. Aplikasi ini <b>bukan</b> proxy VPN-nya. 
            Anda harus <b>MENG-COPY</b> semua kode di bawah ini, lalu <b>PASTE (Tempel)</b> ke dalam dashboard <b>Cloudflare Workers</b> Anda (timpa kode yang lama).
          </p>
          <div className="mt-4 inline-block bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-3 py-2 rounded font-medium text-sm">
            Catatan: File `html.js` sudah saya jadikan satu ke dalam `worker.js`. Anda cukup copy 1 kode ini saja!
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-slate-300 bg-slate-900 px-2 flex items-center h-7 rounded border border-slate-700 shadow-inner">
                worker.js (DENGAN HTML INLINE & ANTI ERROR 1101)
              </span>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold shadow-lg transition-all ${
                copied 
                  ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20" 
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
              }`}
            >
              {copied ? (
                <><CheckCircle2 size={16} /> BERHASIL DI-COPY!</>
              ) : (
                <><Copy size={16} /> COPY SEMUA KODE</>
              )}
            </button>
          </div>
          
          <div className="flex-1 relative p-1">
            <textarea 
              readOnly 
              value={workerCode}
              spellCheck={false}
              className="absolute inset-0 w-full h-full bg-transparent p-4 font-mono text-[13px] md:text-sm text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-b-xl leading-relaxed"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
