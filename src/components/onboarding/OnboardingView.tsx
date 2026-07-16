"use client";

import { useEffect, useRef, useState } from "react";
import { colors, fonts } from "@/lib/tokens";

type Props = {
  onComplete: (name: string) => void;
};

export function OnboardingView({ onComplete }: Props) {
  const [nameInput, setNameInput] = useState("");
  const [cardOffsetY, setCardOffsetY] = useState(-700);
  const [buttonOpacity, setButtonOpacity] = useState(0);
  const [animating, setAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentYear = new Date().getFullYear();
  const trimmed = nameInput.trim();
  const ready = trimmed.length > 0;

  useEffect(() => {
    const t1 = requestAnimationFrame(() => {
      setAnimating(true);
      setCardOffsetY(0);
    });
    const t2 = window.setTimeout(() => {
      setButtonOpacity(1);
      inputRef.current?.focus();
    }, 600);
    return () => {
      cancelAnimationFrame(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: colors.oakBrown }}
    >
      <div className="flex flex-1 items-center justify-center px-9">
        <div
          className="w-full max-w-[340px]"
          style={{
            transform: `translateY(${cardOffsetY}px) rotate(-1.5deg)`,
            transition: animating
              ? "transform 0.62s cubic-bezier(0.34, 1.2, 0.64, 1)"
              : "none",
            background: colors.cream,
            borderRadius: 3,
            border: `1.5px solid ${colors.inkBlue}`,
            boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
          }}
        >
          {/* Signature section */}
          <div className="px-3 pt-4">
            <input
              ref={inputRef}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && ready) onComplete(trimmed);
              }}
              placeholder="your name"
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck={false}
              className="w-full min-h-[44px] bg-transparent px-1 outline-none placeholder:opacity-25"
              style={{
                fontFamily: fonts.typewriter,
                fontSize: 22,
                fontWeight: 700,
                color: colors.inkBlue,
              }}
            />
            <div
              className="mx-0 mb-2 mt-1.5 h-[0.8px]"
              style={{ background: colors.inkBlue }}
            />
          </div>

          {/* Legal text */}
          <p
            className="px-3.5 pb-3.5 text-left italic leading-relaxed"
            style={{
              fontFamily: fonts.serif,
              fontSize: 7,
              color: "rgba(46, 64, 148, 0.55)",
            }}
          >
            THIS CARD NOT VALID WITHOUT A SIGNATURE. ALL MATERIALS TO BE CHECKED
            OUT MUST BE ACCOMPANIED BY THIS CARD. MATERIALS NOT RETURNED IN 2
            WEEKS ARE CONSIDERED OVERDUE.
          </p>

          {/* Bottom section */}
          <div>
            <div className="h-[1.5px]" style={{ background: colors.inkBlue }} />
            <div className="flex items-center py-3.5">
              <div className="flex-1 pl-3.5 text-left">
                <div
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 11,
                    fontWeight: 700,
                    color: colors.inkBlue,
                  }}
                >
                  BOOKISH
                </div>
                <div
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: colors.inkBlue,
                  }}
                >
                  L I B R A R Y
                </div>
                <div
                  className="mt-0.5 h-[0.6px]"
                  style={{ background: "rgba(46, 64, 148, 0.4)" }}
                />
              </div>
              <div
                className="mx-3 h-[52px] w-[1.5px] shrink-0"
                style={{ background: colors.inkBlue }}
              />
              <div className="w-[68px] shrink-0 pr-2.5 text-center">
                <div
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 9,
                    color: colors.inkBlue,
                  }}
                >
                  Member
                </div>
                <div
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 9,
                    color: colors.inkBlue,
                  }}
                >
                  Since
                </div>
                <div
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 18,
                    fontWeight: 700,
                    color: colors.inkBlue,
                  }}
                >
                  {currentYear}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enter button */}
      <div className="flex justify-center pb-[52px]">
        <button
          type="button"
          disabled={!ready}
          onClick={() => ready && onComplete(trimmed)}
          className="flex items-center gap-1.5 px-7 py-3 transition-opacity duration-[450ms]"
          style={{
            opacity: buttonOpacity * (ready ? 1 : 0.35),
            color: colors.cream,
            fontFamily: fonts.serif,
            fontSize: 16,
            border: `1px solid ${ready ? "rgba(246,243,235,0.7)" : "rgba(246,243,235,0.3)"}`,
            borderRadius: 2,
          }}
        >
          Enter the Library
          <span aria-hidden style={{ fontSize: 13 }}>
            →
          </span>
        </button>
      </div>
    </div>
  );
}
