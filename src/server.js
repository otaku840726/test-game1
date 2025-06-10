import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/vendor', express.static(
  path.join(__dirname, '..', 'node_modules', 'three', 'build')
));
app.use('/vendor', express.static(
  path.join(__dirname, '..', 'node_modules', 'socket.io', 'client-dist')
));

const players = new Map();

io.on('connection', (socket) => {
  const id = socket.id;
  players.set(id, { id, x: 0, y: 0, z: 0 });
  socket.emit('init', Array.from(players.values()));
  socket.broadcast.emit('player-joined', players.get(id));

  socket.on('update', (data) => {
    const player = players.get(id);
    if (!player) return;
    player.x = data.x;
    player.y = data.y;
    player.z = data.z;
    socket.broadcast.emit('player-updated', player);
  });

  socket.on('disconnect', () => {
    players.delete(id);
    io.emit('player-left', id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
