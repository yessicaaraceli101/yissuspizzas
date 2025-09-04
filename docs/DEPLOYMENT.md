# Deployment

This is a static site; host it on any static platform.

## Vercel
- Framework Preset: **Other**
- Build Command: **None**
- Output Directory: **dist** (production build)

- Provide `vercel.json` for cache headers.

## Netlify
- Build Command: **None**
- Publish Directory: **dist** (production build)

- `_headers` controls caching.

## GitHub Pages
- Publish the **contents of `dist/`** to the selected branch/root (or use `/docs`).

## S3 + CloudFront
- Upload `dist/` to the bucket, set index document to `index.html`, include `404.html`.

## Post‑Deploy
- Test all pages for 404s and asset loading.

- Verify long‑term caching for `/assets/*` or equivalent.

