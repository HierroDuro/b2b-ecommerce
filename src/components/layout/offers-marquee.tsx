"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ProductDTO } from "@/types/product";

const BASE_SPEED = 45; // px/s while nobody is interacting
const EDGE_BOOST = 700; // extra px/s right at the very edge
const EDGE_ZONE = 0.18; // fraction of the width (each side) that reacts to the mouse

/** Continuously scrolling strip of on-sale products. It is a real
 * horizontally-scrollable container driven by a requestAnimationFrame loop,
 * so every interaction shares one mechanism:
 *  - idle (mouse not over it at all): drifts steadily to the right
 *    (endless — the list is rendered three times and the position is
 *    wrapped by exactly one copy's width);
 *  - mouse near either edge: speeds up in that direction — right edge runs
 *    right, left edge runs left;
 *  - mouse over the middle (not near an edge): freezes in place, so
 *    hovering to read a card actually holds still;
 *  - touch: the finger scrolls it natively; auto-scroll pauses while
 *    touching (and during the swipe's momentum) and then resumes on its
 *    own once the finger lifts. */
export function OffersMarquee({ offers }: { offers: ProductDTO[] }) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const hoverRef = React.useRef({ dir: 0 as -1 | 0 | 1, strength: 0, hovering: false });
  const [zone, setZone] = React.useState<-1 | 0 | 1>(0);

  // Repeat the list until one copy is wide enough for any screen, then
  // render that copy three times (previous / current / next) for the wrap.
  const base = React.useMemo(() => {
    const out: ProductDTO[] = [];
    if (offers.length === 0) return out;
    while (out.length < 8) out.push(...offers);
    return out;
  }, [offers]);
  const track = React.useMemo(() => [...base, ...base, ...base], [base]);

  React.useEffect(() => {
    const el = scrollerRef.current;
    const trackEl = trackRef.current;
    if (!el || !trackEl || base.length === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const idleSpeed = reduceMotion ? 0 : BASE_SPEED;

    let loop = 0; // width of one copy of the list
    let pos = 0;
    let velocity = idleSpeed;
    let lastSet = 0;
    let lastUserScroll = 0;
    let touching = false;
    let last = performance.now();
    let raf = 0;

    const measure = () => {
      const first = trackEl.children[0] as HTMLElement | undefined;
      const second = trackEl.children[base.length] as HTMLElement | undefined;
      if (!first || !second) return;
      const wasZero = loop === 0;
      loop = second.offsetLeft - first.offsetLeft;
      if (wasZero && loop > 0) {
        pos = loop;
        el.scrollLeft = pos;
        lastSet = el.scrollLeft;
      }
    };

    const onScroll = () => {
      if (Math.abs(el.scrollLeft - lastSet) > 1.5) lastUserScroll = performance.now();
    };
    const onTouchStart = () => {
      touching = true;
    };
    const onTouchEnd = () => {
      touching = false;
      lastUserScroll = performance.now();
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (loop > 0) {
        const userActive = touching || now - lastUserScroll < 250;
        let wrapped = false;
        if (userActive) {
          pos = el.scrollLeft;
          velocity = idleSpeed;
        } else {
          const { dir, strength, hovering } = hoverRef.current;
          // Not hovering at all: keep drifting. Hovering the middle: hold
          // still. Hovering an edge: run toward that side, faster the
          // closer the pointer is to the very edge.
          const target = !hovering ? idleSpeed : dir === 0 ? 0 : dir * (BASE_SPEED + strength * EDGE_BOOST);
          velocity += (target - velocity) * Math.min(1, dt * 6);
          pos += velocity * dt;
        }
        if (pos >= 2 * loop) {
          pos -= loop;
          wrapped = true;
        } else if (pos < loop) {
          pos += loop;
          wrapped = true;
        }
        if (!userActive || wrapped) {
          el.scrollLeft = pos;
          lastSet = el.scrollLeft;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [base]);

  const setHover = (dir: -1 | 0 | 1, strength: number) => {
    hoverRef.current = { dir, strength, hovering: true };
    setZone((prev) => (prev === dir ? prev : dir));
  };

  const clearHover = () => {
    hoverRef.current = { dir: 0, strength: 0, hovering: false };
    setZone((prev) => (prev === 0 ? prev : 0));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const edge = rect.width * EDGE_ZONE;
    const x = e.clientX - rect.left;
    if (x < edge) setHover(-1, 1 - x / edge);
    else if (x > rect.width - edge) setHover(1, 1 - (rect.width - x) / edge);
    else setHover(0, 0);
  };

  if (offers.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Tag className="h-4 w-4 text-primary" />
        Ofertas de la semana
      </h2>
      <div className="relative" onPointerMove={onPointerMove} onPointerLeave={clearHover}>
        <div
          ref={scrollerRef}
          className="w-full overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div ref={trackRef} className="relative flex w-max items-stretch gap-3 lg:gap-5">
            {track.map((product, i) => (
              <Link
                key={`${product.id}-${i}`}
                href={`/productos/${product.id}`}
                draggable={false}
                className="relative flex w-28 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-soft transition-shadow hover:border-primary/30 hover:shadow-card-hover sm:w-36 lg:w-56 xl:w-64"
              >
                <Badge
                  variant="destructive"
                  className="absolute left-1.5 top-1.5 z-10 gap-1 px-1.5 py-0 text-[9px] sm:left-2.5 sm:top-2.5 sm:px-2 sm:py-0.5 sm:text-[10px]"
                >
                  <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  Oferta
                </Badge>
                <div className="relative aspect-square w-full bg-white">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="256px"
                    className="object-contain p-2 sm:p-4 lg:p-6"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-0.5 p-2 sm:gap-1 sm:p-2.5 lg:p-3.5">
                  <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-foreground sm:text-xs lg:text-sm">
                    {product.name}
                  </p>
                  <div className="mt-auto flex flex-wrap items-baseline gap-1 pt-1 sm:gap-2">
                    {product.originalPrice && (
                      <span className="text-[10px] text-muted-foreground line-through sm:text-xs">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                    <span className="text-xs font-bold text-foreground sm:text-sm lg:text-base">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Mouse-only edge cues: a chevron shows which way it is running. */}
        {([-1, 1] as const).map((side) => (
          <div
            key={side}
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 z-10 hidden items-center transition-opacity duration-150 [@media(hover:hover)]:flex ${
              side === -1 ? "left-1" : "right-1"
            } ${zone === side ? "opacity-100" : "opacity-0"}`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
              {side === -1 ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
