# DreamFrame standalone route

The DreamFrame concept lives at `/dreamframe`; the existing ALO homepage and
public navigation remain unchanged. The feature-grid and 3D layouts are drafts
until the supplied design references are available.

## Scroll-sequence assets

The requested `public/frames_150.zip` was not present in the checkout. Extract
its contents into `public/images/dreamframe/frames/` as `frame-001.png` through `frame-150.png`
(the filenames need to be directly in that directory). Rebuild/restart the app
after adding the assets. When all 150 files exist, the route automatically
switches from the static fallback to the 400vh sticky canvas sequence. Missing
or incomplete assets deliberately leave the short static hero in place, rather
than generating failed requests or trapping visitors in a stationary scroll.

The canvas progressively preloads the sequence, prioritizes the current scroll
position, draws at up to 2x device pixel ratio, and uses a requestAnimationFrame
loop to ease toward the scroll position. Reduced-motion users see a still first
frame and a one-screen hero. The PNG sequence is not included in this checkout.
