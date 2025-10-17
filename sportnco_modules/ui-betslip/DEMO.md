# UI Betslip Demo

This folder contains standalone HTML demos for the UI Betslip web component.

## Files

- **demo.html** - Uses UMD build with Vue global (simpler, works everywhere)
- **demo-esm.html** - Uses ES module build with import maps (modern, smaller)

## Usage

### Option 1: Use the preview server (Recommended)

```bash
pnpm build
pnpm preview:demo
```

Then open:
- http://localhost:4173/demo.html (UMD version)
- http://localhost:4173/demo-esm.html (ESM version)

### Option 2: Use any HTTP server

```bash
cd dist
python3 -m http.server 8000
```

Then open:
- http://localhost:8000/demo.html
- http://localhost:8000/demo-esm.html

## How it works

### UMD Version (demo.html)
```html
<!-- Load Vue from CDN as a global -->
<script src="https://cdn.jsdelivr.net/npm/vue@3.5.22/dist/vue.global.prod.js"></script>

<!-- Load component (expects global Vue) -->
<script src="./ui-betslip.umd.js"></script>

<!-- Use the component -->
<betslip-component></betslip-component>
```

### ESM Version (demo-esm.html)
```html
<!-- Map "vue" import to CDN -->
<script type="importmap">
{
  "imports": {
    "vue": "https://cdn.jsdelivr.net/npm/vue@3.5.22/dist/vue.esm-browser.prod.js"
  }
}
</script>

<!-- Load component as ES module -->
<script type="module">
  import './ui-betslip.es.js'
</script>

<!-- Use the component -->
<betslip-component></betslip-component>
```

## Features

- ✅ Tailwind CSS 4 with `tw-` prefix
- ✅ All styles injected into Shadow DOM
- ✅ Works as a Web Component
- ✅ No build step needed for consumers
