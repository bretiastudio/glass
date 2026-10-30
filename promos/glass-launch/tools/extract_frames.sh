#!/usr/bin/env bash
# Frames of the two GLASS films, at their own rate, for the composition (comp/frames/, not committed).
# The sources are the site's own trimmed files (assets/media/), untouched: no grade, no crop, no filter.
#   film 01: 0.9–6.2 s (30 fps) — the pour into the shaker, the jigger
#   film 02: 0.0–1.92 s (25 fps) — its opening flash cuts and the bar spoon; it stops before the colour
#            flash at 1.96 s, and the film never uses anything after 7.0 s.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p comp/frames/film01 comp/frames/film02
ffmpeg -v error -y -i assets/media/glass-experience-01.mp4 -vf "select='between(n,27,186)'" -vsync 0 -q:v 2 -start_number 27 comp/frames/film01/%04d.jpg
ffmpeg -v error -y -i assets/media/glass-experience-02.mp4 -vf "select='between(n,0,48)'" -vsync 0 -q:v 2 -start_number 0 comp/frames/film02/%04d.jpg
echo "film01: $(ls comp/frames/film01 | wc -l) frames · film02: $(ls comp/frames/film02 | wc -l) frames"
