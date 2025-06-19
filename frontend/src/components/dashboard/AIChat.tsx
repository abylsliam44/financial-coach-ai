import { useEffect, useRef, useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "../ui/button";

interface Message {
  role: "user" | "ai";
  text: string;
  time: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Привет! Я ваш ИИ-помощник по финансам. Задайте вопрос или расскажите о своих целях!",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((msgs) => [
      ...msgs,
      { role: "user", text: input, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setLoading(true);
    setError("");
    const userMessage = input;
    setInput("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/coach/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMessage }),
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        setError("Ваша сессия истекла. Пожалуйста, войдите снова.");
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 2000);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      console.log("AI Response:", data);
      let aiText = data.advice || data.reply || data.message || data.answer || data.text || data.response;
      if (!aiText) {
        aiText = `[Нет ответа от ИИ]\n${JSON.stringify(data, null, 2)}`;
      }
      setMessages((msgs) => [
        ...msgs,
        { role: "ai", text: aiText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
    } catch (e: any) {
      setError(e.message || "Ошибка ответа ИИ");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      sendMessage();
    }
  };

  return (
    <aside className="w-[320px] flex flex-col border-l border-gray-100 bg-white min-h-screen">
      <div className="flex items-center gap-2 p-4 border-b border-gray-100">
        <Bot className="w-6 h-6 text-emerald-500" />
        <span className="font-bold text-lg text-gray-900">ИИ-Чат</span>
      </div>
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] flex flex-col ${msg.role === "ai" ? "items-start" : "items-end"}`}>
              <div className={`flex items-center gap-2 mb-1 ${msg.role === "ai" ? "" : "flex-row-reverse"}`}>
                {msg.role === "ai" ? <Bot className="w-5 h-5 text-emerald-500" /> : <User className="w-5 h-5 text-gray-400" />}
                <span className={`text-xs ${msg.role === "ai" ? "text-gray-500" : "text-emerald-500"}`}>{msg.role === "ai" ? "ИИ" : "Вы"}</span>
              </div>
              <div className={`rounded-xl px-4 py-2 text-xs ${msg.role === "ai" ? "bg-gray-100 text-gray-900" : "bg-emerald-500 text-white"}`}>{msg.text}</div>
              <span className="text-[10px] text-gray-400 mt-1">{msg.time}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span className="text-xs text-gray-500">ИИ</span>
              </div>
              <div className="rounded-xl px-4 py-2 text-xs bg-gray-100 text-gray-900 animate-pulse">...</div>
            </div>
          </div>
        )}
        {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
      </div>
      <form className="p-4 border-t border-gray-100 flex gap-2 bg-white" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          placeholder="Спросите о ваших финансах..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <Button type="submit" className="rounded-xl px-4 py-2" disabled={loading || !input.trim()}><Send className="w-5 h-5" /></Button>
      </form>
    </aside>
  );
} 