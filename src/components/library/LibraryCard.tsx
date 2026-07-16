"use client";

import { useRef } from "react";
import {
  colors,
  fonts,
  GAP,
  LEFT_W,
  RIGHT_W,
  ROW_COUNT,
  ROW_H,
  RULED_AREA_TOP,
} from "@/lib/tokens";
import type { BookEntry } from "@/lib/types";

type Props = {
  year: number;
  entries?: BookEntry[];
  ownerName?: string;
  /** -1 = header, 0..n-1 = entry, n = empty slot */
  onTapRow?: (row: number) => void;
  onTapEditZone?: (row: number) => void;
  onLongPressRow?: (row: number) => void;
};

export function LibraryCard({
  year,
  entries = [],
  ownerName = "",
  onTapRow,
  onTapEditZone,
  onLongPressRow,
}: Props) {
  const longPressTimers = useRef(new Map<number, number>());
  const movedRows = useRef(new Set<number>());

  const clearLongPress = (row: number) => {
    const id = longPressTimers.current.get(row);
    if (id) {
      clearTimeout(id);
      longPressTimers.current.delete(row);
    }
  };

  const startLongPress = (row: number, e: React.PointerEvent) => {
    movedRows.current.delete(row);
    const startX = e.clientX;
    const startY = e.clientY;
    const id = window.setTimeout(() => {
      if (!movedRows.current.has(row)) onLongPressRow?.(row);
    }, 450);
    longPressTimers.current.set(row, id);

    const onMove = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 8) {
        movedRows.current.add(row);
        clearLongPress(row);
        cleanup();
      }
    };
    const onUp = () => {
      clearLongPress(row);
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const handleTap = (row: number, action?: (r: number) => void) => {
    if (movedRows.current.has(row)) {
      movedRows.current.delete(row);
      return;
    }
    action?.(row);
  };

  return (
    <div className="relative w-full select-none" style={{ touchAction: "none" }}>
      <div
        className="overflow-hidden"
        style={{
          background: colors.cream,
          borderRadius: 2,
          border: `1.5px solid ${colors.inkBlue}`,
          boxShadow: "0 6px 12px rgba(0,0,0,0.45)",
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: `1.5px solid ${colors.inkBlue}` }}>
          <div className="flex items-center py-2">
            <div className="flex-1 pl-3 text-left" style={{ color: colors.inkBlue }}>
              <div style={{ fontFamily: fonts.serif, fontSize: 11 }}>From the</div>
              <div
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                }}
              >
                L I B R A R Y
              </div>
            </div>
            <div
              className="mx-2 h-12 w-[1.5px] shrink-0"
              style={{ background: colors.inkBlue }}
            />
            <div
              className="w-[62px] shrink-0 pr-2.5 text-center"
              style={{ color: colors.inkBlue }}
            >
              <div style={{ fontFamily: fonts.serif, fontSize: 11 }}>Est.</div>
              <div style={{ fontFamily: fonts.serif, fontSize: 22, fontWeight: 700 }}>
                {year}
              </div>
            </div>
          </div>
          <div className="h-[1.5px]" style={{ background: colors.inkBlue }} />
          <div className="flex items-center py-[7px]">
            <span
              className="pl-3 pr-1.5"
              style={{ fontFamily: fonts.serif, fontSize: 13, color: colors.inkBlue }}
            >
              of:
            </span>
            {ownerName ? (
              <span
                className="flex-1 truncate pr-2.5 text-left"
                style={{
                  fontFamily: fonts.typewriter,
                  fontSize: 14,
                  fontWeight: 700,
                  color: colors.inkBlue,
                }}
              >
                {ownerName}
              </span>
            ) : (
              <div
                className="mr-2.5 h-[0.8px] flex-1"
                style={{ background: colors.inkBlue }}
              />
            )}
          </div>
        </div>

        {/* Column headers */}
        <div
          className="relative flex items-end pb-[5px] pt-1"
          style={{ color: colors.inkBlue }}
        >
          <div
            className="whitespace-pre-line pl-1 text-left leading-tight"
            style={{ width: LEFT_W, fontSize: 8.5 }}
          >
            {"mm/dd-\nmm/dd"}
          </div>
          <div
            className="flex-1 text-center"
            style={{ fontFamily: fonts.serif, fontSize: 11 }}
          >
            {"{title}"}
          </div>
          <div
            className="whitespace-pre-line pr-1 text-right leading-tight"
            style={{ width: RIGHT_W, fontSize: 8.5 }}
          >
            {"rate\n1-5"}
          </div>
          {/* Red column rules */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{ left: LEFT_W, background: colors.redClr }}
            />
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{ left: LEFT_W + GAP, background: colors.redClr }}
            />
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{ right: RIGHT_W + GAP, background: colors.redClr }}
            />
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{ right: RIGHT_W, background: colors.redClr }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-[0.8px]"
              style={{ background: colors.ruleClr }}
            />
          </div>
        </div>

        {/* Ruled rows */}
        <div className="relative" style={{ height: ROW_COUNT * ROW_H }}>
          {/* Horizontal rules + vertical red lines */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {Array.from({ length: ROW_COUNT }, (_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-[0.8px]"
                style={{
                  top: (i + 1) * ROW_H - 0.4,
                  background: colors.ruleClr,
                }}
              />
            ))}
            {[LEFT_W, LEFT_W + GAP].map((left) => (
              <div
                key={left}
                className="absolute top-0 bottom-0 w-px"
                style={{ left, background: colors.redClr }}
              />
            ))}
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{ right: RIGHT_W + GAP, background: colors.redClr }}
            />
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{ right: RIGHT_W, background: colors.redClr }}
            />
          </div>

          {Array.from({ length: ROW_COUNT }, (_, i) => {
            const e = entries[i];
            return (
              <div
                key={i}
                className="absolute left-0 right-0 flex items-center"
                style={{ top: i * ROW_H, height: ROW_H }}
              >
                {e ? (
                  <>
                    <div
                      className="pl-[5px] text-left leading-tight"
                      style={{
                        width: LEFT_W,
                        fontFamily: fonts.handwriting,
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: "rgba(46, 64, 148, 0.7)",
                      }}
                    >
                      <div>{e.dateTop}</div>
                      {e.dateBot ? (
                        <div className="pl-3">{e.dateBot}</div>
                      ) : null}
                    </div>
                    <div
                      className="flex-1 truncate pl-1.5 text-left"
                      style={{
                        fontFamily: fonts.typewriter,
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: colors.inkBlue,
                      }}
                    >
                      {e.title}
                    </div>
                    <div
                      className="text-center"
                      style={{
                        width: RIGHT_W,
                        fontFamily: fonts.handwriting,
                        fontSize: 13,
                        fontWeight: 700,
                        color: colors.inkBlue,
                      }}
                    >
                      {e.rate}
                    </div>
                  </>
                ) : i === entries.length && onTapRow ? (
                  <>
                    <div style={{ width: LEFT_W }} />
                    <div
                      className="flex-1 pl-2.5 text-left"
                      style={{
                        fontSize: 9,
                        fontWeight: 300,
                        color: "rgba(46, 64, 148, 0.25)",
                      }}
                    >
                      +
                    </div>
                    <div style={{ width: RIGHT_W }} />
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tap overlay */}
      {onTapRow ? (
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 2 }}>
          <div
            className="w-full cursor-pointer"
            style={{ height: RULED_AREA_TOP }}
            onClick={() => handleTap(-1, onTapRow)}
            onPointerDown={(e) => startLongPress(-1, e)}
          />
          {Array.from({ length: ROW_COUNT }, (_, i) => (
            <div key={i} className="flex" style={{ height: ROW_H }}>
              <div
                className="cursor-pointer"
                style={{ width: LEFT_W + GAP }}
                onClick={() => handleTap(i, onTapEditZone)}
                onPointerDown={(e) => startLongPress(i, e)}
              />
              <div
                className="flex-1 cursor-pointer"
                onClick={() => handleTap(i, onTapRow)}
                onPointerDown={(e) => startLongPress(i, e)}
              />
              <div
                className="cursor-pointer"
                style={{ width: GAP + RIGHT_W }}
                onClick={() => handleTap(i, onTapEditZone)}
                onPointerDown={(e) => startLongPress(i, e)}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
