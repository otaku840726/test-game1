# Medieval Survival Demo

This small demo uses Node, Express and Socket.io with Three.js. Buildings,
monsters and players are rendered as simple 3D meshes. Their relative size is
scaled so buildings are largest, monsters are larger than the players, and the
players are the smallest.

## Running the game

1. Install dependencies
   ```
   npm install
   ```
2. Start the server
   ```
   npm start
   ```
3. Open `http://localhost:3000` in your browser.

If you open `public/index.html` directly without running the server,
the game will now create a local world so you can still move around,
but multiplayer features will be disabled.
