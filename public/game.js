const socket = io();
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: 0xc2b280,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);
let cursors;
let player;
let otherPlayers;
let buildings;
let monsters;
let joystick;
const joystickForce = { x: 0, y: 0 };
const inventory = [];
const buildingMap = {};
const monsterMap = {};
let offlineMode = false;

function preload() {
  // no external assets
}

function create() {
  const self = this;
  cursors = this.input.keyboard.createCursorKeys();
  otherPlayers = this.physics.add.group();
  buildings = this.physics.add.staticGroup();
  monsters = this.physics.add.group();

  // generate textures using pixel art styled graphics
  const g = this.add.graphics({ x: 0, y: 0 });

  const p = 4; // pixel size

  // player texture (blue shirt)
  g.fillStyle(0xffcc99, 1); // head
  g.fillRect(2 * p, 0, 4 * p, 3 * p);
  g.fillStyle(0x3333ff, 1); // body
  g.fillRect(2 * p, 3 * p, 4 * p, 3 * p);
  g.fillStyle(0xffcc99, 1); // arms
  g.fillRect(p, 3 * p, p, 3 * p);
  g.fillRect(6 * p, 3 * p, p, 3 * p);
  g.fillStyle(0x555555, 1); // legs
  g.fillRect(2 * p, 6 * p, 2 * p, 3 * p);
  g.fillRect(4 * p, 6 * p, 2 * p, 3 * p);
  g.generateTexture('playerTexture', 8 * p, 9 * p);
  g.clear();

  // other player texture (green shirt)
  g.fillStyle(0xffcc99, 1); // head
  g.fillRect(2 * p, 0, 4 * p, 3 * p);
  g.fillStyle(0x00aa00, 1); // body
  g.fillRect(2 * p, 3 * p, 4 * p, 3 * p);
  g.fillStyle(0xffcc99, 1); // arms
  g.fillRect(p, 3 * p, p, 3 * p);
  g.fillRect(6 * p, 3 * p, p, 3 * p);
  g.fillStyle(0x555555, 1); // legs
  g.fillRect(2 * p, 6 * p, 2 * p, 3 * p);
  g.fillRect(4 * p, 6 * p, 2 * p, 3 * p);
  g.generateTexture('otherTexture', 8 * p, 9 * p);
  g.clear();

  // building full
  g.fillStyle(0x8b4513, 1); // walls
  g.fillRect(0, 3 * p, 8 * p, 5 * p);
  g.fillStyle(0x654321, 1); // roof
  g.fillTriangle(-p, 3 * p, 4 * p, 0, 9 * p, 3 * p);
  g.fillStyle(0x3d2314, 1); // door
  g.fillRect(3 * p, 5 * p, 2 * p, 3 * p);
  g.fillStyle(0xdddddd, 1); // windows
  g.fillRect(p, 4 * p, p, p);
  g.fillRect(6 * p, 4 * p, p, p);
  g.generateTexture('building_full', 8 * p, 8 * p);
  g.clear();

  // building damaged (missing window and cracked roof)
  g.fillStyle(0x8b4513, 1);
  g.fillRect(0, 3 * p, 8 * p, 5 * p);
  g.fillStyle(0x654321, 1);
  g.fillTriangle(-p, 3 * p, 4 * p, p, 9 * p, 3 * p);
  g.fillStyle(0x3d2314, 1);
  g.fillRect(3 * p, 5 * p, 2 * p, 3 * p);
  g.fillStyle(0xdddddd, 1);
  g.fillRect(6 * p, 4 * p, p, p);
  g.fillStyle(0x000000, 1); // crack
  g.fillRect(2 * p, 3 * p, p / 2, 2 * p);
  g.generateTexture('building_damaged', 8 * p, 8 * p);
  g.clear();

  // building destroyed (rubble)
  g.fillStyle(0x555555, 1);
  g.fillRect(0, 6 * p, 8 * p, 2 * p);
  g.fillRect(2 * p, 5 * p, p, p);
  g.fillRect(5 * p, 4 * p, 2 * p, p);
  g.generateTexture('building_destroyed', 8 * p, 8 * p);
  g.clear();

  // monster
  g.fillStyle(0x00aa00, 1); // body
  g.fillRect(p, p, 6 * p, 6 * p);
  g.fillStyle(0x006600, 1); // outline at bottom
  g.fillRect(p, 6 * p, 6 * p, p);
  g.fillStyle(0x000000, 1); // eyes
  g.fillRect(2 * p, 3 * p, p, p);
  g.fillRect(5 * p, 3 * p, p, p);
  g.fillStyle(0xff0000, 1); // mouth
  g.fillRect(3 * p, 5 * p, 2 * p, p);
  g.generateTexture('monster', 8 * p, 8 * p);
  g.destroy();

  // world bounds
  this.physics.world.setBounds(0, 0, 2000, 2000);
  this.cameras.main.setBounds(0, 0, 2000, 2000);

  // buildings and monsters will be created when server sends world data

  // joystick using nipplejs
  joystick = nipplejs.create({
    zone: document.getElementById('joystick'),
    mode: 'static',
    position: { left: '50px', bottom: '50px' },
    color: 'white',
  });
  joystick.on('move', (evt, data) => {
    const rad = Phaser.Math.DegToRad(data.angle.degree);
    joystickForce.x = Math.cos(rad);
    joystickForce.y = -Math.sin(rad);
  });
  joystick.on('end', () => {
    joystickForce.x = 0;
    joystickForce.y = 0;
  });

  socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (id === socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id], id);
      }
    });
  });

  socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo.data, playerInfo.id);
  });

  socket.on('playerDisconnected', function (playerId) {
    otherPlayers.getChildren().forEach(function (other) {
      if (playerId === other.playerId) {
        other.destroy();
      }
    });
  });

  socket.on('playerMoved', function (playerInfo) {
    otherPlayers.getChildren().forEach(function (other) {
      if (playerInfo.id === other.playerId) {
        other.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });

  socket.on('worldData', function (data) {
    data.buildings.forEach(info => createBuilding(self, info));
    data.monsters.forEach(info => createMonster(self, info));
  });

  socket.on('buildingUpdated', function (info) {
    const b = buildingMap[info.id];
    if (b) {
      const textures = ['building_full', 'building_damaged', 'building_destroyed'];
      b.setTexture(textures[info.state]);
      b.setData('state', info.state);
    }
  });

  socket.on('updateInventory', function (items) {
    inventory.length = 0;
    items.forEach(i => inventory.push(i));
    document.getElementById('inventory').innerText = 'Inventory: ' + inventory.join(', ');
  });

  // if server never responds, fall back to a local world after a short delay
  this.time.delayedCall(1500, () => {
    if (!player) {
      offlineMode = true;
      initOfflineWorld(self);
    }
  });
}

function addPlayer(self, playerInfo) {
  player = self.physics.add.image(playerInfo.x, playerInfo.y, 'playerTexture').setOrigin(0.5, 0.5).setDisplaySize(40, 40);
  player.setCollideWorldBounds(true);
  self.cameras.main.startFollow(player);
}

function addOtherPlayers(self, playerInfo, id) {
  const other = self.add.sprite(playerInfo.x, playerInfo.y, 'otherTexture').setOrigin(0.5, 0.5).setDisplaySize(40, 40);
  other.playerId = id;
  otherPlayers.add(other);
}

function createBuilding(self, info) {
  const textures = ['building_full', 'building_damaged', 'building_destroyed'];
  const b = buildings.create(info.x, info.y, textures[info.state]);
  b.setData('id', info.id);
  b.setData('state', info.state);
  b.setInteractive();
  b.on('pointerdown', () => {
    socket.emit('damageBuilding', b.getData('id'));
  });
  buildingMap[info.id] = b;
}

function createMonster(self, info) {
  const m = monsters.create(info.x, info.y, 'monster');
  monsterMap[info.id] = m;
}

function initOfflineWorld(self) {
  // mimic the server's random world generation for offline play
  function randomPos() {
    return Phaser.Math.Between(100, 1900);
  }
  addPlayer(self, { x: 1000, y: 1000 });
  for (let i = 0; i < 20; i++) {
    createBuilding(self, { id: i, x: randomPos(), y: randomPos(), state: 0 });
  }
  for (let i = 0; i < 20; i++) {
    createMonster(self, { id: i, x: randomPos(), y: randomPos() });
  }
  document.getElementById('inventory').innerText = 'Offline Mode';
}

function update() {
  if (player) {
    const speed = 200;
    player.body.setVelocity(0);
    if (cursors.left.isDown || joystickForce.x < -0.3) {
      player.body.setVelocityX(-speed);
    } else if (cursors.right.isDown || joystickForce.x > 0.3) {
      player.body.setVelocityX(speed);
    }
    if (cursors.up.isDown || joystickForce.y < -0.3) {
      player.body.setVelocityY(-speed);
    } else if (cursors.down.isDown || joystickForce.y > 0.3) {
      player.body.setVelocityY(speed);
    }
    player.body.velocity.normalize().scale(speed);
    if (!offlineMode) {
      socket.emit('playerMovement', { x: player.x, y: player.y });
    }
  }
}
