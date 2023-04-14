import { readFileSync } from 'fs';

import { AppConfig } from './AppConfig';

const ensureObject = (cand: unknown): Record<string, unknown> | undefined => {
  if (cand && typeof cand === 'object' && !Array.isArray(cand)) {
    return cand as Record<string, unknown>;
  }
};
const ensureNonEmptyString = (cand: unknown): string | undefined => {
  if (cand && typeof cand === 'string') {
    return cand;
  }
};

const ensureStringMap = (cand: unknown): Record<string, string> | undefined => {
  const obj = ensureObject(cand);
  if (obj && Object.values(obj).every(ensureNonEmptyString)) {
    return obj as Record<string, string>;
  }
};

// ---------------------------------------------------------------------------

export const parseRedirects = (
  redirects?: AppConfig['redirects'],
  redirectsFile?: AppConfig['redirectsFile']
) => {
  if (redirects !== undefined) {
    redirects = ensureStringMap(redirects);
    if (!redirects) {
      throw new Error(`The redirects config field must contain a string→string map`);
    }
  }

  const redirectsFiles = Array.isArray(redirectsFile) ? redirectsFile : [redirectsFile];
  redirectsFiles
    .filter((v): v is string => !!v)
    .forEach((file) => {
      let fileContents: string | undefined;
      try {
        fileContents = readFileSync(file).toString();
      } catch (e) {
        throw new Error(`Could not read redirectsFile "${file}"`);
      }
      let parsedContents: unknown;
      try {
        parsedContents = JSON.parse(fileContents);
      } catch (e) {
        throw new Error(`Invalid JSON found in redirectsFile "${file}"`);
      }
      const fileRedirects = ensureStringMap(parsedContents);
      if (!fileRedirects) {
        throw new Error(
          `The redirectsFile "${file}" must contain \`Record<string, string>\``
        );
      }
      if (redirects) {
        // Merge fileRedirects into redirects.
        Object.keys(fileRedirects).forEach((key) => {
          redirects![key] = fileRedirects[key];
        });
      } else {
        redirects = fileRedirects;
      }
    });
  return redirects;
};
