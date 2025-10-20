
# Copilot Instructions for nestrest-window Frontend

## Overview
This project is a TypeScript/HTML/CSS frontend for monitoring and controlling networked cameras via WebSocket. It provides a dynamic UI for displaying camera status, video frames, and sending control commands.

## Architecture & Data Flow
- The frontend connects to a backend WebSocket endpoint (default: `ws://127.0.0.1:8081/web-ws`) to receive device updates and video frames.
- All camera state is managed in-memory via the `CameraCatalog` class (`src/camera.ts`).
- UI is rendered dynamically using the `CameraGridUI` class (`src/ui.ts`), which creates camera cards from the template in `index.html`.
- WebSocket messages are parsed and dispatched using types and helpers in `src/messages.ts`.
- Device commands (power, stream) are sent to the backend via WebSocket using a global `wsManager` object.

## Key Files & Patterns
- `src/camera.ts`: Defines `CameraInfo` and `CameraCatalog` for camera state management and inactivity tracking.
- `src/ui.ts`: Implements `CameraGridUI` for rendering, updating, and removing camera cards in the DOM.
- `src/messages.ts`: Declares message types, enums, and parsing helpers for WebSocket communication.
- `src/index.ts`: Entry point; sets up the WebSocket connection, binds UI and state, and exposes debug helpers on `window`.
- `index.html`: Contains the camera card template (`#cameraCardTemplate`) and UI containers. Loads modules in dependency order.
- `package.json`: Scripts for build (`npm run build`), dev (`npm run dev`), and static server (`npm run serve`).

## Developer Workflows
- Build: `npm run build` (outputs to `dist/`)
- Dev (watch): `npm run dev`
- Serve static files: `npm run serve` (Python) or `npm run serve:live` (live reload)
- TypeScript is compiled to ES2020 modules; see `tsconfig.json` for strictness and output settings.

## Project Conventions
- Device IP is the unique identifier for cameras throughout the frontend.
- All device and UI updates are event-driven via WebSocket messages.
- Camera UI cards are generated from the template in `index.html`.
- TypeScript modules use explicit imports (e.g., `import { CameraInfo } from './camera.js'`).
- Device commands (on/off/stream) are sent via the `sendStreamCommand` helper in `CameraGridUI`.
- Debug helpers (`getCameras`, `getCameraStats`, etc.) are attached to `window` for browser console use.

## Integration Points
- WebSocket endpoint: `ws://127.0.0.1:8081/web-ws` (configurable in `src/index.ts`)
- All backend communication is via JSON or binary WebSocket messages; see `src/messages.ts` for structure.

## Examples
- To add a new camera: receive an `AddDevice` message from the backend; the frontend updates state and UI automatically.
- To toggle camera power/stream: UI buttons call `sendStreamCommand`, which sends a message to the backend via WebSocket.
- To debug: use browser console helpers (e.g., `getCameras()`, `gridUI.clearAll()`).

---

For more details, see the referenced files. If you add new device types or UI features, update the shared state, UI, and WebSocket message handling accordingly.
