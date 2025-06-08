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
const inventory = [];

function preload() {
  this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
  this.load.image('other', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
}

function create() {
  const self = this;
  cursors = this.input.keyboard.createCursorKeys();
  otherPlayers = this.physics.add.group();

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
  player = self.physics.add.image(playerInfo.x, playerInfo.y, 'player').setOrigin(0.5, 0.5).setDisplaySize(40, 40);
  self.cameras.main.startFollow(player);
}

function addOtherPlayers(self, playerInfo, id) {
  const other = self.add.sprite(playerInfo.x, playerInfo.y, 'other').setOrigin(0.5, 0.5).setDisplaySize(40, 40);
  other.playerId = id;
  otherPlayers.add(other);
}

function update() {
  if (player) {
    const speed = 200;
    player.body.setVelocity(0);
    if (cursors.left.isDown) {
      player.body.setVelocityX(-speed);
    } else if (cursors.right.isDown) {
      player.body.setVelocityX(speed);
    }
    if (cursors.up.isDown) {
      player.body.setVelocityY(-speed);
    } else if (cursors.down.isDown) {
      player.body.setVelocityY(speed);
    }
    player.body.velocity.normalize().scale(speed);
    socket.emit('playerMovement', { x: player.x, y: player.y });
  }
}
