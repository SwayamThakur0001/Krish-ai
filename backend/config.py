import os
from typing import List
from dotenv import load_dotenv

# Load .env file from repo root or backend folder
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv()

# Prevent LiteLLM from making slow/failing network requests for price maps
os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/app.db")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")
    ENABLE_FAILURE_SIMULATION: bool = os.getenv("ENABLE_FAILURE_SIMULATION", "true").lower() in ("true", "1", "yes")
    DEFAULT_MODEL: str = os.getenv("LLM_MODEL", "gemini/gemini-3-flash-preview")
    DEFAULT_SYSTEM_PROMPT: str = os.getenv("DEFAULT_SYSTEM_PROMPT", "You are Krish AI, a helpful, highly intelligent, professional AI assistant.")

    @property
    def api_keys(self) -> List[str]:
        raw = os.getenv("LLM_API_KEYS", "")
        keys = [k.strip() for k in raw.split(",") if k.strip()]
        if not keys:
            # Fallback placeholder keys if not provided in environment
            return ["key_1_placeholder", "key_2_placeholder"]
        return keys

    @property
    def models(self) -> List[str]:
        raw_models = os.getenv("LLM_MODELS", "")
        parsed = [m.strip() for m in raw_models.split(",") if m.strip()]
        keys_count = len(self.api_keys)
        if not parsed:
            # Provide high-performance flash models for failover
            defaults = ["gemini/gemini-3-flash-preview", "gemini/gemini-3.5-flash"]
            if keys_count <= 2:
                return defaults[:keys_count]
            return defaults + [self.DEFAULT_MODEL] * (keys_count - len(defaults))
        if len(parsed) < keys_count:
            return parsed + [self.DEFAULT_MODEL] * (keys_count - len(parsed))
        return parsed[:keys_count]

    @property
    def allowed_origins_list(self) -> List[str]:
        raw = self.ALLOWED_ORIGINS
        if not raw or raw.strip() == "*":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]

settings = Settings()
