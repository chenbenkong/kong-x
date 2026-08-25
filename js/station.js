import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// 中国空间站「T」字构型程序化建模（参赛级细节 + 科幻动效）
// 坐标约定：天和轴向 = 世界 X 轴（节点舱朝 +X），T 字横梁沿世界 Z 轴
// ─────────────────────────────────────────────────────────────

// ── 程序化贴图 ──
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function makeHullTexture() {
  const c = cv(512, 256), g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 512, 256);
  bg.addColorStop(0, '#c8d0da'); bg.addColorStop(.5, '#d8e0ea'); bg.addColorStop(1, '#bcc4d0');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 256);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = x % 128 ? '#c4ccd6' : '#d6dee8'; g.fillRect(x, 0, 64, 256); }
  g.strokeStyle = 'rgba(80,100,120,.55)'; g.lineWidth = 2;
  for (let y = 18; y < 256; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  // 青色能量管线
  g.strokeStyle = 'rgba(0, 234, 255, .5)'; g.lineWidth = 2;
  for (let y = 28; y < 256; y += 68) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  g.fillStyle = 'rgba(90,110,130,.55)';
  for (let y = 34; y < 256; y += 34) for (let x = 32; x < 512; x += 64) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeFoil() {
  const c = cv(512, 256), g = c.getContext('2d');
  // 低饱和香槟银箔
  const grd = g.createLinearGradient(0, 0, 512, 256);
  grd.addColorStop(0, '#b9b196'); grd.addColorStop(.5, '#d6c9a6'); grd.addColorStop(1, '#a89c80');
  g.fillStyle = grd; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 260; i++) {
    g.strokeStyle = `rgba(${i%2?70:235},${i%2?80:225},${i%2?95:210},${0.04 + Math.random()*0.06})`;
    g.lineWidth = 0.6 + Math.random() * 1.4;
    g.beginPath();
    const x = Math.random()*512, y = Math.random()*256, a = Math.random()*Math.PI, l = 20 + Math.random()*120;
    g.moveTo(x, y); g.lineTo(x + Math.cos(a)*l, y + Math.sin(a)*l); g.stroke();
  }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(245,240,225,${Math.random()*0.08})`; g.fillRect(Math.random()*512, Math.random()*256, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function makePanelTexture() {
  const c = cv(512, 256), g = c.getContext('2d');
  g.fillStyle = '#040a16'; g.fillRect(0, 0, 512, 256);   // 深空底
  const cw = 512 / 16, ch = 256 / 8;
  for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) {
    const v = 0.7 + Math.random() * 0.3;
    const grad = g.createLinearGradient(i*cw, j*ch, i*cw+cw, j*ch+ch);
    grad.addColorStop(0, `rgb(${20*v|0},${120*v|0},${210*v|0})`);
    grad.addColorStop(1, `rgb(${8*v|0},${60*v|0},${150*v|0})`);
    g.fillStyle = grad; g.fillRect(i*cw+1.5, j*ch+1.5, cw-3, ch-3);
    if ((i+j) % 4 === 0) { g.fillStyle = 'rgba(120,225,255,.45)'; g.fillRect(i*cw+1.5, j*ch+1.5, cw-3, 2); }
  }
  g.strokeStyle = 'rgba(120,225,255,.5)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, 128); g.lineTo(512, 128); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeFlagTexture() {
  // 低调金属徽章式国旗：暗红底 + 发光金星，避免大红突兀
  const c = cv(220, 150), g = c.getContext('2d');
  g.fillStyle = '#7a1714'; g.fillRect(0, 0, 220, 150);
  g.fillStyle = '#ffcf3a';
  const R_big = 26, R_small = 9;
  const drawStar = (cx, cy, R, rot) => {
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const ao = rot + i * (Math.PI * 2 / 5), ai = ao + Math.PI / 5;
      const x1 = cx + Math.cos(ao) * R, y1 = cy + Math.sin(ao) * R;
      const x2 = cx + Math.cos(ai) * R * 0.382, y2 = cy + Math.sin(ai) * R * 0.382;
      i === 0 ? g.moveTo(x1, y1) : g.lineTo(x1, y1); g.lineTo(x2, y2);
    }
    g.closePath(); g.fill();
  };
  drawStar(42, 42, R_big, -Math.PI / 2);
  const stars = [[78,18],[94,36],[94,62],[78,80]];
  for (const [x, y] of stars) drawStar(x, y, R_small, Math.atan2(42 - y, 42 - x) + Math.PI / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeTextDecal(text, w = 320, h = 80, glow = '#7fe9ff') {
  const c = cv(w, h), g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  g.font = 'bold 56px "PingFang SC","Microsoft YaHei",sans-serif';
  g.fillStyle = '#e9f1ff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = glow; g.shadowBlur = 12;
  g.fillText(text, w/2, h/2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildStation(scene) {
  const hullTex  = makeHullTexture();
  const foilTex  = makeFoil();
  const panelTex = makePanelTexture();
  const flagTex  = makeFlagTexture();
  const tgTex    = makeTextDecal('天宫');

  const M = {
    hull:   new THREE.MeshStandardMaterial({ map: hullTex, metalness: .55, roughness: .5, color: 0xffffff }),
    hullD:  new THREE.MeshStandardMaterial({ color: 0xaab4c2, metalness: .6, roughness: .5 }),
    foil:   new THREE.MeshStandardMaterial({ map: foilTex, metalness: .82, roughness: .35, color: 0xffffff }),
    dark:   new THREE.MeshStandardMaterial({ color: 0x1b2230, metalness: .6, roughness: .5 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xff7a33, metalness: .5, roughness: .45, emissive: 0x3a1500, emissiveIntensity: .35 }),
    arm:    new THREE.MeshStandardMaterial({ color: 0xdfe6ef, metalness: .72, roughness: .3 }),
    joint:  new THREE.MeshStandardMaterial({ color: 0x2a3038, metalness: .6, roughness: .35, emissive: 0x00eaff, emissiveIntensity: .55 }),
    white:  new THREE.MeshStandardMaterial({ color: 0xeef3f8, metalness: .3, roughness: .5 }),
    rackA:  new THREE.MeshStandardMaterial({ color: 0x2f6fb2, roughness: .7 }),
    rackB:  new THREE.MeshStandardMaterial({ color: 0x6fa8c9, roughness: .7 }),
    rackC:  new THREE.MeshStandardMaterial({ color: 0x9aa7b5, roughness: .7 }),
    panel:  new THREE.MeshStandardMaterial({ map: panelTex, emissive: 0x1a90ff, emissiveMap: panelTex, emissiveIntensity: .9, metalness: .3, roughness: .5, side: THREE.DoubleSide }),
    window: new THREE.MeshStandardMaterial({ color: 0x06121f, emissive: 0x39e0ff, emissiveIntensity: 1.6, roughness: .3 }),
    flag:   new THREE.MeshStandardMaterial({ map: flagTex, emissive: 0xff3b30, emissiveMap: flagTex, emissiveIntensity: .5, side: THREE.DoubleSide, transparent: true, metalness: .2, roughness: .6 }),
    label:  new THREE.MeshBasicMaterial({ map: tgTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  };
  const hullMats = [M.hull, M.hullD, M.foil];
  const rackMeshes = [];
  const pickables = [];
  const wings = [];
  const arms = [];
  const thrusterGlows = [];
  let wingDeploy = 1;
  const parts = {};
  const root = new THREE.Group(); scene.add(root);

  const cylX = (r, len, mat, seg = 48) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat); m.rotation.z = Math.PI / 2; return m; };
  const coneX = (r1, r2, len, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, len, 48), mat); m.rotation.z = Math.PI / 2; return m; };
  const ring = (r, tube, mat) => new THREE.Mesh(new THREE.TorusGeometry(r, tube, 16, 48), mat);
  const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

  function tagPick(group, id) { group.traverse(o => { if (o.isMesh) { o.userData.partId = id; pickables.push(o); } }); }

  function detailHull(group, r, len, cx) {
    for (const yy of [r + 0.05, -(r + 0.05)]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, len * 0.92, 8), M.arm);
      rail.rotation.z = Math.PI / 2; rail.position.set(cx, yy, 0); group.add(rail);
      for (let i = -2; i <= 2; i++) { const h = box(0.12, 0.5, 0.12, M.arm); h.position.set(cx + i * len * 0.2, yy > 0 ? yy + 0.25 : yy - 0.25, 0); group.add(h); }
    }
    for (let i = -1; i <= 1; i++) {
      const w = box(0.45, 0.45, 0.1, M.window); w.position.set(cx + i * len * 0.28, r + 0.02, 0); group.add(w);
    }
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.02, r + 0.02, len * 0.96, 48, 1, true), M.dark);
    stripe.rotation.z = Math.PI / 2; stripe.position.x = cx; stripe.material = new THREE.MeshStandardMaterial({ color: 0x1c2230, metalness: .5, roughness: .6, transparent: true, opacity: .35 }); group.add(stripe);
  }

  function addDecal(group, x, y, w, h, tex, mat) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat || M.flag);
    p.position.set(x, y, 0); p.rotation.x = -Math.PI / 2; group.add(p); return p;
  }

  function addRacks(parent, cx, cz, len, r, n, seed = 0) {
    for (let i = 0; i < n; i++) {
      const a = seed + i * 2.399963;
      const m = new THREE.Mesh(new THREE.BoxGeometry(len * 0.72, r * 0.85, r * 0.5), [M.rackA, M.rackB, M.rackC][i % 3]);
      m.position.set(cx + (i % 3 - 1) * len * 0.28, Math.sin(a) * r * 0.62, cz + Math.cos(a) * r * 0.62);
      m.rotation.x = a; parent.add(m); rackMeshes.push(m);
    }
  }

  function makeWing(pivotPos, parent, span, width, foldAxis, foldFrom, deployTo) {
    const pivot = new THREE.Group(); pivot.position.copy(pivotPos);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(span * 0.92, 0.16, width + 0.3), M.arm); frame.position.set(span * 0.52, -0.1, 0); pivot.add(frame);
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(span * 0.86, 0.1, width), M.panel); blanket.position.set(span * 0.52, -0.02, 0); pivot.add(blanket);
    const boom = box(span * 0.9, 0.18, 0.18, M.dark); boom.position.set(span * 0.5, 0.1, 0); pivot.add(boom);
    const tip = box(span * 0.05, 0.36, width + 0.3, M.dark); tip.position.set(span, 0, 0); pivot.add(tip);
    parent.add(pivot); wings.push({ pivot, foldAxis, foldAngle: foldFrom, deployAngle: deployTo, phase: Math.random() * 6.28 });
    return pivot;
  }

  function makeThruster(posVec, parent, color = 0x39e0ff) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: 1.2, transparent: true, opacity: .7, depthWrite: false })
    );
    m.position.copy(posVec); m.userData.ph = Math.random() * 6.28; parent.add(m); thrusterGlows.push(m); return m;
  }

  // ═══════════ 天和核心舱 ═══════════
  const tianhe = new THREE.Group(); root.add(tianhe); parts.tianhe = { group: tianhe };
  {
    const res = new THREE.Group();
    const resBody = cylX(1.5, 3.6, M.foil); resBody.position.x = -6.4; res.add(resBody);
    const cap = cylX(1.2, 0.7, M.dark); cap.position.x = -8.4; res.add(cap);
    for (let i = 0; i < 4; i++) { const th = coneX(0.18, 0.32, 0.5, M.dark); th.position.set(-8.7, Math.cos(i*1.57)*1.0, Math.sin(i*1.57)*1.0); res.add(th); }
    makeWing(new THREE.Vector3(0, 0,  1.2), res, 12, 4.2, 'y', 0, -Math.PI / 2);
    makeWing(new THREE.Vector3(0, 0, -1.2), res, 12, 4.2, 'y', 0,  Math.PI / 2);
    res.userData.explodeDir = new THREE.Vector3(-6, 0, 0); tianhe.add(res);

    const big = new THREE.Group();
    const b1 = cylX(2.1, 7, M.hull); b1.position.x = -0.6; big.add(b1);
    detailHull(big, 2.1, 7, -0.6);
    const r1 = ring(2.02, 0.09, M.orange); r1.rotation.y = Math.PI / 2; r1.position.x = 2.6; big.add(r1);
    addRacks(big, -0.6, 0, 6.4, 2.05, 12);
    addDecal(big, -0.6, 2.18, 3.0, 1.8, flagTex, M.flag);
    addDecal(big, 1.6, 2.18, 2.2, 0.9, tgTex, M.label);
    big.userData.explodeDir = new THREE.Vector3(0, 0, 0); tianhe.add(big);

    const cone = coneX(2.1, 1.45, 1.8, M.hull); cone.position.x = 3.7; tianhe.add(cone);
    const small = new THREE.Group();
    const s1 = cylX(1.45, 4, M.hullD); s1.position.x = 6.4; small.add(s1); detailHull(small, 1.45, 4, 6.4);
    const r2 = ring(1.4, 0.08, M.arm); r2.rotation.y = Math.PI / 2; r2.position.x = 6.4; small.add(r2);
    addRacks(small, 6.4, 0, 3.4, 1.4, 6, 2);
    small.userData.explodeDir = new THREE.Vector3(4, 0, 0); tianhe.add(small);

    // 大机械臂
    const arm = new THREE.Group();
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), M.joint); arm.add(shoulder);
    const mkSeg = (len, rr, px, py, rot) => {
      const s = cylX(rr, len, M.arm); s.position.set(px, py, 0); s.rotation.z = rot; arm.add(s);
      const jr = ring(rr+0.02, 0.05, M.joint); jr.rotation.y = Math.PI/2; jr.position.set(px + Math.cos(rot)*len/2, py + Math.sin(rot)*len/2, 0); arm.add(jr); return s;
    };
    mkSeg(3.4, 0.26, 1.5, 0.62, Math.PI/2 - 0.35);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), M.joint); elbow.position.set(3.1, 1.2, 0); arm.add(elbow);
    mkSeg(2.9, 0.22, 5.0, 0.5, Math.PI/2 + 0.5);
    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), M.joint); wrist.position.set(6.3, -0.1, 0); arm.add(wrist);
    arm.position.set(3.4, 2.15, 0); tianhe.add(arm); arms.push(arm);

    const node = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.65, 48, 32), M.hull); node.add(ball);
    const stub = (dir, len, rr) => {
      const holder = new THREE.Group();
      const s = cylX(rr, len, M.hullD); s.position.x = len / 2 + rr * 0.4; holder.add(s);
      const capRing = ring(rr, 0.1, M.dark); capRing.rotation.y = Math.PI/2; capRing.position.x = len + rr*0.4; holder.add(capRing);
      holder.rotation.y = dir; return holder;
    };
    node.add(stub(0, 1.4, 0.95)); node.add(stub(Math.PI/2, 1.2, 0.8)); node.add(stub(-Math.PI/2, 1.2, 0.8));
    node.position.x = 8.6; node.userData.explodeDir = new THREE.Vector3(7, 0, 0); tianhe.add(node);

    const ant = new THREE.Group();
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 12, 0, Math.PI*2, 0, Math.PI*0.42), M.white); dish.rotation.x = Math.PI; ant.add(dish);
    const mast = box(0.1, 1.4, 0.1, M.dark); mast.position.y = -0.7; ant.add(mast);
    ant.position.set(-0.6, 2.3, 0); tianhe.add(ant);

    tianhe.userData.explodeDir = new THREE.Vector3(0, 0, 0); tagPick(tianhe, 'tianhe');
  }

  // ═══════════ 实验舱通用构造 ═══════════
  function buildLab(id, isWentian) {
    const g = new THREE.Group();
    const work = cylX(2.1, 8.6, M.hull); work.position.x = 0.2; g.add(work); detailHull(g, 2.1, 8.6, 0.2);
    const rr = ring(2.02, 0.09, M.orange); rr.rotation.y = Math.PI / 2; rr.position.x = 3.4; g.add(rr);
    addRacks(g, 0.2, 0, 7.8, 2.05, 14, isWentian ? 1 : 3);
    addDecal(g, 0.2, 2.18, 2.6, 1.6, flagTex, M.flag);
    const fn = cylX(1.8, 3.4, isWentian ? M.hull : M.hullD); fn.position.x = 6.2; g.add(fn); detailHull(g, 1.8, 3.4, 6.2);
    if (!isWentian) {
      const plat = box(2.4, 0.16, 3.2, M.dark); plat.position.set(8.6, -0.9, 0); g.add(plat);
      const exp1 = box(0.9, 0.5, 0.9, M.foil); exp1.position.set(8.6, -0.55, -0.8); g.add(exp1);
      const exp2 = box(0.9, 0.5, 0.9, M.foil); exp2.position.set(8.6, -0.55, 0.8); g.add(exp2);
    } else {
      const hatch = cylX(1.0, 1.1, M.hullD); hatch.rotation.z = Math.PI / 2; hatch.rotation.y = Math.PI / 2; hatch.position.set(6.2, 1.9, 0); g.add(hatch);
    }
    const res = cylX(1.5, 3.2, M.foil); res.position.x = 9.4; g.add(res);
    const truss = box(1.6, 0.5, 0.5, M.arm); truss.position.x = 11.6; g.add(truss);
    makeWing(new THREE.Vector3(11.9, 0, 0), g, 14.5, 5.2, 'y', 0, -Math.PI / 2);
    makeWing(new THREE.Vector3(11.9, 0, 0), g, 14.5, 5.2, 'y', 0,  Math.PI / 2);
    const collar = cylX(1.15, 1.3, M.hullD); collar.position.x = -4.9; g.add(collar);
    const cr = ring(1.05, 0.1, M.dark); cr.rotation.y = Math.PI / 2; cr.position.x = -5.5; g.add(cr);
    if (isWentian) {
      const sa = new THREE.Group();
      const s1 = cylX(0.16, 2.2, M.arm); s1.rotation.z = Math.PI / 2 - 0.4; s1.position.set(1.0, 2.5, 0); sa.add(s1);
      const j = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), M.joint); j.position.set(2.0, 2.9, 0); sa.add(j);
      const s2 = cylX(0.13, 1.9, M.arm); s2.rotation.z = Math.PI / 2 + 0.55; s2.position.set(2.9, 2.3, 0); sa.add(s2);
      sa.position.x = 4.6; g.add(sa);
    }
    tagPick(g, id); return g;
  }

  const wentian = buildLab('wentian', true);
  wentian.rotation.y = -Math.PI / 2; wentian.position.set(8.6, 0, 11.4);
  wentian.userData.explodeDir = new THREE.Vector3(0, 2.5, 15); root.add(wentian); parts.wentian = { group: wentian };

  const mengtian = buildLab('mengtian', false);
  mengtian.rotation.y = Math.PI / 2; mengtian.position.set(8.6, 0, -11.4);
  mengtian.userData.explodeDir = new THREE.Vector3(0, 2.5, -15); root.add(mengtian); parts.mengtian = { group: mengtian };

  // ═══════════ 神舟载人飞船 ════════════
  const shenzhou = new THREE.Group();
  {
    const orb = cylX(1.25, 2.8, M.hull); orb.position.x = 12.4; shenzhou.add(orb); detailHull(shenzhou, 1.25, 2.8, 12.4);
    const ret = coneX(1.25, 0.7, 2.6, M.hullD); ret.position.x = 15.1; shenzhou.add(ret);
    const nose = cylX(0.35, 0.8, M.dark); nose.rotation.z = -Math.PI / 2; nose.position.x = 16.8; shenzhou.add(nose);
    const svc = cylX(1.5, 3.2, M.foil); svc.position.x = 9.4; shenzhou.add(svc);
    [-0.5, 0.5].forEach(dz => { const p = box(3.4, 0.08, 1.4, M.white); p.position.set(9.4, 0.2, dz * 1.6); p.rotation.x = dz * 0.35; shenzhou.add(p); });
    const col = cylX(0.9, 0.9, M.dark); col.position.x = 10.9; col.rotation.z = Math.PI / 2; shenzhou.add(col);
    const r = ring(1.28, 0.08, M.orange); r.rotation.y = Math.PI / 2; r.position.x = 13.9; shenzhou.add(r);
    makeThruster(new THREE.Vector3(17.4, 0, 0), shenzhou);
  }
  shenzhou.userData.explodeDir = new THREE.Vector3(16, 0, 0); root.add(shenzhou); parts.shenzhou = { group: shenzhou };

  // ═══════════ 天舟货运飞船 ════════════
  const tianzhou = new THREE.Group();
  {
    const cargo = cylX(1.68, 4.4, M.hull); cargo.position.x = -11.2; tianzhou.add(cargo); detailHull(tianzhou, 1.68, 4.4, -11.2);
    const prop = cylX(1.68, 3.6, M.foil); prop.position.x = -15.2; tianzhou.add(prop);
    [-1, 1].forEach(s => { const p = box(3.0, 0.08, 1.3, M.white); p.position.set(-15.2, 0.2, s * 1.7); p.rotation.x = s * 0.3; tianzhou.add(p); });
    const col = cylX(0.95, 0.9, M.dark); col.position.x = -8.9; tianzhou.add(col);
    const r = ring(1.5, 0.08, M.orange); r.rotation.y = Math.PI / 2; r.position.x = -13.4; tianzhou.add(r);
    makeThruster(new THREE.Vector3(-17.0, 0, 0), tianzhou);
  }
  tianzhou.userData.explodeDir = new THREE.Vector3(-14, 0, 0); root.add(tianzhou); parts.tianzhou = { group: tianzhou };

  // ── 标注锚点 ──
  const anchorDefs = {
    tianhe:   [parts.tianhe.group,  new THREE.Vector3(0, 2.6, 0)],
    wentian:  [parts.wentian.group, new THREE.Vector3(0.2, 2.6, 0)],
    mengtian: [parts.mengtian.group,new THREE.Vector3(0.2, 2.6, 0)],
    shenzhou: [shenzhou,            new THREE.Vector3(13.5, 1.8, 0)],
    tianzhou: [tianzhou,            new THREE.Vector3(-13, 1.9, 0)],
  };
  for (const id in anchorDefs) {
    const a = new THREE.Object3D(); a.position.copy(anchorDefs[id][1]); anchorDefs[id][0].add(a); parts[id].label = a;
  }

  // ── 状态应用 ──
  const basePos = new Map();
  for (const o of [tianhe, ...tianhe.children, wentian, mengtian, shenzhou, tianzhou]) basePos.set(o, o.position.clone());
  function applyExplode(t) {
    for (const [o, base] of basePos) { const d = o.userData.explodeDir; if (!d) continue; o.position.copy(base).addScaledVector(d, t); }
  }
  function applyCut(v) {
    for (const m of hullMats) { m.transparent = v > 0.02; m.opacity = 1 - v * 0.88; m.depthWrite = v <= 0.02; }
    for (const rk of rackMeshes) rk.visible = v > 0.04;
  }
  function applyWings(deploy01) { wingDeploy = deploy01; }
  applyWings(1);

  // ── 在轨动效：姿态微动 + 太阳翼对日 + 机械臂摆动 + 推进器脉冲 ──
  let tAcc = 0;
  function tick(dt, ts) {
    tAcc += dt * ts;
    root.rotation.y = Math.sin(tAcc * 0.15) * 0.06;
    root.rotation.z = Math.sin(tAcc * 0.11 + 1.3) * 0.035;
    root.rotation.x = Math.sin(tAcc * 0.09 + 2.1) * 0.02;
    for (const w of wings) {
      const base = THREE.MathUtils.lerp(w.foldAngle, w.deployAngle, wingDeploy);
      const axis = w.foldAxis === 'x' ? 'x' : 'z';
      w.pivot.rotation[axis] = base + Math.sin(tAcc * 0.4 + w.phase) * 0.12;
    }
    if (arms.length) { arms[0].rotation.y = Math.sin(tAcc * 0.5) * 0.13; arms[0].rotation.z = Math.cos(tAcc * 0.4) * 0.06; }
    for (const g of thrusterGlows) {
      const e = 1.0 + Math.sin(tAcc * 3 + g.userData.ph) * 0.7;
      g.material.emissiveIntensity = e; g.material.opacity = 0.5 + e * 0.25;
      g.scale.setScalar(0.85 + Math.sin(tAcc * 3 + g.userData.ph) * 0.22);
    }
  }
  tick(0.01, 1);

  return { parts, pickables, wings, root, tick, applyExplode, applyCut, applyWings };
}
