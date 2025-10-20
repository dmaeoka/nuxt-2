# @sportnco/ui-betslip

A Vue 3 Web Component for betslip functionality that can be used in any framework, including Nuxt 2.

## Overview

This package exports a custom element (web component) called `<betslip-component>` that provides a fully-functional betslip with real-time synchronization via Server-Sent Events (SSE).

## Building

```bash
# From the ui-betslip directory
npm run build
```

This creates the following output files:
- `dist/betslip-widget.es.js` - ES module format
- `dist/betslip-widget.umd.js` - UMD format (used in Nuxt 2)
- `dist/ui-betslip.css` - Compiled styles including Tailwind CSS base styles

## Usage in Nuxt 2

### 1. Create a client-side plugin

Create a file at `plugins/betslip-widget.client.js`:

```javascript
// Import the custom element styles (includes Tailwind CSS)
import '@sportnco/ui-betslip/dist/ui-betslip.css'
// Import the custom element from the built UMD bundle
import '@sportnco/ui-betslip/dist/betslip-widget.umd.js'

export default () => {
  if (process.client) {
    console.log('Betslip custom element loaded successfully')
  }
}
```

### 2. Register the plugin in nuxt.config.js

```javascript
export default {
  plugins: [
    { src: '~/plugins/betslip-widget.client.js', mode: 'client' }
  ],

  build: {
    transpile: [
      '@sportnco/ui-betslip'
    ]
  }
}
```

### 3. Use in your Vue templates

```vue
<template>
  <div>
    <client-only>
      <betslip-component :api-url="apiUrl"></betslip-component>
    </client-only>
  </div>
</template>

<script>
export default {
  data() {
    return {
      apiUrl: '' // Empty string = same origin
    }
  }
}
</script>
```

## Props

- `api-url` (String): Base URL for API endpoints. Use empty string (`""`) for same-origin requests.

## Features

- **Real-time synchronization**: Uses Server-Sent Events to keep betslip state synchronized across all connected clients
- **Framework agnostic**: Works in any framework that supports Web Components
- **Tailwind CSS included**: All Tailwind CSS base styles are compiled and included in the CSS bundle
- **Vue 3 powered**: Built with Vue 3's `defineCustomElement` API

## Styling

The component uses Tailwind CSS v4 for styling. When using custom elements with Shadow DOM and inline CSS (`?inline` import), all Tailwind CSS custom properties (variables) must be explicitly defined to work correctly across all browsers.

### How It Works

1. **CSS Inlining**: The build uses `import mainCss from './assets/main.css?inline'` to inline all CSS directly into the JavaScript bundle
2. **Shadow DOM Scoping**: All styles are injected into the Shadow DOM of each custom element instance
3. **Variable Definitions**: All Tailwind CSS variables are explicitly defined in `@layer base` for both `*` and `:host` selectors

### CSS Variables for Shadow DOM

The `src/assets/main.css` file includes comprehensive Tailwind CSS variable definitions:

```css
@layer base {
  *,
  *::before,
  *::after,
  ::backdrop {
    --tw-border-style: solid;
    --tw-translate-x: 0;
    --tw-ring-shadow: 0 0 #0000;
    /* ... all other Tailwind variables */
  }

  :host {
    /* Same variables repeated for :host to ensure Shadow DOM compatibility */
  }
}
```

**Why This Is Necessary**: When using `?inline` imports with custom elements, Tailwind's automatic variable injection may not work correctly in Shadow DOM. Explicitly defining all variables ensures they're available in the isolated Shadow DOM scope.

### Variables Included

- **Border**: `--tw-border-style`, `--tw-border-spacing-x/y`
- **Transform**: `--tw-translate-x/y`, `--tw-rotate`, `--tw-scale-x/y`, `--tw-skew-x/y`
- **Filters**: `--tw-blur`, `--tw-brightness`, `--tw-contrast`, etc.
- **Backdrop Filters**: `--tw-backdrop-blur`, `--tw-backdrop-brightness`, etc.
- **Ring**: `--tw-ring-shadow`, `--tw-ring-color`, `--tw-ring-offset-*`
- **Shadow**: `--tw-shadow`, `--tw-shadow-colored`
- **Typography**: `--tw-font-weight`, `--tw-ordinal`, etc.

## API Endpoints

The component expects the following SSE endpoints to be available:

- `GET /api/betslip/stream` - SSE connection for real-time updates
- `POST /api/betslip/add` - Add a bet
- `POST /api/betslip/remove` - Remove a bet
- `POST /api/betslip/update-stake` - Update bet stake
- `POST /api/betslip/submit` - Submit betslip
- `POST /api/betslip/clear` - Clear all bets

## Development

For isolated development of the component:

```bash
# Start dev server (localhost:5173)
yarn dev

# Build for production
yarn build

# Run type checking
yarn type-check
```

## Technical Details

- Built with Vue 3.5+
- Uses Vite for building
- Styled with TailwindCSS v4
- TypeScript support
- Custom Element API via `defineCustomElement`
