export type ParsedModules = Array<string | { ignored: string }>;

// ---------------------------------------------------------------------------

export class ModuleError extends Error {
	__proto__: Error; // TS Extend native type Workaround (https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work)
	moduleName: string;
	constructor(message: string, moduleName: string) {
		super(message + ': ' + JSON.stringify(moduleName));
		this.__proto__ = new.target.prototype; // TS Extend native type Workaround
		this.moduleName = moduleName;
	}
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
