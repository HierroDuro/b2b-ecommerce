"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const BASE_SPEED = 45; // px/s while nobody is interacting
const EDGE_BOOST = 700; // extra px/s right at the very edge
const EDGE_ZONE = 0.18; // fraction of the width (each side) that reacts to the mouse

interface AutoScrollerProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  /** Extra classes for the flex track that holds the items (gaps, etc.). */
  trackClassName?: string;
  /** Size of the round chevron cue shown while the mouse runs it sideways. */
  cueClassName?: string;
  /** Minimum number of entries in one copy of the loop (the list is repeated
   * until it reaches this, so a short list still fills any screen). */
  minLoopItems?: number;
}

/** Continuously scrolling strip. It is a real horizontally-scrollable
 * container driven by a requestAnimationFrame loop, so every interaction
 * shares one mechanism:
 *  - idle (mouse not over it at all): drifts steadily to the right
 *    (endless — the list is rendered three times and the position is
 *    wrapped by exactly one copy's width);
 *  - mouse near either edge: speeds up in that direction — right edge runs
 *    right, left edge runs left;
 *  - mouse over the middle (not near an edge): freezes in place, so
 *    hovering to read an item actually holds still;
 *  - touch: the finger scrolls it natively; auto-scroll pauses while
 *    touching (and during the swipe's momentum) and then resumes on its
 *    own once the finger lifts.
 * Used by the offers strip and the brands strip so both behave identically. */
export function AutoScroller<T>({
  items,
  getKey,
  renderItem,
  trackClassName,
  cueClassName = "h-9 w-9",
  minLoopItems = 8,
}: AutoScrollerProps<T>) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const hoverRef = React.useRef({ dir: 0 as -1 | 0 | 1, strength: 0, hovering: false });
  const [zone, setZone] = React.useState<-1 | 0 | 1>(0);

  // Repeat the list until one copy is wide enough for any screen, then
  // render that copy three times (previous / current / next) for the wrap.
  const base = React.useMemo(() => {
    const out: T[] = [];
    if (items.length === 0) return out;
    while (out.length < minLoopItems) out.push(...items);
    return out;
  }, [items, minLoopItems]);
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
          // Speed is set outright every frame — no easing/lerp toward it —
          // so hovering the middle stops it dead instead of gradually
          // winding down (that gradual wind-down was the "laggy" feel).
          // Not hovering at all: keep drifting. Hovering the middle: hold
          // still. Hovering an edge: run toward that side, faster the
          // closer the pointer is to the very edge.
          velocity = !hovering ? idleSpeed : dir === 0 ? 0 : dir * (BASE_SPEED + strength * EDGE_BOOST);
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

  if (items.length === 0) return null;

  return (
    <div className="relative" onPointerMove={onPointerMove} onPointerLeave={clearHover}>
      <div
        ref={scrollerRef}
        className="w-full overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={trackRef} className={cn("relative flex w-max items-stretch", trackClassName)}>
          {track.map((item, i) => (
            <React.Fragment key={`${getKey(item)}-${i}`}>{renderItem(item)}</React.Fragment>
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
          <span
            className={cn(
              "flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card",
              cueClassName,
            )}
          >
            {side === -1 ? <ChevronLeft className="h-[55%] w-[55%]" /> : <ChevronRight className="h-[55%] w-[55%]" />}
          </span>
        </div>
      ))}
    </div>
  );
}
