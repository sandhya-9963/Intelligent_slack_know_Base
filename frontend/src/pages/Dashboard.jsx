import React, { useEffect, useState } from "react";
import api from "../api";
import { FileText, Layers, MessageCircle, Tag, Clock } from "lucide-react";

export default function Dashboard({ scope }) {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, historyRes, docsRes] = await Promise.all([
          api.get("/stats"),
          api.get("/history"),
          api.get("/documents"),
        ]);
        setStats(statsRes.data);
        setHistory(historyRes.data.slice(0, 6));
        setDocs(docsRes.data.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    { label: "Documents", value: stats?.total_documents ?? 0, icon: FileText, color: "text-accent" },
    { label: "Chunks indexed", value: stats?.total_chunks ?? 0, icon: Layers, color: "text-accent2" },
    { label: "Questions asked", value: stats?.total_queries ?? 0, icon: MessageCircle, color: "text-amber-400" },
    { label: "Topics tagged", value: stats?.tags?.length ?? 0, icon: Tag, color: "text-pink-400" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-muted text-sm mt-1">
          Viewing as <span className="text-accent2 font-mono">{scope}</span> scope
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-panel border border-line rounded-xl p-4">
            <Icon size={18} className={color} />
            <div className="text-2xl font-display font-bold mt-3">{loading ? "—" : value}</div>
            <div className="text-xs text-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-panel border border-line rounded-xl p-5">
          <h2 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <Clock size={14} className="text-accent" /> Recent Questions
          </h2>
          {history.length === 0 && (
            <p className="text-sm text-muted">No questions asked yet. Head to the Ask page.</p>
          )}
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <div className="text-sm font-medium">{h.query}</div>
                <div className="text-xs text-muted mt-1 line-clamp-2">{h.answer}</div>
                <div className="flex gap-2 mt-1.5">
                  <span className="scope-pill text-muted">{h.scope}</span>
                  {h.citations.length > 0 && (
                    <span className="scope-pill text-accent2 border-accent2/30">
                      {h.citations.length} source{h.citations.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-panel border border-line rounded-xl p-5">
          <h2 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <FileText size={14} className="text-accent" /> Recent Documents
          </h2>
          {docs.length === 0 && (
            <p className="text-sm text-muted">No documents uploaded yet. Head to the Upload page.</p>
          )}
          <div className="space-y-3">
            {docs.map((d) => (
              <div key={d.doc_id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <div className="text-sm font-medium">{d.filename}</div>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <span className="scope-pill text-muted">{d.scope}</span>
                  {d.tags.map((t) => (
                    <span key={t} className="tag-chip">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
