"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { colors } from "@/lib/tokens";
import type {
  BookEntry,
  BookEntryRecord,
  HomeState,
} from "@/lib/types";
import { pageEntries, recordToEntry } from "@/lib/types";
import { ChatView, type ChatRequest } from "@/components/chat/ChatView";
import {
  EntryEditSheet,
  type EditRequest,
} from "./EntryEditSheet";
import { FocusedYearView } from "./FocusedYearView";
import { LibraryCardStack } from "./LibraryCardStack";
import { ShelfPageView } from "./Shelf";

type Props = {
  userId: string;
  userName: string;
  entries: BookEntryRecord[];
  onEntriesChange: (entries: BookEntryRecord[]) => void;
};

export function ContentView({
  userId,
  userName,
  entries,
  onEntriesChange,
}: Props) {
  const currentYear = new Date().getFullYear();
  const containerRef = useRef<HTMLDivElement>(null);

  const [homeState, setHomeState] = useState<HomeState>({ kind: "mainCard" });
  const [cardBaseY, setCardBaseY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [editRequest, setEditRequest] = useState<EditRequest | null>(null);
  const [chatRequest, setChatRequest] = useState<ChatRequest | null>(null);
  const [movedAlertYear, setMovedAlertYear] = useState<number | null>(null);

  const isMainCard = homeState.kind === "mainCard";
  const isShelf = homeState.kind === "shelf";

  const shelfYears = useMemo(() => {
    const years = new Set(entries.map((e) => e.year));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => a - b);
  }, [entries, currentYear]);

  const recordsFor = useCallback(
    (year: number) =>
      entries
        .filter((e) => e.year === year)
        .sort((a, b) => a.sort_order - b.sort_order),
    [entries]
  );

  const entriesFor = useCallback(
    (year: number) => recordsFor(year).map(recordToEntry),
    [recordsFor]
  );

  const nextSortOrder = useCallback(
    (year: number, excludingId?: string) => {
      const yearRecords = recordsFor(year).filter((r) => r.id !== excludingId);
      const max = yearRecords.reduce((m, r) => Math.max(m, r.sort_order), -1);
      return max + 1;
    },
    [recordsFor]
  );

  const pagesCurrent = useMemo(
    () => pageEntries(entriesFor(currentYear)),
    [entriesFor, currentYear]
  );

  const liveY = cardBaseY + dragOffset;
  const shelfSnapY = () =>
    (containerRef.current?.clientHeight ?? 800) * 0.76;

  const clampDrag = (d: number) =>
    isMainCard
      ? d >= 0
        ? d
        : Math.max(-30, d * 0.25)
      : d <= 0
        ? d
        : Math.min(30, d * 0.25);

  const makeEditRequest = (year: number, absIdx: number) => {
    const yearRecords = recordsFor(year);
    const record = absIdx < yearRecords.length ? yearRecords[absIdx] : null;
    const entry = record
      ? recordToEntry(record)
      : { dateTop: "", dateBot: "", title: "", rate: "" };
    setEditRequest({ year, existingRecord: record, entry });
  };

  const reload = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("book_entries")
      .select("*")
      .eq("user_id", userId)
      .order("year", { ascending: true })
      .order("sort_order", { ascending: true });
    onEntriesChange((data ?? []) as BookEntryRecord[]);
  };

  const handleSave = async (newEntry: BookEntry, readingYear: number) => {
    if (!editRequest) return;
    const supabase = createClient();
    const sourceYear = editRequest.year;

    if (editRequest.existingRecord) {
      const record = editRequest.existingRecord;
      const updates: Partial<BookEntryRecord> = {
        date_top: newEntry.dateTop,
        date_bot: newEntry.dateBot,
        title: newEntry.title,
        rate: newEntry.rate,
      };
      if (record.year !== readingYear) {
        updates.year = readingYear;
        updates.sort_order = nextSortOrder(readingYear, record.id);
      }
      await supabase.from("book_entries").update(updates).eq("id", record.id);
    } else {
      await supabase.from("book_entries").insert({
        user_id: userId,
        year: readingYear,
        sort_order: nextSortOrder(readingYear),
        date_top: newEntry.dateTop,
        date_bot: newEntry.dateBot,
        title: newEntry.title,
        rate: newEntry.rate,
      });
    }

    await reload();
    if (readingYear !== sourceYear) setMovedAlertYear(readingYear);
  };

  const handleDelete = async () => {
    if (!editRequest?.existingRecord) return;
    const supabase = createClient();
    await supabase
      .from("book_entries")
      .delete()
      .eq("id", editRequest.existingRecord.id);
    await reload();
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ background: colors.oakBrown }}
    >
      <div
        className="absolute inset-0"
        style={{ pointerEvents: isShelf ? "auto" : "none" }}
      >
        <ShelfPageView
          years={shelfYears}
          onYearTap={(year) => {
            if (year === currentYear) {
              setHomeState({ kind: "mainCard" });
              setCardBaseY(0);
              setDragOffset(0);
            } else {
              setHomeState({ kind: "yearFocused", year });
            }
          }}
        />
      </div>

      {/* Oak veil crossfade */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: colors.oakBrown,
          opacity: 1 - Math.min(1, Math.max(0, liveY / 160)),
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          transform: `translateY(${liveY}px)`,
          transition:
            dragOffset === 0
              ? "transform 0.45s cubic-bezier(0.34,1.15,0.64,1)"
              : "none",
        }}
      >
        <LibraryCardStack
          year={currentYear}
          pages={pagesCurrent}
          ownerName={userName}
          horizontalPadding={28}
          showsIndicator={pagesCurrent.length > 1}
          indicatorColor="cream"
          onVerticalDrag={(dy) => {
            if (!isMainCard && !isShelf) return;
            setDragOffset(clampDrag(dy));
          }}
          onVerticalEnd={(dy) => {
            if (!isMainCard && !isShelf) return;
            if (isMainCard && dy > 120) {
              setHomeState({ kind: "shelf" });
              setCardBaseY(shelfSnapY());
              setDragOffset(0);
            } else if (isShelf && dy < -80) {
              setHomeState({ kind: "mainCard" });
              setCardBaseY(0);
              setDragOffset(0);
            } else {
              setDragOffset(0);
            }
          }}
          onTapEntry={(absIdx) => {
            if (!isMainCard && !isShelf) return;
            if (isShelf) {
              setHomeState({ kind: "mainCard" });
              setCardBaseY(0);
              setDragOffset(0);
            } else if (absIdx >= 0) {
              const yr = recordsFor(currentYear);
              if (absIdx < yr.length) {
                setChatRequest({ record: yr[absIdx], userName });
              } else {
                makeEditRequest(currentYear, absIdx);
              }
            }
          }}
          onEditEntry={(absIdx) => {
            if (!isMainCard || absIdx < 0) return;
            makeEditRequest(currentYear, absIdx);
          }}
          onLongPressEntry={(absIdx) => {
            if (!isMainCard || absIdx < 0) return;
            makeEditRequest(currentYear, absIdx);
          }}
        />
      </div>

      {homeState.kind === "yearFocused" ? (
        <FocusedYearView
          year={homeState.year}
          pages={pageEntries(entriesFor(homeState.year))}
          ownerName={userName}
          onDismiss={() => setHomeState({ kind: "shelf" })}
          onTapEntry={(yr, absIdx) => {
            if (absIdx < 0) return;
            const yearRecords = recordsFor(yr);
            if (absIdx < yearRecords.length) {
              setChatRequest({ record: yearRecords[absIdx], userName });
            } else {
              makeEditRequest(yr, absIdx);
            }
          }}
          onEditEntry={(yr, absIdx) => {
            if (absIdx >= 0) makeEditRequest(yr, absIdx);
          }}
          onLongPressEntry={(yr, absIdx) => {
            if (absIdx >= 0) makeEditRequest(yr, absIdx);
          }}
        />
      ) : null}

      {editRequest ? (
        <EntryEditSheet
          request={editRequest}
          onSave={handleSave}
          onDelete={
            editRequest.existingRecord ? () => void handleDelete() : undefined
          }
          onClose={() => setEditRequest(null)}
        />
      ) : null}

      {chatRequest ? (
        <ChatView
          request={chatRequest}
          userId={userId}
          onClose={() => setChatRequest(null)}
        />
      ) : null}

      {movedAlertYear !== null ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-8"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={() => setMovedAlertYear(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl p-5 text-center"
            style={{ background: colors.cream, color: colors.inkBlue }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 text-base font-semibold">
              Moved to {movedAlertYear} Card
            </div>
            <p className="mb-4 text-sm opacity-80">
              This book has been moved to your {movedAlertYear} library card.
            </p>
            <button
              type="button"
              className="px-4 py-2 font-semibold"
              style={{ color: colors.inkBlue }}
              onClick={() => setMovedAlertYear(null)}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
