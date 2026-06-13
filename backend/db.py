import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "kb.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            doc_id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            scope TEXT NOT NULL,
            tags TEXT NOT NULL,
            chunks INTEGER NOT NULL,
            uploaded_at TEXT NOT NULL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT NOT NULL,
            answer TEXT NOT NULL,
            scope TEXT NOT NULL,
            citations TEXT NOT NULL,
            source TEXT DEFAULT 'web',
            timestamp TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def add_document(doc_id, filename, scope, tags, chunks):
    conn = get_conn()
    conn.execute(
        "INSERT INTO documents (doc_id, filename, scope, tags, chunks, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)",
        (doc_id, filename, scope, json.dumps(tags), chunks, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def get_documents():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM documents ORDER BY uploaded_at DESC").fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["tags"] = json.loads(d["tags"])
        result.append(d)
    return result


def get_all_tags():
    conn = get_conn()
    rows = conn.execute("SELECT tags FROM documents").fetchall()
    conn.close()
    tag_set = set()
    for r in rows:
        for t in json.loads(r["tags"]):
            tag_set.add(t)
    return sorted(tag_set)


def add_history(query, answer, scope, citations, source="web"):
    conn = get_conn()
    conn.execute(
        "INSERT INTO history (query, answer, scope, citations, source, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
        (query, answer, scope, json.dumps(citations), source, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def get_history(limit=50):
    conn = get_conn()
    rows = conn.execute("SELECT * FROM history ORDER BY timestamp DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["citations"] = json.loads(d["citations"])
        result.append(d)
    return result


def get_document_by_id(doc_id):
    conn = get_conn()
    row = conn.execute("SELECT * FROM documents WHERE doc_id = ?", (doc_id,)).fetchone()
    conn.close()
    if row:
        d = dict(row)
        d["tags"] = json.loads(d["tags"])
        return d
    return None
