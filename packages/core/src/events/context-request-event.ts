export class ContextRequestEvent<T> extends Event {
  readonly contextKey: symbol;
  
  readonly callback: (value: T) => void;

  constructor(contextKey: symbol, callback: (value: T) => void) {
    super('context-request', {
      bubbles: true,
      composed: true,
      cancelable: false,
    });
    this.contextKey = contextKey;
    this.callback = callback;
  }
}

export function requestContext<T>(
  element: EventTarget,
  contextKey: symbol,
  callback: (value: T) => void
): void {
  const event = new ContextRequestEvent<T>(contextKey, callback);
  element.dispatchEvent(event);
}