"use client";

import { colors, fonts } from "@/lib/tokens";

type ShelfCardProps = {
  year: number;
  cardW: number;
  onTap: () => void;
};

export function ShelfCard({ year, cardW, onTap }: ShelfCardProps) {
  const scale = cardW / 50;
  const visibleH = (cardW * 85) / 50;
  const fullH = (cardW * 120) / 50;

  return (
    <button
      type="button"
      onClick={onTap}
      className="overflow-hidden text-left"
      style={{
        width: cardW,
        height: visibleH,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: cardW,
          height: fullH,
          background: colors.cream,
          borderRadius: 2 * scale,
          border: `${0.8 * scale}px solid ${colors.inkBlue}`,
          boxShadow: `0 ${2 * scale}px ${4 * scale}px rgba(0,0,0,0.35)`,
          padding: 5 * scale,
        }}
      >
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 5 * scale,
            color: colors.inkBlue,
          }}
        >
          From the
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 7.5 * scale,
            fontWeight: 700,
            letterSpacing: scale,
            color: colors.inkBlue,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          LIBRARY
        </div>
        <div
          style={{
            height: 0.7 * scale,
            background: colors.inkBlue,
            marginTop: 2 * scale,
            marginBottom: 3 * scale,
          }}
        />
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 13 * scale,
            fontWeight: 700,
            color: colors.inkBlue,
          }}
        >
          {year}
        </div>
      </div>
    </button>
  );
}

type ShelfTrayProps = {
  years: number[];
  cardW: number;
  onTap: (year: number) => void;
};

export function ShelfTray({ years, cardW, onTap }: ShelfTrayProps) {
  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 3,
        border: `1.5px solid ${colors.woodDark}`,
        boxShadow: "0 5px 8px rgba(0,0,0,0.5)",
      }}
    >
      <div
        className="relative h-[5px]"
        style={{ background: colors.woodDark }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 h-[1.5px]"
          style={{ background: "rgba(0,0,0,0.35)" }}
        />
      </div>
      <div
        className="flex items-end justify-start gap-2.5 px-3 pt-1"
        style={{ background: colors.woodMid }}
      >
        {years.map((year) => (
          <ShelfCard
            key={year}
            year={year}
            cardW={cardW}
            onTap={() => onTap(year)}
          />
        ))}
      </div>
      <div
        className="relative h-3.5"
        style={{
          background: `linear-gradient(to bottom, ${colors.woodDark}, ${colors.woodMid})`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "rgba(0,0,0,0.2)" }}
        />
      </div>
    </div>
  );
}

type ShelfPageViewProps = {
  years: number[];
  onYearTap: (year: number) => void;
};

export function ShelfPageView({ years, onYearTap }: ShelfPageViewProps) {
  const pagePad = 14;
  const trayInnerPad = 12;
  const spacing = 10;
  const maxCards = 4;

  const yearRows: number[][] = [];
  for (let i = 0; i < years.length; i += maxCards) {
    yearRows.push(years.slice(i, i + maxCards));
  }

  // Approximate card width for a ~390px phone column
  const trayW = 390 - pagePad * 2;
  const cardW =
    (trayW - trayInnerPad * 2 - spacing * (maxCards - 1)) / maxCards;

  return (
    <div
      className="absolute inset-0 overflow-y-auto"
      style={{
        background: `linear-gradient(to bottom, ${colors.woodDark}, ${colors.woodMid}, ${colors.woodLight}, ${colors.woodMid}, ${colors.woodDark})`,
      }}
    >
      <div className="flex flex-col gap-8 px-3.5 pt-16 pb-[28vh]">
        {yearRows.length === 0 ? (
          <ShelfTray years={[]} cardW={cardW} onTap={onYearTap} />
        ) : (
          yearRows.map((row, idx) => (
            <ShelfTray
              key={idx}
              years={row}
              cardW={cardW}
              onTap={onYearTap}
            />
          ))
        )}
      </div>
    </div>
  );
}
