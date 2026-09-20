import { EventEmitter } from 'events';
import { broadcastEvent } from './websocket.gateway';

export interface DomainEvent<T = any> {
  id: string;
  name: string;
  timestamp: Date;
  payload: T;
  correlationId?: string;
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

/**
 * Domain Event Bus implementing Event-Driven Architecture (EDA)
 * Decouples domain services and allows pluggable Redis / Kafka streams in microservice clusters.
 */
export class DomainEventBus {
  private static emitter = new EventEmitter();

  static initialize() {
    this.emitter.setMaxListeners(50);
  }

  /**
   * Publishes a domain event to all internal subscribers and WebSocket gateway
   */
  static async publish<T>(eventName: string, payload: T, correlationId?: string): Promise<void> {
    const event: DomainEvent<T> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: eventName,
      timestamp: new Date(),
      payload,
      correlationId,
    };

    console.log(`[EventBus] Publishing event: ${eventName} (ID: ${event.id})`);

    // Emit to internal in-process domain handlers
    this.emitter.emit(eventName, event);
    this.emitter.emit('*', event);

    // Synchronize to WebSocket client broker for real-time dashboard updates
    broadcastEvent(eventName, payload);
  }

  /**
   * Subscribes to a specific domain event
   */
  static subscribe<T>(eventName: string, handler: EventHandler<T>): void {
    this.emitter.on(eventName, handler);
  }

  /**
   * Unsubscribes from an event
   */
  static unsubscribe(eventName: string, handler: EventHandler): void {
    this.emitter.off(eventName, handler);
  }
}
