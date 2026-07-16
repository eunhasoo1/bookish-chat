"use client";

import { useState } from "react";
import { colors, fonts } from "@/lib/tokens";

type Props = {
  onSignIn: () => Promise<void>;
};

export function SignInView({ onSignIn }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      await onSignIn();
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Sign-in failed");
    }
  }

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-8"
      style={{ background: colors.oakBrown }}
    >
      <div className="w-full max-w-[340px] text-center">
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: colors.cream,
            opacity: 0.85,
          }}
        >
          BOOKISH
        </div>
        <div
          className="mt-1"
          style={{
            fontFamily: fonts.serif,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: colors.cream,
          }}
        >
          LIBRARY
        </div>
        <p
          className="mx-auto mt-5 max-w-[260px] leading-relaxed"
          style={{
            fontFamily: fonts.serif,
            fontSize: 14,
            color: "rgba(246, 243, 235, 0.65)",
          }}
        >
          Sign in to claim your membership card and keep your reading journal.
        </p>

        <button
          type="button"
          disabled={busy}
          onClick={handleSignIn}
          className="mt-10 w-full px-6 py-3.5 transition-opacity disabled:opacity-50"
          style={{
            background: colors.cream,
            color: colors.inkBlue,
            fontFamily: fonts.serif,
            fontSize: 15,
            fontWeight: 700,
            borderRadius: 2,
            border: `1.5px solid ${colors.cream}`,
          }}
        >
          {busy ? "Opening Google…" : "Continue with Google"}
        </button>

        {error ? (
          <p
            className="mt-4 text-xs leading-relaxed"
            style={{ color: "rgba(246, 243, 235, 0.55)" }}
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
