const socket = io();
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: 0x228b22,
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

function preload() {
  // no external assets
}

function create() {
  const self = this;
  cursors = this.input.keyboard.createCursorKeys();
  otherPlayers = this.physics.add.group();
  buildings = this.physics.add.staticGroup();
  monsters = this.physics.add.group();

  // generate textures using graphics
  const g = this.add.graphics({ x: 0, y: 0 });
  g.fillStyle(0x0000ff, 1);
  g.fillRect(0, 0, 40, 40);
  g.generateTexture('playerTexture', 40, 40);
  g.clear();
  g.fillStyle(0x00ff00, 1);
  g.fillRect(0, 0, 40, 40);
  g.generateTexture('otherTexture', 40, 40);
  g.clear();
  g.fillStyle(0x888888, 1);
  g.fillRect(0, 0, 40, 40);
  g.generateTexture('building_full', 40, 40);
  g.clear();
  g.fillStyle(0xaa8888, 1);
  g.fillRect(0, 0, 40, 40);
  g.generateTexture('building_damaged', 40, 40);
  g.clear();
  g.fillStyle(0x555555, 1);
  g.fillRect(0, 0, 40, 40);
  g.generateTexture('building_destroyed', 40, 40);
  g.clear();
  g.fillStyle(0xff0000, 1);
  g.fillRect(0, 0, 30, 30);
  g.generateTexture('monster', 30, 30);
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
    joystickForce.y = Math.sin(rad);
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
    socket.emit('playerMovement', { x: player.x, y: player.y });
  }
}
