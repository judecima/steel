import { DebugEvent } from '../core/types';

export class EngineLogger {
  private events: DebugEvent[] = [];

  log(event: string, entityId: string, reason: string, values?: Record<string, any>, relatedIds?: string[]) {
    const debugEvent: DebugEvent = {
      timestamp: Date.now(),
      event,
      entityId,
      reason,
      values,
      relatedIds
    };
    
    this.events.push(debugEvent);
    console.log(`[${event}] ${entityId}: ${reason} ${values ? JSON.stringify(values) : ''}`);
  }

  getEvents(): DebugEvent[] {
    return this.events;
  }

  clear() {
    this.events = [];
  }
}

export const logger = new EngineLogger();
