# Pulse — Intelligent Slack Knowledge Base (Hackathon MVP)

AI-powered knowledge layer: upload PDFs/text, ask grounded questions with citations,
summarize documents, auto-tag content, scoped (Personal/Team/Org), with a Slack `/ask` command.

## Stack
- Frontend: React + Vite + Tailwind
- Backend: FastAPI
- AI: Gemini (`google-genai` SDK)
- Vector DB: ChromaDB (local persistent)
- Metadata/History: SQLite
- Slack: Bolt SDK

## Setup

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_real_key

uvicorn main:app --reload --port 8000
```
Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

### 3. Slack bot (optional, for demo)
```bash
cd backend
# In .env add:
# SLACK_BOT_TOKEN=xoxb-...
# SLACK_SIGNING_SECRET=...
# SLACK_APP_TOKEN=xapp-...   (for Socket Mode)
python slack_bot.py
```
Create a Slack app with a `/ask` slash command, enable Socket Mode, and add the
`SLACK_APP_TOKEN` (with `connections:write` scope) to run without a public URL.

## Demo Flow
1. Upload an Employee Handbook PDF (scope: Org) → see auto-generated tags.
2. Go to Ask → "What is the leave policy?" → grounded answer with citation + relevance %.
3. Follow-up: "What about sick leave specifically?" (multi-turn).
4. Knowledge Explorer → click "Summarize" on the document.
5. Slack: run `/ask What is the leave policy?` → same grounded answer in-channel.

## Notes
- Only PDF and pasted-text ingestion are supported (covers "multi content type" criterion with minimal scope).
- Scope filtering: `org` scope sees everything; `personal`/`team` see their own docs + `org` docs.
- If Gemini can't answer from retrieved context, the API returns a "not grounded" flag and the UI shows a "Not in Knowledge Base" badge instead of hallucinating.
