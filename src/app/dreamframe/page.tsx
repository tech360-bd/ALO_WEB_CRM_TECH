import type { Metadata, Viewport } from 'next';
import { existsSync } from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import { Aperture, ArrowDownRight, ArrowUpRight, Box, CircleDot, Command, Diamond, Flower2, Hexagon, Layers3, Orbit, ScanLine, Sparkles, WandSparkles } from 'lucide-react';
import Hero from './Hero';
import { FRAME_COUNT, frameFilename } from './sequence';
import './dreamframe.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'DreamFrame — Imagine it. Create it.' },
  description: 'A creative universe for turning your ideas into extraordinary images.',
  applicationName: 'DreamFrame',
  robots: { index: false, follow: false },
  manifest: null,
  appleWebApp: null,
  alternates: null,
  icons: { icon: '/images/dreamframe/mark.svg' },
  openGraph: {
    title: 'DreamFrame — Imagine it. Create it.',
    description: 'A creative universe for turning your ideas into extraordinary images.',
    siteName: 'DreamFrame',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DreamFrame — Imagine it. Create it.',
    description: 'A creative universe for turning your ideas into extraordinary images.',
  },
};

export const viewport: Viewport = { themeColor: '#100b12' };

const firstRow = [
  { name: 'the dreamers', icon: Sparkles, style: 'serif' },
  { name: 'VISUAL MAKERS', icon: Aperture, style: 'wide' },
  { name: 'atelier / new', icon: Diamond, style: 'light' },
  { name: 'STORYFORM', icon: Hexagon, style: 'bold' },
  { name: 'creative people', icon: Flower2, style: 'serif' },
  { name: 'STUDIO  /  01', icon: Command, style: 'wide' },
];

const secondRow = [
  { name: 'future thinkers', icon: Orbit, style: 'serif' },
  { name: 'MUSE & CO.', icon: CircleDot, style: 'bold' },
  { name: 'image makers', icon: Sparkles, style: 'light' },
  { name: 'FORM / FUNCTION', icon: Diamond, style: 'wide' },
  { name: 'the curious', icon: Aperture, style: 'serif' },
  { name: 'BEYOND ORDINARY', icon: Hexagon, style: 'wide' },
];

type MarqueeItem = (typeof firstRow)[number];

function MarqueeGroup({ items, duplicate = false }: { items: MarqueeItem[]; duplicate?: boolean }) {
  return (
    <div className="df-marquee-group" aria-hidden={duplicate || undefined}>
      {items.map(({ name, icon: Icon, style }) => (
        <div className={`df-marquee-logo df-logo-${style}`} key={name}>
          <Icon aria-hidden="true" size={23} strokeWidth={1.25} />
          <span>{name}</span>
        </div>
      ))}
    </div>
  );
}

function Marquees() {
  return (
    <section className="df-marquees" id="product" aria-label="Made for all kinds of creators">
      <div className="df-marquee-intro">
        <span className="df-section-label"><span className="df-little-star">✳</span> MADE FOR THE IMAGINATIVE</span>
        <p>For the visionaries, the dreamers,<br className="df-mobile-break" /> and everyone in between.</p>
      </div>
      <div className="df-marquee-viewport">
        <div className="df-marquee-track">
          <MarqueeGroup items={firstRow} />
          <MarqueeGroup items={firstRow} duplicate />
        </div>
      </div>
      <div className="df-marquee-viewport df-marquee-second">
        <div className="df-marquee-track df-marquee-track-reverse">
          <MarqueeGroup items={secondRow} />
          <MarqueeGroup items={secondRow} duplicate />
        </div>
      </div>
      <div className="df-marquee-end"><span>YOUR IMAGINATION BELONGS HERE</span><span>✳</span><span>THE POSSIBILITIES ARE ENDLESS</span></div>
    </section>
  );
}

function Gallery() {
  return (
    <section className="df-universe" id="create" aria-labelledby="df-universe-heading">
      <div className="df-universe-glow" aria-hidden="true" />
      <div className="df-section-inner">
        <div className="df-section-topline"><span><span className="df-little-star">✳</span> THE DREAMFRAME UNIVERSE</span><span>01 / CREATE WITHOUT LIMITS</span></div>
        <div className="df-section-heading">
          <div>
            <h2 id="df-universe-heading">A little imagination.<br /><span>A lot of possibility.</span></h2>
          </div>
          <div className="df-heading-aside">
            <p>From the first spark to the final frame, make space for ideas that feel entirely your own.</p>
            <a href="#gallery">Explore the possibilities <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </div>

        <div className="df-bento" id="gallery">
          <article className="df-card df-card-world">
            <Image src="/images/dreamframe/worlds.jpg" alt="" fill sizes="(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 34vw" />
            <div className="df-card-scrim df-card-scrim-bottom" />
            <div className="df-card-top"><span>01 / DREAM BIGGER</span><span className="df-card-arrow"><ArrowUpRight size={18} strokeWidth={1.5} /></span></div>
            <div className="df-card-copy">
              <span className="df-card-kicker">TEXT TO IMAGE</span>
              <h3>Worlds beyond<br />words.</h3>
              <p>Every great image starts with a little imagination.</p>
            </div>
          </article>

          <article className="df-card df-card-sculpture">
            <Image src="/images/dreamframe/sculpture.jpg" alt="" fill sizes="(max-width: 700px) 100vw, 65vw" />
            <div className="df-card-scrim df-card-scrim-left" />
            <div className="df-card-top"><span>02 / MAKE IT YOURS</span><span className="df-card-arrow"><ArrowUpRight size={18} strokeWidth={1.5} /></span></div>
            <div className="df-card-copy">
              <span className="df-card-kicker">ENDLESS STYLES</span>
              <h3>Find your<br />kind of magic.</h3>
              <p>Explore new aesthetics, textures, and ideas.</p>
            </div>
          </article>

          <article className="df-card df-card-prompt">
            <div className="df-prompt-icon"><WandSparkles size={21} strokeWidth={1.4} aria-hidden="true" /></div>
            <div className="df-prompt-copy">
              <span className="df-card-kicker">A LITTLE CREATIVE SPARK</span>
              <h3>Think it.<br />DreamFrame it.</h3>
              <p>Big ideas, meet a beautifully simple canvas.</p>
            </div>
            <div className="df-prompt-example" aria-label="Example prompt: a world made of imagination">
              <span>“a world made of imagination”</span><Sparkles size={15} aria-hidden="true" />
            </div>
          </article>

          <article className="df-card df-card-portrait">
            <Image src="/images/dreamframe/portrait.jpg" alt="" fill sizes="(max-width: 700px) 100vw, 32vw" />
            <div className="df-card-scrim df-card-scrim-bottom" />
            <div className="df-card-top"><span>03 / THE DETAILS</span><span className="df-card-arrow"><ArrowUpRight size={18} strokeWidth={1.5} /></span></div>
            <div className="df-card-copy">
              <span className="df-card-kicker">MADE TO INSPIRE</span>
              <h3>See the<br />extraordinary.</h3>
            </div>
          </article>
        </div>
        <div className="df-bento-foot"><span>MADE FOR WHAT'S NEXT</span><span>YOUR VISION. YOUR WORLD. <Sparkles size={14} aria-hidden="true" /></span></div>
      </div>
    </section>
  );
}

function ModelCreator() {
  return (
    <section className="df-model" id="model-creator" aria-labelledby="df-model-heading">
      <div className="df-model-inner">
        <div className="df-model-topline"><span><span className="df-model-star">✳</span> BEYOND THE FRAME</span><span>02 / A NEW DIMENSION</span></div>
        <div className="df-model-heading">
          <div>
            <div className="df-model-badge"><Box size={15} strokeWidth={1.5} aria-hidden="true" /> 3D MODEL CREATOR</div>
            <h2 id="df-model-heading">Give your ideas<br /><span>another dimension.</span></h2>
          </div>
          <div className="df-model-intro">
            <p>From a spark of inspiration to a whole new perspective. Imagine what you can create beyond the frame.</p>
            <a href="#gallery">Explore the possibilities <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </div>
        {/* Intentionally open: the reference's central imagery is to be removed. */}
        <div className="df-model-open-space">
          <div className="df-model-side df-model-side-left">
            <span className="df-model-side-number">01 / IMAGINE</span>
            <div className="df-model-side-icon"><Sparkles size={19} strokeWidth={1.4} aria-hidden="true" /></div>
            <h3>Start with a thought.</h3>
            <p>Every extraordinary thing begins as an idea.</p>
          </div>
          <div className="df-model-side df-model-side-right">
            <span className="df-model-side-number">02 / EXPLORE</span>
            <div className="df-model-side-icon"><Layers3 size={19} strokeWidth={1.4} aria-hidden="true" /></div>
            <h3>See it differently.</h3>
            <p>Discover a whole new way to bring it to life.</p>
          </div>
        </div>
        <div className="df-model-bottom"><span>YOUR IMAGINATION HAS NO EDGES.</span><span>MADE FOR THE CURIOUS <ArrowDownRight size={16} aria-hidden="true" /></span></div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="df-footer">
      <div className="df-footer-inner">
        <div><a className="df-footer-brand" href="#top"><span>✳</span> dreamframe.</a><p>Made for the imaginatively curious.</p></div>
        <div className="df-footer-links"><a href="#product">Product</a><a href="#gallery">Explore</a><a href="#model-creator">3D creator</a></div>
        <a className="df-footer-top" href="#top">BACK TO TOP <ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>
      <div className="df-footer-bottom"><span>© DREAMFRAME</span><span>IMAGINE MORE. CREATE ANYTHING.</span><span><ScanLine size={14} aria-hidden="true" /> A LITTLE MAGIC, MADE BY YOU</span></div>
    </footer>
  );
}

export default function DreamFramePage() {
  // Wait for the complete supplied sequence rather than requesting 150
  // missing files or trapping visitors in a four-screen static scroll area.
  const framesAvailable = Array.from({ length: FRAME_COUNT }, (_, index) =>
    existsSync(path.join(process.cwd(), 'public', 'images', 'dreamframe', 'frames', frameFilename(index))),
  ).every(Boolean);

  return (
    <main className="df-page">
      <Hero framesAvailable={framesAvailable} />
      <Marquees />
      <Gallery />
      <ModelCreator />
      <Footer />
    </main>
  );
}
