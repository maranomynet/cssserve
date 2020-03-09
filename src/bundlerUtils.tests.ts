import o from 'ospec';
import {
	lowercaseFirstCompare,
	isSafeToken,
	resolveCssVersionFolder,
	getModuleListFromQuery,
	parseDepsFromCSS,
	parseModules,
	makeCssFromModuleNames,
	ParsedModules,
	NonExistentModuleError,
	UsafeModuleTokenError,
} from './bundlerUtils';

const staticFolder = 'testing/public/';

// ---------------------------------------------------------------------------

o.spec('lowercaseFirstCompare', () => {
	o('sorts alphabetically first, then by case', () => {
		o(['C', 'A', '_B'].sort(lowercaseFirstCompare)).deepEquals(['_B', 'A', 'C']);
		o(['aa', 'ab', 'Ab'].sort(lowercaseFirstCompare)).deepEquals(['aa', 'Ab', 'ab']);
		o(['B', 'a', 'c', 'D'].sort(lowercaseFirstCompare)).deepEquals(['a', 'B', 'c', 'D']);
	});
});

// ---------------------------------------------------------------------------

o.spec('iSafeToken', () => {
	o('Accepts simple tokens', () => {
		o(isSafeToken('hello')).equals(true);
		o(isSafeToken('1.1')).equals(true);
		o(isSafeToken('foo-bar')).equals(true);
		o(isSafeToken('foo_bar')).equals(true);
	});
	o('rejects evil tokens', () => {
		o(isSafeToken('foo/bar')).equals(false);
		o(isSafeToken('foo/../bar')).equals(false);
		o(isSafeToken('..')).equals(false);
	});
	o('accepts undefined/empty tokens', () => {
		o(isSafeToken('')).equals(true);
		o(isSafeToken(undefined)).equals(true);
	});
});

// ---------------------------------------------------------------------------

o.spec('resolveCssVersionFolder', () => {
	o('finds exact folderNames', () => {
		o(resolveCssVersionFolder(staticFolder, 'dev')).equals('css/dev/');
		o(resolveCssVersionFolder(staticFolder, 'v1.1')).equals('css/v1.1/');
	});
	o('finds highest point-version folder', () => {
		o(resolveCssVersionFolder(staticFolder, 'v1')).equals('css/v1.10.10/');
		o(resolveCssVersionFolder(staticFolder, 'v15')).equals('css/v15.1/');
	});
	o('returns `null` for undefined version', () => {
		o(resolveCssVersionFolder(staticFolder, undefined)).equals(null);
	});
	o('returns `null` for bonkers versions', () => {
		o(resolveCssVersionFolder(staticFolder, 'bonkers')).equals(null);
	});
	o('returns `null` for evil versions', () => {
		o(resolveCssVersionFolder(staticFolder, '../css/dev')).equals(null);
	});
});

// ---------------------------------------------------------------------------

o.spec('getModuleListFromQuery', () => {
	const empty: Array<string> = [];
	o('finds the m param and splits it on commas, and sorts the list', () => {
		o(getModuleListFromQuery({ m: 'Module' })).deepEquals(['Module']);
		o(getModuleListFromQuery({ m: 'A,B,C' })).deepEquals(['A', 'B', 'C']);
		o(getModuleListFromQuery({ m: 'C,_B,A' })).deepEquals(['_B', 'A', 'C']);
	});
	o('Rejects m params with spaces or invalid tokens', () => {
		o(getModuleListFromQuery({ m: '../A' })).deepEquals(empty);
		o(getModuleListFromQuery({ m: 'A ,B, C' })).deepEquals(empty);
		o(getModuleListFromQuery({ m: 'Halló,Jón' })).deepEquals(empty);
	});
	o('Ignores missing, or empty m param(s)', () => {
		o(getModuleListFromQuery({})).deepEquals(empty);
		o(getModuleListFromQuery({ m: '' })).deepEquals(empty);
		o(getModuleListFromQuery({ m: ['', ''] })).deepEquals(empty);
	});
});

// ---------------------------------------------------------------------------

o.spec('parseDepsFromCSS', () => {
	const tests: Record<string, { css: string; expects: Array<string> }> = {
		'Declaration with each module on its own line': {
			css: '/*!@deps\n\tFoo\tBar\n*/body{color:red}',
			expects: ['Foo', 'Bar'],
		},
		'Declaration w. mixture of spaces, commas, semi-commas and newlines': {
			css: '/*!@deps Foo\nBar,\n \tBaz Smu;Ble \n */body{color:red}',
			expects: ['Foo', 'Bar', 'Baz', 'Smu', 'Ble'],
		},
		'Allows space before "@deps"': {
			css: '/*! @deps \n\n\tFoo\tBar\n*/body{color:red}',
			expects: ['Foo', 'Bar'],
		},
		'Is OK with there not being any actual CSS': {
			css: '\n\n/*!@deps\n\tFoo\tBar\n*/\n\n',
			expects: ['Foo', 'Bar'],
		},
		'Duplicate module names are purposefully allowed': {
			css: '/*!@deps Foo,Bar,Foo,Foo,Bar*/',
			expects: ['Foo', 'Bar', 'Foo', 'Foo', 'Bar'],
		},
		// NOTE: The parser views CSS files as a trusted source.
		'Is purposefully agnostic about evil module names': {
			css: '/*!@deps Fo/../o, ../Bar ${EVIL} */',
			expects: ['Fo/../o', '../Bar', '${EVIL}'],
		},
		// ------------------------
		'Other /*! comments may precede declaration': {
			css: '/*! @licence Whatever */\n/*!@deps\n\tFoo\tBar\n*/body{color:red}',
			expects: ['Foo', 'Bar'],
		},
		'CSS rules may precede the declaration': {
			css: 'body{color:red}/*! @licence Whatever */\n/*!@deps\n\tFoo\tBar\n*/',
			expects: ['Foo', 'Bar'],
		},
		'Only a single @deps declaration is parsed': {
			css: '/*!@deps\n\tFoo\tBar\n*//*! @deps\n\tBaz\tSmu\n*/body{color:red}',
			expects: ['Foo', 'Bar'],
		},
		// ------------------------
		'Invalid @deps markers are ignored': {
			css: '/*!@ deps\n\tFoo\tBar\n*/body{color:red}',
			expects: [],
		},
		'Invalid @deps markers are ignored 2': {
			css: '/*!@Deps\n\tFoo\tBar\n*/body{color:red}',
			expects: [],
		},
	};
	Object.entries(tests).forEach(([name, test]) => {
		o(name, () => {
			o(parseDepsFromCSS(test.css)).deepEquals(test.expects);
		});
	});
});

// ---------------------------------------------------------------------------

o.spec('parseModules', () => {
	const sourceFolder = staticFolder + 'css/dev/';
	type TestDescr =
		| { input: Array<string>; expected: ParsedModules }
		| { input: Array<string>; error: { notFound: string } | { invalid: string } };
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
		'Throws for broken top-level module tokens that match no CSS file': {
			input: ['Prompt', 'Button', 'Search', 'Http404'],
			error: { notFound: 'Http404' },
		},
		// NOTE: Belt + Suspenders! - just in case.
		'Throws for unsafe top-level module tokens': {
			input: ['Prompt', 'Button', 'Search', '/etc/evil/token'],
			error: { invalid: '/etc/evil/token' },
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

	Object.entries(tests).forEach(([name, test], i) => {
		o(name, (done) => {
			const modulesP = parseModules(sourceFolder, test.input);
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
							o((err as UsafeModuleTokenError).moduleName).equals(test.error.invalid);
						}
					})
					.finally(done);
			}
		});
	});
});

// ---------------------------------------------------------------------------

o.spec('makeCssFromModuleNames', () => {
	const cssFolderName = 'css/v1/';
	o('Makes a simple CSS file with @imports. (No sorting!)', () => {
		const modules = ['C', 'A', 'B'];
		o(makeCssFromModuleNames(cssFolderName, modules)).equals(
			`
@import "/css/v1/C.css";
@import "/css/v1/A.css";
@import "/css/v1/B.css";
`.trimStart()
		);
	});
	o('Inserts comment-markers about ignored/invalid module tokens', () => {
		const modules: ParsedModules = [
			{ ignored: 'Http404' },
			'C',
			{ ignored: '../EVIL' },
			'B',
		];
		o(makeCssFromModuleNames(cssFolderName, modules)).equals(
			`
/* token "Http404" ignored */
@import "/css/v1/C.css";
/* token "../EVIL" ignored */
@import "/css/v1/B.css";
`.trimStart()
		);
	});
});
