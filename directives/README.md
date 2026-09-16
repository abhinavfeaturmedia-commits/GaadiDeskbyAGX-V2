# Directives (Layer 1: What to Do)

This directory contains Standard Operating Procedures (SOPs) written in natural language Markdown. They serve as the explicit instruction set for human operators and AI agents.

## Structure of a Directive

Each directive SOP should define:
1. **Goal**: What does this procedure achieve?
2. **Inputs**: What data, configuration, or files are required?
3. **Execution Scripts**: Which deterministic Python scripts in `execution/` are invoked?
4. **Outputs**: Where are deliverables stored? (Cloud, Google Sheets, local UI, etc.)
5. **Edge Cases & Error Handling**: How should failures or edge cases be resolved?

## Living Documents
Directives are improved and updated over time as new business constraints, API quirks, or optimizations are discovered (self-annealing).
