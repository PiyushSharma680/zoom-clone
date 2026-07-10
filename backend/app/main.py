"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import auth, meetings, signaling

# Create tables on startup (simple approach for a SQLite demo project).
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zoom Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(meetings.router)
app.include_router(signaling.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "Zoom Clone API", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
