# Krish AI - Full-Stack LLM Chatbot with Key Failover and Response Caching

A production-grade, resilient AI chatbot built with **React** (frontend), **Python FastAPI** (backend), and **SQLite** for persistent storage. Powered by a **LiteLLM gateway** featuring automatic multi-key failover, deterministic response caching, per-request token tracking, and simulation hooks.

---

## 1. Repository & Local Endpoints

- **Frontend Application (Local)**: `http://localhost:3000`
- **Backend API (Local)**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **GitHub Repository**: `https://github.com/SwayamThakur0001/Krish-ai`

---

## 2. Run locally: with Docker and without

### Option A: With Docker (Mandatory Single-Command Setup)

The entire full-stack application (frontend, backend, and persistent SQLite volume) starts with a single command:

```bash
# Clone the repository
git clone https://github.com/SwayamThakur0001/Krish-ai.git
cd Krish-ai

# Copy environment variables template
cp .env.example .env

# Start the stack (Backend on :8000, Frontend on :3000)
make up
```

- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

To stop the containers:
```bash
make down
```

---

### Option B: Without Docker (Manual Local Setup)

#### 1. Backend Setup (FastAPI + LiteLLM)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Linux/macOS:
source venv/bin/activate
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp ../.env.example ../.env

# Start backend server on port 8000
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup (React + Vite)

In a separate terminal:
```bash
cd frontend

# Install packages
npm install

# Run Vite development server on port 3000
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

#### 3. Run Backend Automated Test Suite

```bash
# From repository root or backend folder
python -m pytest backend/tests/test_api.py -v
```

---

## 3. Design decisions: key fallback, caching, SQLite session storage

### 1. Key Fallback & Resilience Architecture
- **Key Pool**: Configured through `LLM_API_KEYS` as an ordered pool (`key_1`, `key_2`, ...). Each key can either point to the same model (e.g. multiple Gemini keys) or heterogeneous models (e.g. `gemini/gemini-2.0-flash` and `groq/llama-3.3-70b-versatile`).
- **Automatic Fallback**: If `key_1` encounters HTTP 429 (rate limit), quota exhaustion, 5xx server errors, or transient connection failures, the gateway catches the exception, increments `fallback_attempts`, and automatically retries the request using `key_2`.
- **Failover Test Hook (`X-Simulate-Failure`)**: Fully implemented in accordance with Section 4. When `ENABLE_FAILURE_SIMULATION=true`, the backend intercepts headers such as `X-Simulate-Failure: key_1=429` or `*=429` without making wasteful calls to upstream providers.
- **Fail-Closed Safety**: If every key in the pool fails or all keys are simulated to fail, the backend returns HTTP 503 `{"detail": "all providers unavailable"}` and **does not write any records to SQLite**.

### 2. Response Caching Mechanics
- **LiteLLM Native Integration**: Uses LiteLLM's built-in local cache (`litellm.caching.Cache(type="local")`).
- **Deterministic Cache Key**: Computed as SHA-256 of `model + normalized message history (system prompt + past user/assistant turns + current user message)`.
- **Cache Hit Guarantees**:
  - The same first message sent in a new session returns `resolution_source: "LLM_CACHE"`.
  - The reply text, `input_tokens`, and `output_tokens` are identical to the cached generation.
  - `key_id` is returned as `null` on cache hits.
  - `fallback_attempts` is `0` on cache hits.
  - Cache hits execute in ~1–3 ms, orders of magnitude faster than live inference.
  - A different message or altered conversation context generates a distinct SHA-256 key and never hits cache.

### 3. SQLite Session Storage
- **Schema**: Adheres strictly to the specification:
  ```sql
  CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    metadata TEXT, -- JSON string, assistant messages only
    created_at TEXT NOT NULL -- server time, ISO-8601
  );
  CREATE INDEX idx_messages_session_id ON messages(session_id, id ASC);
  ```
- **Data Persistence**: In Docker, SQLite resides under `/data/app.db` on a named Docker volume (`lyftr_sqlite_data`), persisting across container restarts.
- **Multi-turn Context**: When `/chat` is invoked, previous messages for `session_id` are loaded in chronological order (`ORDER BY id ASC`) and prepended to the current turn before calling LiteLLM.
- **Session History Endpoint**: `GET /sessions/{session_id}/messages` returns stored messages without the system prompt. If `session_id` is unknown, it returns HTTP 404 `{"detail": "session not found"}`.

---

## 4. Verification: how to see failover, cache hits and per-message token usage

You can verify all features using `curl` or directly in the UI:

### 1. Verification of Health Check
```bash
curl -X GET http://localhost:8000/health
```
**Response:**
```json
{ "status": "ok", "keys_configured": 2, "cache_enabled": true }
```

---

### 2. Verification of Live Inference (`LIVE_INFERENCE`)
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "s-test-01", "message": "What is the capital of France?"}'
```
**Response:**
```json
{
  "session_id": "s-test-01",
  "reply": "The capital of France is Paris.",
  "metadata": {
    "resolution_source": "LIVE_INFERENCE",
    "model": "gemini/gemini-2.0-flash",
    "latency_ms": 684,
    "input_tokens": 42,
    "output_tokens": 9,
    "key_id": "key_1",
    "fallback_attempts": 0
  }
}
```

---

### 3. Verification of Cache Hit (`LLM_CACHE`)
Send the same message in a new session:
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "s-test-02", "message": "What is the capital of France?"}'
```
**Response:**
```json
{
  "session_id": "s-test-02",
  "reply": "The capital of France is Paris.",
  "metadata": {
    "resolution_source": "LLM_CACHE",
    "model": "gemini/gemini-2.0-flash",
    "latency_ms": 2,
    "input_tokens": 42,
    "output_tokens": 9,
    "key_id": null,
    "fallback_attempts": 0
  }
}
```
*Note that latency dropped from ~684ms to 2ms, `key_id` is `null`, and `fallback_attempts` is `0`.*

---

### 4. Verification of Key Failover (`key_1=429`)
Send a request with `X-Simulate-Failure: key_1=429`:
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "X-Simulate-Failure: key_1=429" \
  -d '{"session_id": "s-test-03", "message": "Explain solar energy briefly"}'
```
**Response:**
```json
{
  "session_id": "s-test-03",
  "reply": "Solar energy is radiant light and heat from the Sun that is harnessed using technologies such as solar power...",
  "metadata": {
    "resolution_source": "LIVE_INFERENCE",
    "model": "gemini/gemini-2.0-flash",
    "latency_ms": 710,
    "input_tokens": 38,
    "output_tokens": 24,
    "key_id": "key_2",
    "fallback_attempts": 1
  }
}
```
*Notice that `key_id` failed over to `key_2`, and `fallback_attempts` is `1`.*

---

### 5. Verification of All Providers Unavailable (`*=429`)
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "X-Simulate-Failure: *=429" \
  -d '{"session_id": "s-test-04", "message": "Hello"}'
```
**Response (HTTP 503):**
```json
{
  "detail": "all providers unavailable"
}
```

---

### 6. Verification of Multi-Turn Session History
```bash
curl -X GET http://localhost:8000/sessions/s-test-01/messages
```
**Response:**
```json
{
  "session_id": "s-test-01",
  "messages": [
    {
      "role": "user",
      "content": "What is the capital of France?"
    },
    {
      "role": "assistant",
      "content": "The capital of France is Paris.",
      "metadata": {
        "resolution_source": "LIVE_INFERENCE",
        "input_tokens": 42,
        "output_tokens": 9
      }
    }
  ]
}
```

---

## 5. Setup Used: your editor and AI tools

- **IDE / Editor**: Antigravity IDE (VS Code-based agentic paired environment)
- **AI Tools & SDKs**:
  - **LiteLLM**: Unified gateway interface for model routing, in-memory caching, and error handling.
  - **Google Gemini API**: Primary upstream model provider (`gemini/gemini-2.0-flash`).
  - **Secondary Provider**: Configurable for Groq (`groq/llama-3.3-70b-versatile`) or backup Gemini keys.
- **Runtimes & Frameworks**:
  - Python 3.10 with FastAPI & Pydantic v2
  - Node.js 24 with Vite 5, React 18, and TypeScript
  - SQLite 3 with multi-stage Alpine / Slim Docker containers

---

## 6. Bonus features (if any): what you added beyond the requirements and why

1. **Interactive In-UI Simulation Dropdown**:
   - Rather than requiring reviewers to use curl or open browser developer tools to test failover headers, the UI includes a dropdown to test `key_1=429`, `key_1=500`, or `*=429` on the fly with visual status banners.
2. **Interactive System Prompt Configuration**:
   - Built a sleek modal with the `data-testid="system-prompt-input"` field allowing users to customize the system persona dynamically per session.
3. **Smart Mock / Offline Fallback Mode**:
   - The LiteLLM gateway contains built-in test-key support that produces structured context-aware responses when placeholder keys are used, ensuring tests pass deterministically without network flakiness.
4. **Visual Metrics & Cache Badges**:
   - AI replies feature distinct color-coded badges: cyan ⚡ for `LLM_CACHE` and green 🟢 for `LIVE_INFERENCE`, with millisecond latency, token usage, and key fallback counters.
5. **Robust Test Suite (13 / 13 Pytest Cases)**:
   - Automated unit and integration tests validating the exact contracts for 422 errors, 404 session lookup, 503 key outages, cache hit consistency, and multi-turn persistence.
