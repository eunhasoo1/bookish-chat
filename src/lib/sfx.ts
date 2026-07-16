type SfxId = "card" | "edit" | "chat";

type SfxSpec = {
  file: string;
  attackOffset: number;
  playDuration: number;
  pitchMin: number;
  pitchMax: number;
};

const SFX: Record<SfxId, SfxSpec> = {
  card: {
    file: "ES_Computers, Keyboard & Mouse, Mouse, Macbook Pro, Trackpad, Movement - Epidemic Sound - 2225-2943.wav",
    attackOffset: 0.12,
    playDuration: 0.5,
    pitchMin: 0.9,
    pitchMax: 1.15,
  },
  edit: {
    file: "ES_Objects, Writing, Writing Letters, Soft Pencil - Epidemic Sound - 2489-3246.wav",
    attackOffset: 0.3,
    playDuration: 0.55,
    pitchMin: 1,
    pitchMax: 1.2,
  },
  chat: {
    file: "ES_Computers, Keyboard & Mouse, Keyboard, Razer, Backspace, Hits 02 - Epidemic Sound - 0000-0178.wav",
    attackOffset: 0.03,
    playDuration: 0.15,
    pitchMin: 0.9,
    pitchMax: 1.15,
  },
};

let audioCtx: AudioContext | null = null;
let unlocked = false;
const buffers = new Map<SfxId, AudioBuffer>();
const loadPromises = new Map<SfxId, Promise<AudioBuffer | null>>();

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioCtx = new AC();
  }
  return audioCtx;
}

function sfxUrl(file: string): string {
  return `/sfx/${encodeURIComponent(file)}`;
}

async function loadBuffer(id: SfxId): Promise<AudioBuffer | null> {
  const cached = buffers.get(id);
  if (cached) return cached;

  const existing = loadPromises.get(id);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const ctx = getAudioContext();
      const res = await fetch(sfxUrl(SFX[id].file));
      if (!res.ok) return null;
      const data = await res.arrayBuffer();
      const buffer = await ctx.decodeAudioData(data.slice(0));
      buffers.set(id, buffer);
      return buffer;
    } catch {
      return null;
    }
  })();

  loadPromises.set(id, promise);
  return promise;
}

function startSource(ctx: AudioContext, id: SfxId, buffer: AudioBuffer): void {
  const spec = SFX[id];
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value =
    spec.pitchMin + Math.random() * (spec.pitchMax - spec.pitchMin);
  source.connect(ctx.destination);
  source.start(ctx.currentTime, spec.attackOffset, spec.playDuration);
}

function playSfx(id: SfxId): void {
  try {
    const ctx = getAudioContext();

    // Kick resume in this call stack (click/gesture); don't wait for "running".
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const ready = buffers.get(id);
    if (ready) {
      startSource(ctx, id, ready);
      return;
    }

    void (async () => {
      try {
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        const buffer = await loadBuffer(id);
        if (!buffer) return;
        startSource(ctx, id, buffer);
      } catch {
        // Autoplay / decode failures are non-fatal
      }
    })();
  } catch {
    // Non-fatal
  }
}

/**
 * Fetch + decode all SFX buffers (no user gesture required).
 * Call once when the library view mounts so the first swipe can play instantly.
 */
export function warmSfxBuffers(): void {
  void loadBuffer("card");
  void loadBuffer("edit");
  void loadBuffer("chat");
}

/**
 * Unlock AudioContext during a user gesture (pointerdown / click).
 */
export function unlockSfx(): void {
  try {
    const ctx = getAudioContext();

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    if (!unlocked) {
      unlocked = true;
      const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
      const tick = ctx.createBufferSource();
      tick.buffer = silent;
      tick.connect(ctx.destination);
      tick.start(0);
    }
  } catch {
    // Non-fatal
  }
}

/**
 * Call from a user-gesture handler (pointerdown).
 * Unlocks AudioContext and ensures buffers are loading (card first).
 */
export function preloadSfx(): void {
  try {
    unlockSfx();
    void loadBuffer("card");
    void loadBuffer("edit");
    void loadBuffer("chat");
  } catch {
    // Non-fatal
  }
}

/** @deprecated use preloadSfx */
export const preloadPaperSfx = preloadSfx;

/** Card snap (shelf ↔ main) */
export function playCardSfx(): void {
  playSfx("card");
}

/** @deprecated use playCardSfx */
export const playPaperSfx = playCardSfx;

/** Open book edit sheet */
export function playEditSfx(): void {
  playSfx("edit");
}

/** Open book chat */
export function playChatSfx(): void {
  playSfx("chat");
}
