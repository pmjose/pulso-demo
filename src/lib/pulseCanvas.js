// ECG trace that sheds sparks of light, which gather into a glowing halo.
// Returns controls: unlock() starts the burst, stop() tears everything down.
export function startPulse(c) {
  const x = c.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, dpr, raf, t0 = performance.now(), parts = [], stars = [];
  const mouse = { x: -1e4, y: -1e4 };
  let unlocking = 0;

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr;
    stars = Array.from({ length: 180 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 * dpr, p: Math.random() * 6.28 }));
  }
  const onMove = (e) => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; };

  // ECG shape over one beat, input u in [0,1)
  function ecg(u) {
    const g = (m, s, a) => a * Math.exp(-((u - m) ** 2) / (2 * s * s));
    return g(.18, .025, .12) - g(.36, .008, .14) + g(.40, .012, 1) - g(.44, .01, .28) + g(.66, .04, .22);
  }

  function frame(now) {
    const t = (now - t0) / 1000;
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = 'rgba(6,18,43,0.22)'; x.fillRect(0, 0, W, H);

    for (const s of stars) {
      const a = .25 + .25 * Math.sin(t * 1.3 + s.p);
      x.fillStyle = `rgba(184,214,255,${a})`; x.beginPath(); x.arc(s.x, s.y, s.r, 0, 6.28); x.fill();
    }

    const mid = H * 0.8, amp = H * 0.12, speed = .55; // sweep fraction per second
    const head = (t * speed) % 1.25;                  // sweep position (overshoot for pause)
    const beats = 3.2;
    const N = Math.ceil(W / (2 * dpr)), seg = 6;
    const yAt = (f) => mid - ecg((f * beats) % 1) * amp * (1 + unlocking * 2);
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (let i = 0; i < N; i += seg) {
      const f0 = i / N; if (f0 > head) break;
      const alpha = Math.max(0, 1 - (head - f0) * 1.4);
      if (alpha <= 0) continue;
      x.beginPath();
      for (let k = 0; k <= seg; k++) { const f = Math.min(head, (i + k) / N); const px = f * W, py = yAt(f); k ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.strokeStyle = `rgba(111,201,255,${alpha * .18})`; x.lineWidth = 10 * dpr; x.stroke();
      x.strokeStyle = `rgba(200,250,245,${alpha * .95})`; x.lineWidth = 2 * dpr; x.stroke();
    }
    x.globalCompositeOperation = 'lighter';
    if (head <= 1) {
      const hx = head * W, hy = yAt(head);
      for (let k = 0; k < (reduce ? 0 : 3); k++) parts.push({ x: hx, y: hy, vx: (Math.random() - .3) * 1.6 * dpr, vy: (Math.random() - .5) * 1.6 * dpr, l: 1, warm: Math.random() < .25 });
      const g = x.createRadialGradient(hx, hy, 0, hx, hy, 60 * dpr);
      g.addColorStop(0, 'rgba(255,240,200,.9)'); g.addColorStop(.2, 'rgba(159,232,228,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(hx, hy, 60 * dpr, 0, 6.28); x.fill();
    }
    // particles drift toward the centre — the light gathers
    const cx = W / 2, cy = H * 0.36;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const dx = cx - p.x, dy = cy - p.y, d = Math.hypot(dx, dy) + 1;
      p.vx += dx / d * .03 * dpr * (1 + unlocking * 6); p.vy += dy / d * .03 * dpr * (1 + unlocking * 6);
      const mx = p.x - mouse.x, my = p.y - mouse.y, md = Math.hypot(mx, my);
      if (md < 120 * dpr) { p.vx += mx / md * .4; p.vy += my / md * .4; }
      p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.l -= .006;
      if (p.l <= 0 || d < 6 * dpr) { parts.splice(i, 1); continue; }
      x.fillStyle = p.warm ? `rgba(255,210,122,${p.l * .8})` : `rgba(159,232,228,${p.l * .7})`;
      x.fillRect(p.x, p.y, 1.6 * dpr, 1.6 * dpr);
    }
    const pulse = .5 + .5 * Math.sin(t * 2.2);
    const R = (220 + unlocking * 900) * dpr;
    const halo = x.createRadialGradient(cx, cy, 0, cx, cy, R);
    halo.addColorStop(0, `rgba(255,226,160,${.10 + .06 * pulse + unlocking * .5})`);
    halo.addColorStop(.5, `rgba(111,201,255,${.04 + unlocking * .2})`);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = halo; x.beginPath(); x.arc(cx, cy, R, 0, 6.28); x.fill();

    if (parts.length > 1400) parts.splice(0, parts.length - 1400);
    if (unlocking) unlocking = Math.min(1, unlocking + .012);
    raf = requestAnimationFrame(frame);
  }

  size();
  addEventListener('resize', size);
  addEventListener('pointermove', onMove);
  raf = requestAnimationFrame(frame);
  return {
    unlock() { unlocking = .01; },
    stop() { cancelAnimationFrame(raf); removeEventListener('resize', size); removeEventListener('pointermove', onMove); },
  };
}
