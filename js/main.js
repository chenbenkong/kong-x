import * as THREE from 'three';
import { EffectComposer } from './vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/addons/postprocessing/OutputPass.js';
import { OrbitCam } from './controls.js';
import { buildEnvironment } from './environment.js';
import { buildStation } from './station.js';
import { initUI, updateLabels, showInfo } from './ui.js';

// ─────────────────────────────────────────
// 天宫立体课堂 · 主入口（含 UnrealBloom 科技泛光）
// ─────────────────────────────────────────
const canvas = document.getElementById('scene');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.42;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02040a);
scene.fog = null;

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 6000);

const env = buildEnvironment(scene, renderer);
const stationApi = buildStation(scene);

// ── 速度矢量流光带（暗示在轨高速飞行，沿 +X 运动方向）──
const trail = new THREE.Group(); scene.add(trail);
const TRAIL_N = 28, trailPts = [];
for (let i = 0; i < TRAIL_N; i++) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x39e0ff, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  m.position.set(-60 + i * (120 / TRAIL_N), 0, 0); trail.add(m); trailPts.push(m);
}
// 轨道弧线（地球外缘的青色光环，暗示运行轨道）
const orbitRing = new THREE.Mesh(
  new THREE.TorusGeometry(86, 0.18, 8, 160),
  new THREE.MeshBasicMaterial({ color: 0x00eaff, transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false })
);
orbitRing.rotation.x = Math.PI / 2; orbitRing.position.copy(env.earthCenter); scene.add(orbitRing);

const controls = new OrbitCam(camera, canvas);
controls.sph.set(46, 1.12, 0.55); controls.sphTo.copy(controls.sph);

// ── 后期：泛光 ──
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.45, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ── 聚焦某舱段 ──
function focusPart(id) {
  const part = stationApi.parts[id]; if (!part) return;
  const p = new THREE.Vector3();
  part.label.getWorldPosition(p);
  controls.flyTo(p, id === 'shenzhou' || id === 'tianzhou' ? 22 : 24, 1.2, controls.sphTo.theta);
  showInfo(id, focusPart);
}

const ui = initUI({ stationApi, controls, focusPart });

// ── 拾取 ──
const ray = new THREE.Raycaster();
let downXY = null;
canvas.addEventListener('pointerdown', e => { downXY = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => {
  if (!downXY) return;
  const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]);
  downXY = null;
  if (moved > 6) return;
  const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(stationApi.pickables, false);
  if (hits.length) {
    let o = hits[0].object;
    while (o && !o.userData.partId) o = o.parent;
    if (o) { focusPart(o.userData.partId); activeId = o.userData.partId; }
  }
});
let activeId = null;

// ── 遥测 ──
const PERIOD_S = 90 * 60;
let simSeconds = 0, distKm = 0;
const tlAlt = document.getElementById('tl-alt');
const tlOrb = document.getElementById('tl-orb');
const tlDist = document.getElementById('tl-dist');

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

// ── 主循环 ──
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const ts = ui.isRunning() ? ui.getTimeScale() : 0;

  env.update(dt, ts);
  simSeconds += dt * ts;
  distKm += 7.68 * dt * ts;

  const orbits = Math.floor(simSeconds / PERIOD_S);
  tlOrb.textContent = orbits.toLocaleString() + ' 圈';
  tlDist.textContent = (distKm / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' 万公里';
  tlAlt.textContent = (400 + Math.sin(simSeconds / 900) * 4).toFixed(1) + ' km';

  // 在轨动效
  stationApi.tick(dt, ts);
  if (ts > 0) {
    const span = 120;
    for (let i = 0; i < TRAIL_N; i++) {
      const x = -60 + ((simSeconds * 9 + i * (span / TRAIL_N)) % span);
      const d = Math.abs(x) / 60;
      trailPts[i].position.x = x;
      trailPts[i].material.opacity = 0.9 * (1 - d) + 0.05;
      trailPts[i].scale.setScalar(0.6 + (1 - d) * 0.8);
    }
    orbitRing.material.opacity = 0.18 + 0.1 * Math.sin(simSeconds * 0.5);
  }

  controls.update(dt);
  updateLabels(camera, stationApi.parts, ui.labelsVisible(), activeId);
  composer.render();
}
animate();

window.__tg = {
  renderer, scene, camera, composer, stationApi,
  setExplode: v => stationApi.applyExplode(v),
  setCutaway: v => stationApi.applyCut(v),
  setWings:   v => stationApi.applyWings(v ? 1 : 0),
  setView:    n => { import('./ui.js').then(m => m.applyView(n, controls, stationApi.parts)); },
  focusPart,
};
stationApi.applyCut(0);
