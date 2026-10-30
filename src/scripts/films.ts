/**
 * Video panels.
 *
 * - Nothing downloads until a panel is close to the viewport (preload="none").
 * - Each film autoplays once, muted, when it is mostly on screen — and only one
 *   plays at a time.
 * - When it ends, the poster returns and the control becomes a replay arrow.
 * - Leaving the viewport pauses playback; coming back resumes it, unless the
 *   viewer paused it themselves.
 * - Reduced motion or Save-Data: no autoplay, the viewer starts it.
 *
 * Without JavaScript the native controls stay in place.
 */
type State = 'idle' | 'playing' | 'paused' | 'ended';

const LABELS: Record<State, string> = {
  idle: 'Riproduci il video',
  playing: 'Metti in pausa il video',
  paused: 'Riprendi il video',
  ended: 'Guarda di nuovo il video',
};

interface Film {
  root: HTMLElement;
  video: HTMLVideoElement;
  control: HTMLButtonElement;
  autoplayed: boolean;
  pausedByUser: boolean;
  pausedByScroll: boolean;
  visible: boolean;
}

export function initFilms() {
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-film]'));
  if (!roots.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const autoplay = !reduce && !saveData;

  const films: Film[] = roots.map((root) => {
    const video = root.querySelector<HTMLVideoElement>('[data-film-video]')!;
    const control = root.querySelector<HTMLButtonElement>('[data-film-control]')!;
    video.controls = false;
    video.muted = true; // property, not just attribute: required for autoplay
    control.hidden = false;
    return { root, video, control, autoplayed: false, pausedByUser: false, pausedByScroll: false, visible: false };
  });

  const setState = (film: Film, state: State) => {
    film.root.dataset.state = state;
    film.control.setAttribute('aria-label', LABELS[state]);
  };

  const play = (film: Film, { fromStart = false } = {}) => {
    films.forEach((other) => {
      if (other !== film && !other.video.paused) {
        other.video.pause();
        other.pausedByScroll = true; // yield, resume later if it comes back into focus
      }
    });
    if (fromStart) film.video.currentTime = 0;
    film.pausedByUser = false;
    film.pausedByScroll = false;
    film.video.play().catch(() => setState(film, 'idle'));
  };

  const wantsStage = (f: Film) =>
    f.visible && !f.video.ended && ((autoplay && !f.autoplayed) || (f.pausedByScroll && !f.pausedByUser));

  // Give the stage to the next visible film that is waiting for it.
  const promote = (except: Film) => {
    if (films.some((f) => !f.video.paused)) return;
    const next = films.find((f) => f !== except && wantsStage(f));
    if (!next) return;
    next.autoplayed = true;
    play(next);
  };

  films.forEach((film) => {
    const { video, control } = film;

    video.addEventListener('play', () => setState(film, 'playing'));
    video.addEventListener('pause', () => {
      if (!video.ended) setState(film, 'paused');
    });
    video.addEventListener('ended', () => {
      setState(film, 'ended');
      promote(film);
    });

    control.addEventListener('click', () => {
      const state = film.root.dataset.state as State;
      if (state === 'playing') {
        film.pausedByUser = true;
        video.pause();
      } else {
        play(film, { fromStart: state === 'ended' });
      }
    });
  });

  // Start fetching metadata shortly before a panel arrives.
  const warm = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const video = (entry.target as HTMLElement).querySelector('video');
        if (video && video.preload === 'none') video.preload = 'metadata';
        warm.unobserve(entry.target);
      });
    },
    { rootMargin: '200px 0px' },
  );

  // Autoplay once / pause off-screen / resume on return.
  const focus = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const film = films.find((f) => f.root === entry.target);
        if (!film) return;
        // Measured against the panel, or against the viewport for panels taller
        // than the screen (landscape phones). Hysteresis: start at 60%, stop
        // below 20%, so a small scroll never toggles playback.
        const viewport = entry.rootBounds?.height ?? window.innerHeight;
        const share = entry.isIntersecting
          ? Math.max(entry.intersectionRatio, entry.intersectionRect.height / viewport)
          : 0;

        if (share < 0.2) {
          film.visible = false;
          if (!film.video.paused) {
            film.pausedByScroll = true;
            film.video.pause();
            promote(film);
          }
          return;
        }
        if (share < 0.6) return;
        film.visible = true;

        if (films.some((f) => f !== film && !f.video.paused)) return;
        if (wantsStage(film)) {
          film.autoplayed = true;
          play(film);
        }
      });
    },
    { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
  );

  films.forEach((film) => {
    warm.observe(film.root);
    focus.observe(film.root);
  });
}
