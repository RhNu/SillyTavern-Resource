export type EventStopHandle = {
  stop: () => void;
};

export type EventGateway = ReturnType<typeof createEventGateway>;

export function createEventGateway() {
  return {
    on(eventName: string, handler: (...args: any[]) => void): EventStopHandle {
      return eventOn(eventName, handler);
    },
    emit(eventName: string, ...args: any[]) {
      return eventEmit(eventName, ...args);
    },
    tavernEvents: tavern_events,
  };
}
