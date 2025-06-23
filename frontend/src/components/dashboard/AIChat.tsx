import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: number;
  role: "user" | "ai";
  content: string;
}

const initialMessage: Message = {
  id: 0,
  role: 'ai',
  content: "Привет! Я — BaiAI, ваш личный финансовый коуч. Чем могу помочь сегодня?"
};

const streamAIResponse = async (userMessageContent: string, onChunk: (chunk: string) => void) => {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/coach/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ message: userMessageContent })
  });
  if (!response.body) throw new Error("Нет ответа от сервера");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let fullText = "";
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      const chunk = decoder.decode(value);
      fullText += chunk;
      onChunk(fullText);
    }
  }
};

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat from localStorage on mount
  useEffect(() => {
    try {
      const storedChat = localStorage.getItem('bai-chat');
      if (storedChat) {
        const storedMessages: Message[] = JSON.parse(storedChat);
        setMessages(storedMessages);
      }
    } catch (e) {
      console.error("Failed to load chat from localStorage", e);
    }
  }, []);

  // Save chat to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 1) { // Don't save initial state
      try {
        localStorage.setItem('bai-chat', JSON.stringify(messages));
      } catch (e) {
        console.error("Failed to save chat to localStorage", e);
      }
    }
  }, [messages]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleClearChat = () => {
    localStorage.removeItem('bai-chat');
    setMessages([initialMessage]);
  };
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    const userMessageContent = input;
    const newUserMessage: Message = { id: Date.now(), role: "user", content: userMessageContent };
    const tempAiMessageId = Date.now() + 1;
    const newAiMessage: Message = { id: tempAiMessageId, role: "ai", content: "" };
    setMessages(prev => [...prev, newUserMessage, newAiMessage]);
    setInput("");
    try {
      await streamAIResponse(userMessageContent, (partial) => {
        setMessages(prev => prev.map(msg => msg.id === tempAiMessageId ? { ...msg, content: partial } : msg));
      });
    } catch (e: any) {
      setError(e.message || "Произошла неизвестная ошибка");
      setMessages(prev => prev.filter(msg => msg.id !== tempAiMessageId));
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-[320px] flex flex-col border-l border-gray-100 bg-white h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-emerald-500" />
          <span className="font-bold text-lg text-gray-900">BaiAI</span>
        </div>
        <Button onClick={handleClearChat} variant="ghost" className="p-2">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages (отдельный скролл) */}
      <div className="flex-1 min-h-0">
        <div className="overflow-y-auto h-full max-h-[calc(100vh-180px)] p-4 space-y-4" style={{scrollbarGutter:'stable'}}>
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="shrink-0 pt-1">
                {msg.role === "ai" ? (
                  <Bot className="w-5 h-5 text-emerald-500" />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className={`rounded-xl px-4 py-2 text-sm flex-1 ${
                msg.role === "ai" 
                  ? "bg-gray-50 text-gray-800" 
                  : "bg-emerald-500 text-white"
              }`}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  }}
                >
                  {msg.content || (msg.role === 'ai' ? '...' : '')}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !loading) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={"Спросите что-нибудь..."}
            disabled={loading}
            className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    </aside>
  );
} 