export const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nautica Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    },
                    colors: {
                        glass: 'rgba(255, 255, 255, 0.1)',
                        glassBorder: 'rgba(255, 255, 255, 0.2)',
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #0f172a;
            background-image:
                radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%),
                radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%),
                radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%);
            background-attachment: fixed;
            color: #f8fafc;
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-white">

    <div class="max-w-4xl w-full space-y-8 animate-fade-in">

        <!-- Header -->
        <div class="text-center space-y-2">
            <h1 class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
                SERVER SIMPEL
            </h1>
            <p class="text-slate-400 text-lg">Advanced Cloudflare VLESS/Trojan Worker</p>
        </div>

        <!-- Status Card -->
        <div class="glass-panel rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="relative">
                    <div class="w-3 h-3 bg-green-500 rounded-full animate-ping absolute"></div>
                    <div class="w-3 h-3 bg-green-500 rounded-full relative"></div>
                </div>
                <div>
                    <p class="text-sm text-slate-400">System Status</p>
                    <p class="font-semibold text-green-400">Operational</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-sm text-slate-400">Your IP</p>
                <p id="user-ip" class="font-mono text-cyan-300">Loading...</p>
            </div>
        </div>

        <!-- Main Configuration -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

            <!-- Controls -->
            <div class="glass-panel rounded-2xl p-6 space-y-6">
                <h2 class="text-xl font-semibold border-b border-white/10 pb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                    Configuration
                </h2>

                <div class="space-y-4">
                    <!-- UUID -->
                    <div>
                        <label class="block text-sm font-medium text-slate-300 mb-1">UUID</label>
                        <div class="flex gap-2">
                            <input type="text" id="uuid" class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 transition font-mono text-sm" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
                            <button onclick="generateUUID()" class="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition" title="Generate New UUID">
                                <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Proxy IP (Optional) -->
                    <div>
                        <label class="block text-sm font-medium text-slate-300 mb-1">Proxy IP:Port (Optional)</label>
                        <input type="text" id="proxyInput" class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 transition font-mono text-sm" placeholder="1.1.1.1:443">
                    </div>

                    <!-- Domain -->
                    <div>
                        <label class="block text-sm font-medium text-slate-300 mb-1">Worker Domain (SNI)</label>
                        <input type="text" id="domain" class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 transition font-mono text-sm">
                    </div>

                    <!-- Format -->
                    <div>
                        <label class="block text-sm font-medium text-slate-300 mb-1">Format Output</label>
                        <select id="format" class="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 transition text-sm">
                            <option value="raw">Raw (VLESS/Trojan Links)</option>
                            <option value="clash">Clash (YAML)</option>
                            <option value="v2ray">V2Ray (Base64)</option>
                            <option value="singbox">Sing-box (JSON)</option>
                        </select>
                    </div>

                    <button onclick="getSubscription()" class="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition transform hover:scale-[1.02] active:scale-95">
                        Generate Configuration
                    </button>
                </div>
            </div>

            <!-- Result -->
            <div class="glass-panel rounded-2xl p-6 flex flex-col h-full">
                <h2 class="text-xl font-semibold border-b border-white/10 pb-4 flex items-center gap-2 mb-4">
                    <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Result
                </h2>
                <div class="relative flex-1">
                    <textarea id="output" readonly class="w-full h-64 md:h-full bg-slate-900/80 border border-white/10 rounded-lg p-4 font-mono text-xs text-green-400 focus:outline-none resize-none" placeholder="Configuration will appear here..."></textarea>
                    <button onclick="copyToClipboard()" class="absolute top-2 right-2 p-2 bg-slate-800/80 rounded-md hover:bg-slate-700 transition text-slate-400 hover:text-white backdrop-blur-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                    </button>
                </div>
            </div>
        </div>

            <!-- List Proxy -->
            <div class="glass-panel rounded-2xl p-6 col-span-1 md:col-span-2 space-y-6">
                 <div class="flex flex-col md:flex-row items-center justify-between border-b border-white/10 pb-4 gap-4">
                    <h2 class="text-xl font-semibold flex items-center gap-2 w-full md:w-auto">
                        <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        LIST PROXY
                    </h2>

                    <div class="flex gap-2 w-full md:w-auto">
                        <input type="text" id="proxy-search" placeholder="Search Country or ISP..." class="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-1.5 focus:outline-none focus:border-cyan-500 transition font-mono text-sm w-full md:w-64" onkeydown="if(event.key === 'Enter') loadProxies()">
                        <button onclick="loadProxies()" class="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition" title="Search">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </button>
                    </div>
                </div>

                <div id="proxy-grid" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Proxies will be loaded here -->
                    <div class="col-span-3 text-center text-slate-400 py-8">Loading proxies...</div>
                </div>
            </div>

        <!-- Footer -->
        <footer class="text-center text-slate-500 text-sm py-4">
            <p>&copy; 2024 Nautica Worker. Design by FoolVPN & Jules.</p>
        </footer>

    </div>

    <!-- Modal -->
    <div id="modal" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeModal()"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4">
            <div class="glass-panel rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center border-b border-white/10 pb-4">
                    <h3 class="text-xl font-semibold text-cyan-400">Configuration Result</h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col items-center justify-center space-y-2 bg-slate-900/50 p-4 rounded-xl border border-white/10">
                        <img id="qr-code" src="" alt="QR Code" class="w-48 h-48 rounded-lg bg-white p-2">
                        <p class="text-xs text-slate-400">Scan to import</p>
                    </div>
                    <div class="relative h-full min-h-[200px]">
                         <textarea id="modal-output" readonly class="w-full h-full bg-slate-900/80 border border-white/10 rounded-lg p-4 font-mono text-xs text-green-400 focus:outline-none resize-none"></textarea>
                         <button onclick="copyModalClipboard()" class="absolute top-2 right-2 p-2 bg-slate-800/80 rounded-md hover:bg-slate-700 transition text-slate-400 hover:text-white backdrop-blur-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Init
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('domain').value = window.location.hostname;
            fetchIP();
            generateUUID();
            loadProxies();
        });

        async function fetchIP() {
            try {
                const res = await fetch('/api/v1/myip');
                const data = await res.json();
                document.getElementById('user-ip').innerText = data.ip + ' (' + data.colo + ')';
            } catch (e) {
                document.getElementById('user-ip').innerText = 'Unknown';
            }
        }

        function generateUUID() {
            const uuid = crypto.randomUUID();
            document.getElementById('uuid').value = uuid;
        }

        async function getSubscription() {
            const btn = document.querySelector('button[onclick="getSubscription()"]');
            const output = document.getElementById('output');
            const proxyInput = document.getElementById('proxyInput').value.trim();

            btn.disabled = true;
            btn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9696;</span> Processing...';
            output.value = 'Processing...';

            try {
                let resultText = "";

                // Check specific proxy if input provided
                if (proxyInput) {
                    output.value = 'Checking proxy ' + proxyInput + '...';
                    const checkUrl = new URL('/check', window.location.origin);
                    checkUrl.searchParams.set('target', proxyInput);

                    const checkRes = await fetch(checkUrl);
                    if (checkRes.ok) {
                        const data = await checkRes.json();
                        const flag = data.flag || "🏳️";
                        const country = data.country || data.regionCode || "Unknown";
                        const isp = data.asOrganization || "Unknown ISP";
                        const delay = data.delay || "N/A";

                        resultText += \`================================\n\`;
                        resultText += \`SERVER STATUS\n\`;
                        resultText += \`================================\n\`;
                        resultText += \`IP      : \${data.ip}\n\`;
                        resultText += \`Port    : \${data.port}\n\`;
                        resultText += \`Country : \${flag} \${country}\n\`;
                        resultText += \`ISP     : \${isp}\n\`;
                        resultText += \`Ping    : \${delay}ms\n\`;
                        resultText += \`================================\n\n\`;
                    } else {
                        resultText += \`Failed to check proxy: \${checkRes.statusText}\n\n\`;
                    }
                }

                // Generate Subscription Links
                const domain = document.getElementById('domain').value;
                const format = document.getElementById('format').value;
                const url = new URL('/api/v1/sub', window.location.origin);
                url.searchParams.set('host', domain);
                url.searchParams.set('format', format);
                url.searchParams.set('limit', '10');

                const subRes = await fetch(url);
                if (subRes.ok) {
                    const text = await subRes.text();
                    const accounts = text.split(String.fromCharCode(10)).filter(line => line.trim() !== '');
                    const separator = String.fromCharCode(10) + '================================' + String.fromCharCode(10);
                    if (accounts.length > 0) {
                        resultText += accounts.join(separator);
                        resultText += separator;
                    }
                } else {
                    resultText += 'Error fetching subscription: ' + subRes.statusText;
                }

                output.value = resultText;

            } catch (e) {
                output.value = 'Error: ' + e.message;
            } finally {
                btn.disabled = false;
                btn.innerText = 'Generate Configuration';
            }
        }

        function copyToClipboard() {
            const copyText = document.getElementById("output");
            copyText.select();
            copyText.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(copyText.value).then(() => {
                alert("Copied to clipboard!");
            });
        }

        // Proxy List Logic
        async function loadProxies() {
            const grid = document.getElementById('proxy-grid');
            const search = document.getElementById('proxy-search') ? document.getElementById('proxy-search').value : '';

            grid.innerHTML = '<div class="col-span-3 text-center text-slate-400 py-8"><span class="animate-spin inline-block mr-2">&#9696;</span> Loading proxies...</div>';

            try {
                const url = new URL('/api/v1/proxies', window.location.origin);
                url.searchParams.set('limit', '12');
                if (search) url.searchParams.set('search', search);

                const res = await fetch(url);
                const proxies = await res.json();

                if (proxies.length === 0) {
                    grid.innerHTML = '<div class="col-span-3 text-center text-slate-400 py-8">No proxies found matching your search.</div>';
                    return;
                }

                grid.innerHTML = '';
                proxies.forEach((proxy, index) => {
                    const id = \`proxy-\${index}\`;
                    const div = document.createElement('div');
                    div.className = 'bg-slate-900/50 border border-white/10 rounded-xl p-4 space-y-3 hover:border-cyan-500/50 transition relative group';
                    div.innerHTML = \`
                        <div class="flex justify-between items-start">
                            <div class="flex items-center gap-2">
                                <span class="text-2xl">\${proxy.flag}</span>
                                <div>
                                    <p class="font-bold text-white text-sm">\${proxy.country}</p>
                                    <p class="text-xs text-slate-400 truncate max-w-[100px]" title="\${proxy.org}">\${proxy.org}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <span id="\${id}-ping" class="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-400">Waiting...</span>
                            </div>
                        </div>

                        <div class="bg-black/20 rounded p-2 font-mono text-xs text-cyan-300 text-center break-all">
                            \${proxy.prxIP}:\${proxy.prxPort}
                        </div>

                        <button onclick="generateProxyConfig('\${proxy.prxIP}', '\${proxy.prxPort}', '\${proxy.flag}', '\${proxy.country}', '\${proxy.org}')" class="w-full bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 border border-white/10 text-slate-300 text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            Generate VLESS TROJAN
                        </button>
                    \`;
                    grid.appendChild(div);

                    // Trigger ping check
                    checkProxyPing(proxy.prxIP, proxy.prxPort, id);
                });

            } catch (e) {
                grid.innerHTML = \`<div class="col-span-3 text-center text-red-400 py-8">Error loading proxies: \${e.message}</div>\`;
            }
        }

        async function checkProxyPing(ip, port, elementId) {
            const el = document.getElementById(\`\${elementId}-ping\`);
            try {
                // Simulate concurrency delay to avoid flooding if needed, or just go for it
                // Using the /check endpoint
                const checkUrl = new URL('/check', window.location.origin);
                checkUrl.searchParams.set('target', \`\${ip}:\${port}\`);

                const start = Date.now();
                const res = await fetch(checkUrl);
                const data = await res.json();

                if (data.delay) {
                    let color = 'text-green-400';
                    if (data.delay > 500) color = 'text-yellow-400';
                    if (data.delay > 1500) color = 'text-red-400';

                    el.className = \`text-xs font-mono px-2 py-1 rounded bg-slate-800 \${color}\`;
                    el.innerText = \`\${data.delay}ms\`;
                } else {
                    el.className = \`text-xs font-mono px-2 py-1 rounded bg-slate-800 text-red-400\`;
                    el.innerText = 'Timeout';
                }
            } catch (e) {
                el.className = \`text-xs font-mono px-2 py-1 rounded bg-slate-800 text-red-400\`;
                el.innerText = 'Error';
            }
        }

        async function generateProxyConfig(ip, port, flag, country, org) {
            const modal = document.getElementById('modal');
            const output = document.getElementById('modal-output');
            const qrCode = document.getElementById('qr-code');
            const domain = document.getElementById('domain').value;
            const uuid = document.getElementById('uuid').value;

            modal.classList.remove('hidden');
            output.value = 'Generating...';

            // Construct links manually or fetch from API?
            // Fetching from API ensures consistency with the worker logic
            try {
                const url = new URL('/api/v1/sub', window.location.origin);
                url.searchParams.set('host', domain);
                url.searchParams.set('format', 'raw');
                url.searchParams.set('limit', '10'); // Generate a few links
                // We want to force this specific proxy.
                // The current API generates random proxies from the list.
                // We need to modify the API or just construct it client side.
                // Since modifying API to accept single proxy override might be complex,
                // let's construct client side since we have UUID, Domain, Proxy IP/Port.

                // Wait, the API supports filtering?
                // The worker API logic:
                // const prxList = await getPrxList(prxBankUrl)...
                // It doesn't seem to support passing a specific IP/Port to generate.
                // So I will construct it client-side to be safe and fast.

                const vlessLink = \`vless://\${uuid}@\${ip}:\${port}?security=tls&encryption=none&type=ws&host=\${domain}&path=%2F\${ip}-\${port}&sni=\${domain}#\${flag} \${country} \${org} VLESS\`;
                const trojanLink = \`trojan://\${uuid}@\${ip}:\${port}?security=tls&type=ws&host=\${domain}&path=%2F\${ip}-\${port}&sni=\${domain}#\${flag} \${country} \${org} TROJAN\`;

                const resultText = \`================================\\n\` +
                                   \`VLESS ACCOUNT\\n\` +
                                   \`================================\\n\` +
                                   \`\${vlessLink}\\n\` +
                                   \`================================\\n\\n\` +
                                   \`================================\\n\` +
                                   \`TROJAN ACCOUNT\\n\` +
                                   \`================================\\n\` +
                                   \`\${trojanLink}\\n\` +
                                   \`================================\\n\`;

                output.value = resultText;

                // Generate QR (VLESS as default)
                qrCode.src = \`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(vlessLink)}\`;

            } catch (e) {
                output.value = 'Error generating config: ' + e.message;
            }
        }

        function closeModal() {
            document.getElementById('modal').classList.add('hidden');
        }

        function copyModalClipboard() {
            const copyText = document.getElementById("modal-output");
            copyText.select();
            copyText.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(copyText.value).then(() => {
                alert("Copied to clipboard!");
            });
        }
    </script>
</body>
</html>
`;
