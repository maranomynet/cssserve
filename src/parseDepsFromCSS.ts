export type CssDepsList = Array<string> & { hasCSS: boolean };

const parseDepsFromCSS = (cssSource: string): CssDepsList => {
  // if (/\/\*!\s*@deps\s/.test(cssSource.slice(0, 1000))) {
  const match = cssSource.match(/\/\*!\s*@deps\s([^*]*)\*\//);
  if (match) {
    const deps = match[1]
      .replace(/\/\/.*(?:\n|$)/g, '')
      .replace(/\n|,|;/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((x) => x) as CssDepsList;
    deps.hasCSS =
      cssSource
        .replace(/\/\*(?:\s|.)*?\*\//g, '') // Remove all comments, including @deps
        .trim().length > 0;
    return deps;
  }
  // }
  const empty = [] as Array<string> as CssDepsList;
  empty.hasCSS = cssSource.trim().length > 0;
  return empty;
};

export default parseDepsFromCSS;
