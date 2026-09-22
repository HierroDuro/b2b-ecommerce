"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
}

/** How much the side zoom panel magnifies the source image. */
const ZOOM_FACTOR = 2.5;
/** Result panel width as a multiple of the source image box's width. */
const RESULT_WIDTH_RATIO = 1.35;
/** Lens outline size on the source image, in pixels. */
const LENS_SIZE = 96;
/** Minimum horizontal drag, in pixels, before a touch counts as a swipe
 * (rather than a tap-to-zoom or an incidental wobble). */
const SWIPE_THRESHOLD = 40;

interface ZoomState {
  lensLeft: number;
  lensTop: number;
  bgPosX: number;
  bgPosY: number;
  bgW: number;
  bgH: number;
  resultH: number;
}

/**
 * Thumbnail rail + main image with a hover magnifier: moving the mouse over
 * the main image pans a zoomed view in an adjacent panel (classic
 * marketplace-style "lens" zoom).
 *
 * The image is displayed with `object-contain`, so for a non-square photo
 * part of the square source box is empty letterboxing — all the math below
 * is done in terms of the *rendered image content's* pixel box (not the
 * container), otherwise the lens/zoom would drift out of sync with the
 * cursor whenever a product photo isn't perfectly square.
 */
export function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isZooming, setIsZooming] = React.useState(false);
  const [zoom, setZoom] = React.useState<ZoomState | null>(null);
  const [naturalSize, setNaturalSize] = React.useState<{ w: number; h: number } | null>(null);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  // Opening the lightbox pushes a throwaway history entry (same URL, just
  // a marker in `state`) instead of only flipping React state. That's what
  // lets the phone's own back button close the lightbox and land back on
  // this product page — without it, "back" skips the lightbox entirely and
  // goes wherever the browser history would otherwise send it (usually the
  // catalog), since opening the lightbox never looked like navigation to
  // begin with.
  const openLightbox = () => {
    window.history.pushState({ galleryLightbox: true }, "");
    setLightboxOpen(true);
  };

  // Closing it the "normal" way (X button, tapping the backdrop, Escape)
  // goes back through that same history entry rather than just setting
  // state — so the entry doesn't linger, and both close paths (this one,
  // and the popstate handler below reacting to the hardware back button)
  // end up doing the exact same thing.
  const closeLightbox = () => {
    if (window.history.state?.galleryLightbox) {
      window.history.back();
    } else {
      setLightboxOpen(false);
    }
  };

  // Close the lightbox on Escape or on the back button (via the popstate
  // this pops our pushed history entry into), and lock page scroll behind
  // it while open (the lightbox itself stays scrollable/pinch-zoomable —
  // see its own div).
  React.useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    const onPopState = () => setLightboxOpen(false);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("popstate", onPopState);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("popstate", onPopState);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxOpen]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const imgElRef = React.useRef<HTMLImageElement>(null);
  // Touch-swipe bookkeeping — a ref, not state, since it only drives what
  // touchend/click do next and never needs to trigger a re-render itself.
  const touchRef = React.useRef<{ x: number; y: number; swiped: boolean } | null>(null);

  const activeImage = images[activeIndex] ?? images[0] ?? "";

  const showPrev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length);
  const showNext = () => setActiveIndex((i) => (i + 1) % images.length);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t) return;
    touchRef.current = { x: t.clientX, y: t.clientY, swiped: false };
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchRef.current;
    const t = e.touches[0];
    if (!start || !t || images.length <= 1) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Only claim the gesture once it's clearly more horizontal than
    // vertical — otherwise a vertical scroll through the page would get
    // eaten the moment it happens to start over the photo.
    if (!start.swiped && Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      start.swiped = true;
      if (dx < 0) showNext();
      else showPrev();
    }
  };

  const onTouchEnd = () => {
    // No need to guard the container's onClick here: a browser only
    // synthesizes a tap's click event when the touch barely moved, well
    // under our 40px swipe threshold, so a real swipe never also opens
    // the lightbox.
    touchRef.current = null;
  };

  // Same swipe gesture, but for the fullscreen lightbox — kept as its own
  // ref/handlers (rather than reusing the ones above) because this view
  // also supports native pinch-zoom-and-pan, which a swipe must not
  // fight with: a second finger, or an already-zoomed-in image, means
  // "let the browser handle this pan/zoom", not "change photo".
  const lightboxTouchRef = React.useRef<{ x: number; y: number; swiped: boolean } | null>(null);

  const isPinchZoomedIn = () => (window.visualViewport?.scale ?? 1) > 1.05;

  const onLightboxTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t || e.touches.length > 1 || isPinchZoomedIn()) {
      lightboxTouchRef.current = null;
      return;
    }
    lightboxTouchRef.current = { x: t.clientX, y: t.clientY, swiped: false };
  };

  const onLightboxTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = lightboxTouchRef.current;
    const t = e.touches[0];
    if (!start || !t || e.touches.length > 1 || images.length <= 1) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (!start.swiped && Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      start.swiped = true;
      if (dx < 0) showNext();
      else showPrev();
    }
  };

  const onLightboxTouchEnd = () => {
    lightboxTouchRef.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    // The prev/next arrows sit on top of the image, inside this same
    // container — hovering one still fires this handler (mousemove
    // bubbles), which would otherwise draw the zoom lens right underneath
    // the button. Hide it instead while the cursor is over an arrow.
    if ((e.target as HTMLElement).closest("[data-gallery-nav]")) {
      setIsZooming(false);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();

    const naturalW = naturalSize?.w ?? containerRect.width;
    const naturalH = naturalSize?.h ?? containerRect.height;

    // Reproduce object-contain's fit math to find the actual rendered image
    // box within the (square) container, and its letterbox offset.
    const containerRatio = containerRect.width / containerRect.height;
    const imageRatio = naturalW / naturalH;
    let renderW: number;
    let renderH: number;
    if (imageRatio > containerRatio) {
      renderW = containerRect.width;
      renderH = containerRect.width / imageRatio;
    } else {
      renderH = containerRect.height;
      renderW = containerRect.height * imageRatio;
    }
    const offsetX = (containerRect.width - renderW) / 2;
    const offsetY = (containerRect.height - renderH) / 2;

    const localX = e.clientX - containerRect.left - offsetX;
    const localY = e.clientY - containerRect.top - offsetY;

    // Cursor is over the letterbox padding, not the actual photo — no zoom.
    if (localX < 0 || localX > renderW || localY < 0 || localY > renderH) {
      setIsZooming(false);
      return;
    }

    const pctX = localX / renderW;
    const pctY = localY / renderH;

    const resultW = wrapperRect.width * RESULT_WIDTH_RATIO;
    const resultH = wrapperRect.height;
    const bgW = renderW * ZOOM_FACTOR;
    const bgH = renderH * ZOOM_FACTOR;

    setIsZooming(true);
    setZoom({
      lensLeft: offsetX + localX - LENS_SIZE / 2,
      lensTop: offsetY + localY - LENS_SIZE / 2,
      bgPosX: -(pctX * bgW - resultW / 2),
      bgPosY: -(pctY * bgH - resultH / 2),
      bgW,
      bgH,
      resultH,
    });
  };

  return (
    <div className="flex gap-4">
      {images.length > 1 && (
        <div className="flex flex-col gap-2.5">
          {images.map((url, index) => (
            <button
              key={url + index}
              type="button"
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              aria-label={`Ver imagen ${index + 1} de ${alt}`}
              aria-current={index === activeIndex}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition-colors",
                index === activeIndex
                  ? "border-primary"
                  : "border-transparent hover:border-border",
              )}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="64px"
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}

      <div ref={wrapperRef} className="relative flex-1">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setIsZooming(false)}
          onClick={openLightbox}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl border border-border bg-white lg:cursor-crosshair"
          style={{ touchAction: "pan-y" }}
        >
          <Image
            ref={imgElRef}
            src={activeImage}
            alt={alt}
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="object-contain"
            onLoad={(e) => {
              const img = e.currentTarget;
              setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
            }}
          />
          {isZooming && zoom && (
            <div
              aria-hidden
              className="pointer-events-none absolute rounded border-2 border-primary/70 bg-primary/10"
              style={{ left: zoom.lensLeft, top: zoom.lensTop, width: LENS_SIZE, height: LENS_SIZE }}
            />
          )}
          {/* Desktop already has the hover-zoom lens as its "this can zoom"
              affordance; phone/tablet get an explicit tap-to-zoom hint since
              nothing else on a touch screen suggests the image is tappable. */}
          <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-soft lg:hidden">
            <ZoomIn className="h-3.5 w-3.5" />
            Ampliar
          </span>

          {/* Prev/next arrows on the main photo — desktop only. Phone/
              tablet swipe the photo left/right instead (see the touch
              handlers above); arrows there would just sit in the way of
              that gesture and duplicate it. */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                data-gallery-nav
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                aria-label={`Imagen anterior de ${alt}`}
                className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/90 p-1.5 text-foreground shadow-soft transition-colors hover:bg-background lg:block"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                data-gallery-nav
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                aria-label={`Imagen siguiente de ${alt}`}
                className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/90 p-1.5 text-foreground shadow-soft transition-colors hover:bg-background lg:block"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {isZooming && zoom && activeImage && (
          <div
            aria-hidden
            className="pointer-events-none absolute left-full top-0 z-30 ml-4 hidden w-[135%] overflow-hidden rounded-xl border border-border bg-muted shadow-xl lg:block"
            style={{
              height: zoom.resultH,
              backgroundImage: `url(${activeImage})`,
              backgroundSize: `${zoom.bgW}px ${zoom.bgH}px`,
              backgroundPosition: `${zoom.bgPosX}px ${zoom.bgPosY}px`,
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={(e) => {
              // This button sits inside the backdrop div, which has its own
              // onClick={closeLightbox} — without stopping propagation,
              // both handlers would fire for one click. That used to be
              // harmless (setLightboxOpen(false) twice is a no-op), but
              // closeLightbox() now does a history.back() each time, so a
              // double-fire would skip an extra page back.
              e.stopPropagation();
              closeLightbox();
            }}
            aria-label="Cerrar"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Arrows — desktop only, same as the main photo. Phone/tablet
              swipe left/right on the image instead (see the touch handlers
              on the scrollable div below), which also has to stay clear
              for the native pinch-zoom/pan gesture this view supports. */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                aria-label="Imagen anterior"
                className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 lg:block"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                aria-label="Imagen siguiente"
                className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 lg:block"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Scrollable, not `overflow-hidden` — that's what lets the
              browser's native pinch-zoom / pan actually work once zoomed
              in, same as a photo viewer. Swipe-to-change-photo (phone/
              tablet) piggybacks on the same div, but backs off the moment
              there's a second finger or the photo is already pinch-zoomed
              in, so it never fights that native gesture. */}
          <div
            className="h-full w-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onLightboxTouchStart}
            onTouchMove={onLightboxTouchMove}
            onTouchEnd={onLightboxTouchEnd}
          >
            <div className="flex min-h-full items-center justify-center p-6">
              {/* Plain <img>, not next/image — the lightbox needs the
                  photo at its natural size so pinch-zoom has real detail
                  to zoom into, not a viewport-fitted `fill` box. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage}
                alt={alt}
                className="max-h-none max-w-none"
                style={{ width: "min(90vw, 700px)", height: "auto" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
