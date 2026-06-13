import os
import chromadb
from chromadb import Documents, EmbeddingFunction, Embeddings
from pypdf import PdfReader
from google import genai
from google.genai import types

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

_genai_client = genai.Client(api_key=GEMINI_API_KEY)


class GeminiEmbeddingFunction(EmbeddingFunction):
    """Custom ChromaDB embedding function using google-genai's embed_content."""

    def __call__(self, input: Documents) -> Embeddings:
        result = _genai_client.models.embed_content(
            model="text-embedding-004",
            contents=input,
            config=types.EmbedContentConfig(output_dimensionality=768),
        )
        return [e.values for e in result.embeddings]


# --- Vector store setup ---
chroma_client = chromadb.PersistentClient(path=os.path.join(os.path.dirname(__file__), "chroma_db"))

embed_fn = GeminiEmbeddingFunction()

collection = chroma_client.get_or_create_collection(
    name="knowledge_base",
    embedding_function=embed_fn
)


def extract_text_from_pdf(filepath: str) -> str:
    reader = PdfReader(filepath)
    text_parts = []
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text_parts.append(extracted)
    return "\n".join(text_parts)


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100):
    """Simple sliding-window character chunker."""
    text = text.strip()
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def ingest_text(text: str, doc_id: str, filename: str, scope: str) -> int:
    """Chunk text, embed, and store in ChromaDB. Returns number of chunks."""
    chunks = chunk_text(text)
    if not chunks:
        return 0

    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "filename": filename, "scope": scope} for _ in chunks]

    # Gemini's embed API has a limit (~100 texts per call) — batch manually.
    BATCH = 90
    for i in range(0, len(chunks), BATCH):
        collection.add(
            documents=chunks[i:i + BATCH],
            ids=ids[i:i + BATCH],
            metadatas=metadatas[i:i + BATCH],
        )

    return len(chunks)


def query_chunks(query: str, scope: str, n_results: int = 4):
    """Retrieve relevant chunks. Org docs are visible to everyone; scope-specific
    docs are visible to that scope only."""
    if scope == "org":
        where_filter = None  # org users see everything for demo simplicity
    else:
        where_filter = {"scope": {"$in": [scope, "org"]}}

    if collection.count() == 0:
        return []

    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, collection.count()),
        where=where_filter
    )

    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    return list(zip(docs, metas, distances))


def get_doc_chunks(doc_id: str):
    results = collection.get(where={"doc_id": doc_id})
    return results.get("documents", [])


def delete_document_chunks(doc_id: str):
    collection.delete(where={"doc_id": doc_id})
