# Capra Configurator

Interactive 3D headphone color configurator with responsive camera framing,
shareable colorways, downloads, filament matching, and light/dark themes. It
currently includes Capra Audio's Satyr 4 and Open-Omega, an independent
headphone designed by DMS that is not a Capra headphone.

The base URL currently opens Satyr 4. Each model also has a permanent,
static-host-compatible link: `/?model=satyr-4` and `/?model=open-omega`.
`DEFAULT_PRODUCT_MODEL` controls what the base URL opens, so it can change
later without breaking either permanent model link. Shared colorway links add
the existing versioned `config` parameter alongside the model parameter.

## Development

Run the app from this folder with:

```sh
pnpm dev
```

Then open the local URL Vite prints, usually `http://localhost:5173/`.

For a production build:

```sh
pnpm build
pnpm preview
```

The deployable static site is generated in `dist/`. Host that directory at the
root of a domain or subdomain so the model and mask asset paths resolve correctly.

Do not open the source `index.html` directly from Finder/File Explorer; the browser will block the module and GLB assets when loaded with `file://`.
