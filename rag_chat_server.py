"""Tiny HTML chatbot server for the RAG pipeline.

Run:
    python rag_chat_server.py

Then open:
    http://localhost:8000
"""

from __future__ import annotations

import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import unquote

HOST = "127.0.0.1"
PORT = 8000
WEB_DIR = Path(__file__).parent / "web"


def build_contextual_query(question: str, history: list[dict[str, Any]]) -> str:
    """Add recent turns so short follow-up questions can be resolved by the LLM."""
    recent_turns: list[str] = []
    for message in history[-6:]:
        role = "Nguoi dung" if message.get("role") == "user" else "Tro ly"
        content = str(message.get("content") or "").strip()
        if content:
            recent_turns.append(f"{role}: {content}")

    if not recent_turns:
        return question

    return (
        "Cuoc hoi thoai gan day:\n"
        + "\n".join(recent_turns)
        + "\n\nHay tra loi cau hoi hien tai dua tren ngu canh neu day la cau hoi follow-up. "
        + f"Cau hoi hien tai: {question}"
    )


def slim_source(source: dict[str, Any]) -> dict[str, Any]:
    metadata = dict(source.get("metadata") or {})
    return {
        "content": str(source.get("content") or ""),
        "score": float(source.get("score") or 0.0),
        "source": str(source.get("source") or "hybrid"),
        "metadata": {
            "title": str(metadata.get("title") or metadata.get("source") or "Source"),
            "source": str(metadata.get("source") or metadata.get("title") or "Source"),
            "source_path": str(metadata.get("source_path") or ""),
            "type": str(metadata.get("type") or "unknown"),
        },
    }


class ChatHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        path = unquote(self.path.split("?", 1)[0])
        if path == "/":
            path = "/index.html"

        file_path = (WEB_DIR / path.lstrip("/")).resolve()
        if not str(file_path).startswith(str(WEB_DIR.resolve())) or not file_path.is_file():
            self.send_error(404, "Not found")
            return

        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/api/chat":
            self.send_error(404, "Not found")
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            question = str(payload.get("question") or "").strip()
            history = payload.get("history") or []
            top_k = int(payload.get("top_k") or 5)
            if not question:
                raise ValueError("Question is required.")

            from src.task10_generation import generate_with_citation

            result = generate_with_citation(
                build_contextual_query(question, history),
                top_k=max(3, min(top_k, 8)),
            )
            response = {
                "answer": str(result.get("answer") or "").strip()
                or "Toi khong the xac minh thong tin nay tu nguon hien co.",
                "retrieval_source": str(result.get("retrieval_source") or "unknown"),
                "sources": [slim_source(item) for item in list(result.get("sources") or [])],
            }
            self.write_json(200, response)
        except Exception as exc:  # Keep the demo UI alive if a model/service is missing.
            self.write_json(
                500,
                {
                    "answer": (
                        "Chua tao duoc cau tra loi vi pipeline dang loi hoac LLM chua chay. "
                        f"Chi tiet: {exc}"
                    ),
                    "retrieval_source": "error",
                    "sources": [],
                },
            )

    def write_json(self, status: int, payload: dict[str, Any]) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[web] {self.address_string()} - {format % args}")


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), ChatHandler)
    print(f"RAG chatbot HTML server: http://localhost:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
