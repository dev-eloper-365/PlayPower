export const createLogger = (namespace) => {
  const prefix = `[${namespace}]`;
  return {
    info: (...args) => console.log(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
    debug: (...args) => {
      if (process.env.DEBUG?.includes(namespace) || process.env.DEBUG === '*') {
        console.debug(prefix, ...args);
      }
    },
  };
};

export default createLogger;


