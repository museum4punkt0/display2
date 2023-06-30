const levels = { debug: 3, info: 2, warn: 1, error: 0 };
type levelType = keyof typeof levels;

let defaultLevel: levelType = 'info';

let logConfLevels: { [name: string]: levelType } = {
  AnimationLoop: 'info',
  KHRMaterialsVariantsParser: 'info',
  Renderer: 'info',
  'hook::useGltf': 'info',
  SceneManager: 'info',
  'component::View3d': 'info',
};

const loggers: Logger[] = [];

/** configure logging */
export function logConfig(level: levelType, logLevels: typeof logConfLevels) {
  defaultLevel = level;
  logConfLevels = logLevels;

  for (const logger of loggers) {
    logger.setConfigLevel();
  }
}

/**
 * Trivially simple non-hierachical logger.
 * Globally configured. Mostly for debugging.
 * Probably should be removed/replaced in production.
 */
export class Logger {
  name: string;
  level: number;
  _header: string;

  constructor(name: string) {
    this.name = name;
    this.level = 0;
    this._header = `[${this.name.padEnd(24)}]`;
    this.setConfigLevel();
    loggers.push(this);
  }

  setLevel(levelName: keyof typeof levels) {
    this.level = levels[levelName];
  }

  setConfigLevel() {
    let levelName = logConfLevels[this.name];
    if (levelName === undefined) {
      levelName = defaultLevel;
    }
    this.setLevel(levelName);
  }

  error(...args: unknown[]) {
    if (this.level >= 0) {
      console.error(this._header, ...args);
    }
  }

  warn(...args: unknown[]) {
    if (this.level >= 1) {
      console.warn(this._header, ...args);
    }
  }

  info(...args: unknown[]) {
    if (this.level >= 2) {
      console.info(this._header, ...args);
    }
  }

  log(...args: unknown[]) {
    if (this.level >= 2) {
      console.log(this._header, ...args);
    }
  }

  debug(...args: unknown[]) {
    if (this.level >= 3) {
      console.debug(this._header, ...args);
    }
  }
}
