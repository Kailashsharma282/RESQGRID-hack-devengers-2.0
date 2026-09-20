export enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation
  OPEN = 'OPEN',           // Tripped, reject immediately to fallback
  HALF_OPEN = 'HALF_OPEN', // Testing recovery
}

export interface CircuitBreakerOptions {
  failureThreshold: number; // consecutive failures before tripping
  resetTimeoutMs: number;   // time to wait before entering HALF_OPEN
  name: string;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  async execute<T>(action: () => Promise<T>, fallback: () => Promise<T> | T): Promise<T> {
    const now = Date.now();

    // Check if OPEN circuit should transition to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (now - this.lastFailureTime > this.options.resetTimeoutMs) {
        console.log(`[CircuitBreaker:${this.options.name}] Transitioning from OPEN to HALF_OPEN`);
        this.state = CircuitState.HALF_OPEN;
      } else {
        console.warn(`[CircuitBreaker:${this.options.name}] Circuit is OPEN. Executing fallback.`);
        return fallback();
      }
    }

    try {
      const result = await action();
      // Successful execution resets circuit
      if (this.state === CircuitState.HALF_OPEN || this.failureCount > 0) {
        console.log(`[CircuitBreaker:${this.options.name}] Recovery verified. Resetting to CLOSED.`);
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
      }
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = now;
      console.error(`[CircuitBreaker:${this.options.name}] Failure ${this.failureCount}/${this.options.failureThreshold}:`, error);

      if (this.failureCount >= this.options.failureThreshold || this.state === CircuitState.HALF_OPEN) {
        console.error(`[CircuitBreaker:${this.options.name}] Trip threshold reached! Circuit is now OPEN.`);
        this.state = CircuitState.OPEN;
      }

      return fallback();
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
