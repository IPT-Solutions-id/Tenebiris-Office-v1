# TENEBIRIS OFFICE — Database Schema Specification

This document details the PostgreSQL schema supporting the virtual office persistence layer.

### Core Tables

1. **`workspaces`**:
   - `id` (UUID PK), `name` (TEXT), `created_at` (TIMESTAMP)
2. **`departments`**:
   - `id` (UUID PK), `name` (TEXT), `code` (VARCHAR), `description` (TEXT)
3. **`office_zones`**:
   - `id` (UUID PK), `name` (TEXT), `room_type` (TEXT), `capacity` (INT), `coordinates` (JSONB)
4. **`workstations`**:
   - `id` (UUID PK), `zone_id` (FK office_zones), `code` (VARCHAR), `type` (CODING | CAD | RESEARCH | DEVOPS | COMMAND), `assigned_agent_id` (FK agents, NULLABLE), `coordinates` (JSONB)
5. **`agents`**:
   - `id` (UUID PK), `agent_number` (VARCHAR UNIQUE), `name` (VARCHAR), `title` (VARCHAR), `department_id` (FK), `role_id` (FK), `avatar_theme` (TEXT), `status` (DRAFT | CONFIGURED | SYNC_PENDING | AVAILABLE | UNAVAILABLE | ERROR), `workstation_id` (FK), `is_primary` (BOOLEAN DEFAULT FALSE)
6. **`skills`**:
   - `id` (UUID PK), `skill_identifier` (VARCHAR UNIQUE), `name` (VARCHAR), `category` (TEXT), `hermes_source` (VARCHAR), `status` (AVAILABLE | UNAVAILABLE), `metadata` (JSONB)
7. **`agent_skills`**:
   - `agent_id` (FK agents), `skill_id` (FK skills), `proficiency` (NOVICE | INTERMEDIATE | ADVANCED | EXPERT | MASTER), PRIMARY KEY (agent_id, skill_id)
8. **`tasks`**:
   - `id` (UUID PK), `title` (TEXT), `description` (TEXT), `priority` (LOW | MEDIUM | HIGH | CRITICAL), `status` (DRAFT | QUEUED | ASSIGNED | RUNNING | WAITING_APPROVAL | COMPLETED | FAILED | CANCELLED), `assigned_agent_id` (FK agents), `created_by` (FK users)
9. **`task_executions`**:
   - `id` (UUID PK), `task_id` (FK tasks), `hermes_session_id` (TEXT), `status` (TEXT), `started_at` (TIMESTAMP), `completed_at` (TIMESTAMP)
10. **`execution_events`**:
    - `id` (UUID PK), `execution_id` (FK task_executions), `event_type` (LOG | STEP | ARTIFACT | STATUS_CHANGE), `payload` (JSONB), `created_at` (TIMESTAMP)
11. **`artifacts`**:
    - `id` (UUID PK), `execution_id` (FK task_executions), `type` (CODE | CAD_DXF | PDF | IMAGE | MARKDOWN), `file_path` (TEXT), `metadata` (JSONB)
12. **`integrations`**:
    - `id` (UUID PK), `service_name` (TEXT), `endpoint_url` (TEXT), `status` (CONNECTED | DISCONNECTED | ERROR), `capability_matrix` (JSONB), `last_synced_at` (TIMESTAMP)
13. **`runtime_agent_bindings`**:
    - `id` (UUID PK), `agent_id` (FK agents), `hermes_agent_id` (TEXT UNIQUE), `binding_status` (BOUND | PENDING | FAILED)
14. **`audit_logs`**:
    - `id` (UUID PK), `action` (TEXT), `actor` (TEXT), `details` (JSONB), `created_at` (TIMESTAMP)
