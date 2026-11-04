#!/usr/bin/env python3
"""Mount the real, built GLASS site inside the film's composition.

    python3 -I tools/build_site.py /path/to/glass-site/dist

Reads the site's own built index.html (branch claude/great-shannon-r0o8rk, `npm run build`) and writes
comp/site/: one stylesheet and one body per viewport, ready to be placed in a shadow root. Nothing is
redrawn: the markup and the CSS are the site's. Only what a shadow root and a frame-by-frame clock need
is rewritten:

- document selectors (:root, html, body) → the shadow host and a body wrapper;
- media queries and viewport units are resolved for each viewport (desktop 1920×1080 with a mouse,
  mobile 390×844 touch, phone 390×693 touch — exactly 9:16, the vertical film's frame);
- :hover / :active → .is-hover / .is-active, set by the film from the pointer's position;
- CSS animations and transitions off: the film computes every state change itself, from the site's own
  durations and curves, so any frame can be sought.
"""
import base64, json, re, shutil, sys
from pathlib import Path

DIST = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / 'comp' / 'site'
VIEWPORTS = {
    'desktop': dict(w=1920, h=1080, hover=True),
    'mobile': dict(w=390, h=844, hover=False),
    'phone': dict(w=390, h=693.333, hover=False),     # a 9:16 phone viewport: the vertical film's frame
}
REM = 16


def block_end(s, i):
    """Index just past the brace block that opens at s[i] == '{'."""
    depth = 0
    for j in range(i, len(s)):
        if s[j] == '{': depth += 1
        elif s[j] == '}':
            depth -= 1
            if depth == 0: return j + 1
    raise ValueError('unbalanced CSS')


def length(v):
    m = re.fullmatch(r'([\d.]+)(px|rem)', v.strip())
    return float(m.group(1)) * (REM if m.group(2) == 'rem' else 1)


def feature(f, vp):
    f = f.strip().strip('()').replace(' ', '')
    if f.startswith('not'): return not feature(f[3:], vp)
    m = re.fullmatch(r'(width|height)(>=|<=|>|<)(.+)', f)
    if m:
        a, op, b = vp['w' if m.group(1) == 'width' else 'h'], m.group(2), length(m.group(3))
        return {'>=': a >= b, '<=': a <= b, '>': a > b, '<': a < b}[op]
    k, _, v = f.partition(':')
    if k == 'hover': return (v == 'hover') == vp['hover']
    if k == 'pointer': return (v == 'fine') == vp['hover']
    if k == 'orientation': return (v == 'landscape') == (vp['w'] > vp['h'])
    if k == 'prefers-reduced-motion': return v == 'no-preference'
    if k in ('prefers-contrast', 'prefers-reduced-transparency'): return False
    if k == 'backdrop-filter': return True                       # @supports: Chromium has it
    raise ValueError('unknown media feature: ' + f)


def condition(q, vp):
    return any(all(feature(p, vp) for p in re.split(r'\)\s*and\s*\(', alt.strip()))
               for alt in q.split(','))


def resolve_at_rules(css, vp):
    out, i = [], 0
    while True:
        m = re.compile(r'@(media|supports)\s*([^{]+)\{').search(css, i)
        if not m:
            out.append(css[i:]); break
        out.append(css[i:m.start()])
        end = block_end(css, m.end() - 1)
        inner = css[m.end():end - 1]
        cond = m.group(2).strip()
        ok = condition(cond, vp) if m.group(1) == 'media' else (not feature(cond[3:], vp) if cond.startswith('not') else feature(cond, vp))
        if ok: out.append(resolve_at_rules(inner, vp))
        i = end
    return ''.join(out)


def resolve_units(css, vp):
    def px(m):
        n, u = float(m.group(1)), m.group(2)
        base = {'vw': vp['w'], 'vh': vp['h'], 'svh': vp['h'], 'dvh': vp['h'], 'lvh': vp['h'],
                'vmin': min(vp['w'], vp['h']), 'vmax': max(vp['w'], vp['h'])}[u]
        return f'{n * base / 100:.3f}px'
    return re.sub(r'(?<![\w-])(\d*\.?\d+)(vw|vh|svh|dvh|lvh|vmin|vmax)\b', px, css)


def host_selectors(css):
    def html(m):
        comp = m.group(1)
        return f':host({comp})' if comp else ':host'
    css = re.sub(r'(?<![\w.#-]):root\b', ':host', css)
    css = re.sub(r'(?<![\w.#\[-])html((?:\[[^\]]*\]|\.[\w-]+)*)(?=[\s{,>:])', html, css)
    css = re.sub(r'(?<![\w.#\[-])body(?=[\s{,>:\[.])', '.site-body', css)
    # classes the site's scripts put on <html> without naming it in the selector (light.ts: .light-live)
    css = re.sub(r'(?<![\w-])\.light-live(?=\s)', ':host(.light-live)', css)
    css = css.replace(':hover', '.is-hover').replace(':active', '.is-active')
    return css


def main():
    page = (DIST / 'index.html').read_text()
    css = re.search(r'<style>(.*?)</style>', page, re.S).group(1)
    body = re.search(r'<body>(.*)</body>', page, re.S).group(1)

    faces = re.findall(r'@font-face\{.*?\}', css, re.S)
    for f in faces: css = css.replace(f, '')
    font = base64.b64encode((DIST / 'fonts/jost-latin-wght.woff2').read_bytes()).decode()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'jost.css').write_text('\n'.join(faces).replace(
        "url(/fonts/jost-latin-wght.woff2)", f"url(data:font/woff2;base64,{font})") + '\n')

    css = css.replace('/brand/grain.webp', 'site/grain.webp')

    body = re.sub(r'<script.*?</script>', '', body, flags=re.S)
    body = re.sub(r'<video\b.*?</video>|<video\b[^>]*/>', '', body, flags=re.S)
    body = body.replace('src="/media/', 'src="site/media/').replace(' loading="lazy"', '')
    body = body.replace('<main', '<div class="scroller" data-scroller><main', 1).replace('</footer>', '</footer></div>', 1)

    mounts = {}
    for name, vp in VIEWPORTS.items():
        out = host_selectors(resolve_units(resolve_at_rules(css, vp), vp))
        out += '\n*,*::before,*::after{animation:none!important;transition:none!important}\n'
        mounts[name] = {'css': out, 'html': body, 'w': vp['w'], 'h': vp['h']}
    (OUT / 'site.js').write_text('// Generated by tools/build_site.py from the built GLASS site. Do not edit.\n'
                                 'window.GLASS_SITE = ' + json.dumps(mounts, ensure_ascii=False) + ';\n')
    shutil.copy(DIST / 'brand/grain.webp', OUT / 'grain.webp')
    for p in (DIST / 'media').glob('*-poster.webp'): shutil.copy(p, OUT / 'media' / p.name)
    print('mounts:', {k: (len(v['css']), len(v['html'])) for k, v in mounts.items()})
    left = sorted(set(re.findall(r'@media[^{]+|(?<![\w-])\d*\.?\d+v(?:w|h|min|max)\b|(?<![\w.#-])html\b', mounts['mobile']['css'])))
    print('unresolved in mobile:', left)


main()
