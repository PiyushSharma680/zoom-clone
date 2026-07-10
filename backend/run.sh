#!/usr/bin/env bash
# Convenience script: set up the backend and start the API server.
set -e

python -m venv .venv 2>/dev/null || true
source .venv/bin/activate

pip install -r requirements.txt

# Seed the database (creates zoom_clone.db with a default user + sample meetings).
python -m app.seed

# Start the FastAPI server with hot reload.
uvicorn app.main:app --reload --port 8000
