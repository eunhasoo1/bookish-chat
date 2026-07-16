"use client";

import { useEffect, useRef, useState } from "react";
import { colors, fonts } from "@/lib/tokens";
import type { BookEntry, BookEntryRecord } from "@/lib/types";

export type EditRequest = {
  year: number;
  existingRecord: BookEntryRecord | null;
  entry: BookEntry;
};

type Props = {
  request: EditRequest;
  onSave: (entry: BookEntry, readingYear: number) => void;
  onDelete?: () => void;
  onClose: () => void;
};

const INT_VALUES: [string, number][] = [
  ["—", 0],
  ["1", 1],
  ["2", 2],
  ["3", 3],
  ["4", 4],
  ["5", 5],
];
const HALF_VALUES = [0.5, 1.5, 2.5, 3.5, 4.5];

function parseDate(str: string, year: number): Date | null {
  const clean = str.trim();
  if (!clean) return null;
  const d = new Date(`${clean}/${year}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function EntryEditSheet({ request, onSave, onDelete, onClose }: Props) {
  const e = request.entry;
  const recordYear = request.existingRecord?.year ?? request.year;
  const titleRef = useRef<HTMLInputElement>(null);

  const [titleText, setTitleText] = useState(e.title);
  const [startDate, setStartDate] = useState(
    () =>
      parseDate(e.dateTop.replace(/-/g, ""), recordYear) ?? new Date()
  );
  const [hasEndDate, setHasEndDate] = useState(!!e.dateBot);
  const [endDate, setEndDate] = useState(
    () => (e.dateBot ? parseDate(e.dateBot, recordYear) : null) ?? new Date()
  );
  const [rating, setRating] = useState(() => Number(e.rate) || 0);

  useEffect(() => {
    if (!request.existingRecord) {
      const t = window.setTimeout(() => titleRef.current?.focus(), 550);
      return () => clearTimeout(t);
    }
  }, [request.existingRecord]);

  const readingYear = () =>
    hasEndDate ? endDate.getFullYear() : startDate.getFullYear();

  const buildEntry = (): BookEntry => {
    const t = titleText.trim();
    const start = fmtDate(startDate);
    const top = hasEndDate ? `${start}-` : start;
    const bot = hasEndDate ? fmtDate(endDate) : "";
    const r = rating === 0 ? "" : String(Number(rating));
    return { dateTop: top, dateBot: bot, title: t, rate: r };
  };

  const canSave = titleText.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-[420px] flex-col overflow-hidden"
        style={{
          background: colors.cream,
          borderRadius: "12px 12px 0 0",
        }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-center px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            style={{
              fontFamily: fonts.serif,
              fontSize: 14,
              color: colors.inkBlue,
            }}
          >
            Cancel
          </button>
          <div
            className="flex-1 text-center"
            style={{
              fontFamily: fonts.serif,
              fontSize: 15,
              fontWeight: 600,
              color: colors.inkBlue,
            }}
          >
            {request.existingRecord ? "Edit Book" : "Add Book"}
          </div>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return;
              onSave(buildEntry(), readingYear());
              onClose();
            }}
            style={{
              fontFamily: fonts.serif,
              fontSize: 14,
              fontWeight: 600,
              color: canSave ? colors.inkBlue : "rgba(46, 64, 148, 0.3)",
            }}
          >
            Save
          </button>
        </div>
        <div className="h-[0.8px]" style={{ background: colors.ruleClr }} />

        <div className="overflow-y-auto p-6">
          <Field label="TITLE">
            <input
              ref={titleRef}
              value={titleText}
              onChange={(ev) => setTitleText(ev.target.value)}
              placeholder="Book title"
              className="w-full px-2.5 py-[9px] outline-none"
              style={{
                fontFamily: fonts.typewriter,
                fontSize: 14,
                fontWeight: 700,
                color: colors.inkBlue,
                background: colors.cream,
                border: `1px solid ${colors.ruleClr}`,
                borderRadius: 2,
              }}
            />
          </Field>

          <Field label="START DATE">
            <input
              type="date"
              value={toDateInputValue(startDate)}
              onChange={(ev) => setStartDate(new Date(ev.target.value + "T12:00:00"))}
              className="outline-none"
              style={{ color: colors.inkBlue, fontFamily: fonts.serif }}
            />
          </Field>

          <div className="mb-[22px]">
            <div className="mb-2 flex items-center">
              <SectionLabel>FINISH DATE</SectionLabel>
              <div className="flex-1" />
              <button
                type="button"
                role="switch"
                aria-checked={hasEndDate}
                onClick={() => setHasEndDate((v) => !v)}
                className="relative h-6 w-10 rounded-full transition-colors"
                style={{
                  background: hasEndDate ? colors.inkBlue : "rgba(46,64,148,0.25)",
                }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                  style={{
                    left: hasEndDate ? 18 : 2,
                  }}
                />
              </button>
            </div>
            {hasEndDate ? (
              <input
                type="date"
                value={toDateInputValue(endDate)}
                onChange={(ev) =>
                  setEndDate(new Date(ev.target.value + "T12:00:00"))
                }
                className="outline-none"
                style={{ color: colors.inkBlue, fontFamily: fonts.serif }}
              />
            ) : null}
          </div>

          <Field label="RATING">
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2.5">
                {INT_VALUES.map(([label, val]) => (
                  <RatingBtn
                    key={val}
                    label={label}
                    selected={rating === val}
                    onClick={() => setRating(val)}
                  />
                ))}
              </div>
              <div className="flex gap-2.5 pl-[25px]">
                {HALF_VALUES.map((val) => (
                  <RatingBtn
                    key={val}
                    label={String(val)}
                    selected={rating === val}
                    onClick={() => setRating(val)}
                  />
                ))}
              </div>
            </div>
          </Field>

          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="mt-1.5 flex w-full items-center justify-center gap-1 py-2.5"
              style={{
                fontFamily: fonts.serif,
                fontSize: 13,
                color: colors.redClr,
                border: `1px solid rgba(209, 46, 46, 0.45)`,
                borderRadius: 2,
              }}
            >
              Remove Entry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: fonts.serif,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.18em",
        color: "rgba(46, 64, 148, 0.55)",
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-[22px]">
      <div className="mb-2">
        <SectionLabel>{label}</SectionLabel>
      </div>
      {children}
    </div>
  );
}

function RatingBtn({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full"
      style={{
        fontFamily: fonts.handwriting,
        fontSize: 16,
        fontWeight: 700,
        color: selected ? colors.cream : colors.inkBlue,
        background: selected ? colors.inkBlue : colors.cream,
        border: `1.2px solid ${selected ? colors.inkBlue : "rgba(46, 64, 148, 0.5)"}`,
      }}
    >
      {label}
    </button>
  );
}
