export const isProd = process.env.NODE_ENV === 'production';
export const isDebug = process.env.NODE_ENV === 'debug';
export const isDev = isDebug || process.env.NODE_ENV === 'development';

export const logInfo = process.env.TEST ? () => {} : console.info;
