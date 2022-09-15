import { sync as glob } from 'glob';

const getAllValidCssVersions = (staticFolder: string): Record<string, string> => {
  const versions: Record<string, string> = {};
  const cssFolder = staticFolder + 'css/';
  const versionFolders = glob('*/', { cwd: cssFolder })
    // chop trailing "/" off directoryNames
    .map((dirName) => dirName.slice(0, -1));

  versionFolders.forEach((name) => {
    const superVersions = name
      .split('.')
      .slice(0, -1)
      .reduce<Array<string>>(
        (superVersions, token, i, arr) =>
          superVersions.concat([arr.slice(0, i + 1).join('.')]),
        []
      );
    superVersions.forEach((superVersion) => {
      if (!versions[superVersion]) {
        const cutIdx = superVersion.length + 1;
        const topPointVersion = versionFolders
          .filter((subName) => subName.startsWith(superVersion + '.'))
          .map((subName) => subName.slice(cutIdx))
          .filter((minorVersionSuffix) => !/[^0-9.]/.test(minorVersionSuffix))
          .map((minorVersionSuffix) => {
            const arr = minorVersionSuffix.split('.').map((bit) => parseInt(bit));
            arr.length = 4; // Normalize the length for saner sort.
            return arr;
          })
          .sort((a, b) => {
            const idx = a.findIndex((_, i) => a[i] !== b[i]);
            return (a[idx] || 0) > (b[idx] || 0) ? 1 : -1;
          })
          .pop() as ReadonlyArray<number>;
        if (topPointVersion) {
          const pointVersionSuffix = topPointVersion.join('.').replace(/\.+$/, '');
          versions[superVersion] = 'css/' + superVersion + '.' + pointVersionSuffix + '/';
        }
      }
    });

    versionFolders.filter((fname) => fname.startsWith(name + '.'));
  });

  versionFolders.forEach((name) => {
    versions[name] = versions[name] || 'css/' + name + '/';
  });

  return versions;
};

export default getAllValidCssVersions;
