/**
 * 360° tour with checkpoints (/visita).
 *
 * One equirectangular panorama drawn by a single WebGL fragment shader behind the
 * page. Scrolling stays native; it only decides which checkpoint is active.
 *
 * - Each checkpoint (`[data-tour-stop]`) faces a point of interest. The camera stays
 *   still on it. Halfway to the next checkpoint (while no card is on screen) the
 *   camera turns to the next one in a single quick move: a critically damped spring,
 *   so it leaves at once, never overshoots, and turns back smoothly if the visitor
 *   scrolls back mid-move. A small hysteresis stops it flickering at the threshold.
 * - Fast turns get motion blur along the turn (a box filter over a 1/60 s shutter)
 *   and a slight widening of the view, so the move reads as a whip pan, not a jump.
 * - The loop runs only while the camera moves. Positions are measured on resize;
 *   a scroll event reads `scrollY` and nothing else from layout.
 * - Reduced motion: no turns. The view changes at each checkpoint with a crossfade.
 * - No WebGL, no JavaScript, or a lost context: the poster stays, which is the
 *   opening view rendered by tools/tour/prepare_pano.py.
 *
 * GRADE, FOV and the projection must match tools/tour/prepare_pano.py.
 * URL flags for tuning: `?hud` shows the current direction, `?colore` skips the
 * black-and-white grade.
 */
const GRADE_GAIN = 0.78;
const GRADE_GAMMA = 1.2;
const FOV_H = 95; // degrees, wide screens
const FOV_V_MIN = 60;
const FOV_V_MAX = 80;
const PORTRAIT_SHIFT = 0.2; // lens shift on tall screens: the subject sits above the cards

/**
 * Spring response, seconds. A turn of 90–180° is mostly done in under half a second
 * and fully settled in about 0.6 s: quick enough to read as a decisive move, long
 * enough to keep the visitor oriented. Raise it for calmer turns.
 */
const RESPONSE = 0.6;
const OMEGA = (2 * Math.PI) / RESPONSE;
const HYSTERESIS = 0.06; // share of a gap past the halfway point before the camera turns
const SHUTTER = 1 / 60; // seconds of motion blurred into one frame
const BLUR_MAX = 5; // degrees
const BREATHE = 0.05; // the view widens by up to 5 % at full turning speed
const BREATHE_SPEED = 500; // degrees per second for the full widening

const rad = (deg: number) => (deg * Math.PI) / 180;
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);

export function tanHalfV(aspect: number) {
  return clamp(Math.tan(rad(FOV_H / 2)) / aspect, Math.tan(rad(FOV_V_MIN / 2)), Math.tan(rad(FOV_V_MAX / 2)));
}

const VERT = `
attribute vec2 a_pos;
varying vec2 v_ndc;
void main() {
  v_ndc = a_pos;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_tex;
uniform vec2 u_scale;  // tan(half fov) * (aspect, 1)
uniform float u_shift; // vertical lens shift, in NDC
uniform vec4 u_rot;    // cos yaw, sin yaw, cos pitch, sin pitch
uniform float u_blur;  // horizontal motion blur, in texture u (a yaw turn is a shift in u)
uniform float u_sat;
varying vec2 v_ndc;
const float PI = 3.141592653589793;
void main() {
  vec3 d = normalize(vec3(v_ndc.x * u_scale.x, (v_ndc.y - u_shift) * u_scale.y, -1.0));
  d = vec3(d.x, d.y * u_rot.z - d.z * u_rot.w, d.y * u_rot.w + d.z * u_rot.z);
  d = vec3(d.x * u_rot.x - d.z * u_rot.y, d.y, d.x * u_rot.y + d.z * u_rot.x);
  vec2 uv = vec2(0.5 + atan(d.x, -d.z) / (2.0 * PI), 0.5 - asin(clamp(d.y, -1.0, 1.0)) / PI);
  vec3 c;
  if (u_blur > 0.0) {
    c = vec3(0.0);
    for (int k = 0; k < 9; k++) {
      c += texture2D(u_tex, uv + vec2((float(k) / 8.0 - 0.5) * u_blur, 0.0)).rgb;
    }
    c /= 9.0;
  } else {
    c = texture2D(u_tex, uv).rgb;
  }
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, u_sat);
  c = ${GRADE_GAIN.toFixed(4)} * pow(clamp(c, 0.0, 1.0), vec3(${GRADE_GAMMA.toFixed(4)}));
  gl_FragColor = vec4(c, 1.0);
}`;

interface Stop {
  el: HTMLElement;
  point: string;
  yaw: number;
  pitch: number;
  zoom: number;
  at: number; // scrollY at which this checkpoint's card is in focus
}

interface View {
  yaw: number;
  pitch: number;
  zoom: number;
  speed: number; // degrees per second, for blur and widening
}

type ImageSource = ImageBitmap | HTMLImageElement;

class Renderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private tex: WebGLTexture | null = null;
  private loc: Record<'scale' | 'shift' | 'rot' | 'blur' | 'sat', WebGLUniformLocation | null> = {
    scale: null,
    shift: null,
    rot: null,
    blur: null,
    sat: null,
  };
  source: ImageSource | null = null;

  constructor(
    readonly canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext,
    private sat: number,
  ) {
    this.gl = gl;
    this.init();
  }

  get maxTexture() {
    return this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) as number;
  }

  init() {
    const gl = this.gl;
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'program');
    gl.useProgram(p);
    this.program = p;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p, 'a_pos');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

    this.loc = {
      scale: gl.getUniformLocation(p, 'u_scale'),
      shift: gl.getUniformLocation(p, 'u_shift'),
      rot: gl.getUniformLocation(p, 'u_rot'),
      blur: gl.getUniformLocation(p, 'u_blur'),
      sat: gl.getUniformLocation(p, 'u_sat'),
    };
    gl.uniform1f(this.loc.sat, this.sat);
    this.tex = null;
    if (this.source) this.upload(this.source);
  }

  /** Power-of-two panoramas: REPEAT wraps the seam, no mipmaps (the texture is always magnified). */
  upload(source: ImageSource) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
    if (this.tex) gl.deleteTexture(this.tex);
    this.tex = tex;
    this.source = source;
  }

  get ready() {
    return Boolean(this.tex && this.program);
  }

  resize(dpr: number) {
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
  }

  draw(view: View) {
    if (!this.ready) return;
    const gl = this.gl;
    const aspect = this.canvas.width / this.canvas.height;
    const widen = 1 + BREATHE * Math.min(view.speed / BREATHE_SPEED, 1);
    const t = tanHalfV(aspect) * view.zoom * widen;
    gl.uniform2f(this.loc.scale, t * aspect, t);
    gl.uniform1f(this.loc.shift, aspect < 1 ? PORTRAIT_SHIFT : 0);
    const y = rad(view.yaw);
    const p = rad(view.pitch);
    gl.uniform4f(this.loc.rot, Math.cos(y), Math.sin(y), Math.cos(p), Math.sin(p));
    const blur = Math.min(view.speed * SHUTTER, BLUR_MAX);
    gl.uniform1f(this.loc.blur, blur > 0.05 ? blur / 360 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

async function loadImage(url: string): Promise<ImageSource> {
  if ('createImageBitmap' in window) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      // Decodes off the main thread.
      return await createImageBitmap(await res.blob());
    } catch {
      /* fall through to <img> */
    }
  }
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  return img;
}

/** One critically damped spring channel, stepped with its exact solution (stable at any frame rate). */
class Spring {
  v = 0;
  constructor(
    public x: number,
    public target: number,
    private eps: number,
  ) {}

  step(dt: number) {
    const x0 = this.x - this.target;
    const e = Math.exp(-OMEGA * dt);
    const k = this.v + OMEGA * x0;
    this.x = this.target + (x0 + k * dt) * e;
    this.v = (this.v - OMEGA * k * dt) * e;
    if (Math.abs(this.x - this.target) < this.eps && Math.abs(this.v) < this.eps) {
      this.x = this.target;
      this.v = 0;
      return true;
    }
    return false;
  }

  jump(to: number) {
    this.x = this.target = to;
    this.v = 0;
  }
}

export function initTour() {
  const root = document.querySelector<HTMLElement>('[data-tour]');
  const canvas = root?.querySelector<HTMLCanvasElement>('[data-tour-canvas]');
  if (!root || !canvas) return;

  const params = new URLSearchParams(location.search);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const north = Number(root.dataset.north);
  const compass = root.querySelector<HTMLElement>('[data-tour-compass]');
  const needle = compass?.querySelector<SVGElement>('[data-tour-needle]') ?? null;
  const footer = document.querySelector<HTMLElement>('.footer');

  const stops: Stop[] = Array.from(root.querySelectorAll<HTMLElement>('[data-tour-stop]')).map((el) => ({
    el,
    point: el.dataset.point ?? '',
    yaw: north + Number(el.dataset.bearing),
    pitch: Number(el.dataset.pitch),
    zoom: Number(el.dataset.zoom) || 1,
    at: 0,
  }));
  if (!stops.length) return;

  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'default',
    });
  } catch {
    gl = null;
  }
  if (!gl) return; // the poster stays

  let renderer: Renderer;
  try {
    renderer = new Renderer(canvas, gl, params.has('colore') ? 1 : 0);
  } catch {
    return;
  }

  let hud: HTMLOutputElement | null = null;
  if (params.has('hud')) {
    hud = document.createElement('output');
    hud.className = 'tour__hud';
    document.body.append(hud);
  }

  // --- Measuring ---------------------------------------------------------------

  const measure = () => {
    const vh = window.innerHeight;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
    // Tall screens keep the cards low so the room shows above them.
    const anchor = window.innerWidth < window.innerHeight ? 0.7 : 0.5;
    stops.forEach((s, i) => {
      if (i === 0) {
        s.at = 0;
        return;
      }
      const focus = s.el.querySelector<HTMLElement>('[data-tour-focus]') ?? s.el;
      const r = focus.getBoundingClientRect();
      s.at = Math.min(r.top + window.scrollY + r.height / 2 - vh * anchor, maxScroll);
    });
    // Keep the track strictly increasing even on odd layouts.
    for (let i = 1; i < stops.length; i++) stops[i].at = Math.max(stops[i].at, stops[i - 1].at + 1);
  };

  /** Continuous position along the checkpoints: 0 at the first, 1 at the second… */
  const progress = (y: number) => {
    if (y <= stops[0].at) return 0;
    for (let i = 0; i < stops.length - 1; i++) {
      if (y < stops[i + 1].at) return i + (y - stops[i].at) / (stops[i + 1].at - stops[i].at);
    }
    return stops.length - 1;
  };

  let active = 0;

  /** The checkpoint that should be active, with hysteresis around each halfway point. */
  const pick = (y: number) => {
    const p = progress(y);
    if (p > active + 0.5 + HYSTERESIS || p < active - 0.5 - HYSTERESIS) {
      active = clamp(Math.round(p), 0, stops.length - 1);
    }
    return active;
  };

  // --- Camera -------------------------------------------------------------------------

  const yaw = new Spring(stops[0].yaw, stops[0].yaw, 0.01);
  const pitch = new Spring(stops[0].pitch, stops[0].pitch, 0.01);
  const zoom = new Spring(stops[0].zoom, stops[0].zoom, 0.0001);

  const aim = (index: number, instant: boolean) => {
    const s = stops[index];
    if (instant) {
      yaw.jump(s.yaw);
      pitch.jump(s.pitch);
      zoom.jump(s.zoom);
    } else {
      yaw.target = s.yaw;
      pitch.target = s.pitch;
      zoom.target = s.zoom;
    }
    if (compass) compass.dataset.active = s.point;
  };

  const draw = () => {
    const v: View = { yaw: yaw.x, pitch: pitch.x, zoom: zoom.x, speed: Math.abs(yaw.v) };
    renderer.draw(v);
    if (needle) needle.style.transform = `rotate(${(v.yaw - north).toFixed(2)}deg)`;
    if (hud) hud.textContent = `direzione ${(v.yaw - north).toFixed(1)}°  pitch ${v.pitch.toFixed(1)}°  zoom ${v.zoom.toFixed(2)}  checkpoint ${active}`;
  };

  let raf = 0;
  let last = 0;

  const frame = () => {
    // performance.now(), not the rAF timestamp: the timestamp can predate the wake-up,
    // which would make the first step negative.
    const now = performance.now();
    const dt = clamp((now - last) / 1000, 0, 1 / 20); // clamp after tab switches
    last = now;
    const a = yaw.step(dt);
    const b = pitch.step(dt);
    const c = zoom.step(dt);
    draw();
    raf = a && b && c ? 0 : requestAnimationFrame(frame);
  };

  const wake = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  // --- Reduced motion: stills, crossfaded at each checkpoint ----------------------------

  let swap = 0;

  const crossfade = (index: number) => {
    window.clearTimeout(swap);
    canvas.classList.add('is-swapping');
    swap = window.setTimeout(() => {
      aim(index, true);
      draw();
      canvas.classList.remove('is-swapping');
    }, 160); // --d-fast: the fade-out, then the new view fades in
  };

  // --- Wiring ------------------------------------------------------------------------

  const onScroll = () => {
    if (!renderer.ready) return;
    const before = active;
    const index = pick(window.scrollY);
    if (index === before) return;
    if (reduce.matches) {
      crossfade(index);
    } else {
      aim(index, false);
      wake();
    }
  };

  const settle = () => {
    renderer.resize(Math.min(window.devicePixelRatio || 1, 2));
    measure();
    if (!renderer.ready) return;
    cancelAnimationFrame(raf);
    raf = 0;
    active = clamp(Math.round(progress(window.scrollY)), 0, stops.length - 1);
    aim(active, true);
    draw();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  new ResizeObserver(settle).observe(canvas);
  new ResizeObserver(() => {
    measure();
    onScroll();
  }).observe(root);
  reduce.addEventListener('change', settle);
  document.fonts?.ready.then(() => {
    measure();
    onScroll();
  });

  if (compass && footer) {
    new IntersectionObserver(([entry]) => compass.classList.toggle('is-away', entry.isIntersecting), {
      rootMargin: '0px 0px -20% 0px',
    }).observe(footer);
  }

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
    canvas.classList.remove('is-live');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    try {
      renderer.init();
    } catch {
      return;
    }
    settle();
    canvas.classList.add('is-live');
  });

  // --- Loading: small panorama first, the large one when the device can hold it --

  const small = root.dataset.panoSmall!;
  const large = root.dataset.panoLarge!;

  loadImage(small)
    .then((img) => {
      renderer.upload(img);
      settle();
      // Next frame: the first draw is on screen before the canvas fades in over the poster.
      requestAnimationFrame(() => canvas.classList.add('is-live'));
      if (!saveData && renderer.maxTexture >= 4096) {
        return loadImage(large).then((big) => {
          renderer.upload(big);
          draw();
          if (img instanceof ImageBitmap) img.close();
        });
      }
    })
    .catch(() => {
      /* the poster stays */
    });
}
