import { Logger } from '../simpleLog';

const log = new Logger('AnimationLoop');

/**
 * Responsible for scheduling draw calls.
 * Nothing to do with animated objects on the screen.
 */
export class AnimationLoop {
  prevT: number;
  handle: number | null;
  msec = 100;
  onTick: (t: number, d: number) => void;
  _stopping = false;

  /**
   * @param onTick called on every frame
   * @param fps frames per second.
   *     Useful for console.log style debugging to set it to something low like 0.5
   */
  constructor(onTick: (t: number, d: number) => void, fps = 120) {
    this.prevT = 0;
    this.handle = null;
    this.onTick = onTick;
    this.msec = 1000 / fps;
  }

  start() {
    // performance.now is a monotonic timer! Returns milliseconds
    // Using it to avoid the initial delta being inconsistent,
    // likely large, or even negative.
    // So we are ignoring the perf time we get from requestAnimationFrame.
    log.info('start');
    this._stopping = false;
    this.prevT = performance.now();
    requestAnimationFrame(this._tick.bind(this));
  }

  _tick() {
    const t = performance.now();
    const delta = t - this.prevT;
    if (delta > this.msec) {
      this.onTick(t, delta);
      this.prevT = t;
    }
    if (!this._stopping) {
      this.handle = requestAnimationFrame(this._tick.bind(this));
    }
  }

  stop() {
    log.info('stop');
    this._stopping = true;
    if (this.handle) {
      cancelAnimationFrame(this.handle);
    }
  }
}
