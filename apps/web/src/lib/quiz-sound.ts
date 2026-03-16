function getAudioContextCtor() {
  try {
    const win = window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    };
    return win.AudioContext ?? win.webkitAudioContext ?? null;
  } catch {
    return null;
  }
}

export function createQuizSound() {
  let context: AudioContext | null = null;

  function ensureContext() {
    if (context) return context;
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    context = new Ctor();
    return context;
  }

  function withContext(cb: (ctx: AudioContext) => void) {
    const ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
    cb(ctx);
  }

  function tone(freq: number, toFreq: number, duration: number, volume: number, type: OscillatorType = "sine") {
    withContext((ctx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(toFreq, ctx.currentTime + duration);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    });
  }

  return {
    playCorrect() {
      withContext((ctx) => {
        const notes = [523, 659, 784];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = ctx.currentTime + i * 0.08;
          osc.type = "triangle";
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.1, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
          osc.start(start);
          osc.stop(start + 0.15);
        });
      });
    },

    playWrong() {
      tone(330, 220, 0.25, 0.08, "sawtooth");
    },

    playTimerWarn() {
      tone(880, 440, 0.12, 0.05, "sine");
    },

    playTimerCritical() {
      tone(1100, 550, 0.1, 0.07, "square");
    },

    dispose() {
      if (context) {
        void context.close().catch(() => undefined);
        context = null;
      }
    }
  };
}
