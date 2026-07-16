"use client";

import { useState } from "react";
import type { BookEntry } from "@/lib/types";
import { LibraryCardStack } from "./LibraryCardStack";

type Props = {
  year: number;
  pages: BookEntry[][];
  ownerName?: string;
  onDismiss: () => void;
  onTapEntry?: (year: number, absIdx: number) => void;
  onEditEntry?: (year: number, absIdx: number) => void;
  onLongPressEntry?: (year: number, absIdx: number) => void;
};

export function FocusedYearView({
  year,
  pages,
  ownerName,
  onDismiss,
  onTapEntry,
  onEditEntry,
  onLongPressEntry,
}: Props) {
  const [vDrag, setVDrag] = useState(0);

  return (
    <div className="absolute inset-0 z-20">
      <div
        className="absolute inset-0"
        style={{
          background: "#000",
          opacity: Math.max(0, 0.5 - Math.max(0, vDrag) / 240),
        }}
        onClick={onDismiss}
      />
      <div
        className="relative h-full w-full"
        style={{
          transform: `translateY(${vDrag}px)`,
          transition: vDrag === 0 ? "transform 0.42s cubic-bezier(0.34,1.2,0.64,1)" : "none",
        }}
      >
        <LibraryCardStack
          year={year}
          pages={pages}
          ownerName={ownerName}
          horizontalPadding={28}
          showsIndicator={pages.length > 1}
          indicatorColor="#fff"
          onVerticalDrag={(dy) => {
            setVDrag(dy >= 0 ? dy : Math.max(-40, dy * 0.3));
          }}
          onVerticalEnd={(dy) => {
            if (dy > 130) onDismiss();
            else setVDrag(0);
          }}
          onTapEntry={(absIdx) => onTapEntry?.(year, absIdx)}
          onEditEntry={(absIdx) => onEditEntry?.(year, absIdx)}
          onLongPressEntry={(absIdx) => onLongPressEntry?.(year, absIdx)}
        />
      </div>
    </div>
  );
}
