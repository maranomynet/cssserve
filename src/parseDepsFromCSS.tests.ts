import o from 'ospec';
import parseDepsFromCSS from './parseDepsFromCSS';

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
