# Implementation Plan: Tenebiris Office UI/Chat Enhancements

## 1. Sidebar & Layout
- Modify `src/components/layout/Sidebar.tsx` to include a toggle button (expand/collapse).
- Update `src/App.tsx` to replace the existing workspace layout with a 50% height main workspace area and a 50% height chat interface area.

## 2. Chat Interface Development
- Create `src/components/chat/ChatInterface.tsx`:
    - AI Model selector.
    - File/photo attachment trigger.
    - History view / New Chat.
    - Input area with `@(agent_name)` parsing logic for direct agent tagging/messaging.
- Integrate into `App.tsx` below the main workspace.

## 3. State Management
- Update `src/store/officeStore.tsx`:
    - Refine message handling to distinguish between A2A, User-to-Agent, and Global chat threads.
    - Implement tagging support logic.
