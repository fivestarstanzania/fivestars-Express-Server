const isProduction = process.env.NODE_ENV === 'production';

let consolePatched = false;

export const suppressNonCriticalConsoleInProduction = () => {
  if (!isProduction || consolePatched) {
    return;
  }

  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  consolePatched = true;
};

export const logger = {
  debug: (...args) => {
    if (!isProduction) {
      console.debug(...args);
    }
  },
  info: (...args) => {
    if (!isProduction) {
      console.info(...args);
    }
  },
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};