const PAPER_SFX_FILE =
  "ES_Computers, Keyboard & Mouse, Mouse, Macbook Pro, Trackpad, Movement - Epidemic Sound - 2225-2943.wav";
const PAPER_SFX_URL = `/sfx/${encodeURIComponent(PAPER_SFX_FILE)}`;

/** Skip quiet lead-in before the trackpad movement attack. */
const ATTACK_OFFSET = 0.12;
/** Play the useful movement portion. */
const PLAY_DURATION = 0.5;

const PITCH_MIN = 0.9;
const PITCH_MAX = 1.15;

let audioCtx: AudioContext | null = null;
let paperBuffer: AudioBuffer | null = null;
let loadPromise: Promise<AudioBuffer | null> | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

async function loadPaperBuffer(): Promise<AudioBuffer | null> {
  if (paperBuffer) return paperBuffer;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const ctx = getAudioContext();
      const res = await fetch(PAPER_SFX_URL);
      if (!res.ok) return null;
      const data = await res.arrayBuffer();
      paperBuffer = await ctx.decodeAudioData(data.slice(0));
      return paperBuffer;
    } catch {
      return null;
    }
  })();

  return loadPromise;
}

function startPaperSource(ctx: AudioContext, buffer: AudioBuffer): void {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const rate = PITCH_MIN + Math.random() * (PITCH_MAX - PITCH_MIN);
  source.playbackRate.value = rate;
  source.connect(ctx.destination);
  const when = ctx.currentTime;
  source.start(when, ATTACK_OFFSET, PLAY_DURATION);
}

/** Warm AudioContext + decode buffer early so snap play is instant. */
export function preloadPaperSfx(): void {
  void (async () => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      await loadPaperBuffer();
    } catch {
      // Non-fatal
    }
  })();
}

/**
 * Play the paper-handle SFX with a slight random pitch.
 * When preloaded, starts synchronously so it lines up with the snap animation.
 */
export function playPaperSfx(): void {
  try {
    const ctx = getAudioContext();

    if (paperBuffer && ctx.state === "running") {
      startPaperSource(ctx, paperBuffer);
      return;
    }

    void (async () => {
      try {
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        const buffer = await loadPaperBuffer();
        if (!buffer) return;
        startPaperSource(ctx, buffer);
      } catch {
        // Autoplay / decode failures are non-fatal
      }
    })();
  } catch {
    // Non-fatal
  }
}
