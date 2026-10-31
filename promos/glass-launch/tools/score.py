#!/usr/bin/env python3
"""The sound of RIFLESSO: one room, original synthesis only (no samples, no licensed music).

    python3 -I tools/score.py            → out/events.json, out/sfx.wav (48 kHz stereo)

Reads every event from the composition itself (window.__events(): times, screen positions as pans, the light's
speed), so a retimed beat takes its sound with it. Built on onetake's sound palette (scripts/sfx_palette.py:
air, glass, wood, sub, one synthetic room); set ONETAKE to the skill's folder if it isn't ~/.claude/skills/onetake.

The room is a dark lounge after hours. Five things live in it and nothing else:
  a low pad that breathes with the picture · air that follows the light and the camera · muted crystal contacts
  only where the picture has a cause (hovers, taps, clicks) · a sub under the two architectural moments ·
  silence: before the light, on the headline, and before POWERED BY.
BRETÌA gets its own two-note signature, brighter, in the same room.
"""
import asyncio, json, os, sys
import numpy as np
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(os.environ.get('ONETAKE', os.path.expanduser('~/.claude/skills/onetake')), 'scripts'))
from sfx_palette import Score, SR, air, glass, wood, sub, lp, hp, bp  # noqa: E402

rng = np.random.default_rng(11)


async def dump_events():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1080, 'height': 1920})
        await pg.goto('file://' + os.path.join(ROOT, 'comp', 'comp.html')); await pg.evaluate('window.__ready')
        ev = await pg.evaluate('__events()'); await b.close()
    os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
    json.dump(ev, open(os.path.join(ROOT, 'out', 'events.json'), 'w'), indent=1)
    return ev


def env(points, n):
    """piecewise-linear gain envelope from (t, gain) points, at audio rate"""
    t = np.arange(n) / SR; ts, gs = zip(*points)
    return np.interp(t, ts, gs)


def pad(dur):
    """the room's own tone: open voicings that move once per section, slow beating, darkened"""
    n = int(SR * dur); t = np.arange(n) / SR
    sections = [  # (start, end, frequencies)
        (0.0, 11.6, [73.42, 110.0, 146.83, 164.81, 220.0]),          # D · A · D · E · A — open, unresolved
        (11.4, 19.9, [98.0, 146.83, 220.0, 246.94, 293.66]),         # G · D · A · B · D — the phone, the films: a lift
        (19.7, 25.5, [73.42, 110.0, 146.83, 185.0, 220.0]),          # D with the F#: warmer, the page lit up
        (25.3, 33.0, [73.42, 110.0, 146.83, 220.0]),                 # open fifths again: the bookend
    ]
    out = np.zeros(n)
    for a, b, freqs in sections:
        w = np.clip((t - a) / 1.2, 0, 1) * np.clip((b - t) / 1.2, 0, 1)
        for k, f in enumerate(freqs):
            v = np.zeros(n)
            for d in (-0.0022, 0.0, 0.0019):
                v += np.sin(2 * np.pi * f * (1 + d) * t + rng.uniform(0, 6.28))
            v += 0.22 * np.sin(2 * np.pi * 2 * f * t + rng.uniform(0, 6.28))
            v *= 0.75 + 0.25 * np.sin(2 * np.pi * (0.05 + 0.013 * k) * t + k)          # each voice breathes on its own
            out += v * w / (1 + 0.35 * k)
    return lp(out, 900, 2) / 6.0


def shaker_pulse(dur, t0, t1, beat):
    """under the films: a felt low pulse and, off the beat, the hush of a shaker — the bar, not a drum kit"""
    n = int(SR * dur); out = np.zeros(n); k = 0
    for tb in np.arange(t0, t1, beat):
        w = np.sin(np.pi * (tb - t0) / (t1 - t0)) ** 0.8                               # swells in and out of the section
        s = sub(52, 0.42) * 0.55 * w * rng.uniform(0.85, 1.0)
        i = int(tb * SR); out[i:i + len(s)] += s[:n - i]
        m = int(SR * 0.16); sh = hp(rng.standard_normal(m), 5200) * np.exp(-np.arange(m) / SR * 38) * 0.16 * w
        j = int((tb + beat / 2 + rng.uniform(-0.008, 0.008)) * SR); out[j:j + m] += sh[:n - j]
        k += 1
    return out


def light_air(speed, hz, dur):
    """the light is heard as a breath: band-limited air scaled by how fast it moves"""
    n = int(SR * dur); sp = np.interp(np.arange(n) / SR, np.arange(len(speed)) / hz, speed)
    e = np.clip(sp / 900, 0, 1) ** 1.25; e = lp(e, 6, 1)
    x = lp(bp(rng.standard_normal(n), 620, 0.7), 2600)
    return x * e / (np.abs(x).max() + 1e-9)


def main():
    ev = asyncio.run(dump_events())
    D = ev['T']; B = ev['beats']; s = Score(dur=D, T60=1.3)
    place = s.place
    at = {}
    for e in ev['events']: at.setdefault(e['kind'], []).append(e)
    first = lambda k: at[k][0]

    # ── the bed: it plays under movement and stops on the still beats — the hero, the menu, the Instagram tap, the
    # closing GLASS (one crystal tone in silence) and the breath before POWERED BY
    bed = pad(D + 2) * env([(0, 0), (0.55, 0), (B['sweep'][1], 0.6), (B['introHold'][1] + 1.1, 0.66), (B['words'] + 1.2, 0.5),
                            (B['words'] + 2.2, 0.0), (B['anchor'][0], 0.0), (B['anchor'][1], 0.42), (B['push'][1], 0.62),
                            (B['swipe2'][1] - 0.2, 0.62), (B['tapCta'][0] - 0.1, 0.0), (B['down'][0], 0.0), (B['down'][0] + 0.8, 0.34),
                            (B['glow'] - 0.5, 0.3), (B['glow'], 0.0), (B['reveal'][0] + 0.2, 0.0), (B['reveal'][0] + 0.8, 0.22),
                            (B['reveal'][1] + 0.7, 0.0), (D + 2, 0)], int(SR * (D + 2)))
    place(bed[:int(SR * D)], 0.0, 0.34, -0.12, 0.55); place(np.roll(bed, int(SR * 0.021))[:int(SR * D)], 0.0, 0.34, 0.12, 0.55)
    place(shaker_pulse(D, B['push'][1] - 0.3, B['swipe2'][0] + 0.3, 0.82), 0.0, 0.42, 0.08, 0.35)   # the bar, under the films

    # ── 01 · the light rises; it crosses the name (a high shimmer travelling with it); one crystal tone as it leaves
    e = first('light-rise'); place(air(1.8, 110, 700, 0.8, 0.6), e['t'], 0.3, e['pan'] * 0.6, 0.7, pan_to=0.1)
    place(sub(41, 2.6), e['t'] + 0.2, 0.1, 0, 0.5)
    e = first('sweep'); w = B['sweep'][1] - B['sweep'][0]
    place(air(w + 0.2, 2600, 7200, 1.8, 0.5), e['t'] - 0.05, 0.1, -0.45, 0.6, pan_to=0.45)
    place(glass(1174.66, 2.4, 0.3), e['t'] + 0.55 * w, 0.05, 0.0, 0.75)
    place(glass(587.33, 3.0, 0.35), B['sweep'][1] - 0.1, 0.13, 0.1, 0.75); place(glass(880, 2.6, 0.25), B['sweep'][1] + 0.02, 0.06, 0.2, 0.8)
    # ── the hand-off: the name becomes architecture; 03 · the bar forms
    e = first('handoff'); place(air(1.15, 320, 95, 0.8, 0.45), e['t'], 0.4, 0, 0.6); place(sub(49, 1.4), e['t'] + 0.75, 0.3, 0, 0.45)
    e = first('nav-expand'); place(air(0.6, 700, 2400, 1.3, 0.3), e['t'], 0.13, 0, 0.5); place(glass(2349.3, 0.5, 0.4), e['t'] + 0.18, 0.03, 0, 0.45)
    # ── touches: taps (a soft knock and a glint), 03 · the menu forming, the anchor scroll, swipes (air)
    for e in at['tap']: place(wood(300, 0.06), e['t'], 0.2, e['pan'] * 0.6, 0.18); place(glass(3136, 0.18, 0.4), e['t'] + 0.006, 0.035, e['pan'] * 0.6, 0.3)
    e = first('menu-open'); place(air(0.32, 1800, 3800, 1.6, 0.3), e['t'], 0.11, e['pan'] * 0.6, 0.4); place(glass(2637, 0.3, 0.4), e['t'] + 0.12, 0.025, e['pan'] * 0.6, 0.4)
    e = first('scroll'); place(air(0.8, 700, 260, 1.0, 0.4), e['t'], 0.18, 0, 0.4)
    for e in at['swipe']: place(air(0.75, 900, 300, 1.0, 0.3), e['t'], 0.2, e['pan'] * 0.5, 0.45)
    # ── 04 · the portal: a low swell into the frame, the light across it, a felt landing; 05 · the aperture
    e = first('portal'); w = B['push'][1] - B['push'][0]
    place(air(w, 100, 1100, 0.9, 0.6), e['t'], 0.4, 0, 0.55); place(sub(55, 1.2), e['t'] + w - 0.05, 0.26, 0, 0.45)
    e = first('sheen'); place(air(0.85, 3000, 7000, 1.8, 0.5), e['t'], 0.06, -0.3, 0.6, pan_to=0.3); place(glass(1760, 1.8, 0.3), e['t'] + 0.35, 0.05, 0, 0.7)
    e = first('iris'); place(air(0.9, 400, 1600, 1.0, 0.25), e['t'], 0.16, 0.0, 0.55); place(glass(1318.5, 1.6, 0.4), e['t'] + 0.05, 0.075, 0.0, 0.65)
    # ── the page ends on its own name; the light rises behind it, as at the start
    e = first('descend'); place(air(1.6, 1300, 180, 0.9, 0.35), e['t'], 0.32, 0, 0.6)
    e = first('bookend'); place(air(1.8, 110, 700, 0.8, 0.6), e['t'], 0.3, -0.05, 0.7, pan_to=0.08)
    place(sub(41, 2.2), e['t'] + 0.1, 0.13, 0, 0.45); place(glass(587.33, 2.6, 0.35), e['t'] + 0.55, 0.15, 0, 0.6); place(glass(880, 2.2, 0.25), e['t'] + 0.67, 0.07, 0.12, 0.65)
    e = first('recede'); place(air(0.9, 600, 120, 0.8, 0.3), e['t'], 0.2, 0, 0.6)
    # ── silence, then 07 · BRETÌA: the reflection's shimmer crosses with the reveal, then a brighter two-note signature
    e = first('signature'); w = B['reveal'][1] - B['reveal'][0]
    place(air(w + 0.1, 2600, 7000, 1.8, 0.45), e['t'], 0.1, -0.4, 0.6, pan_to=0.4)
    t0 = e['t'] + 0.55 * w
    place(sub(55, 1.6), t0, 0.28, 0, 0.4)
    place(glass(880.0, 2.2, 0.8), t0, 0.2, -0.08, 0.6); place(wood(440, 0.09), t0, 0.08, -0.08, 0.3)
    place(glass(1318.5, 2.6, 0.7), t0 + 0.19, 0.17, 0.1, 0.65); place(wood(659, 0.08), t0 + 0.19, 0.06, 0.1, 0.3)

    out = os.path.join(ROOT, 'out', 'sfx.wav'); s.write(out, peak_db=-4.5)


main()
