# Build Guide

## Build Targets

This package supports two build targets:

### 1. Plugin Build (Default)
ES and UMD modules for integration with bundlers (Webpack, Vite, etc.)

**Output:** `dist/plugin/`
- `betslip-widget.es.js` - ES module
- `betslip-widget.umd.js` - UMD module

**Build command:**
```bash
npm run build:plugin
```

**Usage:**
```javascript
import '@sportnco/ui-betslip'
// or
import { BetslipCustomElement } from '@sportnco/ui-betslip'
```

### 2. Standalone Build (IIFE)
Self-contained IIFE bundle for direct use in HTML files without a bundler.

**Output:** `dist/standalone/`
- `betslip-widget.iife.js` - Single file with all dependencies inlined

**Build command:**
```bash
npm run build:standalone
```

**Features:**
- Format: IIFE (Immediately Invoked Function Expression)
- All dynamic imports are inlined (`inlineDynamicImports: true`)
- All dependencies bundled into a single file
- Minified with Terser
- Can be used directly in `<script>` tags

**Usage:**
```html
<!DOCTYPE html>
<html>
<body>
  <betslip-component api-url="http://localhost:5000"></betslip-component>

  <script src="path/to/betslip-widget.iife.js"></script>
</body>
</html>
```

## Build All Targets

To build both plugin and standalone versions:

```bash
npm run build
```

This will:
1. Run type checking
2. Build plugin version (ES + UMD)
3. Build standalone version (IIFE)

## Development

```bash
npm run dev
```

Starts Vite dev server with hot module replacement.

## Environment Variables

- `BUILD_MODE=standalone` - Used internally to switch build configuration
