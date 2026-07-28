// Three.js 3D Background Setup
let scene, camera, renderer, particles;

function init3D() {
  const container = document.getElementById('canvas-container');
  if (!container || typeof THREE === 'undefined') return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 400;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Particles mesh
  const geometry = new THREE.BufferGeometry();
  const count = 600;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 1200;
    positions[i + 1] = (Math.random() - 0.5) * 1200;
    positions[i + 2] = (Math.random() - 0.5) * 1200;

    colors[i] = 0.38; // R (indigo)
    colors[i + 1] = 0.4; // G
    colors[i + 2] = 0.94; // B
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 3,
    vertexColors: true,
    transparent: true,
    opacity: 0.6
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);

  window.addEventListener('resize', onWindowResize);
  document.addEventListener('mousemove', onMouseMove);

  animate();
}

let mouseX = 0, mouseY = 0;

function onMouseMove(event) {
  mouseX = (event.clientX - window.innerWidth / 2) * 0.05;
  mouseY = (event.clientY - window.innerHeight / 2) * 0.05;
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if (particles) {
    particles.rotation.y += 0.001;
    particles.rotation.x += 0.0005;
  }
  if (camera) {
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
  }
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Modal Handlers
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function submitForm(e) {
  e.preventDefault();
  alert('Thank you for your commercial inquiry! Our team will contact your institution shortly.');
  closeModal('demoModal');
}

// ROI Update Function
function updateRoi() {
  const students = parseInt(document.getElementById('studentRange').value);
  const faculty = parseInt(document.getElementById('facultyRange').value);

  document.getElementById('studentVal').innerText = students.toLocaleString() + ' Students';
  document.getElementById('facultyVal').innerText = faculty.toLocaleString() + ' Faculty';

  const hours = faculty * 16 * 10;
  const money = (students * 320) / 1000;

  document.getElementById('roiHours').innerText = hours.toLocaleString();
  document.getElementById('roiMoney').innerText = '₹' + money.toFixed(1) + 'k';
}

function showModuleDetails(id) {
  openModal('demoModal');
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  init3D();
});
