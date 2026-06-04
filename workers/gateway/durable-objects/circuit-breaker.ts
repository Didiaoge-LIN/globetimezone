import { DurableObject } from 'cloudflare:workers';
import { CONFIG } from '../../config';

/**
 * CircuitBreakerDO — SQLite Durable Object
 * State: closed → open (failures >= threshold) → half-open (timeout) → closed (success)
 * State is in-memory; DO eviction resets to closed (safe default)
 */
export class CircuitBreakerDO extends DurableObject {
  private failures: number = 0;
  private lastFailure: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/allow-request':
        return this.handleAllowRequest();
      case '/success':
        return this.handleSuccess();
      case '/failure':
        return this.handleFailure();
      case '/status':
        return this.handleStatus();
      default:
        return new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  }

  private handleAllowRequest(): Response {
    const now = Date.now();

    if (this.state === 'open') {
      if (now - this.lastFailure > CONFIG.CIRCUIT_BREAKER.OPEN_TIMEOUT) {
        this.state = 'half-open';
      } else {
        return new Response(JSON.stringify({ allowed: false, retryAfter: 30 }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ allowed: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private handleSuccess(): Response {
    if (this.state === 'half-open') {
      this.state = 'closed';
      this.failures = 0;
    }
    return new Response(JSON.stringify({ state: this.state }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private handleFailure(): Response {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
      this.state = 'open';
    }

    return new Response(JSON.stringify({ failures: this.failures, state: this.state }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private handleStatus(): Response {
    return new Response(JSON.stringify({
      failures: this.failures,
      state: this.state,
      lastFailure: this.lastFailure
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
