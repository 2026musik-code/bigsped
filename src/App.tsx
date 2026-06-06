/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";
// Import the raw worker string we downloaded and fixed
import workerCode from "../worker.js?raw";

export default function App() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(workerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex justify-center text-slate-200">
      <div className="max-w-4xl w-full">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Nautica Worker Fix (Error 1101)
          </h1>
          <p className="text-slate-400 text-sm">
            Halo! Saya telah membuatkan ulang dan menyempurnakan `worker.js` Anda agar tidak terjadi "Error 1101" saat ada kegagalan koneksi proxy dari GitHub Nautica.
            Silakan copy kode di bawah ini dan paste seluruhnya ke dalam file `src/worker.js` di repositori GitHub Anda.
          </p>
        </header>

        <div className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-slate-800/50 px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <span className="font-mono text-sm text-slate-400">src/worker.js</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-colors px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={16} /> copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> copy full code
                </>
              )}
            </button>
          </div>
          <div className="p-4 overflow-auto max-h-[60vh] bg-black/40">
            <pre className="font-mono text-xs text-slate-300 whitespace-pre">
              {workerCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
