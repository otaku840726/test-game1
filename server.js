const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store connected players
const players = {};

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Create a new player
  players[socket.id] = {
    id: socket.id,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    health: 100,
    equipment: [],
    inventory: []
  };

  // Send the current state to the new player
  socket.emit('currentPlayers', players);

  // Notify other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Handle player movement
  socket.on('playerMovement', (movementData) => {
    players[socket.id].position = movementData.position;
    players[socket.id].rotation = movementData.rotation;
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  // Handle player attack
  socket.on('playerAttack', (attackData) => {
    socket.broadcast.emit('playerAttacked', {
      playerId: socket.id,
      target: attackData.target
    });
  });

  // Handle item pickup
  socket.on('itemPickup', (itemData) => {
    if (players[socket.id]) {
      players[socket.id].inventory.push(itemData.item);
      socket.emit('inventoryUpdate', players[socket.id].inventory);
      socket.broadcast.emit('itemPickedUp', {
        playerId: socket.id,
        itemId: itemData.itemId
      });
    }
  });

  // Handle equipment change
  socket.on('equipItem', (equipData) => {
    if (players[socket.id]) {
      players[socket.id].equipment = equipData.equipment;
      socket.broadcast.emit('playerEquipmentChanged', {
        playerId: socket.id,
        equipment: equipData.equipment
      });
    }
  });

  // Handle player damage
  socket.on('playerDamage', (damageData) => {
    if (players[socket.id]) {
      players[socket.id].health -= damageData.amount;
      if (players[socket.id].health <= 0) {
        socket.emit('playerDied');
        socket.broadcast.emit('playerDied', {
          playerId: socket.id
        });
        // Respawn player in town
        players[socket.id].health = 100;
        players[socket.id].position = { x: 0, y: 0, z: 0 };
        players[socket.id].equipment = [];
        socket.emit('respawn', players[socket.id]);
        socket.broadcast.emit('playerRespawned', players[socket.id]);
      } else {
        socket.emit('healthUpdate', players[socket.id].health);
        socket.broadcast.emit('playerDamaged', {
          playerId: socket.id,
          health: players[socket.id].health
        });
      }
    }
  });

  // Handle building damage
  socket.on('buildingDamage', (damageData) => {
    socket.broadcast.emit('buildingDamaged', damageData);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
