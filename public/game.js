const socket = typeof io !== 'undefined' ? io() : { on: () => {}, emit: () => {} };

let scene, camera, renderer;
let player;
const otherPlayers = {};
const buildings = {};
const monsters = {};
let joystick;
const joystickForce = { x: 0, y: 0 };
const inventory = [];
let offlineMode = false;

function createGroundTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#5a7c36';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 6 + 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = Math.random() > 0.5 ? '#4b6b30' : '#6a8f40';
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 20);
  return tex;
}

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc2b280);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    5000
  );
  camera.position.set(0, 60, 80);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize);
  document.addEventListener('pointerdown', onPointerDown);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444);
  light.position.set(0, 200, 0);
  scene.add(light);

  const groundGeo = new THREE.PlaneGeometry(2000, 2000);
  const groundMat = new THREE.MeshLambertMaterial({ map: createGroundTexture() });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  joystick = nipplejs.create({
    zone: document.getElementById('joystick'),
    mode: 'static',
    position: { left: '50px', bottom: '50px' },
    color: 'white',
  });
  joystick.on('move', (evt, data) => {
    const rad = data.angle.radian;
    joystickForce.x = Math.cos(rad);
    joystickForce.y = -Math.sin(rad);
  });
  joystick.on('end', () => {
    joystickForce.x = 0;
    joystickForce.y = 0;
  });

  socket.on('currentPlayers', players => {
    Object.keys(players).forEach(id => {
      if (id === socket.id) {
        addPlayer(players[id]);
      } else {
        addOtherPlayer(players[id], id);
      }
    });
  });

  socket.on('newPlayer', info => {
    addOtherPlayer(info.data, info.id);
  });

  socket.on('playerDisconnected', id => {
    if (otherPlayers[id]) {
      scene.remove(otherPlayers[id]);
      delete otherPlayers[id];
    }
  });

  socket.on('playerMoved', info => {
    const other = otherPlayers[info.id];
    if (other) {
      other.position.set(info.x, 10, -info.y);
    }
  });

  socket.on('worldData', data => {
    data.buildings.forEach(createBuilding);
    data.monsters.forEach(createMonster);
  });

  socket.on('buildingUpdated', info => {
    const b = buildings[info.id];
    if (b) {
      b.userData.state = info.state;
      const colors = [0x8b4513, 0x996633, 0x555555];
      b.material.color.setHex(colors[info.state]);
    }
  });

  socket.on('updateInventory', items => {
    inventory.length = 0;
    items.forEach(i => inventory.push(i));
    document.getElementById('inventory').innerText =
      'Inventory: ' + inventory.join(', ');
  });

  setTimeout(() => {
    if (!player) {
      offlineMode = true;
      initOfflineWorld();
    }
  }, 500);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerDown(event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const objs = Object.values(buildings);
  const intersects = raycaster.intersectObjects(objs);
  if (intersects.length > 0) {
    const b = intersects[0].object;
    socket.emit('damageBuilding', b.userData.id);
  }
}

function addPlayer(info) {
  const geom = new THREE.CylinderGeometry(5, 5, 15, 8);
  const mat = new THREE.MeshStandardMaterial({ color: 0x3333ff });
  player = new THREE.Mesh(geom, mat);
  player.position.set(info.x, 7.5, -info.y);
  scene.add(player);
  updateCamera();
}

function addOtherPlayer(info, id) {
  const geom = new THREE.CylinderGeometry(5, 5, 15, 8);
  const mat = new THREE.MeshStandardMaterial({ color: 0x00aa00 });
  const other = new THREE.Mesh(geom, mat);
  other.position.set(info.x, 7.5, -info.y);
  otherPlayers[id] = other;
  scene.add(other);
}

function createBuilding(info) {
  const colors = [0x8b4513, 0x996633, 0x555555];
  const height = 60 + Math.random() * 40;
  const geom = new THREE.BoxGeometry(60, height, 60);
  const mat = new THREE.MeshLambertMaterial({ color: colors[info.state] });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(info.x, height / 2, -info.y);
  mesh.userData = { id: info.id, state: info.state };
  buildings[info.id] = mesh;
  scene.add(mesh);
}

function createMonster(info) {
  const geom = new THREE.SphereGeometry(15, 12, 12);
  const mat = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
  const m = new THREE.Mesh(geom, mat);
  m.position.set(info.x, 15, -info.y);
  monsters[info.id] = m;
  scene.add(m);
}

function initOfflineWorld() {
  function randomPos() {
    return Math.floor(Math.random() * 1800) + 100;
  }
  addPlayer({ x: 1000, y: 1000 });
  for (let i = 0; i < 30; i++) {
    createBuilding({ id: i, x: randomPos(), y: randomPos(), state: 0 });
  }
  for (let i = 0; i < 30; i++) {
    createMonster({ id: i, x: randomPos(), y: randomPos() });
  }
  document.getElementById('inventory').innerText = 'Offline Mode';
}

function updateCamera() {
  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 80;
  camera.lookAt(player.position);
}

function animate() {
  requestAnimationFrame(animate);
  if (player) {
    const speed = 1.5;
    let vx = 0;
    let vz = 0;
    if (joystickForce.x < -0.3) {
      vx = -speed;
    } else if (joystickForce.x > 0.3) {
      vx = speed;
    }
    if (joystickForce.y < -0.3) {
      vz = speed;
    } else if (joystickForce.y > 0.3) {
      vz = -speed;
    }
    player.position.x += vx;
    player.position.z += vz;
    if (vx !== 0 || vz !== 0) {
      updateCamera();
      if (!offlineMode) {
        socket.emit('playerMovement', {
          x: player.position.x,
          y: -player.position.z,
        });
      }
    }
  }
  renderer.render(scene, camera);
}
