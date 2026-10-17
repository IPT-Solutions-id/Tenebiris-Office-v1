# TENEBIRIS OFFICE — Hermes Integration Specification

### 1. Integration Model
Hermes is the sole authoritative AI execution engine.
Tenebiris Office acts as the visual simulation, spatial HUD, and orchestration front-panel.

### 2. Capability Matrix
Each connected Hermes instance is evaluated against 5 operational tiers:
- **SUPPORTED**: Feature is verified active and functioning.
- **PARTIALLY SUPPORTED**: Feature exists with constraints (e.g. text only, no streaming).
- **REQUIRES CONFIGURATION**: Missing API keys, permissions, or gateway binding.
- **UNSUPPORTED**: Feature not available in current runtime version.
- **NOT VERIFIED**: Initial discovery pending.

### 3. Mr Sunan: Primary Orchestrator Mapping
- Mr Sunan (Agent 001) maps directly to the Hermes Primary Agent.
- If Hermes is unreachable, status displays `Hermes Binding Required`.
- No simulated pseudo-agent replaces Mr Sunan in live mode.
- Users can toggle Demo Mode for visual stress-testing and room inspections.

### 4. Dynamic Skill Discovery
Skills are queried from `/api/hermes/skills`:
- Auto-registers discovered capabilities.
- Detects removed or deprecated skills.
- Marks impacted agent roles gracefully without corrupting task histories.
