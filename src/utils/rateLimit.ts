export class RateLimiter {
  private queue: Array<() => Promise<unknown>> = [];
  private processing = false;
  private lastCall = 0;
  private minInterval: number;

  constructor(minInterval: number) {
    this.minInterval = minInterval;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    const waitTime = Math.max(0, this.minInterval - timeSinceLastCall);

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    const task = this.queue.shift();
    if (task) {
      this.lastCall = Date.now();
      await task();
    }

    // Process next item
    this.processQueue();
  }

  clear() {
    this.queue = [];
    this.processing = false;
  }

  get queueLength() {
    return this.queue.length;
  }
}
