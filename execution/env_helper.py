"""
Helper utility for loading environment variables and configuration for Layer 3 execution scripts.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
TMP_DIR = BASE_DIR / ".tmp"
ENV_FILE = BASE_DIR / ".env"

def ensure_tmp_dir() -> Path:
    """Ensure .tmp directory exists and return its path."""
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    return TMP_DIR

def load_env(env_path: Path = ENV_FILE) -> dict:
    """
    Simple, zero-dependency .env parser that loads key-value pairs
    into os.environ if not already set.
    """
    env_vars = {}
    if not env_path.exists():
        return env_vars

    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip("'\"")
            env_vars[key] = val
            if key not in os.environ:
                os.environ[key] = val
    return env_vars

def get_env_var(key: str, default: str = None) -> str:
    """Retrieve environment variable with fallback default."""
    load_env()
    return os.environ.get(key, default)

if __name__ == "__main__":
    ensure_tmp_dir()
    loaded = load_env()
    print(f"[OK] Layer 3 environment helper initialized. Loaded {len(loaded)} keys from {ENV_FILE.name}.")
