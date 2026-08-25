import * as THREE from 'three';
import { PART_INFO, LABELS, OBJECTIVES, TOUR, TIMELINE, FACTS, QUIZ } from './data.js?v=20260825c';

const $ = s => document.querySelector(s);

// ── 音效（WebAudio 程序化，无外部资源）──
let actx = null, ambGain = null;
export const sound = {
  enabled: false,
  ensure() {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      // 环境底噪：布朗噪声 + 低通
      const len = actx.sampleRate * 2;
      const buf = actx.createBuffer(1, len, actx.sampleRate);
      const d = buf.getChannelData(0); let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; d[i] = (last + 0.02 * w) / 1.02; last = d[i]; }
      const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 190;
      ambGain = actx.createGain(); ambGain.gain.value = 0;
      src.connect(lp).connect(ambGain).connect(actx.destination); src.start();
    }
    if (actx.state === 'suspended') actx.resume();
  },
  ambient(on) { if (ambGain) ambGain.gain.linearRampToValueAtTime(on ? 0.06 : 0, actx.currentTime + 0.6); },
  click() {
    if (!this.enabled || !actx) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = 740;
    g.gain.setValueAtTime(0.05, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.09);
    o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.1);
  },
};

// ── 标注 DOM ──
// 主舱（始终显示名称）；子系统（悬停/选中时才显示，避免 41 个名字糊屏）
const MAIN_IDS = LABELS.map(L => L.id);
const labelEls = new Map();
function buildLabels(parts) {
  const wrap = $('#labels');
  const mk = (id, text, main) => {
    const el = document.createElement('div');
    el.className = 'tag ' + (main ? 'main' : 'sub');
    el.dataset.id = id;
    el.innerHTML = `<i></i>${text}`;
    el.style.opacity = '0';
    wrap.appendChild(el);
    labelEls.set(id, el);
  };
  for (const L of LABELS) mk(L.id, L.text, true);           // 主舱常显
  for (const id of Object.keys(PART_INFO)) {                // 子系统自动生成（取自资料卡名称）
    if (MAIN_IDS.includes(id)) continue;
    const p = parts[id];
    if (!p || !p.label) continue;
    mk(id, PART_INFO[id].name, false);
  }
}

const _p = new THREE.Vector3(), _d = new THREE.Vector3(), _v = new THREE.Vector3();
export function updateLabels(camera, parts, labelsVisible, showParts, revealAll, activeId, hoverId) {
  camera.getWorldDirection(_d);
  const w = innerWidth, h = innerHeight;
  for (const [id, el] of labelEls) {
    const part = parts[id];
    if (!part || !part.label) continue;
    part.label.getWorldPosition(_v);
    const facing = _v.clone().sub(camera.position).dot(_d) > 0; // 在相机前方
    _v.project(camera);
    const onScreen = _v.z < 1 && Math.abs(_v.x) < 1.2 && Math.abs(_v.y) < 1.2;
    const isMain = MAIN_IDS.includes(id);
    const isFocus = id === activeId || id === hoverId;
    // 主舱：标注开启即常显；部件：开启「显示部件名称」且（悬停/选中 或 已剖切/爆炸展开）时显示
    const show = isMain
      ? (labelsVisible && facing && onScreen)
      : (showParts && facing && onScreen && (isFocus || revealAll));
    el.style.opacity = show ? (isFocus ? '1' : (isMain ? '0.85' : '1')) : '0';
    if (show) {
      el.style.left = ((_v.x * 0.5 + 0.5) * w) + 'px';
      el.style.top  = ((-_v.y * 0.5 + 0.5) * h - 10) + 'px';
    }
    el.classList.toggle('hot', isFocus);
    el.classList.toggle('active', id === activeId);
  }
}

// ── 信息卡 ──
function showInfo(id, onFocus) {
  const info = PART_INFO[id]; if (!info) return;
  $('#if-badge').textContent = info.badge;
  $('#if-name').textContent = info.name;
  $('#if-en').textContent = info.en;
  $('#if-specs').innerHTML = info.specs.map(([k, v]) => `<li><b>${k}</b>${v}</li>`).join('');
  $('#if-roles').innerHTML = info.roles.map(r => `<li>${r}</li>`).join('');
  const factEl = $('#if-fact'); factEl.textContent = info.fact;
  $('#infocard').classList.remove('hidden');
  $('#if-focus').onclick = () => onFocus(id);
  sound.click();
}

// ── 学习抽屉内容 ──
function renderDrawer(stationApi, focusPart) {
  // 教学目标
  $('#tab-goal').innerHTML = `
    <div class="goal-card"><b>知识目标</b><ul>${OBJECTIVES.knowledge.map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="goal-card"><b>能力目标</b><ul>${OBJECTIVES.skills.map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="goal-card"><b>情感目标</b><ul>${OBJECTIVES.affect.map(x => `<li>${x}</li>`).join('')}</ul></div>
    <h3>使用建议</h3>
    <p>① 先用「爆炸 / 组装」滑杆整体拆解一次，建立三舱空间关系；<br>② 点击每个舱段阅读资料卡；<br>③ 打开剖切观察舱内机柜布局；<br>④ 最后完成课堂测验检验学习效果。</p>`;

  // 认识三舱
  $('#tab-tour').innerHTML = `
    <h3>点击卡片，镜头带你逐舱参观</h3>
    <div class="tour-grid">${TOUR.map(t => `
      <div class="tour-card" data-focus="${t.id}"><b>${t.title}</b><span>${t.desc}</span></div>`).join('')}
    </div>
    <h3>T 字构型口诀</h3>
    <p>「一天两问」：<b style="color:#9fefff">天和</b>居中作脊梁，<b style="color:#9fefff">问天</b>、<b style="color:#9fefff">梦天</b>两翼张——节点舱两侧停泊口各接一个实验舱，即成 T 字。</p>`;
  document.querySelectorAll('.tour-card').forEach(c => c.onclick = () => focusPart(c.dataset.focus));

  // 时间线
  $('#tab-line').innerHTML =
    `<h3>从立项到建成</h3>` +
    TIMELINE.map(t => `<div class="tl-item"><b>${t.date}</b><p><strong style="color:#fff">${t.title}</strong> — ${t.detail}</p></div>`).join('');

  // 数据速查
  $('#tab-facts').innerHTML = `
    <h3>关键数据一览（官方公开报道）</h3>
    <table class="facts-table">${FACTS.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;

  // 测验
  const total = QUIZ.length;
  let answered = 0, correct = 0;
  const scoreHtml = () => `已答 ${answered}/${total} · 答对 <b style="color:#9fe8bf">${correct}</b> 题`;
  $('#tab-quiz').innerHTML = `<div class="score-bar" id="quiz-score">🎓 ${scoreHtml()}</div>` + QUIZ.map((qz, qi) => `
    <div class="quiz-q" data-qi="${qi}">
      <div class="q">${qz.q}</div>
      ${qz.options.map((o, oi) => `<button class="opt" data-oi="${oi}">${String.fromCharCode(65 + oi)}. ${o}</button>`).join('')}
      <div class="explain">💡 ${qz.explain}</div>
    </div>`).join('');
  document.querySelectorAll('.quiz-q').forEach(qEl => {
    qEl.querySelectorAll('.opt').forEach(btn => btn.onclick = () => {
      if (qEl.dataset.done) return;
      qEl.dataset.done = '1';
      const qi = +qEl.dataset.qi, oi = +btn.dataset.oi;
      qEl.querySelectorAll('.opt')[QUIZ[qi].answer].classList.add('right');
      if (oi !== QUIZ[qi].answer) btn.classList.add('wrong'); else correct++;
      answered++;
      qEl.querySelector('.explain').classList.add('show');
      $('#quiz-score').innerHTML = `🎓 ${scoreHtml()}${answered === total ? (correct === total ? ' —— 满分！你就是未来的航天工程师！🚀' : ' —— 再看看「数据速查」，下次满分！') : ''}`;
      sound.click();
    });
  });
}

// ── 视角预设 ──
export function applyView(name, controls, parts) {
  const V = {
    global:  [[0, 1, 0],   46, 1.12, 0.55],
    tianhe:  [[2, 2, 4],   20, 1.25, 0.9],
    wentian: [[8, 2, 12],  22, 1.18, -0.5],
    mengtian:[[8, 2, -12], 22, 1.18, 0.5],
    top:     [[0, 0, 0.01],52, 0.08, 0],
    horizon: [[0, 4, 0],   60, 1.62, -0.85],
  }[name];
  if (!V) return;
  controls.flyTo(new THREE.Vector3(...V[0]), V[1], V[2], V[3]);
}

// ── 总装 ──
export function initUI({ stationApi, controls, focusPart }) {
  buildLabels(stationApi.parts);

  const console_ = $('#console');
  $('#console-toggle').onclick = () => {
    console_.classList.toggle('folded');
    $('#console-toggle').textContent = console_.classList.contains('folded') ? '‹' : '›';
  };

  // 运行 / 暂停
  let running = true;
  const runBtn = $('#btn-run');
  runBtn.onclick = () => {
    running = !running;
    runBtn.textContent = running ? '⏸ 暂停轨道' : '▶ 恢复轨道';
    runBtn.classList.toggle('paused', !running);
    runBtn.classList.toggle('running', running);
    sound.click();
  };

  // 时间流速
  const lbTime = $('#lb-time');
  let timeScale = 30;
  $('#rg-time').oninput = e => { timeScale = +e.target.value; lbTime.textContent = `×${timeScale}`; };

  // 爆炸 / 组装
  const lbEx = $('#lb-explode');
  $('#rg-explode').oninput = e => {
    const t = +e.target.value / 100;
    stationApi.applyExplode(t);
    lbEx.textContent = e.target.value + '%';
  };

  // 太阳翼展开
  $('#ck-wings').onchange = e => stationApi.applyWings(e.target.checked ? 1 : 0);

  // 剖切
  const lbCut = $('#lb-cut');
  $('#rg-cut').oninput = e => {
    const v = +e.target.value / 100;
    stationApi.applyCut(v);
    lbCut.textContent = v === 0 ? '不剖切' : Math.round(v * 100) + '% 透视';
  };

  // 标注
  let showLabels = true;
  let showParts = true;
  $('#ck-labels').onchange = e => { showLabels = e.target.checked; };
  $('#ck-parts').onchange = e => { showParts = e.target.checked; };

  // 音效
  $('#ck-sound').onchange = e => {
    sound.enabled = e.target.checked;
    if (sound.enabled) { sound.ensure(); sound.ambient(true); } else sound.ambient(false);
  };

  // 视角 chips
  document.querySelectorAll('#views .chip').forEach(chip => chip.onclick = () => {
    document.querySelectorAll('#views .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    applyView(chip.dataset.view, controls, stationApi.parts);
    sound.click();
  });

  // 抽屉
  const drawer = $('#drawer');
  $('#btn-drawer').onclick = () => { drawer.classList.add('open'); };
  $('#drawer-close').onclick = () => { drawer.classList.remove('open'); };
  document.querySelectorAll('.tabs .tab').forEach(tab => tab.onclick = () => {
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-body').forEach(b => b.classList.add('hidden'));
    $('#tab-' + tab.dataset.tab).classList.remove('hidden');
  });
  renderDrawer(stationApi, focusPart);

  // 信息卡关闭
  $('#info-close').onclick = () => $('#infocard').classList.add('hidden');

  return {
    isRunning: () => running,
    getTimeScale: () => timeScale,
    labelsVisible: () => showLabels,
    showParts: () => showParts,
  };
}

export { showInfo };
