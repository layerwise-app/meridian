import { useEffect, useRef, useState } from 'react';
import type { Screen } from '~/content/types';
import figures from '~/content/generated/figures.json';
import images from '~/content/images.json';
import { mountField } from '~/lib/field-canvas';
import { clsx } from 'clsx';

type SlotProps = {
  screen: Screen;
  /** Width divided by height. Fixed, so nothing shifts while it loads. */
  aspect: number;
  /** Describes the figure for screen readers. */
  label: string;
  /** Set on the figure at the top of the page. */
  priority?: boolean;
  className?: string;
};

/**
 * The one place a page's figure is chosen. A `drawn` screen is the generative
 * contour field; set the screen to an `image` (processed with
 * `pnpm add-images`) or a `video` to replace it. See the README.
 */
export function ScreenSlot({ screen, ...props }: SlotProps) {
  if (screen.kind === 'image') {
    return <SlotImage name={screen.image} alt={screen.alt} {...props} />;
  }
  if (screen.kind === 'video') {
    return (
      <SlotVideo
        src={screen.src}
        poster={screen.poster}
        alt={screen.alt}
        {...props}
      />
    );
  }
  return <FieldFigure seed={screen.seed} {...props} />;
}

type FigureEntry = { src: string; srcSet: string; width: number; height: number };
const stills = figures as Record<string, FigureEntry>;

/** The contour field on canvas, over a pre-rendered still of its first frame. */
export function FieldFigure({
  seed,
  aspect,
  label,
  priority,
  className
}: Omit<SlotProps, 'screen'> & { seed: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const still = stills[seed];

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    setLive(false);
    return mountField(container, canvas, {
      seed,
      onReady: () => setLive(true)
    });
  }, [seed]);

  return (
    <div
      ref={containerRef}
      className={clsx('field', className)}
      style={{ aspectRatio: aspect }}
      role='img'
      aria-label={label}
      data-live={live ? 'true' : 'false'}
    >
      <canvas ref={canvasRef} aria-hidden='true' />
      {still ? (
        <img
          src={still.src}
          srcSet={still.srcSet}
          sizes={aspect <= 1.2 ? '(min-width: 1024px) 40vw, 100vw' : '100vw'}
          width={still.width}
          height={still.height}
          alt=''
          decoding='async'
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'auto' : 'low'}
        />
      ) : null}
    </div>
  );
}

type ImageEntry = {
  width: number;
  height: number;
  /** Generated file widths, like [800, 1600, 2880]; empty for GIFs. */
  widths: number[];
  format: 'webp' | 'gif';
  placeholder: string;
};
const imageManifest = images as Record<string, ImageEntry>;

function SlotImage({
  name,
  alt,
  aspect,
  priority,
  className
}: Omit<SlotProps, 'screen' | 'label'> & { name: string; alt: string }) {
  const entry = imageManifest[name];
  if (!entry) {
    if (import.meta.env.DEV) {
      console.warn(`[ScreenSlot] No image named "${name}". Run pnpm add-images first.`);
    }
    return <div className={clsx('field', className)} style={{ aspectRatio: aspect }} />;
  }
  const base = `/images/${name}`;
  const fallbackWidth = entry.widths[Math.min(1, entry.widths.length - 1)];
  const src = entry.format === 'gif' ? `${base}.gif` : `${base}-${fallbackWidth}.webp`;
  const srcSet =
    entry.format === 'gif'
      ? undefined
      : entry.widths.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
  return (
    <div
      className={clsx('field', className)}
      style={{
        aspectRatio: aspect,
        backgroundImage: `url(${entry.placeholder})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <img
        className='object-cover'
        src={src}
        srcSet={srcSet}
        sizes={aspect <= 1.2 ? '(min-width: 1024px) 40vw, 100vw' : '100vw'}
        width={entry.width}
        height={entry.height}
        alt={alt}
        decoding='async'
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </div>
  );
}

function SlotVideo({
  src,
  poster,
  alt,
  aspect,
  className
}: Omit<SlotProps, 'screen' | 'label'> & {
  src: string;
  poster?: string;
  alt: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const userPaused = useRef(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Play only while on screen, and never on its own under reduced motion.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !reduced.matches && !userPaused.current) {
        void video.play().catch(() => {});
      } else video.pause();
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);
  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      void video.play().catch(() => {});
    } else {
      userPaused.current = true;
      video.pause();
    }
  };
  return (
    <div className={clsx('field', className)} style={{ aspectRatio: aspect }}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload='metadata'
        aria-label={alt}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        className='absolute inset-0 h-full w-full object-cover'
      />
      <button
        type='button'
        onClick={toggle}
        className='btn btn-quiet absolute right-3 bottom-3 bg-paper/90 text-[0.9rem]'
      >
        {paused ? 'Play' : 'Pause'}
      </button>
    </div>
  );
}
