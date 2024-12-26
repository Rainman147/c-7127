export interface BackoffConfig {
  initialDelay: number;
  maxDelay: number;
  maxAttempts: number;
  jitter?: boolean;
}

const DEFAULT_CONFIG: BackoffConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxAttempts: 5,
  jitter: true
};

export class ExponentialBackoff {
  private attempts = 0;
  private readonly config: BackoffConfig;

  constructor(config: Partial<BackoffConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public reset(): void {
    this.attempts = 0;
  }

  public nextDelay(): number | null {
    if (this.attempts >= this.config.maxAttempts) {
      return null;
    }

    const delay = Math.min(
      this.config.initialDelay * Math.pow(2, this.attempts),
      this.config.maxDelay
    );

    this.attempts++;

    if (this.config.jitter) {
      return delay + (Math.random() * delay * 0.1); // Add up to 10% jitter
    }

    return delay;
  }

  public get attemptCount(): number {
    return this.attempts;
  }

  public canRetry(): boolean {
    return this.attempts < this.config.maxAttempts;
  }
}