'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { ArrowDown, ArrowUpRight, Menu, X } from 'lucide-react';
import { easeFrame, FRAME_COUNT, frameUrl, nearestReadyFrame, targetFrameForScroll, type FrameState } from './sequence';

function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 1.5c1.3 7.8 5.7 12.2 13.5 13.5-7.8 1.3-12.2 5.7-13.5 13.5C14.7 20.7 10.3 16.3 2.5 15 10.3 13.7 14.7 9.3 16 1.5Z" fill="currentColor" />
      <path d="M26.8 21.6c.4 2.4 1.8 3.8 4.2 4.2-2.4.4-3.8 1.8-4.2 4.2-.4-2.4-1.8-3.8-4.2-4.2 2.4-.4 3.8-1.8 4.2-4.2Z" fill="currentColor" />
    </svg>
  );
}

function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className="df-nav">
      <a className="df-nav-brand" href="#top" aria-label="DreamFrame home" onClick={() => setMenuOpen(false)}>
        <BrandMark className="df-nav-mark" />
        <span>dreamframe<span className="df-nav-brand-dot">.</span></span>
      </a>

      <nav className="df-nav-links" aria-label="Main navigation">
        <a href="#product">The product</a>
        <a href="#gallery">Explore</a>
        <a href="#model-creator">3D creator</a>
      </nav>

      <a className="df-nav-cta" href="#create">
        Get started <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
      </a>

      <button
        className="df-menu-toggle"
        type="button"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="df-mobile-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={21} /> : <Menu size={22} />}
      </button>
      {menuOpen && (
        <nav id="df-mobile-menu" className="df-mobile-menu" aria-label="Mobile navigation">
          <a href="#product" onClick={() => setMenuOpen(false)}>The product</a>
          <a href="#gallery" onClick={() => setMenuOpen(false)}>Explore</a>
          <a href="#model-creator" onClick={() => setMenuOpen(false)}>3D creator</a>
          <a href="#create" onClick={() => setMenuOpen(false)}>Get started <ArrowUpRight size={16} aria-hidden="true" /></a>
        </nav>
      )}
    </header>
  );
}

/**
 * The background remains a normal image until all 150 source files exist.
 * Once supplied, scrolling through the outer section drives this canvas; time
 * only controls the easing toward the scroll-derived target, never playback.
 */
function SequenceCanvas({ section, enabled }: {
  section: RefObject<HTMLElement | null>;
  enabled: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = section.current;
    if (!enabled || !canvas || !hero) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposePlayback: (() => void) | undefined;

    const startPlayback = () => {
      disposePlayback?.();
      let disposed = false;
      let animationFrame = 0;
      let lastTime = 0;
      let currentFrame = 0;
      let targetFrame = 0;
      let lastDrawn = -1;
      let needsDraw = true;
      let activeLoads = 0;
      let cssWidth = 0;
      let cssHeight = 0;
      const reducedMotion = motionPreference.matches;
      const images: Array<HTMLImageElement | undefined> = Array(FRAME_COUNT);
      const states: FrameState[] = Array(FRAME_COUNT).fill('idle');
      const queue: number[] = [];

      // Representative frames become available early during a fast scroll,
      // while the rest of the sequence continues loading in the background.
      const enqueue = (index: number) => {
        if (index < 0 || index >= FRAME_COUNT || states[index] !== 'idle') return;
        states[index] = 'queued';
        queue.push(index);
      };
      enqueue(0);
      if (!reducedMotion) {
        enqueue(FRAME_COUNT - 1);
        for (let i = 10; i < FRAME_COUNT - 1; i += 10) enqueue(i);
        for (let i = 1; i < FRAME_COUNT - 1; i += 1) enqueue(i);
      }

      const draw = () => {
        if (disposed || !cssWidth || !cssHeight) return;
        // Keep the first-frame CSS background visible while it loads, even if a
        // later preload finishes first. A failed first frame must not block playback.
        if (lastDrawn === -1 && states[0] !== 'ready' && states[0] !== 'error') return;
        const desired = reducedMotion ? 0 : currentFrame;
        // Draw the closest available frame rather than clearing the canvas or
        // flashing the background while a newly requested image is loading.
        const available = nearestReadyFrame(desired, states);
        if (available < 0 || (!needsDraw && available === lastDrawn)) return;
        const image = images[available];
        if (!image?.naturalWidth || !image.naturalHeight) return;
        const scale = Math.max(cssWidth / image.naturalWidth, cssHeight / image.naturalHeight);
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        context.fillStyle = '#100b12';
        context.fillRect(0, 0, cssWidth, cssHeight);
        context.drawImage(image, (cssWidth - width) / 2, (cssHeight - height) / 2, width, height);
        canvas.dataset.frame = String(available + 1);
        lastDrawn = available;
        needsDraw = false;
      };

      const pump = () => {
        while (!disposed && activeLoads < (reducedMotion ? 1 : 4) && queue.length) {
          const index = queue.shift()!;
          if (states[index] !== 'queued') continue;
          states[index] = 'loading';
          activeLoads += 1;
          const image = new Image();
          images[index] = image;
          image.onload = () => {
            if (disposed) return;
            activeLoads -= 1;
            states[index] = 'ready';
            // The animation loop redraws when the best available frame changes.
            // Reduced-motion mode has no loop, so draw its still immediately.
            if (reducedMotion) draw();
            pump();
          };
          image.onerror = () => {
            if (disposed) return;
            activeLoads -= 1;
            states[index] = 'error';
            pump();
          };
          image.src = frameUrl(index);
        }
      };

      const prioritize = (index: number) => {
        // Promote the current destination and its neighbours over background
        // preloading, so jumping or dragging the scrollbar stays responsive.
        const priority = [index, index + 1, index - 1, index + 2, index - 2];
        for (let i = priority.length - 1; i >= 0; i -= 1) {
          const frame = priority[i];
          if (frame < 0 || frame >= FRAME_COUNT) continue;
          if (states[frame] === 'idle') states[frame] = 'queued';
          else if (states[frame] !== 'queued') continue;
          const existing = queue.indexOf(frame);
          if (existing !== -1) queue.splice(existing, 1);
          queue.unshift(frame);
        }
        pump();
      };

      const updateTarget = () => {
        const rect = hero.getBoundingClientRect();
        targetFrame = targetFrameForScroll(rect.top, rect.height, canvas.clientHeight || window.innerHeight);
        if (!reducedMotion) prioritize(Math.round(targetFrame));
      };

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        cssWidth = rect.width;
        cssHeight = rect.height;
        // A 2x cap keeps a full-screen canvas sharp on retina displays without
        // allocating an unnecessarily large backing buffer on high-DPR phones.
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(cssWidth * dpr));
        canvas.height = Math.max(1, Math.round(cssHeight * dpr));
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        needsDraw = true;
        updateTarget();
        draw();
      };

      const tick = (time: number) => {
        if (disposed) return;
        const elapsed = lastTime ? Math.min(time - lastTime, 64) : 16.7;
        lastTime = time;
        // Frame-rate independent lerp, snapping at rest to hit frame 1 / 150.
        currentFrame = easeFrame(currentFrame, targetFrame, elapsed);
        draw();
        animationFrame = window.requestAnimationFrame(tick);
      };

      resize();
      currentFrame = reducedMotion ? 0 : targetFrame;
      pump();
      if (!reducedMotion) {
        window.addEventListener('scroll', updateTarget, { passive: true });
        animationFrame = window.requestAnimationFrame(tick);
      }
      window.addEventListener('resize', resize, { passive: true });

      disposePlayback = () => {
        disposed = true;
        window.cancelAnimationFrame(animationFrame);
        window.removeEventListener('scroll', updateTarget);
        window.removeEventListener('resize', resize);
        images.forEach((image) => {
          if (image) {
            image.onload = null;
            image.onerror = null;
          }
        });
      };
    };

    startPlayback();
    motionPreference.addEventListener('change', startPlayback);
    return () => {
      motionPreference.removeEventListener('change', startPlayback);
      disposePlayback?.();
    };
  }, [enabled, section]);

  return <canvas ref={canvasRef} className="df-hero-canvas" aria-hidden="true" />;
}

export default function Hero({ framesAvailable }: { framesAvailable: boolean }) {
  const section = useRef<HTMLElement>(null);
  const fallback = 'url("/images/dreamframe/hero-portal.jpg")';
  const background = framesAvailable ? `url("${frameUrl(0)}"), ${fallback}` : fallback;

  return (
    <section ref={section} className={`df-hero${framesAvailable ? ' df-hero--sequence' : ''}`} id="top" aria-label="DreamFrame introduction">
      <div className="df-hero-pin" style={{ backgroundImage: background }}>
        <SequenceCanvas section={section} enabled={framesAvailable} />
        <div className="df-hero-shade" aria-hidden="true" />
        <Navigation />

        <div className="df-hero-copy">
          <div className="df-eyebrow df-hero-badge"><span className="df-status-dot" /> AI IMAGE GENERATOR <span className="df-badge-divider" /> YOUR IDEAS, UNLIMITED</div>
          <h1>Imagine it.<br /><span>Create it.</span></h1>
          <p>Turn the ideas in your head into extraordinary images. Your imagination has a new place to play.</p>
          <div className="df-hero-actions">
            <a href="#create" className="df-primary-button">Start creating <span><ArrowUpRight size={17} strokeWidth={1.8} aria-hidden="true" /></span></a>
            <span className="df-hero-action-note">MAKE SOMETHING<br />WONDERFUL</span>
          </div>
        </div>

        <div className="df-hero-bottomline" aria-hidden="true">
          <span>AN IDEA IS JUST THE BEGINNING</span>
          <span className="df-scroll-label">SCROLL TO EXPLORE <ArrowDown size={13} strokeWidth={1.5} /></span>
        </div>
        <div className="df-hero-wordmark" aria-label="DreamFrame">DREAMFRAME</div>
      </div>
    </section>
  );
}
