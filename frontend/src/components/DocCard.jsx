import React from "react";
import { FileText, Layers, Sparkles, Loader2 } from "lucide-react";

export default function DocCard({ doc, onSummarize, summarizing }) {
  return (
    <div className="bg-panel border border-line rounded-xl p-4 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
          <FileText size={16} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{doc.filename}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="scope-pill text-muted">{doc.scope}</span>
            <span className="text-xs text-muted flex items-center gap-1">
              <Layers size={11} /> {doc.chunks} chunks
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-3">
        {doc.tags.map((t) => (
          <span key={t} className="tag-chip">{t}</span>
        ))}
      </div>

      <button
        onClick={() => onSummarize(doc)}
        disabled={summarizing}
        className="mt-auto text-xs font-medium text-accent hover:text-accent2 transition-colors flex items-center gap-1.5 disabled:opacity-50"
      >
        {summarizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
        {summarizing ? "Summarizing..." : "Summarize"}
      </button>
    </div>
  );
}
