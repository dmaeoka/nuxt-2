# UI Betslip - Usage Guide

## Plugin Bundle (for Vue/Nuxt projects)

### Installation

```bash
npm install ui-betslip
# or
yarn add ui-betslip
# or
pnpm add ui-betslip
```

### Usage in Vue 3

```javascript
import { createApp } from 'vue'
import { BetslipComponent, register } from 'ui-betslip'
import App from './App.vue'

const app = createApp(App)

// Option 1: Auto-register the custom element
register()

// Option 2: Register as a Vue component
app.component('BetslipComponent', BetslipComponent)

app.mount('#app')
```

### Usage in Nuxt 3

Create a plugin file at `plugins/betslip.client.ts`:

```typescript
import { register } from 'ui-betslip'

export default defineNuxtPlugin(() => {
  // Register the custom element
  register()
})
```

Then use it in your components:

```vue
<template>
  <div>
    <betslip-component></betslip-component>
  </div>
</template>
```

---

## Standalone Bundle (for embedding in any HTML page)

### Download

Download the standalone bundle from:
- JavaScript: `dist/standalone/ui-betslip-standalone.iife.js`
- CSS: `dist/standalone/ui-betslip-standalone.css`

### Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    <!-- Include the CSS -->
    <link rel="stylesheet" href="path/to/ui-betslip-standalone.css">
</head>
<body>
    <!-- Method 1: Auto-mount to #betslip -->
    <div id="betslip"></div>

    <!-- Method 2: Use as a Web Component -->
    <betslip-component></betslip-component>

    <!-- Method 3: Manual mount -->
    <div id="my-custom-container"></div>

    <!-- Load the JavaScript -->
    <script src="path/to/ui-betslip-standalone.iife.js"></script>

    <!-- Optional: Manual mounting -->
    <script>
        // Mount to a specific element
        UiBetslip.mount('#my-custom-container')
    </script>
</body>
</html>
```

### Methods Available

#### Auto-mount
Simply add an element with `id="betslip"` and the component will automatically mount to it.

```html
<div id="betslip"></div>
```

#### Web Component
Use the custom element anywhere in your HTML:

```html
<betslip-component></betslip-component>
```

#### Manual Mount
Use the global `UiBetslip.mount()` function:

```javascript
UiBetslip.mount('#my-selector')
```

### CDN Usage

If you want to serve the standalone bundle via CDN:

```html
<link rel="stylesheet" href="https://your-cdn.com/ui-betslip-standalone.css">
<script src="https://your-cdn.com/ui-betslip-standalone.iife.js"></script>
```

---

## Bundle Sizes

| Bundle | Size | Gzipped |
|--------|------|---------|
| Plugin (ES) | ~7 KB | ~2.5 KB |
| Plugin (UMD) | ~7 KB | ~2.5 KB |
| Standalone (IIFE) | ~72 KB | ~28 KB |
| Standalone CSS | ~5 KB | ~1.7 KB |

**Note:** The standalone bundle is larger because it includes Vue 3 and all dependencies bundled together.

---

## Browser Support

- Modern browsers (ES2015+)
- Chrome, Firefox, Safari, Edge (latest versions)
- Custom Elements support required (natively supported in all modern browsers)

---

## Features

- **Custom Element**: Works as a standard Web Component
- **Vue 3**: Built with Vue 3 Composition API
- **Tailwind CSS**: Styled with Tailwind CSS 4
- **Shadow DOM**: Uses Shadow DOM for style isolation (in custom element mode)
- **TypeScript**: Full TypeScript support

---

## Development

See [BUILD.md](./BUILD.md) for build instructions.
