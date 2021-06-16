const { parallel, series, src, dest } = require('gulp');
const rollupTaskFactory = require('@hugsmidjan/gulp-rollup');
const del = require('del');
const writeFile = require('fs').writeFileSync;

const distFolder = 'dist/';
const testsFolder = 'testing/__tests/';

// ===========================================================================

const baseOpts = {
	src: 'src/',
	format: 'cjs',
	minify: false,
	codeSplit: false,
	sourcemaps: false,
	NODE_ENV: undefined,
	inputOpts: {
		// Returns true for local module ids (treats node_modules/*  as external)
		external: (id) => /^(?:\0|\.|\/|tslib)/.test(id) === false,
	},
};

// ===========================================================================

const [scriptsBundle, scriptsWatch] = rollupTaskFactory({
	...baseOpts,
	name: 'build_server',
	glob: ['server.ts'],
	// glob: ['**/*.ts', '!**/*{tests,privates,WIP}.ts', '!__testing/**/*.ts'];,
	dist: distFolder,
});

const [testsBundle, testsWatch] = rollupTaskFactory({
	...baseOpts,
	name: 'build_tests',
	glob: ['**/*.tests.ts'],
	dist: testsFolder,
	// // TODO: Create a ospec gulp plugin
	// onWatchEvent: (e) => {
	// 	if (e.code === 'BUNDLE_END') {
	// 		console.info('ospec __tests/' + Object.keys(e.input)[0] + '.js');
	// 		require('child_process').execSync(
	// 			'ospec __tests/' + Object.keys(e.input)[0] + '.js'
	// 		);
	// 	}
	// },
});

// ===========================================================================

/*
const pkg = require('./package.json');
const cssDistFolder = 'public/';
const cssVersion = process.env.NODE_ENV === 'production' ? pkg.version : 'canary';
*/

// ===========================================================================

const cleanup = () => del([distFolder, testsFolder]);

const makePackageJson = (done) => {
	const pkg = require('./package.json');
	const { dist_package_json } = pkg;

	delete pkg.dist_package_json;
	delete pkg.scripts;
	delete pkg.engines;
	delete pkg.private;
	delete pkg.devDependencies;
	delete pkg.__devDependencies__;
	delete pkg.hxmstyle;

	Object.assign(pkg, dist_package_json);
	writeFile(distFolder + 'package.json', JSON.stringify(pkg, null, '\t'));
	done();
};

const copyDocs = () =>
	src(['README.md', 'CHANGELOG.md', 'default-keys/*'], { base: '.' }).pipe(
		dest(distFolder)
	);

// ===========================================================================

const bundle = series(cleanup, parallel(scriptsBundle, testsBundle));
const watch = parallel(scriptsWatch, testsWatch);
const publishPrep = parallel(makePackageJson, copyDocs);

exports.dev = series(bundle, watch);
exports.build = series(bundle, publishPrep);
exports.default = exports.build;
