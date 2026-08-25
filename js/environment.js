import * as THREE from 'three';

// ── 程序化噪声（GLSL value noise + fbm，用于贴图缺失时的兜底大陆）──
const NOISE_GLSL = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int k=0;k<5;k++){ v += a*vnoise(p); p = p*2.03 + vec2(19.7,7.3); a *= 0.55; }
  return v;
}
`;

export function buildEnvironment(scene, renderer) {
  const EARTH_R = 60;
  const maxAniso = renderer ? renderer.capabilities.getMaxAnisotropy() : 4;

  // ── 真实贴图（来自 NASA Blue Marble / 夜景灯光 / 云层 / 海洋掩膜）──
  const loader = new THREE.TextureLoader();
  loader.setPath('js/assets/');
  const tex = {
    day:    loader.load('earth-day.jpg'),
    night:  loader.load('earth-night.jpg'),
    clouds: loader.load('earth-clouds.png'),
    water:  loader.load('earth-water.png'),
    bump:   loader.load('earth-topology.png'),
  };
  for (const k of ['day', 'night', 'clouds', 'water']) tex[k].colorSpace = THREE.SRGBColorSpace;
  for (const k of Object.keys(tex)) { tex[k].anisotropy = maxAniso; tex[k].wrapS = tex[k].wrapT = THREE.RepeatWrapping; }

  const earthGroup = new THREE.Group();
  earthGroup.position.set(0, -EARTH_R - 26, 0);
  earthGroup.rotation.z = THREE.MathUtils.degToRad(23.5); // 地轴倾角
  scene.add(earthGroup);

  const sunDir = new THREE.Vector3(0.55, 0.32, 0.62).normalize();

  // ── 地球本体（昼夜融合 + 夜面城市灯光 + 海面镜面高光）──
  const earthMat = new THREE.ShaderMaterial({
    uniforms: {
      uDay:     { value: tex.day },
      uNight:   { value: tex.night },
      uWater:   { value: tex.water },
      uSunDir:  { value: sunDir.clone() },
      uHasTex:  { value: 0 },
      uTime:    { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vWP;
      void main(){
        vUv = uv;
        vN = normalize(mat3(modelMatrix) * normal);
        vWP = (modelMatrix * vec4(position,1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }`,
    fragmentShader: `
      uniform sampler2D uDay, uNight, uWater;
      uniform vec3 uSunDir; uniform float uHasTex; uniform float uTime;
      varying vec2 vUv; varying vec3 vN; varying vec3 vWP;
      ${NOISE_GLSL}
      void main(){
        vec3 N = normalize(vN);
        vec3 L = normalize(uSunDir);
        vec3 V = normalize(cameraPosition - vWP);
        float d = dot(N, L);
        float dayAmt = smoothstep(-0.12, 0.28, d);

        vec3 dayCol, nightCol, water;
        if (uHasTex > 0.5) {
          dayCol  = texture2D(uDay, vUv).rgb;
          nightCol= texture2D(uNight, vUv).rgb;
          water   = texture2D(uWater, vUv).rgb;
        } else {
          float land = fbm(vUv*vec2(8.0,4.0));
          float mask = smoothstep(0.50,0.56, land);
          dayCol = mix(vec3(0.03,0.14,0.30), vec3(0.16,0.34,0.16), mask);
          nightCol = vec3(0.0);
          water = vec3(1.0 - mask);
        }
        // 海面镜面高光（仅白天、仅海洋）
        vec3 H = normalize(L + V);
        float wmask = clamp(water.r + water.g + water.b, 0.0, 1.0) * (1.0 - dayCol.b);
        wmask = clamp(wmask, 0.0, 1.0);
        float spec = pow(max(dot(N,H),0.0), 80.0) * wmask * dayAmt;
        // 夜面城市灯光
        vec3 city = nightCol * (1.0 - dayAmt) * 3.2;
        // 晨昏线暖色大气散射
        float term = exp(-abs(d) * 6.0);
        vec3 terminator = vec3(0.9,0.5,0.22) * term * 0.5;

        vec3 col = dayCol * (0.05 + 0.88 * dayAmt) + city + terminator;
        col += vec3(0.55,0.72,0.95) * spec;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  earthMat.uniforms.uDay.value.image && (earthMat.uniforms.uHasTex.value = 1);
  const onLoad = () => { earthMat.uniforms.uHasTex.value = 1; };
  tex.day.image ? onLoad() : tex.day.addEventListener('load', onLoad);

  const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 128, 96), earthMat);
  earthGroup.add(earth);

  // ── 云层 ──
  const cloudMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uClouds: { value: tex.clouds }, uSunDir: { value: sunDir.clone() } },
    vertexShader: `
      varying vec2 vUv; varying vec3 vN;
      void main(){ vUv = uv; vN = normalize(mat3(modelMatrix)*normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform sampler2D uClouds; uniform vec3 uSunDir;
      varying vec2 vUv; varying vec3 vN;
      void main(){
        vec4 t = texture2D(uClouds, vUv);
        float d = max(t.a, max(t.r, t.g));
        float sun = smoothstep(-0.1, 0.35, dot(normalize(vN), normalize(uSunDir)));
        vec3 c = vec3(1.0) * (0.18 + 0.95 * sun);
        gl_FragColor = vec4(c, d * 0.70);
      }`,
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.012, 96, 64), cloudMat);
  earthGroup.add(clouds);

  // ── 大气辉光（背面菲涅尔，更通透的蓝）──
  const atmoMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uSunDir: { value: sunDir.clone() } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main(){ vN = normalize(mat3(modelMatrix)*normal);
        vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      uniform vec3 uSunDir; varying vec3 vN; varying vec3 vV;
      void main(){
        float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
        float lit = clamp(dot(-normalize(vN), normalize(uSunDir)), 0.0, 1.0) * 0.85 + 0.15;
        vec3 col = mix(vec3(0.0,0.65,1.0), vec3(0.3,0.9,1.0), rim) * rim * lit * 1.6;
        gl_FragColor = vec4(col, rim * lit * 0.9);
      }`,
  });
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.07, 80, 56), atmoMat);
  earthGroup.add(atmo);

  // ── 太阳辉光（供 Bloom 捕捉）──
  const sunDist = 1100;
  const sunPos = sunDir.clone().multiplyScalar(sunDist);
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(235,250,255,1)');
    grd.addColorStop(0.18, 'rgba(150,225,255,0.9)');
    grd.addColorStop(0.5, 'rgba(60,160,255,0.3)');
    grd.addColorStop(1, 'rgba(40,120,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const sunCore = new THREE.Mesh(
    new THREE.SphereGeometry(18, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0xeaf6ff })
  );
  sunCore.position.copy(sunPos); scene.add(sunCore);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  }));
  sunGlow.scale.set(280, 280, 1); sunGlow.position.copy(sunPos); scene.add(sunGlow);

  // ── 星空（含少量亮星辉光）──
  const starGeo = new THREE.BufferGeometry();
  const N = 4200, pos = new Float32Array(N * 3), colArr = new Float32Array(N * 3), sz = new Float32Array(N);
  const tint = [[0.85, 0.95, 1], [0.7, 0.8, 1], [1, 0.85, 0.7], [0.85, 0.7, 1]];
  for (let i = 0; i < N; i++) {
    const r = 1600, th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1), s = r * Math.sin(ph);
    pos[i*3] = s*Math.cos(th); pos[i*3+1] = r*Math.cos(ph); pos[i*3+2] = s*Math.sin(th);
    const c = tint[Math.floor(Math.random()*tint.length)], b = 0.4 + Math.random()*0.6;
    colArr[i*3] = c[0]*b; colArr[i*3+1] = c[1]*b; colArr[i*3+2] = c[2]*b;
    sz[i] = Math.random() < 0.04 ? 3.2 : (Math.random() < 0.2 ? 1.8 : 0.9);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(sz, 1));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 2.0, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: .95, depthWrite: false,
  }));
  scene.add(stars);

  // ── 光照 ──
  const sun = new THREE.DirectionalLight(0xeaf2ff, 2.6);
  sun.position.copy(sunDir).multiplyScalar(200);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x2a3a55, 0.6));
  scene.add(new THREE.HemisphereLight(0x8fc6ff, 0x0c1422, 0.4));

  let t = 0;
  function update(dt, timeScale) {
    t += dt * timeScale;
    earth.rotation.y += dt * timeScale * 0.012;
    clouds.rotation.y += dt * timeScale * 0.0168;
    stars.rotation.y += dt * timeScale * 0.0011;
    earthMat.uniforms.uTime.value = t;
  }

  return { update, sunDir, earthCenter: new THREE.Vector3(0, -EARTH_R - 26, 0) };
}
