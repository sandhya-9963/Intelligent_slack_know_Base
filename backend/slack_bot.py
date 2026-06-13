"""
Slack Bolt app exposing a /ask slash command that queries the
Intelligent Knowledge Base backend (FastAPI service running on :8000).

Run separately from main.py:
    python slack_bot.py

Requires SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET in .env,
and the FastAPI backend running locally on port 8000.

For local testing, expose this with ngrok and point your Slack app's
slash command request URL to: https://<ngrok-url>/slack/events
"""

import os
import requests
from dotenv import load_dotenv
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler

load_dotenv()

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

app = App(
    token=os.environ.get("SLACK_BOT_TOKEN"),
    signing_secret=os.environ.get("SLACK_SIGNING_SECRET"),
)


@app.command("/ask")
def handle_ask_command(ack, respond, command):
    ack()  # acknowledge within 3 seconds

    query = command.get("text", "").strip()
    if not query:
        respond("Please provide a question. Usage: `/ask What is the leave policy?`")
        return

    respond(f"🔍 Searching the knowledge base for: *{query}*...")

    try:
        resp = requests.post(
            f"{BACKEND_URL}/chat",
            json={"query": query, "scope": "org", "history": []},
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()

        answer = data.get("answer", "No answer returned.")
        citations = data.get("citations", [])

        text = f"*Question:* {query}\n\n*Answer:* {answer}"

        if citations:
            sources = "\n".join(
                f"• {c['filename']} (relevance: {c['relevance']}%)" for c in citations
            )
            text += f"\n\n*Sources:*\n{sources}"

        respond(text)

    except requests.exceptions.RequestException as e:
        respond(f"⚠️ Could not reach the knowledge base backend: {e}")


@app.command("/summarize-kb")
def handle_summarize_command(ack, respond, command):
    ack()
    respond(
        "To summarize a document, use the web dashboard's Knowledge Explorer "
        "and click 'Summarize' on the document you want."
    )


if __name__ == "__main__":
    # Socket Mode requires SLACK_APP_TOKEN (xapp-...) with connections:write scope
    app_token = os.environ.get("SLACK_APP_TOKEN")
    if app_token:
        handler = SocketModeHandler(app, app_token)
        print("Starting Slack bot in Socket Mode...")
        handler.start()
    else:
        print("SLACK_APP_TOKEN not set. Run with a public HTTP endpoint + Slack Events API instead,")
        print("or set SLACK_APP_TOKEN for Socket Mode (recommended for hackathon demos).")
