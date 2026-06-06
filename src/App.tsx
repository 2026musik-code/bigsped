/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, Search, BookOpen, Mail, Columns, BrainCircuit,
  TerminalSquare, Settings, Anchor, PanelLeftClose, PanelLeft, Plus, Send, 
  ChevronDown, Hexagon, Database, Paperclip, Globe, Bot, Workflow, Wrench, User
} from "lucide-react";
import Markdown from "react-markdown";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
};

const NAV_ITEMS = [
  { id: "chat", icon: MessageSquare, label: "Chat" },
  { id: "agent", icon: Bot, label: "Agent" },
  { id: "cookbook", icon: BookOpen, label: "Cookbook" },
  { id: "research", icon: Search, label: "Deep Research" },
  { id: "compare", icon: Columns, label: "Compare" },
  { id: "documents", icon: TerminalSquare, label: "Documents" },
  { id: "memory", icon: BrainCircuit, label: "Memory / Skills" },
  { id: "email", icon: Mail, label: "Email" },
  { id: "notes", icon: Workflow, label: "Notes & Tasks" },
  { id: "calendar", icon: Database, label: "Calendar" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: "```text\\n ───────────────────────────────────────────────\\n  ⊹ ࣪ ˖ ૮( ˶ᵔ ᵕ ᵔ˶ )っ  Odysseus vers. 1.0\\n ───────────────────────────────────────────────\\n```\\n\\nWelcome to **Odysseus**. Your private, self-hosted AI workspace is ready.\\n\\nHow can I help you today?",
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      
      const data = await response.json();
      
      if (data.text) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.text
        }]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error.message || "Failed to connect to the local endpoint."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex bg-[#09090b] text-zinc-300 h-screen w-screen overflow-hidden font-sans selection:bg-zinc-800 selection:text-white">
      
      {/* Primary Sidebar (Narrow) */}
      <div className="w-[68px] bg-[#09090b] border-r border-zinc-800/50 flex flex-col items-center py-4 flex-shrink-0 z-20">
        <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center mb-8 shadow-sm">
          <Anchor className="w-6 h-6" strokeWidth={2.5} />
        </div>
        
        <div className="flex flex-col gap-3 flex-1 w-full px-2 mt-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all relative group
                ${activeTab === item.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}
              `}
              title={item.label}
            >
              <item.icon className="w-5 h-5" strokeWidth={activeTab === item.id ? 2.5 : 2} />
              {activeTab === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full px-2 mt-auto">
          <button className="w-full aspect-square rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Secondary Sidebar (History & Context) */}
      {sidebarOpen && activeTab === "chat" && (
        <div className="w-64 bg-[#0f0f12] border-r border-zinc-800/50 flex flex-col flex-shrink-0 z-10 transition-all duration-300">
          <div className="p-4 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-200 text-sm tracking-wide">Conversations</h2>
            <button className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-widest px-2 mb-2 block">Today</span>
            {["System Architecture Design", "Python Web Scraping", "Local LLM Setup Guide"].map((item, i) => (
              <button key={i} className="w-full text-left px-2.5 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg transition-colors truncate">
                {item}
              </button>
            ))}
            
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-widest px-2 mt-6 mb-2 block">Previous 7 Days</span>
            {["Analyzing market data", "React performance fix", "Drafting an email"].map((item, i) => (
              <button key={i} className="w-full text-left px-2.5 py-2 text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors truncate">
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full bg-[#09090b] relative">
        
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-zinc-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md transition-colors"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors">
              <Hexagon className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-zinc-200">Odysseus-v2</span>
              <ChevronDown className="w-4 h-4 text-zinc-500 ml-1" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono px-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Local endpoint connected
            </div>
          </div>
        </header>

        {activeTab !== "chat" ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col gap-4">
            <Anchor className="w-12 h-12 text-zinc-800" />
            <p>Odysseus {NAV_ITEMS.find(n => n.id === activeTab)?.label} workspace module is loading.</p>
          </div>
        ) : (
          <>
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
              <div className="max-w-3xl mx-auto space-y-8 pb-10">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-white shrink-0 flex items-center justify-center shadow-sm">
                        <Anchor className="w-5 h-5 text-black" strokeWidth={2.5} />
                      </div>
                    )}
                    
                    <div className={`max-w-[85%] md:max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-zinc-800/80 text-zinc-200 rounded-2xl rounded-tr-md px-5 py-3 shadow-sm' 
                        : 'text-zinc-300 leading-relaxed min-w-0 font-sans'
                    }`}>
                      {message.role === 'assistant' ? (
                         <div className="prose prose-invert max-w-none prose-p:my-2 prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl prose-pre:my-3 prose-p:leading-relaxed prose-headings:text-zinc-100 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-zinc-200">
                           <Markdown>{message.content}</Markdown>
                         </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-zinc-400" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                   <div className="flex gap-4 justify-start">
                      <div className="w-8 h-8 rounded-lg bg-white shrink-0 flex items-center justify-center shadow-sm">
                        <Anchor className="w-5 h-5 text-black" strokeWidth={2.5} />
                      </div>
                      <div className="px-1 py-2 flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                         <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                         <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                      </div>
                   </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>

            {/* Input Container */}
            <div className="px-4 pb-6 pt-2 shrink-0">
              <div className="max-w-3xl mx-auto">
                <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-2xl shadow-sm focus-within:border-zinc-700 transition-colors flex flex-col">
                  
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Message Odysseus..."
                    className="w-full bg-transparent text-zinc-200 px-4 pt-4 pb-2 max-h-64 min-h-[56px] focus:outline-none resize-none placeholder:text-zinc-600 text-sm md:text-base selection:bg-zinc-700"
                    rows={1}
                  />
                  
                  <div className="flex items-center justify-between px-3 pb-3 pt-1">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors border border-transparent shadow-sm">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors border border-transparent shadow-sm">
                        <Globe className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors border border-transparent shadow-sm ml-2 flex items-center gap-1.5 px-2">
                        <Database className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Memory</span>
                      </button>
                    </div>
                    
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      className={`p-1.5 rounded-lg transition-all flex items-center justify-center
                        ${input.trim() && !isTyping 
                          ? 'bg-white text-black hover:bg-zinc-200 shadow-sm' 
                          : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <span className="text-[11px] text-zinc-600">Odysseus runs locally and does not share your data.</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

