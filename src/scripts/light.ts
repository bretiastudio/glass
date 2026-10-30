/**
 * Cursor-following light for fine pointers only.
 *
 * A critically damped spring per axis (Apple's damping 1.0 — no overshoot)
 * with a slow response, so the light trails the cursor like a source behind
 * frosted glass. The loop runs only while the light is moving and the hero is
 * on screen; it writes `transform` directly (no CSS variables, no layout reads
 * per frame).
 */
const RESPONSE = 0.9; // seconds — deliberately slow and calm
const OMEGA = (2 * Math.PI) / RESPONSE;
const REST_EPSILON = 0.25; // px and px/s below which the light is considered settled

export function initLight() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const light = hero?.querySelector<HTMLElement>('[data-light]');
  if (!hero || !light) return;

  let enabled = false;
  let visible = true;
  let raf = 0;
  let last = 0;
  let heroRect = hero.getBoundingClientRect();
  const pos = { x: 0, y: 0, vx: 0, vy: 0 };
  const target = { x: 0, y: 0 };

  const rest = () => {
    target.x = heroRect.width * 0.72;
    target.y = heroRect.height * 0.3;
  };

  const write = () => {
    light.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
  };

  const step = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30); // clamp after tab switches
    last = now;
    // Critically damped spring: a = ω²(target − x) − 2ω·v
    pos.vx += (OMEGA * OMEGA * (target.x - pos.x) - 2 * OMEGA * pos.vx) * dt;
    pos.vy += (OMEGA * OMEGA * (target.y - pos.y) - 2 * OMEGA * pos.vy) * dt;
    pos.x += pos.vx * dt;
    pos.y += pos.vy * dt;
    write();

    const settled =
      Math.abs(target.x - pos.x) < REST_EPSILON &&
      Math.abs(target.y - pos.y) < REST_EPSILON &&
      Math.abs(pos.vx) < REST_EPSILON &&
      Math.abs(pos.vy) < REST_EPSILON;
    raf = settled ? 0 : requestAnimationFrame(step);
  };

  const wake = () => {
    if (raf || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(step);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    target.x = e.clientX - heroRect.left;
    target.y = e.clientY - heroRect.top;
    wake();
  };

  const measure = () => {
    heroRect = hero.getBoundingClientRect();
  };

  const enable = () => {
    if (enabled) return;
    enabled = true;
    measure();
    rest();
    pos.x = target.x;
    pos.y = target.y;
    document.documentElement.classList.add('light-live');
    write();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
  };

  const disable = () => {
    if (!enabled) return;
    enabled = false;
    cancelAnimationFrame(raf);
    raf = 0;
    document.documentElement.classList.remove('light-live');
    light.style.transform = '';
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('scroll', measure);
    window.removeEventListener('resize', measure);
  };

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }).observe(hero);

  const sync = () => (fine.matches && !reduce.matches ? enable() : disable());
  fine.addEventListener('change', sync);
  reduce.addEventListener('change', sync);
  sync();
}
