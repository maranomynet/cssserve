import o from 'ospec';
import parseModules from './parseModules';
import { ParsedModules, NonExistentModuleError, UnsafeModuleTokenError } from './types';
import { staticFolder } from '../testing/cssserve-config.json';

const defaultOpts = {
	cache: true,
	loudBadTokenErrors: false,
};

type Opts = Parameters<typeof parseModules>[2];

// ---------------------------------------------------------------------------

o.spec('parseModules', () => {
	const sourceFolder = staticFolder + 'css/dev/';

	type TestDescr =
		| {
				input: Array<string>;
				expected: ParsedModules;
				opts?: Opts;
		  }
		| {
				input: Array<string>;
				error: { notFound: string } | { invalid: string };
				opts?: Opts;
		  };

	const tests: Record<string, TestDescr> = {
		'finds a basic module': {
			input: ['_basic'],
			expected: ['_basic'],
		},
		'sorts the module list': {
			input: ['Button', '_basic'],
			expected: ['_basic', 'Button'],
		},
		'finds depenencies': {
			input: ['Prompt'],
			expected: ['Button', 'Prompt'],
		},
		'finds dependencies recursively': {
			input: ['Wizard'],
			expected: ['Button', 'Prompt', 'Wizard'],
		},
		'deduplicates the list': {
			input: ['Button', 'Button'],
			expected: ['Button'],
		},
		'deduplicates from sub-dependencies': {
			input: ['Prompt', 'Button'],
			expected: ['Button', 'Prompt'],
		},
		'correctly merges duplicated sub-dependencies': {
			input: ['Prompt', 'Button', 'Search'],
			expected: ['Button', 'Prompt', 'Input', 'Search'],
		},
		'tolerates circular dependencies': {
			input: ['A', 'B'],
			expected: ['B', 'A'],
		},
		// ---------------------
		'suppresses empty module files': {
			input: ['EmptyModule'],
			expected: [],
		},
		'suppresses meta (@deps only) module files': {
			input: ['MetaModule'],
			expected: ['Button', 'Prompt', 'Input', 'Search'],
		},
		// ---------------------
		'Warns about broken top-level module tokens that match no CSS file': {
			input: ['Prompt', 'Button', 'Search', 'Http404'],
			expected: ['Button', { ignored: 'Http404' }, 'Prompt', 'Input', 'Search'],
		},
		'Optionally throws for broken top-level module tokens that match no CSS file': {
			input: ['Prompt', 'Button', 'Search', 'Http404'],
			error: { notFound: 'Http404' },
			opts: { loudBadTokenErrors: true },
		},
		'Throws for unsafe top-level module tokens': {
			input: ['Prompt', 'Button', 'Search', '/etc/evil/token'],
			error: { invalid: '/etc/evil/token' },
			opts: { loudBadTokenErrors: true },
		},
		'Throws for unsafe top-level module tokens regardless config.loadBadTokenErrors': {
			input: ['Prompt', 'Button', 'Search', '/etc/evil/token'],
			error: { invalid: '/etc/evil/token' },
			opts: { loudBadTokenErrors: false },
		},
		// NOTE: Don't bother users of cssBundler with the mistakes of the CSS author.
		'Broken /*!@deps*/ tokens in CSS files are silently ignored': {
			input: ['HasBrokenDependency'],
			expected: ['Button', { ignored: 'Http404' }, 'HasBrokenDependency'],
		},
		// NOTE: Don't bother users of cssBundler with the mistakes of the CSS author.
		'Unsafe /*!@deps*/ tokens in CSS files are silently ignored': {
			input: ['HasUnsafeDependencies'],
			expected: [
				{ ignored: '../../_EVÍL$_/Http404' },
				{ ignored: '../dev/Input' },
				'Button',
				'HasUnsafeDependencies',
			],
		},
	};

	Object.entries(tests).forEach(([name, test]) => {
		o(name, (done) => {
			const modulesP = parseModules(test.input, sourceFolder, test.opts || defaultOpts);

			if ('expected' in test) {
				modulesP
					.then((modules) => {
						o(modules).deepEquals(test.expected);
						done();
					})
					.catch(done);
			} else {
				modulesP
					.then((modules) => {
						// @ts-ignore
						o(modules).equals('should have cast an error');
					})
					.catch((err) => {
						if ('notFound' in test.error) {
							o(err instanceof NonExistentModuleError).equals(true);
							o((err as NonExistentModuleError).moduleName).equals(test.error.notFound);
						} else {
							o(err instanceof UnsafeModuleTokenError).equals(true);
							o((err as UnsafeModuleTokenError).moduleName).equals(test.error.invalid);
						}
					})
					.finally(done);
			}
		});
	});
});
