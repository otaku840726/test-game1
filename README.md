# Medieval Combat Survival - Reborn

This project is a fresh start for a simple networked 3D game built with Three.js and Socket.IO.

## Development

1. Install dependencies
   ```bash
   npm install
   ```
2. Start the development server
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

The server exposes Three.js and Socket.IO from `node_modules` under `/vendor` so the client can load them without relying on a CDN or bundler.

This rewrite contains only the minimal features: a basic scene and networked player cubes. More functionality can be built on top of this foundation.
