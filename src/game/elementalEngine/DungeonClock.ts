/** A monotonic dungeon clock. Time in the pause menu never ages combat state. */
export class DungeonClock {
  private readonly origin: number;
  private readonly epoch: number;
  private pausedAt: number | null = null;
  private excludedMs = 0;
  private timers = new Set<{ at: number; callback: () => void }>();

  constructor(private readonly source = () => performance.now(), epoch = Date.now()) {
    this.origin = source();
    this.epoch = epoch;
  }

  get isPaused(): boolean { return this.pausedAt !== null; }
  now(): number { return this.epoch + this.performanceNow() - this.origin; }
  performanceNow(): number { return (this.pausedAt ?? this.source()) - this.excludedMs; }
  pause(): void { if (this.pausedAt === null) this.pausedAt = this.source(); }
  resume(): void {
    if (this.pausedAt === null) return;
    this.excludedMs += this.source() - this.pausedAt;
    this.pausedAt = null;
  }
  schedule(callback: () => void, delayMs: number): () => void {
    const timer = { at: this.now() + delayMs, callback };
    this.timers.add(timer);
    return () => { this.timers.delete(timer); };
  }
  flushTimers(): void {
    if (this.isPaused) return;
    const now = this.now();
    for (const timer of this.timers) {
      if (timer.at <= now) {
        this.timers.delete(timer);
        timer.callback();
      }
    }
  }
}
