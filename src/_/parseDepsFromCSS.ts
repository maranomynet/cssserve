export type CssDepsList = Array<string> & { hasCSS: boolean };

const parseDepsFromCSS = (cssSource: string): CssDepsList => {
  // if (/\/\*!\s*@deps\s/.test(cssSource.slice(0, 1000))) {
  const allDeps = [] as unknown as CssDepsList;

  const allMatches = cssSource.matchAll(/\/\*!\s*@deps\s([^*]*)\*\//g);
  let foundDeclaration = false;
  for (const match of allMatches) {
    const deps = match[1]!
      .replace(/\/\/.*(?:\n|$)/g, '')
      .replace(/\n|,|;/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((x) => x);
    allDeps.push(...deps);
    foundDeclaration = true;
  }

  allDeps.hasCSS =
    (foundDeclaration
      ? cssSource.replace(/\/\*(?:\s|.)*?\*\//g, '') // Remove all comments, including @deps
      : cssSource
    ).trim().length > 0;

  return allDeps;
};

export default parseDepsFromCSS;
