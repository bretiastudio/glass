/**
 * Scroll-driven 360° tour (/visita).
 *
 * One equirectangular panorama drawn by a single WebGL fragment shader. Scrolling
 * never gets hijacked: the page scrolls natively and the camera follows it.
 *
 * - Each stop (`[data-tour-stop]`) has a heading. The camera holds still while a
 *   stop's card sits on the anchor line, then turns to the next heading with an
 *   ease-in-out between holds, so the room "stops" at each section by itself.
 * - The scroll position the camera follows goes through a critically damped
 *   spring (no overshoot), which smooths mouse-wheel steps; touch momentum is
 *   already smooth and passes through almost unchanged.
 * - The loop runs only while the camera is moving. Positions are measured on
 *   resize only; a frame reads `scrollY` and nothing else from layout.
 * - Reduced motion: the camera never turns. The view changes only from one stop
 *   to the next, with a short crossfade.
 * - No WebGL, no JavaScript, or a lost context: the poster stays, which is the
 *   first stop's view rendered by tools/tour/prepare_pano.py.
 *
 * GRADE, FOV and the projection must match tools/tour/prepare_pano.py.
 *
 * URL flags for tuning: `?hud` shows the current heading, `?colore` skips the
 * black-and-white grade.
 */
const GRADE_GAIN = 0.78;
const GRADE_GAMMA = 1.2;
const FOV_H = 95; // degrees, wide screens
const FOV_V_MIN = 60;
const FOV_V_MAX = 80;
const PORTRAIT_SHIFT = 0.2; // lens shift on tall screens: the subject sits above the cards

const RESPONSE = 0.5; // seconds — critically damped spring on the followed scroll position
const OMEGA = (2 * Math.PI) / RESPONSE;
const REST_EPSILON = 0.1; // px and px/s
const HOLD = 0.18; // share of each gap, at both ends, where the camera holds still
const BREATHE = 0.05; // the view widens by up to 5 % while turning

const rad = (deg: number) => (deg * Math.PI) / 180;
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

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
uniform float u_sat;
varying vec2 v_ndc;
const float PI = 3.141592653589793;
void main() {
  vec3 d = normalize(vec3(v_ndc.x * u_scale.x, (v_ndc.y - u_shift) * u_scale.y, -1.0));
  d = vec3(d.x, d.y * u_rot.z - d.z * u_rot.w, d.y * u_rot.w + d.z * u_rot.z);
  d = vec3(d.x * u_rot.x - d.z * u_rot.y, d.y, d.x * u_rot.y + d.z * u_rot.x);
  vec2 uv = vec2(0.5 + atan(d.x, -d.z) / (2.0 * PI), 0.5 - asin(clamp(d.y, -1.0, 1.0)) / PI);
  vec3 c = texture2D(u_tex, uv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, u_sat);
  c = ${GRADE_GAIN.toFixed(4)} * pow(clamp(c, 0.0, 1.0), vec3(${GRADE_GAMMA.toFixed(4)}));
  gl_FragColor = vec4(c, 1.0);
}`;

interface Stop {
  el: HTMLElement;
  yaw: number;
  pitch: number;
  at: number; // scrollY at which this stop is in focus
}

interface View {
  yaw: number;
  pitch: number;
  breathe: number;
  index: number; // nearest stop
}

type ImageSource = ImageBitmap | HTMLImageElement;

class Renderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private tex: WebGLTexture | null = null;
  private loc: Record<'scale' | 'shift' | 'rot' | 'sat', WebGLUniformLocation | null> = {
    scale: null,
    shift: null,
    rot: null,
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
    const t = tanHalfV(aspect) * (1 + BREATHE * view.breathe);
    gl.uniform2f(this.loc.scale, t * aspect, t);
    gl.uniform1f(this.loc.shift, aspect < 1 ? PORTRAIT_SHIFT : 0);
    const y = rad(view.yaw);
    const p = rad(view.pitch);
    gl.uniform4f(this.loc.rot, Math.cos(y), Math.sin(y), Math.cos(p), Math.sin(p));
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

export function initTour() {
  const root = document.querySelector<HTMLElement>('[data-tour]');
  const canvas = root?.querySelector<HTMLCanvasElement>('[data-tour-canvas]');
  if (!root || !canvas) return;

  const params = new URLSearchParams(location.search);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const endYaw = Number(root.dataset.endYaw);
  const compass = root.querySelector<HTMLElement>('[data-tour-compass]');
  const needle = compass?.querySelector<SVGElement>('[data-tour-needle]') ?? null;
  const footer = document.querySelector<HTMLElement>('.footer');

  const stops: Stop[] = Array.from(root.querySelectorAll<HTMLElement>('[data-tour-stop]')).map((el) => ({
    el,
    yaw: Number(el.dataset.yaw),
    pitch: Number(el.dataset.pitch),
    at: 0,
  }));
  if (!stops.length) return;
  // The end of the page: one full turn after the opening view.
  const end: Stop = { el: root, yaw: endYaw, pitch: stops[0].pitch, at: 0 };
  const track = [...stops, end];

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

  let vh = window.innerHeight;
  let maxScroll = 0;

  const measure = () => {
    vh = window.innerHeight;
    maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
    // Tall screens keep the cards low so the room shows above them.
    const anchor = window.innerWidth < window.innerHeight ? 0.7 : 0.5;
    stops.forEach((s, i) => {
      if (i === 0) {
        s.at = 0;
        return;
      }
      const focus = s.el.querySelector<HTMLElement>('[data-tour-focus]') ?? s.el;
      const r = focus.getBoundingClientRect();
      s.at = r.top + window.scrollY + r.height / 2 - vh * anchor;
    });
    end.at = maxScroll;
    // Keep the track strictly increasing even on odd layouts.
    for (let i = 1; i < track.length; i++) track[i].at = Math.max(track[i].at, track[i - 1].at + 1);
  };

  // --- Scroll position → view ----------------------------------------------------

  const viewAt = (y: number): View => {
    if (y <= track[0].at) return { yaw: track[0].yaw, pitch: track[0].pitch, breathe: 0, index: 0 };
    for (let i = 0; i < track.length - 1; i++) {
      const a = track[i];
      const b = track[i + 1];
      if (y < b.at || i === track.length - 2) {
        const raw = clamp((y - a.at) / (b.at - a.at), 0, 1);
        const f = smoothstep(HOLD, 1 - HOLD, raw);
        return {
          yaw: a.yaw + (b.yaw - a.yaw) * f,
          pitch: a.pitch + (b.pitch - a.pitch) * f,
          breathe: Math.sin(Math.PI * f),
          index: raw < 0.5 ? i : i + 1,
        };
      }
    }
    const last = track[track.length - 1];
    return { yaw: last.yaw, pitch: last.pitch, breathe: 0, index: track.length - 1 };
  };

  const writeCompass = (yaw: number) => {
    if (needle) needle.style.transform = `rotate(${(yaw - track[0].yaw).toFixed(2)}deg)`;
  };

  const writeHud = (v: View) => {
    if (hud) hud.textContent = `yaw ${v.yaw.toFixed(1)}°  pitch ${v.pitch.toFixed(1)}°  tappa ${v.index}`;
  };

  // --- Motion: spring on the followed scroll position ---------------------------

  const pos = { y: window.scrollY, v: 0 };
  let raf = 0;
  let last = 0;

  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30); // clamp after tab switches
    last = now;
    const target = window.scrollY;
    pos.v += (OMEGA * OMEGA * (target - pos.y) - 2 * OMEGA * pos.v) * dt;
    pos.y += pos.v * dt;
    const settled = Math.abs(target - pos.y) < REST_EPSILON && Math.abs(pos.v) < REST_EPSILON;
    if (settled) {
      pos.y = target;
      pos.v = 0;
    }
    const v = viewAt(pos.y);
    renderer.draw(v);
    writeCompass(v.yaw);
    writeHud(v);
    raf = settled ? 0 : requestAnimationFrame(frame);
  };

  const wake = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  // --- Reduced motion: stills, crossfaded at each stop ---------------------------

  let shown = -1;
  let swap = 0;

  const still = (index: number) => {
    const s = track[index];
    return { yaw: s.yaw, pitch: s.pitch, breathe: 0, index };
  };

  const showStill = (instant = false) => {
    const index = viewAt(window.scrollY).index;
    if (index === shown) return;
    shown = index;
    window.clearTimeout(swap);
    const apply = () => {
      const v = still(index);
      renderer.draw(v);
      writeCompass(v.yaw);
      writeHud(v);
      canvas.classList.remove('is-swapping');
    };
    if (instant) return apply();
    canvas.classList.add('is-swapping');
    swap = window.setTimeout(apply, 160); // --d-fast: the fade-out, then the new view fades in
  };

  // --- Wiring ------------------------------------------------------------------------

  const render = () => {
    if (!renderer.ready) return;
    if (reduce.matches) {
      cancelAnimationFrame(raf);
      raf = 0;
      showStill();
    } else {
      wake();
    }
  };

  const onResize = () => {
    renderer.resize(Math.min(window.devicePixelRatio || 1, 2));
    measure();
    pos.y = window.scrollY;
    pos.v = 0;
    if (!renderer.ready) return;
    if (reduce.matches) {
      shown = -1;
      showStill(true);
    } else {
      const v = viewAt(pos.y);
      renderer.draw(v);
      writeCompass(v.yaw);
      writeHud(v);
    }
  };

  window.addEventListener('scroll', render, { passive: true });
  new ResizeObserver(onResize).observe(canvas);
  new ResizeObserver(() => {
    measure();
    render();
  }).observe(root);
  reduce.addEventListener('change', () => {
    shown = -1;
    onResize();
  });
  document.fonts?.ready.then(() => {
    measure();
    render();
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
    onResize();
    canvas.classList.add('is-live');
  });

  // --- Loading: small panorama first, the large one when the device can hold it --

  const small = root.dataset.panoSmall!;
  const large = root.dataset.panoLarge!;

  loadImage(small)
    .then((img) => {
      renderer.upload(img);
      onResize();
      // Next frame: the first draw is on screen before the canvas fades in over the poster.
      requestAnimationFrame(() => canvas.classList.add('is-live'));
      if (!saveData && renderer.maxTexture >= 4096) {
        return loadImage(large).then((big) => {
          renderer.upload(big);
          onResize();
          if (img instanceof ImageBitmap) img.close();
        });
      }
    })
    .catch(() => {
      /* the poster stays */
    });
}
