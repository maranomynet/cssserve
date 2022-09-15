// ---------------------------------------------------------------------------
/**
 * Checks if an URL token contains no spaces or funny characters.
 * Only allows `[a-z0-9-_.]`
 */
const isSafeToken = (token: string | undefined): boolean =>
  !token || !(/[^a-z0-9-_.]/i.test(token) || /\.\./.test(token));

export default isSafeToken;
