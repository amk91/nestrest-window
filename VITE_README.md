# Vite Setup for NestRest Window

## How to use

- **Development:**
  ```sh
  npm run dev
  ```
  This starts the Vite dev server at http://localhost:9000

- **Build:**
  ```sh
  npm run build
  ```
  Bundles your app into the `dist/` folder for production.

- **Preview production build:**
  ```sh
  npm run serve
  ```
  Serves the built files from `dist/`.

## Notes
- Entry point is now `src/index.ts` (imported in `index.html`).
- All npm packages (like `zod`) are bundled for browser use.
- You can remove old scripts for `tsc` and `python -m http.server` if not needed.
