"use client";

import { useEffect, useRef, useState } from "react";
import { colors, fonts } from "@/lib/tokens";
import type { BookEntry } from "@/lib/types";
import { LibraryCard } from "./LibraryCard";

type Props = {
  year: number;
  pages: BookEntry[][];
  ownerName?: string;
  horizontalPadding?: number;
  showsIndicator?: boolean;
  indicatorColor?: string;
  onVerticalDrag?: (dy: number) => void;
  onVerticalEnd?: (dy: number) => void;
  onTapEntry?: (absIdx: number) => void;
  onEditEntry?: (absIdx: number) => void;
  onLongPressEntry?: (absIdx: number) => void;
};

type DragAxis = "h" | "v" | null;

export function LibraryCardStack({
  year,
  pages,
  ownerName = "",
  horizontalPadding = 28,
  showsIndicator = true,
  indicatorColor = "#fff",
  onVerticalDrag,
  onVerticalEnd,
  onTapEntry,
  onEditEntry,
  onLongPressEntry,
}: Props) {
  const n = pages.length;
  const isMultiPage = n > 1;
  const visibleSlots = Math.min(n, 3);

  const [topIndex, setTopIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [leavingPageIdx, setLeavingPageIdx] = useState<number | null>(null);
  const [leavingOffsetX, setLeavingOffsetX] = useState(0);
  const [leavingScale, setLeavingScale] = useState(1);
  const [arrivingBackPageIdx, setArrivingBackPageIdx] = useState<number | null>(
    null
  );
  const [arrivingBackOpacity, setArrivingBackOpacity] = useState(0);
  const axisRef = useRef<DragAxis>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (topIndex >= Math.max(1, n)) {
      setTopIndex(Math.max(0, n - 1));
    }
  }, [n, topIndex]);

  const circularIdx = (slot: number) => (topIndex + slot) % n;

  const commitSwipe = (direction: number, flyDist: number) => {
    if (leavingPageIdx !== null) return;
    const departIdx = topIndex;
    setLeavingOffsetX(dragX);
    setLeavingScale(1);
    setLeavingPageIdx(departIdx);
    setLeavingOffsetX(direction * flyDist);
    setLeavingScale(0.9);
    setDragX(0);

    window.setTimeout(() => {
      setTopIndex((t) => (t + 1) % n);
      setLeavingPageIdx(null);
      setLeavingOffsetX(0);
      setLeavingScale(1);
      setArrivingBackPageIdx(departIdx);
      setArrivingBackOpacity(0);
      requestAnimationFrame(() => setArrivingBackOpacity(1));
      window.setTimeout(() => setArrivingBackPageIdx(null), 320);
    }, 180);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // Capture on the stack container (currentTarget), not the row overlay
    // (e.target) — otherwise move/up never reach these handlers.
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    axisRef.current = null;
    didDragRef.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current || leavingPageIdx !== null) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    if (axisRef.current === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      didDragRef.current = true;
    }

    if (axisRef.current === "h" && isMultiPage) {
      setDragX(dx);
    } else if (axisRef.current === "v") {
      onVerticalDrag?.(dy);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    const locked = axisRef.current;
    axisRef.current = null;
    startRef.current = null;

    const width = containerRef.current?.clientWidth ?? 390;
    const flyDist = width * 1.25;

    if (locked === "h" && isMultiPage) {
      if (Math.abs(dx) > 60) {
        commitSwipe(dx < 0 ? -1 : 1, flyDist);
      } else {
        setDragX(0);
      }
    } else if (locked === "v") {
      onVerticalEnd?.(dy);
    } else {
      setDragX(0);
    }

    // Suppress the click that follows a drag gesture
    if (didDragRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const renderDeckCard = (slot: number) => {
    const pgIdx = circularIdx(slot);
    const isTop = slot === 0;
    const leaving = leavingPageIdx !== null;
    const eff = isTop ? 0 : leaving ? slot - 1 : slot;
    const safeEff = Math.max(0, eff);
    const xOff = isTop ? dragX : safeEff * 8;
    const yOff = isTop ? 0 : safeEff * 6;
    const sc = 1 - safeEff * 0.018;
    const rot = isTop ? dragX * 0.035 : 0;
    let opacity = 1;
    if (isTop && leaving) opacity = 0;
    if (pgIdx === arrivingBackPageIdx) opacity = arrivingBackOpacity;

    return (
      <div
        key={`slot-${slot}-${pgIdx}`}
        className="absolute inset-x-0 top-0"
        style={{
          paddingLeft: horizontalPadding,
          paddingRight: horizontalPadding,
          transform: `translate(${xOff}px, ${yOff}px) scale(${sc}) rotate(${rot}deg)`,
          opacity,
          zIndex: visibleSlots - slot + 1,
          transition:
            leavingPageIdx !== null || arrivingBackPageIdx !== null
              ? "transform 0.22s cubic-bezier(0.34,1.1,0.64,1), opacity 0.28s ease-out"
              : dragX !== 0
                ? "none"
                : "transform 0.38s cubic-bezier(0.34,1.1,0.64,1)",
          pointerEvents: isTop ? "auto" : "none",
        }}
      >
        <LibraryCard
          year={year}
          entries={pages[pgIdx]}
          ownerName={ownerName}
          onTapRow={
            isTop
              ? (row) => onTapEntry?.(pgIdx * 16 + row)
              : undefined
          }
          onTapEditZone={
            isTop
              ? (row) => onEditEntry?.(pgIdx * 16 + row)
              : undefined
          }
          onLongPressRow={
            isTop
              ? (row) => onLongPressEntry?.(pgIdx * 16 + row)
              : undefined
          }
        />
      </div>
    );
  };

  if (!isMultiPage) {
    return (
      <div
        ref={containerRef}
        className="relative flex h-full w-full items-center justify-center"
        style={{
          paddingLeft: horizontalPadding,
          paddingRight: horizontalPadding,
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <LibraryCard
          year={year}
          entries={pages[0] ?? []}
          ownerName={ownerName}
          onTapRow={(row) => onTapEntry?.(row)}
          onTapEditZone={(row) => onEditEntry?.(row)}
          onLongPressRow={(row) => onLongPressEntry?.(row)}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full flex-col items-center justify-center pb-[18px]"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="relative w-full" style={{ minHeight: 760 }}>
        {Array.from({ length: visibleSlots }, (_, i) => visibleSlots - 1 - i).map(
          (slot) => renderDeckCard(slot)
        )}
        {leavingPageIdx !== null ? (
          <div
            className="absolute inset-x-0 top-0 z-[99]"
            style={{
              paddingLeft: horizontalPadding,
              paddingRight: horizontalPadding,
              transform: `translateX(${leavingOffsetX}px) scale(${leavingScale}) rotate(${leavingOffsetX * 0.025}deg)`,
              transition: "transform 0.22s cubic-bezier(0.34,1.1,0.64,1)",
            }}
          >
            <LibraryCard
              year={year}
              entries={pages[leavingPageIdx]}
              ownerName={ownerName}
            />
          </div>
        ) : null}
      </div>
      {showsIndicator ? (
        <div
          className="absolute bottom-0.5"
          style={{
            fontFamily: fonts.serif,
            fontSize: 12,
            fontWeight: 500,
            color:
              indicatorColor === "cream"
                ? `${colors.cream}bf`
                : `${indicatorColor}d9`,
          }}
        >
          {topIndex + 1} / {n}
        </div>
      ) : null}
    </div>
  );
}
