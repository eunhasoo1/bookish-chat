"use client";

import { useState } from "react";
import { SignInView } from "@/components/auth/SignInView";
import { OnboardingView } from "@/components/onboarding/OnboardingView";
import { ContentView } from "@/components/library/ContentView";
import { useBookishAuth } from "@/hooks/useBookishAuth";
import { colors } from "@/lib/tokens";

export function AppShell() {
  const {
    ready,
    userId,
    displayName,
    entries,
    error,
    signInWithGoogle,
    completeOnboarding,
    setEntries,
  } = useBookishAuth();
  const [transitioning, setTransitioning] = useState(false);

  if (!ready) {
    return (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ background: colors.oakBrown, color: colors.cream }}
      >
        <p style={{ fontFamily: "Georgia, serif", fontSize: 14, opacity: 0.7 }}>
          Opening the library…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-3 px-8 text-center"
        style={{ background: colors.oakBrown, color: colors.cream }}
      >
        <p style={{ fontFamily: "Georgia, serif", fontSize: 15 }}>
          Could not connect to the library.
        </p>
        <p className="text-xs opacity-60">{error}</p>
        <p className="mt-2 max-w-sm text-xs opacity-50">
          Check NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and that
          Google sign-in is enabled in Supabase.
        </p>
      </div>
    );
  }

  if (!userId) {
    return <SignInView onSignIn={signInWithGoogle} />;
  }

  if (!displayName) {
    return (
      <div
        className="h-full w-full"
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(-40px)" : "none",
          transition: "opacity 0.4s ease, transform 0.5s cubic-bezier(0.34,1.2,0.64,1)",
        }}
      >
        <OnboardingView
          onComplete={async (name) => {
            setTransitioning(true);
            try {
              await completeOnboarding(name);
            } catch (err) {
              setTransitioning(false);
              alert(err instanceof Error ? err.message : "Failed to save name");
            }
          }}
        />
      </div>
    );
  }

  return (
    <ContentView
      userId={userId}
      userName={displayName}
      entries={entries}
      onEntriesChange={setEntries}
    />
  );
}
