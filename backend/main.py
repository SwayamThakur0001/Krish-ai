import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Header, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from config import settings
from database import db
from gateway import gateway
from models import (
    ChatMetadata,
    ChatRequest,
    ChatResponse,
    HealthResponse,
    SessionHistoryResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
  # Initialize SQLite database schema on startup
  db.init_db()
  yield


app = FastAPI(
    title="Krish AI - Resilient LLM Gateway",
    description="LLM Chatbot with Key Failover and Response Caching",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler to guarantee no unhandled 500 stack traces or HTML leak
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
  if isinstance(exc, (HTTPException, StarletteHTTPException)):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
  return JSONResponse(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      content={"detail": "An unexpected error occurred"},
  )


# --- API Endpoints ---


@app.get("/")
async def root():
  """Root endpoint returning basic service info."""
  return {
      "status": "ok",
      "name": "Krish AI - Resilient LLM Gateway",
      "version": "1.0.0",
      "endpoints": ["/health", "/chat", "/sessions/{session_id}/messages"],
  }


@app.get("/health", response_model=HealthResponse)
async def health_check():
  """Returns 200 once app is running, DB reachable and key pool loaded."""
  if not db.check_health():
    raise HTTPException(status_code=503, detail="database unreachable")

  return HealthResponse(
      status="ok",
      keys_configured=len(settings.api_keys),
      cache_enabled=True,
  )


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    req: ChatRequest,
    x_simulate_failure: Optional[str] = Header(None, alias="X-Simulate-Failure"),
):
  """Chat endpoint with multi-turn history, key failover, and LiteLLM response caching."""
  # 1. Fetch current session history from SQLite
  history = db.get_session_history(req.session_id)

  # 2. Process inference through gateway (handles caching & key failover)
  # If every key fails (503), it raises HTTPException and does NOT add to database
  result = gateway.process_chat(
      session_id=req.session_id,
      history=history,
      message=req.message,
      system_prompt=req.system_prompt,
      simulate_failure_header=x_simulate_failure,
  )

  # 3. Request succeeded! Persist user and assistant messages in SQLite
  db.add_message(
      session_id=req.session_id,
      role="user",
      content=req.message,
  )

  assistant_metadata = {
      "resolution_source": result["resolution_source"],
      "input_tokens": result["input_tokens"],
      "output_tokens": result["output_tokens"],
  }
  db.add_message(
      session_id=req.session_id,
      role="assistant",
      content=result["reply"],
      metadata=assistant_metadata,
  )

  # 4. Return exact response format required by API contract
  return ChatResponse(
      session_id=req.session_id,
      reply=result["reply"],
      metadata=ChatMetadata(
          resolution_source=result["resolution_source"],
          model=result["model"],
          latency_ms=result["latency_ms"],
          input_tokens=result["input_tokens"],
          output_tokens=result["output_tokens"],
          key_id=result["key_id"],
          fallback_attempts=result["fallback_attempts"],
      ),
  )


@app.get("/sessions/{session_id}/messages", response_model=SessionHistoryResponse)
async def get_session_messages(session_id: str):
  """Returns stored history of one session from SQLite, oldest first, without system prompt."""
  if not db.session_exists(session_id):
    raise HTTPException(status_code=404, detail="session not found")

  history = db.get_session_history(session_id)
  return SessionHistoryResponse(session_id=session_id, messages=history)


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
  """Deletes stored history for a session from SQLite."""
  db.delete_session(session_id)
  return {"status": "ok", "message": f"Session {session_id} deleted"}


if __name__ == "__main__":
  import uvicorn

  uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
