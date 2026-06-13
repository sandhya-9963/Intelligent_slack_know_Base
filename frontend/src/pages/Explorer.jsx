import React, { useEffect, useState } from "react";
import api from "../api";
import DocCard from "../components/DocCard.jsx";
import { X, Library } from "lucide-react";

export default function Explorer({ scope }) {
  const [docs, setDocs] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summarizingId, setSummarizingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [docsRes, tagsRes] = await Promise.all([api.get("/documents"), api.get("/tags")]);
    setDocs(docsRes.data);
    setTags(tagsRes.data);
  };

  const handleSummarize = async (doc) => {
    setSummarizingId(doc.doc_id);
    try {
      const res = await api.post("/summarize", { doc_id: doc.doc_id });
      setSummary(res.data);
    } catch (e) {
      setSummary({ filename: doc.filename, summary: "Could not generate summary." });
    } finally {
      setSummarizingId(null);
    }
  };

  const filtered = docs.filter((d) => {
    if (activeTag && !d.tags.includes(activeTag)) return false;
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Knowledge Explorer</h1>
          <p className="text-muted text-sm mt-1">Browse all indexed documents across scopes</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setActiveTag(null)}
          className={`tag-chip ${!activeTag ? "bg-accent/20 text-accent border-accent/40" : ""}`}
        >
          All
        </button>
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTag(t)}
            className={`tag-chip ${activeTag === t ? "bg-accent/20 text-accent border-accent/40" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Library size={28} className="text-muted mb-3" />
          <p className="text-sm text-muted">No documents found. Upload something to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <DocCard
              key={doc.doc_id}
              doc={doc}
              onSummarize={handleSummarize}
              summarizing={summarizingId === doc.doc_id}
            />
          ))}
        </div>
      )}

      {summary && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className="bg-panel border border-line rounded-xl max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-muted font-mono">Summary</div>
                <h3 className="font-display font-semibold text-base mt-1">{summary.filename}</h3>
              </div>
              <button onClick={() => setSummary(null)} className="text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {summary.summary}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
