# Capra Configurator

Interactive 3D headphone color configurator for Capra Audio. The current model
is Satyr 4, with 22 independently customizable CAD parts, responsive camera
framing, shareable colorways, downloads, and light/dark themes.

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
