import os
import uuid
import shutil
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import db
import rag
import gemini_client

# --- App setup ---
app = FastAPI(title="Intelligent Knowledge Base API")
@app.on_event("startup")
def startup():
    print("ROUTES LOADED:")
    for r in app.routes:
        print(r.path)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

db.init_db()


# --- Pydantic models ---
class ChatRequest(BaseModel):
    query: str
    scope: str = "org"
    history: list = []


class SummarizeRequest(BaseModel):
    doc_id: str


class TextUploadRequest(BaseModel):
    text: str
    title: str = "Pasted Text"
    scope: str = "org"


# --- Endpoints ---

@app.get("/")
def root():
    return {"status": "ok", "service": "Intelligent Knowledge Base API"}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...), scope: str = Form("org")):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, safe_filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Extract text
    text = rag.extract_text_from_pdf(filepath)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF (possibly scanned/image-based).")

    # Chunk + embed + store
    num_chunks = rag.ingest_text(text, doc_id, file.filename, scope)

    # Auto-tag
    try:
        tags = gemini_client.generate_tags(text)
    except Exception:
        tags = ["Untagged"]

    db.add_document(doc_id, file.filename, scope, tags, num_chunks)

    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "scope": scope,
        "tags": tags,
        "chunks": num_chunks
    }


@app.post("/upload-text")
async def upload_text(payload: TextUploadRequest):
    """Bonus endpoint: ingest raw pasted text (multi-content-type support)."""
    doc_id = str(uuid.uuid4())
    filename = payload.title or "Pasted Text"

    num_chunks = rag.ingest_text(payload.text, doc_id, filename, payload.scope)
    if num_chunks == 0:
        raise HTTPException(status_code=400, detail="No text provided.")

    try:
        tags = gemini_client.generate_tags(payload.text)
    except Exception:
        tags = ["Untagged"]

    db.add_document(doc_id, filename, payload.scope, tags, num_chunks)

    return {
        "doc_id": doc_id,
        "filename": filename,
        "scope": payload.scope,
        "tags": tags,
        "chunks": num_chunks
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # Build short history string for multi-turn context
    history_text = ""
    for msg in request.history[-6:]:  # last 3 exchanges
        role = "User" if msg.get("role") == "user" else "Assistant"
        history_text += f"{role}: {msg.get('content', '')}\n"

    # Retrieve relevant chunks
    chunks = rag.query_chunks(request.query, request.scope, n_results=4)

    # Generate answer
    result = gemini_client.answer_question(request.query, chunks, history_text)

    # Build citations with relevance score
    citations = []
    for chunk_text, meta, distance in chunks:
        relevance = max(0, round((1 - distance) * 100))
        citations.append({
            "doc_id": meta["doc_id"],
            "filename": meta["filename"],
            "snippet": chunk_text[:200] + ("..." if len(chunk_text) > 200 else ""),
            "relevance": relevance
        })

    # Don't show citations if answer wasn't grounded
    if not result["grounded"]:
        citations = []

    db.add_history(request.query, result["answer"], request.scope, citations, source="web")

    return {
        "answer": result["answer"],
        "citations": citations,
        "grounded": result["grounded"]
    }


@app.post("/summarize")
async def summarize(request: SummarizeRequest):
    doc = db.get_document_by_id(request.doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    chunks = rag.get_doc_chunks(request.doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="No content found for this document.")

    full_text = "\n\n".join(chunks)
    summary = gemini_client.summarize_text(full_text)

    return {"doc_id": request.doc_id, "filename": doc["filename"], "summary": summary}


@app.get("/documents")
async def list_documents():
    return db.get_documents()


@app.get("/tags")
async def list_tags():
    return db.get_all_tags()


@app.get("/history")
async def list_history():
    return db.get_history()


@app.get("/stats")
async def stats():
    docs = db.get_documents()
    history = db.get_history()
    total_chunks = sum(d["chunks"] for d in docs)
    return {
        "total_documents": len(docs),
        "total_chunks": total_chunks,
        "total_queries": len(history),
        "tags": db.get_all_tags()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
