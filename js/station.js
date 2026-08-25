import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// 中国空间站「T」字构型程序化建模（参赛级细节 + 真实内部子系统 + 科幻动效）
// 坐标约定：天和轴向 = 世界 X 轴（节点舱朝 +X），T 字横梁沿世界 Z 轴
// 每个舱 = 外壳(可剖切透明) + 若干内部子系统(可点击查看专业信息卡)
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
    hull:   new THREE.MeshStandardMaterial({ map: hullTex, metalness: .55, roughness: .5, color: 0xffffff, emissive: 0xffffff, emissiveMap: hullTex, emissiveIntensity: .32 }),
    hullD:  new THREE.MeshStandardMaterial({ color: 0xc4cdda, metalness: .6, roughness: .5, emissive: 0x9fb0c4, emissiveIntensity: .35 }),
    foil:   new THREE.MeshStandardMaterial({ map: foilTex, metalness: .82, roughness: .35, color: 0xffffff, emissive: 0xfff0d0, emissiveMap: foilTex, emissiveIntensity: .28 }),
    dark:   new THREE.MeshStandardMaterial({ color: 0x1b2230, metalness: .6, roughness: .5 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xff7a33, metalness: .5, roughness: .45, emissive: 0x3a1500, emissiveIntensity: .3 }),
    arm:    new THREE.MeshStandardMaterial({ color: 0xdfe6ef, metalness: .72, roughness: .3 }),
    joint:  new THREE.MeshStandardMaterial({ color: 0x2a3038, metalness: .6, roughness: .35, emissive: 0x00eaff, emissiveIntensity: .4 }),
    white:  new THREE.MeshStandardMaterial({ color: 0xeef3f8, metalness: .3, roughness: .5 }),
    rackA:  new THREE.MeshStandardMaterial({ color: 0x2f6fb2, roughness: .7 }),
    rackB:  new THREE.MeshStandardMaterial({ color: 0x6fa8c9, roughness: .7 }),
    rackC:  new THREE.MeshStandardMaterial({ color: 0x9aa7b5, roughness: .7 }),
    // 太阳翼单板（细分格，弱化发光避免过曝）
    panel:  new THREE.MeshStandardMaterial({ map: panelTex, emissive: 0x1a90ff, emissiveMap: panelTex, emissiveIntensity: .5, metalness: .3, roughness: .5, side: THREE.DoubleSide }),
    window: new THREE.MeshStandardMaterial({ color: 0x06121f, emissive: 0x39e0ff, emissiveIntensity: 0.9, roughness: .3 }),
    flag:   new THREE.MeshStandardMaterial({ map: flagTex, emissive: 0xff3b30, emissiveMap: flagTex, emissiveIntensity: .4, side: THREE.DoubleSide, transparent: true, metalness: .2, roughness: .6 }),
    label:  new THREE.MeshBasicMaterial({ map: tgTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
    // ── 内部子系统专用材质 ──
    ecs:    new THREE.MeshStandardMaterial({ color: 0x2fa9a0, metalness: .5, roughness: .5, emissive: 0x0c3a36, emissiveIntensity: .35 }),
    ecsOxy: new THREE.MeshStandardMaterial({ color: 0x2f7fb2, metalness: .5, roughness: .5, emissive: 0x0c2a3a, emissiveIntensity: .35 }),
    ecsCo2: new THREE.MeshStandardMaterial({ color: 0x4a8a5a, metalness: .5, roughness: .5, emissive: 0x103018, emissiveIntensity: .35 }),
    cmg:    new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: .85, roughness: .3 }),
    gyro:   new THREE.MeshStandardMaterial({ color: 0xd8dde4, metalness: .8, roughness: .25 }),
    sleep:  new THREE.MeshStandardMaterial({ color: 0x35506b, metalness: .4, roughness: .6 }),
    shelf:  new THREE.MeshStandardMaterial({ color: 0x9a7b54, metalness: .4, roughness: .6 }),
    dock:   new THREE.MeshStandardMaterial({ color: 0xc2cad6, metalness: .7, roughness: .35 }),
    dockRing:new THREE.MeshStandardMaterial({ color: 0xff8c42, metalness: .6, roughness: .4, emissive: 0x301200, emissiveIntensity: .45 }),
    sada:   new THREE.MeshStandardMaterial({ color: 0xff8c42, metalness: .6, roughness: .4, emissive: 0x301200, emissiveIntensity: .45 }),
    grip:   new THREE.MeshStandardMaterial({ color: 0x2a3038, metalness: .6, roughness: .35, emissive: 0x00eaff, emissiveIntensity: .45 }),
    thrust: new THREE.MeshStandardMaterial({ color: 0x111319, emissive: 0x9fe8ff, emissiveIntensity: 0.7, transparent: true, opacity: .7, depthWrite: false }),
    lamp:   new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xfff0c0, emissiveIntensity: 1.0 }),
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

  // ── 空间站专属补光（仅照亮 ±70 内，不波及下方地球）──
  const fillA = new THREE.PointLight(0xdfeeff, 2600, 72, 2); fillA.position.set(26, 34, 30); scene.add(fillA);
  const fillB = new THREE.PointLight(0xbfd8ff, 1500, 72, 2); fillB.position.set(-32, -16, -26); scene.add(fillB);

  const cylX = (r, len, mat, seg = 48) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat); m.rotation.z = Math.PI / 2; return m; };
  const coneX = (r1, r2, len, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, len, 48), mat); m.rotation.z = Math.PI / 2; return m; };
  const ring = (r, tube, mat) => new THREE.Mesh(new THREE.TorusGeometry(r, tube, 16, 48), mat);
  const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

  // 自动登记 partId → 生成 label 锚点（修复「点击子系统无响应」：focusPart 依赖 parts[id].label）
  function registerPart(id, group) {
    if (parts[id]) return;
    const box = new THREE.Box3().setFromObject(group);
    const c = box.getCenter(new THREE.Vector3());
    const label = new THREE.Object3D();
    group.add(label);
    label.position.copy(group.worldToLocal(c.clone()));
    parts[id] = { group, label };
  }

  // 爆炸时把内部子系统「抽」出舱体的偏移表（舱段主组由下方 explodables 注册）
  const explodeNodes = [];
  let explodeSeq = 0;
  function regExplode(obj, dir) {
    dir = dir.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), (explodeSeq++ % 8) * 0.22); // 轻微扇形分散避免叠在一起
    explodeNodes.push({ obj, base: obj.position.clone(), dir });
  }

  // 注册可拾取 mesh：skipIfSet=true 时跳过已有 partId（用于整舱打标不覆盖内部子系统）
  function tagPick(group, id, skipIfSet) {
    group.traverse(o => {
      if (o.isMesh && !(skipIfSet && o.userData.partId)) { o.userData.partId = id; pickables.push(o); }
    });
    registerPart(id, group);
    // 内部子系统（非整舱）：爆炸时从舱体内抽出，散到舱体外侧，便于观察与点选
    if (!skipIfSet) {
      let rep = new THREE.Vector3();
      group.traverse(o => { if (rep.lengthSq() === 0 && o.isMesh) rep.copy(o.position); });
      const radial = new THREE.Vector3(0, rep.y, rep.z);
      if (radial.lengthSq() < 0.04) radial.set(0, 1, 0);
      radial.normalize();
      const dir = radial.multiplyScalar(4.2);
      dir.y += 1.6;                       // 抬离舱体，散到外侧
      regExplode(group, dir);
    }
  }

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

  // ══════════ 内部子系统构造（先填 mesh 再注册）══════════

  // 异体同构周边式对接机构：对接框 + 中心密封 + 8 导向瓣 + 捕获锁
  function makeDock(parent, x, partId) {
    const g = new THREE.Group(); g.position.x = x;
    const frame = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.45, 24, 1, true), M.dock); frame.rotation.z = Math.PI / 2; g.add(frame);
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.14, 24), M.dockRing); seal.rotation.z = Math.PI / 2; g.add(seal);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.22), M.dock);
      petal.position.set(0, Math.cos(a) * 1.02, Math.sin(a) * 1.02);
      petal.lookAt(2, Math.cos(a) * 2.4, Math.sin(a) * 2.4); g.add(petal);
    }
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2;
      const claw = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.32), M.dockRing);
      claw.position.set(0.12, Math.cos(a) * 0.72, Math.sin(a) * 0.72); g.add(claw);
    }
    parent.add(g); tagPick(g, partId); return g;
  }

  // 再生生保系统：三个独立功能机柜（尿处理/水循环 · 电解制氧 · CO₂ 去除）
  function makeECS(parent, cx, ids) {
    const conf = [
      { id: ids[0], mat: M.ecs,   feat: 'water' },
      { id: ids[1], mat: M.ecsOxy, feat: 'oxy' },
      { id: ids[2], mat: M.ecsCo2, feat: 'co2' },
    ];
    for (const c of conf) {
      const sub = new THREE.Group();
      const a = -0.55 + conf.indexOf(c) * 0.55;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.05, 0.95), c.mat);
      cab.position.set(0, Math.sin(a) * 1.55, Math.cos(a) * 1.55); cab.lookAt(sub.position); sub.add(cab);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.34, 0.05), M.dark);
      panel.position.copy(cab.position); panel.lookAt(0, 0, 0); panel.translateZ(0.5); sub.add(panel);
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), M.window);
      led.position.copy(cab.position); led.position.x += 0.4; sub.add(led);
      if (c.feat === 'water') { const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 16), M.arm); ring1.position.copy(cab.position); ring1.translateZ(0.55); sub.add(ring1); }
      if (c.feat === 'oxy')   { const bub = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshStandardMaterial({ color: 0x9fe8ff, emissive: 0x39c0ff, emissiveIntensity: .85 })); bub.position.copy(cab.position); bub.translateZ(0.55); sub.add(bub); }
      if (c.feat === 'co2')   { const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 12), M.ecsCo2); tube.position.copy(cab.position); tube.translateZ(0.55); sub.add(tube); }
      parent.add(sub); tagPick(sub, c.id);
    }
    return parent;
  }

  // 控制力矩陀螺(CMG)：4 个陀螺金字塔布局，负责无燃料姿态调整
  function makeCMG(parent, cx, partId) {
    const g = new THREE.Group(); g.position.x = cx;
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2;
      const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16), M.cmg);
      housing.position.set(0, Math.sin(a) * 1.0, Math.cos(a) * 1.0); housing.lookAt(g.position); g.add(housing);
      const rotor = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 8, 20), M.gyro);
      rotor.position.copy(housing.position); g.add(rotor);
    }
    parent.add(g); tagPick(g, partId); return g;
  }

  // 航天员睡眠区：3 个独立睡眠舱
  function makeSleep(parent, cx, partId) {
    const g = new THREE.Group(); g.position.x = cx;
    for (let i = 0; i < 3; i++) {
      const a = -0.7 + i * 0.7;
      const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.0, 4, 12), M.sleep);
      pod.position.set(-2.2 + i * 2.2, Math.sin(a) * 1.3, Math.cos(a) * 1.3); pod.rotation.z = a; g.add(pod);
    }
    parent.add(g); tagPick(g, partId); return g;
  }

  // 生活支持：太空锻炼设备 + 餐厨支持区（两个独立可点击部件）
  function makeLiving(parent, cx, exId, galId) {
    const ex = new THREE.Group(); ex.position.set(cx - 1.7, 0, 0);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 1.4), M.dark); ex.add(frame);
    const belt = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.7), M.arm); belt.position.y = 0.32; ex.add(belt);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8), M.arm); post.position.set(0.9, 0.85, 0); ex.add(post);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16), M.joint); handle.position.set(-0.9, 0.95, 0); handle.rotation.y = Math.PI / 2; ex.add(handle);
    parent.add(ex); tagPick(ex, exId);
    const gal = new THREE.Group(); gal.position.set(cx + 1.9, 0, 0);
    const box1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.8), M.rackB); gal.add(box1);
    const microwave = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), M.arm); microwave.position.set(0, 0.9, 0); gal.add(microwave);
    const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8), M.window); tap.position.set(0.4, 0.55, 0.4); gal.add(tap);
    parent.add(gal); tagPick(gal, galId);
    return parent;
  }

  // 霍尔电推进：资源舱尾部的电推喷口阵列
  function makeHall(parent, x, partId) {
    const g = new THREE.Group(); g.position.x = x;
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2;
      const thr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 0.5, 12), M.dark);
      thr.position.set(0, Math.cos(a) * 0.9, Math.sin(a) * 0.9); thr.rotation.z = Math.PI / 2; g.add(thr);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), M.thrust);
      glow.position.set(0.28, Math.cos(a) * 0.9, Math.sin(a) * 0.9); g.add(glow);
    }
    parent.add(g); tagPick(g, partId); return g;
  }

  // 按科研类型分组的实验机柜群（每组独立可点击，并带识别特征小件）
  function makeRacksDetailed(parent, cx, groups) {
    for (const grp of groups) {
      const g = new THREE.Group(); g.position.x = cx;
      const n = grp.n || 3;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.3, 0.85), [M.rackA, M.rackB, M.rackC][i % 3]);
        cab.position.set(0, Math.sin(a) * 1.75, Math.cos(a) * 1.75); cab.lookAt(g.position); g.add(cab);
        for (let k = 0; k < 3; k++) {
          const dr = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.5, 0.05), M.dark);
          dr.position.copy(cab.position); dr.lookAt(0, 0, 0);
          dr.translateZ(0.46); dr.translateY(-0.6 + k * 0.6); g.add(dr);
        }
        const fp = cab.position.clone(); fp.z += 0.5;
        if (grp.kind === 'plant')      { const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: 0x6fd66f, emissive: 0x1f7a1f, emissiveIntensity: .5 })); leaf.position.copy(fp); g.add(leaf); }
        if (grp.kind === 'cell')       { const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16), new THREE.MeshStandardMaterial({ color: 0x9fe8ff, emissive: 0x39c0ff, emissiveIntensity: .7 })); dish.rotation.x = Math.PI / 2; dish.position.copy(fp); g.add(dish); }
        if (grp.kind === 'eco')        { const soil = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.6), M.shelf); soil.position.set(0, Math.sin(a) * 1.75 - 0.85, Math.cos(a) * 1.75); g.add(soil); }
        if (grp.kind === 'burner')     { const flame = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xff6600, emissiveIntensity: .9 })); flame.position.copy(fp); g.add(flame); }
        if (grp.kind === 'fluid')      { const pipe = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 8, 16), M.arm); pipe.position.copy(fp); g.add(pipe); }
        if (grp.kind === 'coldatom')   { const trap = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 20), new THREE.MeshStandardMaterial({ color: 0x222a35, emissive: 0x00eaff, emissiveIntensity: .6 })); trap.position.copy(fp); g.add(trap); }
        if (grp.kind === 'micrograv')  { const sp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffaa44, emissiveIntensity: .7 })); sp.position.copy(fp); g.add(sp); }
      }
      parent.add(g); tagPick(g, grp.id);
    }
    return parent;
  }

  // 在轨物资存储机柜（货架 + 货包）
  function makeStorage(parent, cx, partId) {
    const g = new THREE.Group(); g.position.x = cx; g.position.y = -0.2;
    for (let i = 0; i < 3; i++) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 1.4), M.shelf); sh.position.set(0, -1.0 + i * 0.95, 0); g.add(sh);
      for (let j = 0; j < 2; j++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.85), [M.rackA, M.rackC][j]); p.position.set(-0.5 + j, -1.0 + i * 0.95 + 0.4, 0); g.add(p); }
    }
    parent.add(g); tagPick(g, partId); return g;
  }

  // 实验舱临时睡眠位（乘组轮换时使用）
  function makeSleepLab(parent, cx, partId) {
    const g = new THREE.Group(); g.position.x = cx; g.position.y = 0.2;
    for (let i = 0; i < 2; i++) {
      const a = i ? 0.5 : -0.5;
      const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.1, 4, 12), M.sleep);
      pod.position.set(-1.0 + i * 2.0, Math.sin(a) * 1.0, Math.cos(a) * 1.0); pod.rotation.z = a; g.add(pod);
    }
    parent.add(g); tagPick(g, partId); return g;
  }

  // 出舱气闸舱：双密封门 + 环形扶手 + 照明
  function makeAirlock(parent, pos, partId) {
    const g = new THREE.Group(); g.position.copy(pos);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.0, 20, 1, true), M.hullD); tube.rotation.z = Math.PI / 2; g.add(tube);
    const d1 = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 20), M.dockRing); d1.rotation.z = Math.PI / 2; d1.position.x = -1.0; g.add(d1);
    const d2 = d1.clone(); d2.position.x = 1.0; g.add(d2);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.06, 8, 24), M.arm); rail.rotation.y = Math.PI / 2; g.add(rail);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), M.lamp); lamp.position.set(0, 0.9, 0); g.add(lamp);
    parent.add(g); tagPick(g, partId); return g;
  }

  // 货物气闸 + 舱外暴露平台（载荷自动进出舱）
  function makeCargoAirlock(parent, pos, partId) {
    const g = new THREE.Group(); g.position.copy(pos);
    const boxM = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 2.0), M.hullD); g.add(boxM);
    const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.12, 16), M.dockRing); hatch.rotation.z = Math.PI / 2; hatch.position.x = 0.8; g.add(hatch);
    const plat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 2.0), M.arm); plat.position.set(1.5, -1.2, 0); g.add(plat);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), M.dark); peg.position.set(1.5, -1.3, Math.cos(a) * 0.8); plat.add(peg); }
    parent.add(g); tagPick(g, partId); return g;
  }

  // 天舟货物舱货架（多层货包）
  function makeShelves(parent, cx, partId) {
    const g = new THREE.Group(); g.position.x = cx;
    for (let i = 0; i < 4; i++) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1.4), M.shelf); sh.position.set(0, -1.4 + i * 0.92, 0); g.add(sh);
      for (let j = 0; j < 3; j++) {
        const pkg = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.6, 0.85), [M.rackA, M.rackB, M.rackC][j % 3]);
        pkg.position.set(-1 + j * 1.0, -1.4 + i * 0.92 + 0.42, 0); g.add(pkg);
      }
    }
    parent.add(g); tagPick(g, partId); return g;
  }

  // 太阳翼根部驱动机构(SADA，对日定向) + 单板格太阳翼
  function makeWing(pivotPos, parent, span, width, foldAxis, foldFrom, deployTo, sadaId) {
    const pivot = new THREE.Group(); pivot.position.copy(pivotPos);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(span * 0.92, 0.16, width + 0.3), M.arm); frame.position.set(span * 0.52, -0.1, 0); pivot.add(frame);
    // 单板格（替代整块，呈现电池片阵列）
    const cols = 10, rows = 5;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const cell = new THREE.Mesh(new THREE.BoxGeometry(span * 0.86 / cols * 0.94, 0.08, width / rows * 0.94), M.panel);
      cell.position.set(span * 0.52 + (c - (cols - 1) / 2) * span * 0.86 / cols, -0.02, (r - (rows - 1) / 2) * width / rows);
      pivot.add(cell);
    }
    const boom = box(span * 0.9, 0.18, 0.18, M.dark); boom.position.set(span * 0.5, 0.1, 0); pivot.add(boom);
    const tip = box(span * 0.05, 0.36, width + 0.3, M.dark); tip.position.set(span, 0, 0); pivot.add(tip);
    // 根部驱动机构（SADA）
    if (sadaId) {
      const sada = new THREE.Group(); sada.position.set(0, 0, 0);
      const bx = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), M.sada); sada.add(bx);
      const rr = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.08, 8, 20), M.dockRing); sada.add(rr);
      pivot.add(sada); tagPick(sada, sadaId);
    }
    parent.add(pivot); wings.push({ pivot, foldAxis, foldAngle: foldFrom, deployAngle: deployTo, phase: Math.random() * 6.28 });
    return pivot;
  }

  // 大机械臂末端执行器（蜗轮式手爪，7 自由度末端）
  function makeGripper(arm, tipPos, partId) {
    const g = new THREE.Group(); g.position.copy(tipPos);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 16), M.grip); g.add(base);
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * Math.PI * 2;
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.1), M.grip);
      finger.position.set(Math.cos(a) * 0.18, 0.35, Math.sin(a) * 0.18); finger.rotation.y = a; g.add(finger);
    }
    arm.add(g); tagPick(g, partId); return g;
  }

  function makeThruster(posVec, parent, color = 0x39e0ff) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: 0.8, transparent: true, opacity: .7, depthWrite: false })
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
    makeWing(new THREE.Vector3(0, 0,  1.2), res, 12, 4.2, 'y', 0, -Math.PI / 2, 'th_sada');
    makeWing(new THREE.Vector3(0, 0, -1.2), res, 12, 4.2, 'y', 0,  Math.PI / 2, 'th_sada');
    makeHall(res, -8.9, 'th_hall'); // 霍尔电推（资源舱尾部）
    res.userData.explodeDir = new THREE.Vector3(-6, 0, 0); tianhe.add(res);

    const big = new THREE.Group();
    const b1 = cylX(2.1, 7, M.hull); b1.position.x = -0.6; big.add(b1);
    detailHull(big, 2.1, 7, -0.6);
    const r1 = ring(2.02, 0.09, M.orange); r1.rotation.y = Math.PI / 2; r1.position.x = 2.6; big.add(r1);
    addRacks(big, -0.6, 0, 6.4, 2.05, 12);
    addDecal(big, -0.6, 2.18, 3.0, 1.8, flagTex, M.flag);
    addDecal(big, 1.6, 2.18, 2.2, 0.9, tgTex, M.label);
    makeECS(big, -2.4, ['th_ecs_water', 'th_ecs_oxy', 'th_ecs_co2']); // 再生生保三机柜
    makeSleep(big, 1.6, 'th_sleep'); // 航天员睡眠区（大柱段）
    makeLiving(big, 0.2, 'th_exercise', 'th_galley'); // 太空锻炼 + 餐厨支持
    big.userData.explodeDir = new THREE.Vector3(0, 0, 0); tianhe.add(big);

    const cone = coneX(2.1, 1.45, 1.8, M.hull); cone.position.x = 3.7; tianhe.add(cone);
    const small = new THREE.Group();
    const s1 = cylX(1.45, 4, M.hullD); s1.position.x = 6.4; small.add(s1); detailHull(small, 1.45, 4, 6.4);
    const r2 = ring(1.4, 0.08, M.arm); r2.rotation.y = Math.PI / 2; r2.position.x = 6.4; small.add(r2);
    addRacks(small, 6.4, 0, 3.4, 1.4, 6, 2);
    small.userData.explodeDir = new THREE.Vector3(4, 0, 0); tianhe.add(small);

    // 大机械臂（7 自由度）
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
    makeGripper(arm, new THREE.Vector3(6.3, -0.1, 0), 'th_gripper'); // 末端执行器
    tagPick(shoulder, 'arm_shoulder'); tagPick(elbow, 'arm_elbow'); tagPick(wrist, 'arm_wrist'); // 机械臂三关节
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
    makeCMG(node, 0, 'th_cmg');      // 控制力矩陀螺（节点舱）
    makeDock(node, 1.0, 'th_node');  // 异体同构周边式对接机构（前向对接口）
    node.position.x = 8.6; node.userData.explodeDir = new THREE.Vector3(7, 0, 0); tianhe.add(node);

    const ant = new THREE.Group();
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 12, 0, Math.PI*2, 0, Math.PI*0.42), M.white); dish.rotation.x = Math.PI; ant.add(dish);
    const mast = box(0.1, 1.4, 0.1, M.dark); mast.position.y = -0.7; ant.add(mast);
    ant.position.set(-0.6, 2.3, 0); tianhe.add(ant); tagPick(ant, 'th_comm'); // 中继通信天线

    tianhe.userData.explodeDir = new THREE.Vector3(0, 0, 0); tagPick(tianhe, 'tianhe', true);
  }

  // ═══════════ 实验舱通用构造 ═══════════
  function buildLab(id, isWentian) {
    const g = new THREE.Group();
    const work = cylX(2.1, 8.6, M.hull); work.position.x = 0.2; g.add(work); detailHull(g, 2.1, 8.6, 0.2);
    const rr = ring(2.02, 0.09, M.orange); rr.rotation.y = Math.PI / 2; rr.position.x = 3.4; g.add(rr);
    addRacks(g, 0.2, 0, 7.8, 2.05, 14, isWentian ? 1 : 3);
    addDecal(g, 0.2, 2.18, 2.6, 1.6, flagTex, M.flag);
    const fn = cylX(1.8, 3.4, isWentian ? M.hull : M.hullD); fn.position.x = 6.2; g.add(fn); detailHull(g, 1.8, 3.4, 6.2);
    const collar = cylX(1.15, 1.3, M.hullD); collar.position.x = -4.9; g.add(collar);
    const cr = ring(1.05, 0.1, M.dark); cr.rotation.y = Math.PI / 2; cr.position.x = -5.5; g.add(cr);
    if (!isWentian) {
      const plat = box(2.4, 0.16, 3.2, M.dark); plat.position.set(8.6, -0.9, 0); g.add(plat); tagPick(plat, 'mt_expose'); // 舱外暴露实验平台
    } else {
      const hatch = cylX(1.0, 1.1, M.hullD); hatch.rotation.z = Math.PI / 2; hatch.rotation.y = Math.PI / 2; hatch.position.set(6.2, 1.9, 0); g.add(hatch);
    }
    const res = cylX(1.5, 3.2, M.foil); res.position.x = 9.4; g.add(res);
    const truss = box(1.6, 0.5, 0.5, M.arm); truss.position.x = 11.6; g.add(truss);
    makeWing(new THREE.Vector3(11.9, 0, 0), g, 14.5, 5.2, 'y', 0, -Math.PI / 2, 'wt_sada');
    makeWing(new THREE.Vector3(11.9, 0, 0), g, 14.5, 5.2, 'y', 0,  Math.PI / 2, 'wt_sada');
    // 内部子系统（科学机柜、气闸、机械臂、生活/载荷支持）
    if (isWentian) {
      makeRacksDetailed(g, 0.2, [{id:'wt_bio_plant',n:2,kind:'plant'},{id:'wt_bio_cell',n:2,kind:'cell'},{id:'wt_bio_ecology',n:2,kind:'eco'}]); // 生命/生态实验柜
      makeStorage(g, -1.0, 'wt_storage'); // 在轨物资存储
      makeSleepLab(g, 1.0, 'wt_sleep');   // 问天临时睡眠位
      makeAirlock(g, new THREE.Vector3(6.2, 1.9, 0), 'wt_airlock'); // 出舱气闸
      const sa = new THREE.Group();
      const s1 = cylX(0.16, 2.2, M.arm); s1.rotation.z = Math.PI / 2 - 0.4; s1.position.set(1.0, 2.5, 0); sa.add(s1);
      const j = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), M.joint); j.position.set(2.0, 2.9, 0); sa.add(j);
      const s2 = cylX(0.13, 1.9, M.arm); s2.rotation.z = Math.PI / 2 + 0.55; s2.position.set(2.9, 2.3, 0); sa.add(s2);
      sa.position.x = 4.6; g.add(sa); tagPick(sa, 'wt_arm'); // 小机械臂（7 自由度）
    } else {
      makeRacksDetailed(g, 0.2, [{id:'mt_burner',n:2,kind:'burner'},{id:'mt_fluid',n:2,kind:'fluid'},{id:'mt_coldatom',n:2,kind:'coldatom'},{id:'mt_micrograv',n:2,kind:'micrograv'}]); // 微重力科学柜群
      makeCargoAirlock(g, new THREE.Vector3(8.6, -0.9, 0), 'mt_cargoairlock'); // 货物气闸 + 暴露平台
    }
    tagPick(g, id, true); return g;
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
    // 主发动机钟形喷管（Laval 喷管示意）
    const szNoz = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.5, 0.9, 20, 1, true), M.dark);
    szNoz.rotation.z = -Math.PI / 2; szNoz.position.set(11.6, 0, 0); shenzhou.add(szNoz); tagPick(szNoz, 'sz_engine');
    makeThruster(new THREE.Vector3(17.4, 0, 0), shenzhou);
    // 三舱分别可点：返回舱 / 轨道舱 / 推进舱
    tagPick(ret, 'sz_return');
    tagPick(orb, 'sz_orbital');
    tagPick(svc, 'sz_svc');
    tagPick(shenzhou, 'shenzhou', true);
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
    makeShelves(tianzhou, -11.2, 'tz_rack'); // 货物舱货架
    // 推进剂贮箱（球型，可补加推进剂） + 主发动机喷管
    for (const dx of [-13.6, -14.6]) { const tank = new THREE.Mesh(new THREE.SphereGeometry(0.85, 18, 14), M.hullD); tank.position.x = dx; tianzhou.add(tank); tagPick(tank, 'tz_prop'); }
    const tzNoz = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, 0.8, 18, 1, true), M.dark); tzNoz.rotation.z = Math.PI / 2; tzNoz.position.set(-17.4, 0, 0); tianzhou.add(tzNoz); tagPick(tzNoz, 'tz_engine');
    makeThruster(new THREE.Vector3(-17.0, 0, 0), tianzhou);
    tagPick(tianzhou, 'tianzhou', true);
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
  // 可爆炸对象：舱段主组（沿各自方向散开）+ 内部子系统（已由 tagPick 注册，爆炸时从舱体内抽出）
  for (const o of [tianhe, ...tianhe.children.filter(c => c.userData.explodeDir), wentian, mengtian, shenzhou, tianzhou]) {
    if (o.userData.explodeDir && o.userData.explodeDir.lengthSq() > 0) regExplode(o, o.userData.explodeDir);
  }
  function applyExplode(t) {
    for (const n of explodeNodes) n.obj.position.copy(n.base).addScaledVector(n.dir, t);
  }
  let cutVal = 0;
  function applyCut(v) {
    cutVal = v;
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

  return { parts, pickables, wings, root, tick, applyExplode, applyCut, applyWings, getCut: () => cutVal };
}
