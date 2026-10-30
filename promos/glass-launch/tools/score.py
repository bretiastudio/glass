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
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1920, 'height': 1080})
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
    D = ev['T']; s = Score(dur=D, T60=1.3)
    place = s.place
    at = {}
    for e in ev['events']: at.setdefault(e['kind'], []).append(e)
    first = lambda k: at[k][0]

    # ── the bed
    # the bed plays under movement and stops on the still beats: the headline, the phone, the menu, the Instagram hold,
    # the closing GLASS (one crystal tone in silence) and the breath before POWERED BY
    bed = pad(D + 2) * env([(0, 0), (0.55, 0), (2.6, 0.6), (4.4, 0.66), (7.2, 0.55), (7.8, 0.0), (9.3, 0.0), (9.95, 0.5),
                            (11.4, 0.55), (12.5, 0.42), (12.9, 0.0), (14.75, 0.0), (15.6, 0.42), (16.6, 0.62), (22.25, 0.66),
                            (22.6, 0.0), (23.5, 0.0), (24.5, 0.34), (25.1, 0.3), (25.6, 0.0), (28.9, 0.0), (29.5, 0.22),
                            (30.25, 0.0), (D + 2, 0)], int(SR * (D + 2)))
    place(bed[:int(SR * D)], 0.0, 0.34, -0.12, 0.55); place(np.roll(bed, int(SR * 0.021))[:int(SR * D)], 0.0, 0.34, 0.12, 0.55)
    place(shaker_pulse(D, 16.45, 22.5, 0.82), 0.0, 0.42, 0.08, 0.35)
    place(light_air(np.array(ev['light']['speed']), ev['light']['hz'], D), 0.0, 0.2, 0.0, 0.6)

    # ── the name: the light rises, one crystal tone as the letters come into focus
    e = first('light-rise'); place(air(1.8, 110, 700, 0.8, 0.6), e['t'], 0.32, e['pan'] * 0.6, 0.7, pan_to=0.1)
    place(sub(41, 2.6), e['t'] + 0.2, 0.1, 0, 0.5)
    e = first('name'); place(glass(587.33, 3.0, 0.35), e['t'] + 0.35, 0.13, 0, 0.75); place(glass(880, 2.6, 0.25), e['t'] + 0.47, 0.07, 0.15, 0.8)
    # ── the hand-off: the mark becomes architecture
    e = first('handoff'); place(air(1.15, 320, 95, 0.8, 0.45), e['t'], 0.4, 0, 0.6); place(sub(49, 1.4), e['t'] + 0.75, 0.32, 0, 0.45)
    # ── the snap to the nav; three hovers; the bar becomes the phone
    e = first('snap'); place(air(0.85, 170, 2400, 1.3, 0.75), e['t'] - 0.05, 0.42, -0.1, 0.45, pan_to=0.05); place(sub(66, 0.6), e['t'] + 0.78, 0.22, 0, 0.3)
    for e, f in zip(at['hover'], (2093.0, 2349.3, 2637.0)): place(glass(f, 0.35, 0.5), e['t'], 0.06 * e['v'] / 0.55, e['pan'] * 0.7, 0.4)
    e = first('bar'); place(air(0.65, 1900, 380, 1.2, 0.35), e['t'], 0.3, 0, 0.5)
    e = first('unroll'); place(air(0.8, 210, 1300, 1.0, 0.55), e['t'], 0.3, 0, 0.5)
    # ── the phone: two taps, the menu, the scroll
    for e in at['tap']: place(wood(300, 0.06), e['t'], 0.2, e['pan'] * 0.6, 0.18); place(glass(3136, 0.18, 0.4), e['t'] + 0.006, 0.035, e['pan'] * 0.6, 0.3)
    e = first('menu-open'); place(air(0.28, 2600, 4200, 1.6, 0.3), e['t'], 0.1, e['pan'] * 0.6, 0.4)
    e = first('scroll'); place(air(0.7, 700, 260, 1.0, 0.4), e['t'], 0.18, 0, 0.4)
    # ── into film 01, back to the page, the click on 02
    e = first('push'); place(air(0.85, 120, 1500, 1.1, 0.7), e['t'], 0.45, 0, 0.55); place(sub(55, 1.1), e['t'] + 0.8, 0.28, 0, 0.45)
    e = first('back'); place(air(0.9, 900, 280, 1.0, 0.45), e['t'], 0.26, -0.1, 0.5, pan_to=0.15)
    for e in at['click']: place(wood(240, 0.07), e['t'], 0.24, e['pan'] * 0.6, 0.2); place(wood(190, 0.06), e['t'] + 0.07, 0.15, e['pan'] * 0.6, 0.2)
    e = first('glide'); place(air(1.1, 320, 1300, 1.0, 0.5), e['t'], 0.28, 0.25, 0.5, pan_to=-0.25)
    # ── the page ends on its own name; the light rises behind it, as at the start
    e = first('descend'); place(air(1.8, 1300, 180, 0.9, 0.35), e['t'], 0.34, 0, 0.6)
    e = first('bookend'); place(air(1.8, 110, 700, 0.8, 0.6), e['t'], 0.3, -0.05, 0.7, pan_to=0.08)
    place(sub(41, 2.2), e['t'] + 0.1, 0.13, 0, 0.45); place(glass(587.33, 2.6, 0.35), e['t'] + 0.55, 0.15, 0, 0.6); place(glass(880, 2.2, 0.25), e['t'] + 0.67, 0.07, 0.12, 0.65)
    e = first('recede'); place(air(0.9, 600, 120, 0.8, 0.3), e['t'], 0.2, 0, 0.6)
    # ── silence, then BRETÌA: a brighter two-note signature in the same room
    e = first('signature'); t0 = e['t'] + 0.05
    place(sub(55, 1.6), t0, 0.3, 0, 0.4)
    place(glass(880.0, 2.2, 0.8), t0, 0.2, -0.08, 0.6); place(wood(440, 0.09), t0, 0.08, -0.08, 0.3)
    place(glass(1318.5, 2.6, 0.7), t0 + 0.19, 0.17, 0.1, 0.65); place(wood(659, 0.08), t0 + 0.19, 0.06, 0.1, 0.3)
    e = first('sweep'); place(air(0.9, 2400, 6500, 1.8, 0.55), e['t'], 0.07, -0.3, 0.6, pan_to=0.3)

    out = os.path.join(ROOT, 'out', 'sfx.wav'); s.write(out, peak_db=-4.5)


main()
