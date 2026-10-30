/**
 * GLASS opening sequence (≈3.8s, once per session).
 *
 *   0.10s  a faint warm light rises behind the glass
 *   0.50s  G-L-A-S-S come into focus one by one (blur → sharp, small slide from the left)
 *   2.45s  the logo recedes: it grows to the exact box of the hero's background
 *          wordmark while fading to the same opacity, then is swapped for it
 *   2.90s  navigation and hero copy arrive
 *
 * Everything runs on WAAPI (transform / opacity / filter only). Any input skips
 * it. With reduced motion it becomes a short cross-fade with no movement.
 */
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const EASE_OUT_QUART = 'cubic-bezier(0.25, 1, 0.5, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
const SKIP_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

export function initIntro() {
  const html = document.documentElement;
  const found = document.querySelector<HTMLElement>('[data-intro-root]');
  if (!found) return;
  const root: HTMLElement = found;
  if (html.dataset.intro !== 'play') {
    root.remove();
    return;
  }

  try {
    sessionStorage.setItem('glass:intro', '1');
  } catch {
    /* storage unavailable: the intro simply plays again next time */
  }

  const veil = root.querySelector<HTMLElement>('[data-intro-veil]')!;
  const glow = root.querySelector<HTMLElement>('[data-intro-glow]')!;
  const mark = root.querySelector<HTMLElement>('[data-intro-mark]')!;
  const letters = Array.from(mark.querySelectorAll<SVGElement>('.wordmark__letter'));
  const heroMark = document.querySelector<HTMLElement>('[data-hero-mark]');
  const reveals = Array.from(document.querySelectorAll<HTMLElement>('[data-intro-reveal]')).sort(
    (a, b) => Number(a.dataset.introReveal) - Number(b.dataset.introReveal),
  );
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const markOpacity = heroMark
    ? parseFloat(getComputedStyle(heroMark).getPropertyValue('--mark-opacity')) || 0.075
    : 0;

  const anims: Animation[] = [];
  const play = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
    const a = el.animate(keyframes, { fill: 'both', ...options });
    anims.push(a);
    return a;
  };

  let done = false;

  const cleanup = () => {
    // Same frame: drop the gate, remove the overlay, release every fill.
    // The hero mark is already where the intro mark ended, at the same opacity.
    html.removeAttribute('data-intro');
    root.remove();
    anims.forEach((a) => a.cancel());
    SKIP_EVENTS.forEach((t) => window.removeEventListener(t, skip));
    window.removeEventListener('resize', onResize);
  };

  function skip() {
    if (done) return;
    done = true;
    const FADE = 200;
    const targets = heroMark ? [...reveals, heroMark] : reveals;
    const from = targets.map((el) => getComputedStyle(el).opacity);
    const rootFrom = getComputedStyle(root).opacity;
    anims.forEach((a) => a.pause());
    targets.forEach((el, i) => {
      el.getAnimations().forEach((a) => a.cancel());
      const to = el === heroMark ? String(markOpacity) : '1';
      play(el, [{ opacity: from[i] }, { opacity: to }], { duration: FADE, easing: EASE_OUT });
    });
    root.animate([{ opacity: rootFrom }, { opacity: 0 }], { duration: FADE, easing: EASE_OUT, fill: 'forwards' })
      .finished.then(cleanup, cleanup);
  }

  // Mobile browsers fire `resize` as their toolbars settle; only a real width
  // change (rotation, window resize) invalidates the hand-off geometry.
  const startWidth = window.innerWidth;
  const onResize = () => {
    if (Math.abs(window.innerWidth - startWidth) > 1) skip();
  };

  SKIP_EVENTS.forEach((t) => window.addEventListener(t, skip, { passive: true }));
  window.addEventListener('resize', onResize);

  if (reduce) {
    // Cross-fade only: no blur, no slide, no scale.
    letters.forEach((l) => play(l, [{ opacity: 0 }, { opacity: 1 }], { delay: 150, duration: 500, easing: 'ease' }));
    play(glow, [{ opacity: 0 }, { opacity: 1 }], { delay: 150, duration: 500, easing: 'ease' });
    const T = 1400;
    play(root, [{ opacity: 1 }, { opacity: 0 }], { delay: T, duration: 500, easing: 'ease' });
    reveals.forEach((el) => play(el, [{ opacity: 0 }, { opacity: 1 }], { delay: T, duration: 500, easing: 'ease' }));
    if (heroMark) {
      play(heroMark, [{ opacity: 0 }, { opacity: markOpacity }], { delay: T, duration: 500, easing: 'ease' });
    }
  } else {
    // 1. Light rises, drifting slightly left → right as the letters resolve.
    play(
      glow,
      [
        { opacity: 0, transform: 'translateX(-12%) scale(0.94)' },
        { opacity: 1, transform: 'none' },
      ],
      { delay: 100, duration: 1500, easing: EASE_OUT_QUART },
    );

    // 2. Letters come into focus through the glass.
    letters.forEach((letter, i) =>
      play(
        letter,
        [
          { opacity: 0, filter: 'blur(10px)', transform: 'translateX(-14%)' },
          { opacity: 1, filter: 'blur(0px)', transform: 'none' },
        ],
        { delay: 500 + i * 110, duration: 950, easing: EASE_OUT_QUART },
      ),
    );

    // 3. The logo becomes architecture: grow into the hero wordmark's exact box.
    const T = 2450;
    if (heroMark) {
      const from = mark.getBoundingClientRect();
      const to = heroMark.getBoundingClientRect();
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      const s = to.width / from.width;
      play(
        mark,
        [
          { transform: 'none', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: markOpacity },
        ],
        { delay: T, duration: 1100, easing: EASE_IN_OUT },
      );
    } else {
      play(mark, [{ opacity: 1 }, { opacity: 0 }], { delay: T, duration: 600, easing: EASE_OUT });
    }
    play(glow, [{ opacity: 1 }, { opacity: 0 }], { delay: T, duration: 900, easing: EASE_OUT, fill: 'forwards' });
    play(veil, [{ opacity: 1 }, { opacity: 0 }], { delay: T + 50, duration: 1000, easing: EASE_OUT });

    // 4. Navigation and copy arrive (translate, so existing transforms are untouched).
    reveals.forEach((el, i) =>
      play(
        el,
        [
          // The nav is anchored to the top edge, so it settles down; the copy rises.
          { opacity: 0, translate: el.matches('.nav') ? '0 -8px' : '0 10px' },
          { opacity: 1, translate: '0 0' },
        ],
        { delay: T + 450 + i * 80, duration: 700, easing: EASE_OUT },
      ),
    );
  }

  Promise.all(anims.map((a) => a.finished)).then(
    () => {
      if (done) return;
      done = true;
      cleanup();
    },
    () => {
      /* cancelled by skip(), which cleans up itself */
    },
  );
}
