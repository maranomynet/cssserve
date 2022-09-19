export type ParsedModules = Array<
  | string
  | { name: string; invalid: true; empty?: never }
  | { name: string; empty: true; invalid?: never }
>;

// ---------------------------------------------------------------------------
export class NotFoundError extends Error {
  __proto__: Error; // TS Extend native type Workaround (https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work)
  constructor(message: string) {
    super(message);
    this.__proto__ = new.target.prototype; // TS Extend native type Workaround
  }
}

export class ModuleError extends NotFoundError {
  constructor(message: string, moduleName: string) {
    super(message + ': ' + JSON.stringify(moduleName));
    this.moduleName = moduleName;
  }
  moduleName: string;
}
export class NonExistentModuleError extends ModuleError {
  constructor(moduleName: string) {
    super('No CSS file matches token', moduleName);
  }
}
export class UnsafeModuleTokenError extends ModuleError {
  constructor(moduleName: string) {
    super('Invalid/Rejected token', moduleName);
  }
}
