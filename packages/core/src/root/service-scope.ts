

function isDisposable(service: unknown): service is { dispose: () => void } {
  return (
    typeof service === 'object' &&
    service != null &&
    'dispose' in service &&
    typeof (service as { dispose: () => void }).dispose === 'function'
  );
}

export class ServiceScope {
  private services = new Map<symbol, unknown>();

  //scoping to parent in constructor
  constructor(private parent?: ServiceScope) {}

  //subscribes the service to it's internal services
  provide<T>(key: symbol, service: T) {
    this.services.set(key, service);
  }

  //if the service exists, return it. Otherwise, if there is a parent, recurse.
  get<T>(key: symbol): T {
    if (this.services.has(key)) {
      return this.services.get(key) as T
    } else if (this.parent) {
      return this.parent.get<T>(key);
    } else {
      throw new Error(`Service ${String(key)} not found in current scope or any parent scopes`);
    }
  }

  //return true if the service has the key or it's parent has the key
  has(key: symbol): boolean {
    return this.services.has(key) || (!!this.parent && this.parent.has(key));
  }

  delete(key: symbol): boolean {
    const service = this.services.get(key);
    const deleted = this.services.delete(key);
    if (deleted && service && isDisposable(service)){
      service.dispose();
    }
    return deleted;
  }

  disposeAll() {
    for (const [, service] of this.services) {
      if (isDisposable(service)) {
        service.dispose();
      }
    }
    this.services.clear();
  }

  //fork the instance by returning a new instance *with this one as the parent*
  fork(): ServiceScope {
    return new ServiceScope(this)
  }

  // do note nothing is truly secure on the client, however,
  // this will allow vetted access to 'secure' contexts
  secureFork(allowedKeys: symbol[]): ServiceScope {
    const child = new ServiceScope();
    for (const key of allowedKeys) {
      child.provide(key, this.get(key));
    }
    return child;
  }
}