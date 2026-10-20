# Loka Labs

Company site for Loka Labs: the home page (`/`) and the AIUSD page (`/aiusd/`).

Plain static files, no build step. The AIUSD coin is rendered with three.js loaded from a CDN (`shared/coin3d.js`); if WebGL is unavailable the CSS coin underneath stays visible.

## Run locally

```bash
python3 -m http.server 4190
```

Then open http://localhost:4190/.

## Before deploying

Set `window.LOKA_CAPITAL_URL` in `config.js` to the Loka Capital site's address. Every link marked `data-capital` (Loka Capital, its app, loans and funding) is built from it.

## Deploy

Any static host. On Vercel, import the repository with no framework preset and no build command; the output directory is the repository root.
