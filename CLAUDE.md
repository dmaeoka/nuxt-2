# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 2 application using Yarn workspaces with monorepo structure. The project includes custom SportnCo modules and WebSocket functionality for real-time counter synchronization.

**Node Version:** 22.20.0 (managed via Volta)
**Package Manager:** yarn@4.10.3

## Development Commands

```bash
# Install dependencies
yarn install

# Start dev server with hot reload (localhost:5000)
yarn dev

# Build for production
yarn build

# Preview production build
yarn start

# Generate static site
yarn generate
```

## Architecture

### Workspace Structure

The project uses Yarn workspaces with three local packages in `sportnco_modules/`:

1. **@sportnco/ui-betslip** - Vue 3 betslip component with dual build targets
   - Plugin build: ES/UMD modules for integration (`dist/plugin/`)
     - For use with bundlers (Webpack, Vite, etc.)
     - Build: `npm run build:plugin`
   - Standalone build: IIFE bundle for direct use in HTML (`dist/standalone/`)
     - Single self-contained file with all dependencies inlined
     - Can be used directly in `<script>` tags without a bundler
     - Build: `npm run build:standalone`
     - Example: See `sportnco_modules/ui-betslip/example-standalone.html`
   - Build all: `npm run build` (runs type-check + both builds)
   - Uses Vite, Pinia, TailwindCSS v4

2. **@sportnco/hooper** - Vue 2 carousel slider component

3. **@sportnco/uf-webservice** - Unified Front Web Service client module

### Real-Time Synchronization

The application implements two real-time communication systems:

#### 1. WebSocket (Legacy Counter)
- Server middleware: `server-middleware/websocket.js`
- Simple counter synchronization using the `ws` package
- WebSocket URL is configurable via `WS_URL` environment variable

#### 2. Server-Sent Events (SSE) - Betslip Synchronization
- Server middleware: `server-middleware/betslip-events.js`
- Real-time betslip state synchronization across all connected clients
- Lightweight, efficient alternative to WebSockets for server-to-client updates
- Uses standard HTTP with automatic reconnection

**SSE Endpoints:**
- `GET /api/betslip/stream` - SSE connection for real-time updates
- `POST /api/betslip/add` - Add a bet
- `POST /api/betslip/remove` - Remove a bet by ID
- `POST /api/betslip/update-stake` - Update bet stake
- `POST /api/betslip/submit` - Submit betslip
- `POST /api/betslip/clear` - Clear all bets

**How it works:**
1. Client connects to SSE stream endpoint
2. Server broadcasts state changes to all connected clients
3. Clients receive updates via EventSource API
4. Updates appear instantly across all browser windows/tabs

### Nuxt Configuration

Key configuration in `nuxt.config.js`:

- **Bridge mode disabled**: `bridge: false` (Nuxt Bridge is installed but not active)
- **Client-only plugin**: Betslip component loads only on client side via `plugins/betslip-component.client.js`
- **Transpilation**: `@sportnco/ui-betslip` is transpiled to ensure crypto polyfills work correctly
- **Production optimization**: Vue devtools explicitly disabled in production client builds
- **Server config**: Binds to `0.0.0.0:5000` for container compatibility

## Working with ui-betslip Module

The ui-betslip module is a Vue 3 web component that implements a real-time synchronized betslip:

**Architecture:**
- Built as a Custom Element using Vue 3's `defineCustomElement`
- Uses Server-Sent Events (SSE) for real-time synchronization
- Self-contained with styles and logic (works in any framework)

**Props:**
- `api-url` - Base URL for API endpoints (empty string = same origin, recommended)

**Development Workflow:**
1. Isolated development: `yarn dev` from `sportnco_modules/ui-betslip/`
2. Building:
   - `npm run build` - Builds both plugin and standalone versions
   - `npm run build:plugin` - Build only ES/UMD modules (for bundler integration)
   - `npm run build:standalone` - Build only IIFE bundle (for standalone HTML)
3. Integration:
   - Nuxt app: Imports from `dist/plugin/` via `plugins/betslip-widget.client.js`
   - Standalone HTML: Include `dist/standalone/betslip-widget.iife.js` in `<script>` tag

**Standalone HTML Usage:**
```html
<betslip-component api-url="http://localhost:5000"></betslip-component>
<script src="path/to/betslip-widget.iife.js"></script>
```

**Important Notes:**
- ui-betslip uses Vue 3 + Vite, main app uses Nuxt 2 (Vue 2)
- After making changes to ui-betslip, rebuild before testing in Nuxt app
- The component connects to `/api/betslip/stream` for real-time updates
- All betslip state is managed server-side in `server-middleware/betslip-events.js`
- Standalone IIFE build has all dependencies inlined (`inlineDynamicImports: true`)

## Key Technical Details

- The main app uses **Nuxt 2.18.1** with Vue 2
- Component auto-import is enabled
- Server middleware manages both WebSocket and SSE connections
- **SSE vs WebSocket**: SSE is used for betslip (lightweight, one-way), WebSocket for legacy counter (bidirectional)
- In-memory state: Betslip state is stored in memory and lost on server restart (can be enhanced with Redis/database)
- The app is configured for deployment with custom URL support (useful for Netlify/similar platforms)

## Testing Real-Time Sync

To test SSE betslip synchronization:
1. Open `http://localhost:5000` in multiple browser windows
2. Add/remove bets or update stakes in one window
3. Changes appear instantly in all windows
4. Check browser console for `[Betslip SSE]` and `[Betslip]` logs
5. Use Network tab to monitor `/api/betslip/stream` connection (type: eventsource)
