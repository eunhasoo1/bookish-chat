"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { BookEntryRecord, ChatMessageRecord, Profile } from "@/lib/types";

type AuthState = {
  ready: boolean;
  userId: string | null;
  displayName: string;
  entries: BookEntryRecord[];
  error: string | null;
};

function googleDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "";
  return name.trim();
}

export function useBookishAuth() {
  const [state, setState] = useState<AuthState>({
    ready: false,
    userId: null,
    displayName: "",
    entries: [],
    error: null,
  });

  const refreshEntries = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("book_entries")
      .select("*")
      .eq("user_id", userId)
      .order("year", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data ?? []) as BookEntryRecord[];
  }, []);

  const loadUserSession = useCallback(
    async (user: User | null) => {
      if (!user) {
        setState({
          ready: true,
          userId: null,
          displayName: "",
          entries: [],
          error: null,
        });
        return;
      }

      const supabase = createClient();
      const userId = user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      let displayName = (profile as Profile | null)?.display_name ?? "";

      if (!displayName) {
        const seeded = googleDisplayName(user);
        if (seeded) {
          const { error } = await supabase
            .from("profiles")
            .upsert({ id: userId, display_name: seeded });
          if (!error) displayName = seeded;
        }
      }

      const entries = await refreshEntries(userId);

      setState({
        ready: true,
        userId,
        displayName,
        entries,
        error: null,
      });
    },
    [refreshEntries]
  );

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function init() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (cancelled) return;
        await loadUserSession(sessionData.session?.user ?? null);
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            ready: true,
            error: err instanceof Error ? err.message : "Failed to initialize",
          }));
        }
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      loadUserSession(session?.user ?? null).catch((err) => {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            ready: true,
            error: err instanceof Error ? err.message : "Failed to initialize",
          }));
        }
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadUserSession]);

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }, []);

  const completeOnboarding = useCallback(
    async (name: string) => {
      if (!state.userId) throw new Error("No session");
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: state.userId, display_name: name });
      if (error) throw error;
      setState((s) => ({ ...s, displayName: name }));
    },
    [state.userId]
  );

  const setEntries = useCallback((entries: BookEntryRecord[]) => {
    setState((s) => ({ ...s, entries }));
  }, []);

  const reloadEntries = useCallback(async () => {
    if (!state.userId) return;
    const entries = await refreshEntries(state.userId);
    setState((s) => ({ ...s, entries }));
  }, [state.userId, refreshEntries]);

  return {
    ...state,
    signInWithGoogle,
    completeOnboarding,
    setEntries,
    reloadEntries,
  };
}

export async function fetchChatMessages(
  userId: string,
  conversationKey: string
): Promise<ChatMessageRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", userId)
    .eq("conversation_key", conversationKey)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMessageRecord[];
}

export async function insertChatMessage(
  userId: string,
  conversationKey: string,
  role: "user" | "assistant",
  content: string
): Promise<ChatMessageRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      user_id: userId,
      conversation_key: conversationKey,
      role,
      content,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ChatMessageRecord;
}
