const socket = io();
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
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

  // random buildings
  for (let i = 0; i < 20; i++) {
    const bx = Phaser.Math.Between(100, 1900);
    const by = Phaser.Math.Between(100, 1900);
    const b = buildings.create(bx, by, 'building_full');
    b.setData('state', 0);
    b.setInteractive();
    b.on('pointerdown', () => {
      const state = b.getData('state');
      if (state === 0) {
        b.setTexture('building_damaged');
        b.setData('state', 1);
      } else if (state === 1) {
        b.setTexture('building_destroyed');
        b.setData('state', 2);
      }
    });
  }

  // random monsters
  for (let i = 0; i < 20; i++) {
    const mx = Phaser.Math.Between(100, 1900);
    const my = Phaser.Math.Between(100, 1900);
    monsters.create(mx, my, 'monster');
  }

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
