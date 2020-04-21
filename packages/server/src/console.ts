import util from 'util';

declare global {
  interface Console {
    logObject: (obj: object) => void;
    logError: (err: Error) => void;
    logAction: (action: any) => void;
    logState: (state: any) => void;
    logDebug: (...args: any[]) => void;
  }
}

const logObj = (obj: object) =>
  console.info(util.inspect(obj, false, 10, true /* enable colors */));

Object.defineProperty(console, 'logObject', {
  value: (obj: object) => logObj(obj),
});

Object.defineProperty(console, 'logError', {
  value: (err: Error) => {
    console.error('\x1b[31m%s\x1b[0m', '[ ERROR ]', err.message);
    if (process.env.NODE_ENV === 'development') {
      logObj(err);
    }
  },
});

Object.defineProperty(console, 'logAction', {
  value: (action: any) => {
    console.debug('\x1b[33m%s\x1b[0m', '[ ACTION ]', action.type);
    if (process.env.NODE_ENV === 'development') {
      logObj(action);
    }
    console.log('\n');
  },
});

Object.defineProperty(console, 'logState', {
  value: (state: any) => {
    console.debug('\x1b[2m%s\x1b[0m', '[ STATE ]');
    if (process.env.NODE_ENV === 'development') {
      logObj(state);
    }
    console.log('\n');
  },
});

Object.defineProperty(console, 'logDebug', {
  value: (...args: any[]) => {
    console.debug(
      ...[
        '\x1b[36m%s\x1b[0m',
        '[ DEBUG ]',
        Array.isArray(args) && args.shift(),
      ].filter(Boolean)
    );
    args.length && console.log(...args);
    console.log('\n');
  },
});
