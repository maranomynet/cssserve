import { AppConfig } from './AppConfig';
import { readFileSync } from 'fs';

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

	if (redirectsFile) {
		let fileContents: string | undefined;
		try {
			fileContents = readFileSync(redirectsFile).toString();
		} catch (e) {
			throw new Error(`Could not read redirectsFile "${redirects}"`);
		}
		let parsedContents: unknown;
		try {
			parsedContents = JSON.parse(fileContents);
		} catch (e) {
			throw new Error(`Invalid JSON found in redirectsFile "${redirects}"`);
		}
		const fileRedirects = ensureStringMap(parsedContents);
		if (!fileRedirects) {
			throw new Error(
				`The redirectsFile "${redirects}" must contain a string→string map`
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
	}
	return redirects;
};
