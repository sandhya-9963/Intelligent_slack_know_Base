import React from "react";
import { Bot, User, FileText, AlertTriangle } from "lucide-react";

export default function ChatMessage({ role, content, citations = [], grounded = true }) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
          <Bot size={14} className="text-accent" />
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? "order-1" : ""}`}>
        <div
          className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-accent text-white"
              : "bg-panel border border-line text-white"
          }`}
        >
          {!isUser && !grounded && (
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium mb-2">
              <AlertTriangle size={12} /> Not in Knowledge Base
            </div>
          )}
          <p className="whitespace-pre-wrap">{content}</p>
        </div>

        {citations.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {citations.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-ink border border-line rounded-lg px-3 py-2 text-xs"
              >
                <FileText size={12} className="text-accent2 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-accent2">{c.filename}</span>
                    <span className="text-muted shrink-0">{c.relevance}% match</span>
                  </div>
                  <p className="text-muted mt-1 line-clamp-2">{c.snippet}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-line flex items-center justify-center shrink-0">
          <User size={14} className="text-muted" />
        </div>
      )}
    </div>
  );
}
