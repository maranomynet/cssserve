import o from 'ospec';
import { existsSync } from 'fs';
import { version } from '../package.json';
import { sync as glob } from 'glob';

o.spec('Publishing', () => {
	const cssVersion = (version.match(/^\d+\.\d+/) || [])[0];
	const projectRoot = process.cwd();
	const cssfolder = projectRoot + '/public/' + cssVersion + '/';

	o('package has a valid CSS version', () => {
		o(cssVersion != null).equals(true);
	});
	o('created a CSS folder for the current CSS version', () => {
		o(existsSync(cssfolder)).equals(true);
	});
	o('CSS folder has files', () => {
		o(glob(cssfolder + '*.css').length > 0).equals(true);
	});
});
