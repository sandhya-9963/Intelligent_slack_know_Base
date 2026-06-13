import os
from google import genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
_client = genai.Client(api_key=GEMINI_API_KEY)

MODEL = "gemini-1.5-flash"


def _generate(prompt: str) -> str:
    response = _client.models.generate_content(model=MODEL, contents=prompt)
    return (response.text or "").strip()


def answer_question(query: str, context_chunks, history_text: str = "") -> dict:
    """
    context_chunks: list of (chunk_text, metadata, distance)
    Returns dict with 'answer' and 'grounded' (bool).
    """
    if not context_chunks:
        return {
            "answer": "I don't have any documents in the knowledge base yet to answer that question.",
            "grounded": False
        }

    context_blocks = []
    for chunk, meta, dist in context_chunks:
        context_blocks.append(f"[Source: {meta['filename']}]\n{chunk}")
    context = "\n\n---\n\n".join(context_blocks)

    prompt = f"""You are an internal company knowledge base assistant.
Answer the user's question using ONLY the information in the context below.
If the context does not contain enough information to answer, respond EXACTLY with:
"I don't have information about that in the knowledge base."

Do not use outside knowledge. Be concise (2-5 sentences). Mention which source document(s) support your answer.

Context:
{context}

Previous conversation:
{history_text if history_text else "(none)"}

Question: {query}

Answer:"""

    answer_text = _generate(prompt)
    grounded = "don't have information" not in answer_text.lower()
    return {"answer": answer_text, "grounded": grounded}


def summarize_text(text: str) -> str:
    truncated = text[:15000]
    prompt = f"""Summarize the following document in 5-7 concise bullet points.
Cover the key topics, important rules/numbers, and any action items.

Document:
{truncated}

Summary (bullet points):"""
    return _generate(prompt)


def generate_tags(text: str) -> list:
    truncated = text[:5000]
    prompt = f"""Read the following document excerpt and generate 3 to 5 short topic tags
that describe its content (e.g. "HR Policy", "Leave Policy", "Onboarding", "Finance").

Return ONLY a comma-separated list of tags. No numbering, no explanation, no extra text.

Document:
{truncated}

Tags:"""
    raw = _generate(prompt)
    tags = [t.strip().strip('"').strip("'") for t in raw.split(",")]
    tags = [t for t in tags if t and len(t) < 40]
    return tags[:5]
