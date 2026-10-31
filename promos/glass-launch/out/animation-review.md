# Animation review: GLASS · Riflesso (draft v3)

Method: the project's `review-animations` skill (Emil Kowalski's standards, `STANDARDS.md` on the site branch),
applied to `comp/comp.html`. A film has no runtime user, so the review splits motion in two:
**interface states the film shows** (hovers, the menu, presses, the film controls), held to the UI rules (under 300 ms,
ease-out, origin at the trigger); and **cinematic moments** (the light, the camera, the portal, the aperture, the
signature), which the standards class as marketing/explanatory, where longer durations are allowed.

## Part 1: Findings

| Before | After | Why |
| --- | --- | --- |
| Headline words staggered 85 ms (`comp.html`, 06 · the headline) | 70 ms | The standard's stagger band is 30–80 ms; 85 ms let the line read as a list of words, not one phrase arriving. **Fixed.** |
| Desktop bar → phone bar handed over by a bare opacity crossfade | A 3 px blur bell across the swap (`swapBlur`) | Standard 10: a jarring crossfade where a subtle blur would bridge two states is a finding. **Fixed.** |
| Camera to the nav on `expoInOut`, 0.8 s, peak 466 px/frame (draft v2) | `cubicInOut`, 1.15 s, peak 163 px/frame | An expo snap read as aggressive under the new direction; ease-in-out is the standard for on-screen movement. **Fixed in v3.** |
| Portal push on `expoInOut`, 0.8 s (draft v2) | `cubicInOut`, 1.3 s, with the light sweeping the frame | Too fast a zoom for a signature moment. **Fixed in v3.** |
| Mobile menu: the site's scale(.96) + fade, 220 ms | A morph out of the toggle's rect, 280 ms `cubic-bezier(.23,1,.32,1)`, links +45 ms; exit 160 ms | Origin at the trigger, never `scale(0)`, under 300 ms, asymmetric enter/exit. Kept within the UI budget on purpose: the brief asked for a liquid morph, the standard caps UI at 300 ms. |
| End signature on a critically damped spring | `swiftSpring` with bounce 0.1 (ζ 0.9) | The brief asks for "a very subtle settling response"; the standard keeps bounce at 0.1–0.3 and never playful here. |
| Refraction streaks 34–230 px wide at up to 5 % (first pass of v3) | 160–520 px at 2.2–3 % | The thinnest streak read as a hard line, a scratch on the glass. "Never an aggressive spotlight." **Fixed before render.** |

No `ease-in` on any interface motion, no `scale(0)`, no layout-property animation (transform, opacity, clip-path and
filter only), no motion on a high-frequency action.

## Part 2: Verdict

1. **Feel-breaking regressions:** none remaining. The two that existed (the expo snap to the nav and the fast portal
   push) were fixed in v3.
2. **Missed simplifications:** none open. The refraction was reduced instead of removed, because the brief names it
   as a signature; at 2–3 % it stays secondary to the type. The crystal aperture appears once.
3. **Performance:** all motion is transform, opacity, clip-path or small filters; there is no full-screen blur. The one
   blur is the 3 px swap bridge, on a bar-sized layer for 0.35 s.
4. **Interruptibility and timing:** N/A as runtime behaviour (a rendered film is not interrupted). Enter and exit
   are asymmetric where the site's are (the menu, the presses).
5. **Origin, physicality and cohesion:** the menu forms from the toggle; the bar from its own centre; the logo
   settles from 0.97 with a 12 px rise; one light language throughout.
6. **Accessibility:** `prefers-reduced-motion` and hover gating apply to the website, not to a rendered video. The
   site keeps its own reduced-motion paths; the film does not change them.

**Decision: Approve**, on the condition that the draft v3 render confirms the same at playback speed (frame check
on the encoded file, below in `REPORT.md` §9).
