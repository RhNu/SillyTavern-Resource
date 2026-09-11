import { PluginError } from './errors.ts';

type Entry<T> = {
  fingerprint: string;
  promise: Promise<T>;
  expiresAt: number;
  settled: boolean;
};

/** Process-local idempotency for retries after an ambiguous HTTP response. */
export class OperationRegistry<T> {
  private readonly entries = new Map<string, Entry<T>>();

  constructor(
    private readonly ttlMs = 5 * 60_000,
    private readonly maxEntries = 32,
    private readonly now: () => number = Date.now,
  ) {}

  run(key: string, fingerprint: string, action: () => Promise<T>): Promise<T> {
    this.prune();
    const existing = this.entries.get(key);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new PluginError(409, 'OPERATION_CONFLICT', '相同 operationId 不能用于不同的生成请求');
      }
      existing.expiresAt = this.now() + this.ttlMs;
      return existing.promise;
    }

    const promise = action().catch(error => {
      if (this.entries.get(key)?.promise === promise) this.entries.delete(key);
      throw error;
    });
    const entry: Entry<T> = { fingerprint, promise, expiresAt: this.now() + this.ttlMs, settled: false };
    this.entries.set(key, entry);
    void promise.then(
      () => {
        entry.settled = true;
        this.trim();
      },
      () => {},
    );
    return promise;
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  private prune(): void {
    const now = this.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }

  private trim(): void {
    while (this.entries.size > this.maxEntries) {
      const oldest = [...this.entries].find(([, entry]) => entry.settled)?.[0];
      if (!oldest) return;
      this.entries.delete(oldest);
    }
  }
}
