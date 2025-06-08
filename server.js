const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// generate a simple shared world
const world = { buildings: [], monsters: [] };
function randomPos() {
  return Math.floor(Math.random() * 1800) + 100;
}
for (let i = 0; i < 20; i++) {
  world.buildings.push({ id: i, x: randomPos(), y: randomPos(), state: 0 });
}
for (let i = 0; i < 20; i++) {
  world.monsters.push({ id: i, x: randomPos(), y: randomPos() });
}

app.use(express.static(path.join(__dirname, 'public')));

// simple in-memory state for players
const players = {};

io.on('connection', socket => {
  console.log('a user connected', socket.id);
  players[socket.id] = { x: 1000, y: 1000, equipment: null };
  // send current players to new player
  socket.emit('currentPlayers', players);
  // send world layout
  socket.emit('worldData', world);
  // notify existing players of new player
  socket.broadcast.emit('newPlayer', { id: socket.id, data: players[socket.id] });

  socket.on('playerMovement', data => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      io.emit('playerMoved', { id: socket.id, x: data.x, y: data.y });
    }
  });

  socket.on('damageBuilding', id => {
    const b = world.buildings.find(b => b.id === id);
    if (b && b.state < 2) {
      b.state += 1;
      io.emit('buildingUpdated', b);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
