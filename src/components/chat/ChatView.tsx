"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchChatMessages,
  insertChatMessage,
} from "@/hooks/useBookishAuth";
import { buildEdmundSystemPrompt } from "@/lib/prompts";
import { conversationKey } from "@/lib/types";
import type { BookEntryRecord, ChatMessageRecord } from "@/lib/types";

export type ChatRequest = {
  record: BookEntryRecord;
  userName: string;
};

type Props = {
  request: ChatRequest;
  userId: string;
  onClose: () => void;
};

export function ChatView({ request, userId, onClose }: Props) {
  const key = conversationKey(request.record.year, request.record.title);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingEpoch, setTypingEpoch] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const systemPrompt = buildEdmundSystemPrompt(request.userName, request.record);

  useEffect(() => {
    let cancelled = false;
    fetchChatMessages(userId, key).then((msgs) => {
      if (!cancelled) setMessages(msgs);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, key]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const canSend =
    inputText.trim().length > 0 && !isTyping;

  const revealParagraphs = useCallback(
    async (paragraphs: string[]) => {
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        const delay = Math.max(0.6, Math.min(2.5, paragraph.length * 0.025));
        await new Promise((r) => setTimeout(r, delay * 1000));
        const msg = await insertChatMessage(
          userId,
          key,
          "assistant",
          paragraph
        );
        setMessages((prev) => [...prev, msg]);
        if (i < paragraphs.length - 1) {
          setTypingEpoch((e) => e + 1);
        } else {
          setIsTyping(false);
        }
      }
    },
    [userId, key]
  );

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;
    setInputText("");
    setErrorMessage(null);
    inputRef.current?.blur();

    const userMsg = await insertChatMessage(userId, key, "user", text);
    const history = [...messages, userMsg];
    setMessages(history);

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    const initialDelay = 0.3 + Math.random() * 0.6;
    let typingShown = false;
    const showTyping = () => {
      if (!typingShown) {
        typingShown = true;
        setIsTyping(true);
        setTypingEpoch((e) => e + 1);
      }
    };
    window.setTimeout(showTyping, initialDelay * 1000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const payload = trimmed.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const obj = JSON.parse(payload) as { content?: string };
            if (obj.content) full += obj.content;
          } catch {
            // ignore malformed chunks
          }
        }
      }

      if (!typingShown) {
        showTyping();
        await new Promise((r) => setTimeout(r, 400));
      }

      const paragraphs = full
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean);
      await revealParagraphs(paragraphs.length ? paragraphs : [full || "…"]);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Chat failed");
      setIsTyping(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#fff" }}
    >
      {/* Header */}
      <div
        className="shrink-0 border-b border-black/10"
        style={{ background: "rgba(249,249,249,0.92)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center px-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-0.5 text-[17px]"
            style={{ color: "#007AFF" }}
          >
            <span className="text-[17px] font-semibold">‹</span> Back
          </button>
        </div>
        <div className="flex flex-col items-center gap-1.5 pb-3 pt-1.5">
          <div
            className="flex h-[60px] w-[60px] items-center justify-center rounded-full text-[26px] font-semibold text-white"
            style={{ background: "#c7c7cc" }}
          >
            E
          </div>
          <div className="text-center">
            <div className="text-[13px] font-semibold text-black">Edmund</div>
            <div className="text-[11px] text-black/50">Library Assistant</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto pt-2"
        onClick={() => inputRef.current?.blur()}
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} text={m.content} />
        ))}
        {isTyping ? <TypingBubble key={typingEpoch} /> : null}
        {errorMessage ? (
          <p className="px-4 pt-1 text-xs text-red-500">{errorMessage}</p>
        ) : null}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Input bar */}
      <div
        className="flex items-end gap-2.5 px-3 py-2.5"
        style={{
          background: "rgba(249,249,249,0.92)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <button
          type="button"
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-base font-semibold"
          style={{ background: "#e5e5ea" }}
          aria-label="Add"
        >
          +
        </button>

        <div
          className="flex flex-1 items-end gap-1.5 rounded-[20px] px-3 py-2"
          style={{ background: "#f2f2f7" }}
        >
          <textarea
            ref={inputRef}
            value={inputText}
            rows={1}
            placeholder="iMessage"
            className="max-h-[120px] flex-1 resize-none bg-transparent text-[16px] outline-none"
            onChange={(e) => {
              const v = e.target.value;
              if (v.includes("\n")) {
                setInputText(v.replace(/\n/g, ""));
                void sendMessage();
              } else {
                setInputText(v);
              }
            }}
          />
          {inputText.trim() ? (
            <button
              type="button"
              disabled={!canSend}
              onClick={() => void sendMessage()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
              style={{
                background: canSend ? "#007AFF" : "#c7c7cc",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ↑
            </button>
          ) : null}
        </div>

        {!inputText.trim() ? (
          <button
            type="button"
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full"
            style={{ background: "#e5e5ea" }}
            aria-label="Mic"
          >
            <MicIcon />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MessageBubble({ role, text }: { role: string; text: string }) {
  const isUser = role === "user";
  return (
    <div
      className={`flex px-3 py-0.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className="max-w-[75%] rounded-[18px] px-3.5 py-[9px] text-[16px]"
        style={{
          background: isUser ? "#007AFF" : "#e5e5ea",
          color: isUser ? "#fff" : "#000",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start px-3 py-0.5">
      <div
        className="flex items-center gap-[5px] rounded-[18px] px-4 py-3"
        style={{ background: "#e5e5ea" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: "#c7c7cc",
              animation: `typingBounce 0.9s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" aria-hidden>
      <path d="M7 0a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V3a3 3 0 0 0-3-3Z" />
      <path d="M2 8a1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V17H4a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H8v-2.07A7 7 0 0 0 14 8a1 1 0 1 0-2 0 5 5 0 1 1-10 0Z" />
    </svg>
  );
}
