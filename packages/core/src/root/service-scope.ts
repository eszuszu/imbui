//This will allow *global* or *scoped* services.
//Will be a core part of the Context API

export class ServiceScope {
  private services = new Map<string | symbol, unknown>();

  //scoping to parent in constructor
  constructor(private parent?: ServiceScope) {}

  //subscribes the service to it's internal services
  provide<T>(key: string | symbol, service: T) {
    this.services.set(key, service);
  }

  //if the service exists, return it. Otherwise, if there is a parent, recurse.
  get<T>(key: string | symbol): T {
    if (this.services.has(key)) {
      return this.services.get(key) as T
    } else if (this.parent) {
      return this.parent.get<T>(key);
    } else {
      throw new Error(`Service ${String(key)} not found in current scope or any parent scopes`) //consider logger
    }
  }

  //return true if the service has the key or it's parent has the key
  has(key: string | symbol): boolean {
    return this.services.has(key) || (!!this.parent && this.parent.has(key));
  }

  delete(key: string | symbol): boolean{
    return this.services.delete(key);
  }

  //fork the instance by returning a new instance *with this one as the parent*
  fork(): ServiceScope {
    return new ServiceScope(this)
  }
}