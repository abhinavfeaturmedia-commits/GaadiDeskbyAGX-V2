# Execution Layer (Layer 3: Deterministic Scripts)

This directory houses reliable, standalone, deterministic Python scripts and utilities for API integrations, data processing, file manipulations, and calculation validation.

## Principles
1. **Deterministic Execution**: Given the same inputs, scripts must produce the exact same outputs.
2. **Environment Aware**: Read credentials, secrets, and URLs from `.env` via `env_helper.py` or `os.environ`.
3. **No Direct Hardcoding**: Keep secrets out of code.
4. **Intermediate Files**: Save temp outputs in `../.tmp/` only.
5. **Clear Error Reporting**: Print actionable error messages and exit codes so Layer 2 (Orchestrator) can self-anneal.
