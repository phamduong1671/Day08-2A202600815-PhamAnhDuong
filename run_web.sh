#!/usr/bin/env bash
# Launch the RAG chatbot web UI with the project virtualenv.
#
#   ./run_web.sh
#
# Then open http://localhost:8000
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -x ".venv/bin/python" ]; then
  echo "Error: .venv not found. Create it and install dependencies first:" >&2
  echo "  python3.11 -m venv .venv" >&2
  echo "  .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

exec .venv/bin/python rag_chat_server.py
