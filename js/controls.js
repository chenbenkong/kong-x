import * as THREE from 'three';

// ── 轻量轨道控制器：拖拽旋转 / 滚轮缩放 / 双指捏合 / 预设飞行 ──
export class OrbitCam {
  constructor(camera, dom) {
    this.cam = camera; this.dom = dom;
    this.sph = new THREE.Spherical(40, 1.12, 0.55);
    this.sphTo = this.sph.clone();
    this.fromSph = this.sph.clone();
    this.target = new THREE.Vector3(0, 1, 0);
    this.targetTo = this.target.clone();
    this.fromTarget = this.target.clone();
    this.tween = null;
    this.minR = 13; this.maxR = 240;

    let drag = false, lx = 0, ly = 0;
    dom.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return;
      drag = true; lx = e.clientX; ly = e.clientY;
      dom.setPointerCapture(e.pointerId);
    });
    dom.addEventListener('pointerup',   () => { drag = false; });
    dom.addEventListener('pointermove', e => {
      if (!drag || e.pointerType === 'touch') return;
      const dx = (e.clientX - lx) / dom.clientHeight * Math.PI * 2;
      const dy = (e.clientY - ly) / dom.clientHeight * Math.PI;
      lx = e.clientX; ly = e.clientY;
      this.sphTo.theta -= dx;
      this.sphTo.phi = THREE.MathUtils.clamp(this.sphTo.phi - dy, 0.15, 3.0);
      this.tween = null;
    });
    dom.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoom(e.deltaY > 0 ? 1.12 : 0.89);
      this.tween = null;
    }, { passive: false });

    let pinch = 0;
    dom.addEventListener('touchmove', e => {
      if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY);
        if (pinch) this.zoom(pinch / d);
        pinch = d; e.preventDefault();
        this.tween = null;
      }
    }, { passive: false });
    dom.addEventListener('touchend', () => { pinch = 0; });

    // 单指拖拽（触摸）
    let tId = null, tx = 0, ty = 0;
    dom.addEventListener('touchstart', e => { tId = e.touches[0].identifier; tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    dom.addEventListener('touchmove', e => {
      if (e.touches.length !== 1) return;
      const t0 = [...e.touches].find(t => t.identifier === tId); if (!t0) return;
      const dx = (t0.clientX - tx) / dom.clientHeight * Math.PI * 2;
      const dy = (t0.clientY - ty) / dom.clientHeight * Math.PI;
      tx = t0.clientX; ty = t0.clientY;
      this.sphTo.theta -= dx;
      this.sphTo.phi = THREE.MathUtils.clamp(this.sphTo.phi - dy, 0.15, 3.0);
    }, { passive: true });
  }

  zoom(f) { this.sphTo.radius = THREE.MathUtils.clamp(this.sphTo.radius * f, this.minR, this.maxR); }

  // 视角预设：世界坐标注视点 + 球坐标（半径/极角/方位）
  flyTo(target, radius, phi, theta) {
    this.fromSph.copy(this.sph);
    this.fromTarget.copy(this.target);
    this.sphTo.set(radius, phi, theta);
    this.targetTo.copy(target);
    this.tween = { t: 0 };
  }

  update(dt) {
    if (this.tween) {
      this.tween.t += dt / 1.25;
      const k = 1 - Math.pow(1 - Math.min(1, this.tween.t), 3);
      this.sph.radius   = THREE.MathUtils.lerp(this.fromSph.radius, this.sphTo.radius, k);
      this.sph.phi      = THREE.MathUtils.lerp(this.fromSph.phi,    this.sphTo.phi,    k);
      this.sph.theta    = THREE.MathUtils.lerp(this.fromSph.theta,  this.sphTo.theta,  k);
      this.target.lerpVectors(this.fromTarget, this.targetTo, k);
      if (this.tween.t >= 1) this.tween = null;
    } else {
      const s = 1 - Math.pow(0.002, dt);
      this.sph.radius += (this.sphTo.radius - this.sph.radius) * s;
      this.sph.phi    += (this.sphTo.phi    - this.sph.phi)    * s;
      this.sph.theta  += (this.sphTo.theta  - this.sph.theta)  * s;
      this.target.lerp(this.targetTo, s);
    }
    const sp = Math.sin(this.sph.phi), r = this.sph.radius;
    this.cam.position.set(
      this.target.x + r * sp * Math.sin(this.sph.theta),
      this.target.y + r * Math.cos(this.sph.phi),
      this.target.z + r * sp * Math.cos(this.sph.theta),
    );
    this.cam.lookAt(this.target);
  }
}
