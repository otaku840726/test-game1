const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// simple in-memory state for players
const players = {};

io.on('connection', socket => {
  console.log('a user connected', socket.id);
  players[socket.id] = { x: 400, y: 300, equipment: null };
  // send current players to new player
  socket.emit('currentPlayers', players);
  // notify existing players of new player
  socket.broadcast.emit('newPlayer', { id: socket.id, data: players[socket.id] });

  socket.on('playerMovement', data => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      io.emit('playerMoved', { id: socket.id, x: data.x, y: data.y });
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
