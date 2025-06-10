// Load Three.js served from node_modules without using a bundler
import * as THREE from '/vendor/three.module.js';
import io from '/socket.io/socket.io.js';

const socket = io();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game') });
renderer.setSize(window.innerWidth, window.innerHeight);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

const players = new Map();

socket.on('init', (serverPlayers) => {
  for (const p of serverPlayers) {
    if (p.id !== socket.id) addRemotePlayer(p);
  }
});

socket.on('player-joined', addRemotePlayer);
socket.on('player-left', (id) => {
  const obj = players.get(id);
  if (obj) {
    scene.remove(obj);
    players.delete(id);
  }
});

socket.on('player-updated', (data) => {
  const obj = players.get(data.id);
  if (obj) {
    obj.position.set(data.x, data.y, data.z);
  }
});

function addRemotePlayer(data) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  mesh.position.set(data.x, data.y, data.z);
  players.set(data.id, mesh);
  scene.add(mesh);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

function sendUpdate() {
  const { x, y, z } = cube.position;
  socket.emit('update', { x, y, z });
}

window.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW':
      cube.position.z -= 0.1;
      break;
    case 'ArrowDown':
    case 'KeyS':
      cube.position.z += 0.1;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      cube.position.x -= 0.1;
      break;
    case 'ArrowRight':
    case 'KeyD':
      cube.position.x += 0.1;
      break;
  }
  sendUpdate();
});
