#!/usr/bin/env python3
"""Pre-render rhythm check: seeks the composition at 30 fps, captured at 320 px (as verify_promo.py's rest leg reads
the film), and prints the dead-still share, the stretches of stillness and an energy line per second.

    python3 -I tools/rest_check.py comp/comp.html
"""
import asyncio, io, sys
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

async def main(comp):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1 / 6)).new_page()
        await pg.goto('file://' + comp); await pg.evaluate('window.__ready')
        dur = await pg.evaluate('__meta.dur'); n = int(dur * 30)
        prev, d = None, []
        for i in range(n):
            await pg.evaluate(f'__seek({i / 30})')
            im = np.asarray(Image.open(io.BytesIO(await pg.screenshot())).convert('L').resize((320, 180)), dtype=np.float32)
            d.append(0.0 if prev is None else float(np.abs(im - prev).mean())); prev = im
        await b.close()
    d = np.array(d); still = d < 0.5
    print(f'dead-still {still.mean():.3f} of {n} frames')
    runs, s0 = [], None
    for i, v in enumerate(still):
        if v and s0 is None: s0 = i
        if (not v or i == n - 1) and s0 is not None:
            e = i if not v else i + 1
            if e - s0 >= 9: runs.append((s0 / 30, e / 30))
            s0 = None
    print('still stretches ≥ 0.3 s:', ', '.join(f'{a:.2f}–{b:.2f}' for a, b in runs))
    print('energy per second:', ' '.join(f'{d[k * 30:(k + 1) * 30].mean():.1f}' for k in range(int(dur))))

asyncio.run(main(sys.argv[1] if sys.argv[1].startswith('/') else __import__('os').path.abspath(sys.argv[1])))
