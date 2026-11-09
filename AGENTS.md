# Agent Instructions for `danfe-sisgen-api`

## Build & Environment Quirks
- **Webpack over Turbopack:** Do NOT use Next.js Turbopack. Native SWC bindings fail on this Windows environment. The `build` script in `package.json` is explicitly set to `next build --webpack` to bypass this.
- **Tailwind CSS v4 Setup:** The project uses Tailwind v4 via `@tailwindcss/postcss` for Webpack compatibility. Configuration is done via CSS variables and the `@theme` directive in `src/app/globals.css`. Do not attempt to use `tailwind.config.ts` or old v3 directives (`@tailwind base`).
- **Required Env Var:** The app requires `CLIENT_SECRET` (server-side only) in a local `.env` file to authenticate with the Data Proxy. See `.env.example`.

## Architecture & API Notes
- **Documentation:** Read `docs/documenta_o_de_acesso_sisgen_via_data_proxy.md` for the API contract. Ignore the PDF file in `docs/` as the underlying model cannot read it natively.
- **API Service (`src/services/api.ts`):** 
  - Handles the OAuth2 Client Credentials flow.
  - Implements **in-memory token caching** (300s TTL). Do not generate a new token per request.
  - The downstream API uses PostgREST syntax for filtering (e.g., `ilike.*valor*`).
- **Design System:** The UI mimics the internal "Opus" design system. Custom utility classes for colors (`bg-opus-primary`, `text-opus-accent`) and fonts (`font-rubik`, `font-inter`) are already defined in `globals.css` and should be favored over default Tailwind colors where appropriate.

## Commands
- **Dev:** `npm run dev`
- **Build:** `npm run build` (Ensures `--webpack` is used)
- **Lint:** `npm run lint`