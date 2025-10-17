# UI Betslip - Build Guide

This project supports two build outputs:

## 1. Plugin Bundle (for use in other projects)

Located in `dist/plugin/`

### Usage

Install and import into your Vue/Nuxt project:

```javascript
// ES Module
import { BetslipComponent, register } from 'ui-betslip'

// Auto-register the custom element
register()

// Or use the component directly
app.component('BetslipComponent', BetslipComponent)
```

### Build Command

```bash
npm run build:plugin
```

This creates:
- `dist/plugin/ui-betslip.es.js` - ES module (for bundlers)
- `dist/plugin/ui-betslip.umd.js` - UMD module (for legacy)
- External dependency: Vue (must be provided by host project)

---

## 2. Standalone Bundle (embeddable app)

Located in `dist/standalone/`

### Usage

Simply include the script in any HTML page:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>
    <!-- Option 1: Auto-mount to #betslip -->
    <div id="betslip"></div>

    <!-- Option 2: Web Component -->
    <betslip-component></betslip-component>

    <!-- Option 3: Manual mount -->
    <div id="my-betslip"></div>

    <!-- Load the standalone bundle -->
    <script src="./dist/standalone/ui-betslip-standalone.iife.js"></script>

    <!-- Optional: Manual mounting -->
    <script>
        UiBetslip.mount('#my-betslip');
    </script>
</body>
</html>
```

### Build Command

```bash
npm run build:standalone
```

This creates:
- `dist/standalone/ui-betslip-standalone.iife.js` - Self-contained IIFE bundle
- All dependencies (including Vue) are bundled
- Can be used in any HTML page without additional dependencies

---

## Build All

To build both bundles:

```bash
npm run build
```

This runs both `build:plugin` and `build:standalone`, then performs type checking.

---

## Development

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

---

## Preview Demo

After building, you can preview the standalone bundle:

```bash
npm run build
npm run preview
```

Then open [demo.html](./demo.html) to see all usage examples.

---

## Key Differences

| Feature | Plugin Bundle | Standalone Bundle |
|---------|--------------|-------------------|
| Vue included | No (external) | Yes (bundled) |
| File size | Smaller | Larger |
| Use case | Import in Vue/Nuxt apps | Embed in any HTML page |
| Formats | ES + UMD | IIFE only |
| Dependencies | Requires Vue 3 | None |

---

## File Structure

```
dist/
├── plugin/
│   ├── ui-betslip.es.js      # ES module (~7 KB, ~2.5 KB gzipped)
│   └── ui-betslip.umd.js     # UMD module (~7 KB, ~2.5 KB gzipped)
└── standalone/
    ├── ui-betslip-standalone.iife.js  # Self-contained bundle (~72 KB, ~28 KB gzipped)
    └── ui-betslip-standalone.css      # Styles (~5 KB, ~1.7 KB gzipped)
```
