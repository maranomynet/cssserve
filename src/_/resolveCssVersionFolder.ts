import { onCacheRefresh } from './cacheRefresher.js';
import config from './config.js';
import getAllValidCssVersions from './getAllValidCssVersions.js';
import isSafeToken from './isSafeToken.js';

let _validVersions: Record<string, Record<string, string>> = {};
onCacheRefresh(() => {
  _validVersions = {};
});

const resolveCssVersionFolder = (
  staticFolder: string,
  versionParam: string | undefined
): string | null => {
  if (!versionParam || !isSafeToken(versionParam)) {
    return null;
  }
  let versions = config.cache && _validVersions[staticFolder];
  if (!versions) {
    versions = _validVersions[staticFolder] = getAllValidCssVersions(staticFolder);
  }
  return versions[versionParam] || null;
};

export default resolveCssVersionFolder;
