/* global process */
const { parallel, series } = require('gulp');
const rollupTaskFactory = require('@hugsmidjan/gulp-rollup');
const del = require('del');

// ===========================================================================

const baseOpts = {
	src: 'src/',
	format: 'cjs',
	minify: false,
	codeSplit: false,
	sourcemaps: false,
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
	dist: 'dist/',
});

const [testsBundle, testsWatch] = rollupTaskFactory({
	...baseOpts,
	name: 'build_tests',
	glob: ['**/*.tests.ts'],
	dist: '__tests/',
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

const cleanup = () => del(['dist/', '__tests/']);

// ===========================================================================

const buildServer = series(cleanup, parallel(scriptsBundle, testsBundle));
const watchAll = parallel(/* cssDevWatch,  */ scriptsWatch, testsWatch);

exports.publish = parallel(buildServer /* , cssPublishBuild */);
exports.dev = series(parallel(buildServer /* , cssDevBuild */), watchAll);

// exports.default = exports.dev;
