const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

function fmt(msg: string): string {
  const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
  return `[${time}] ${msg}`;
}

export const logger = {
  info(source: string, msg: string) {
    console.log(fmt(`[INFO]  [${source}]  ${msg}`));
  },
  warn(source: string, msg: string) {
    console.warn(fmt(`[WARN]  [${source}]  ${msg}`));
  },
  error(source: string, msg: string) {
    console.error(fmt(`[ERROR] [${source}]  ${msg}`));
  },
};
