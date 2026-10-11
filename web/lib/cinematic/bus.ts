let engine: { scrollToChapter(i: number, focus: boolean): void } | null = null;
export const cinematicBus = {
  register(value: typeof engine) { engine = value; },
  unregister(value: typeof engine) { if (engine === value) engine = null; },
  scrollToChapter(i: number) { if (!engine) return false; engine.scrollToChapter(i,true); return true; },
};
