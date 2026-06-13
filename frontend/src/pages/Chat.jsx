import React, { useState, useRef, useEffect } from "react";
import api from "../api";
import ChatMessage from "../components/ChatMessage.jsx";
import { Send, Loader2, Sparkles } from "lucide-react";

const SUGGESTED = [
  "What is the leave policy?",
  "Summarize the employee handbook",
  "What are the working hours?",
];

export default function Chat({ scope }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;

    const userMsg = { role: "user", content: query };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat", {
        query,
        scope,
        history: newMessages.map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages([
        ...newMessages,
        {
          role: "ai",
          content: res.data.answer,
          citations: res.data.citations,
          grounded: res.data.grounded,
        },
      ]);
    } catch (e) {
      setMessages([
        ...newMessages,
        { role: "ai", content: "Something went wrong reaching the knowledge base. Is the backend running?", citations: [], grounded: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <div className="px-8 pt-8 pb-4">
        <h1 className="font-display text-2xl font-bold">Ask the Knowledge Base</h1>
        <p className="text-muted text-sm mt-1">
          Querying <span className="text-accent2 font-mono">{scope}</span> scope — answers are grounded in your uploaded documents
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles size={28} className="text-accent mb-3" />
            <p className="text-sm text-muted mb-4">Ask anything about your uploaded documents</p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-sm px-4 py-2.5 rounded-lg border border-line bg-panel hover:border-accent/40 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role} content={m.content} citations={m.citations} grounded={m.grounded ?? true} />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
              <Loader2 size={14} className="text-accent animate-spin" />
            </div>
            <div className="bg-panel border border-line rounded-xl px-4 py-3 text-sm text-muted">
              Searching knowledge base...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-8 pb-8 pt-2">
        <div className="flex gap-2 bg-panel border border-line rounded-xl p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm px-3 py-2 placeholder:text-muted"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="bg-accent hover:bg-accent/90 disabled:opacity-40 text-white rounded-lg px-4 flex items-center justify-center transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
