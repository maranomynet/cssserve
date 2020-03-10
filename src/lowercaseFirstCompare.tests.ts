import o from 'ospec';
import lowercaseFirstCompare from './lowercaseFirstCompare';

// ---------------------------------------------------------------------------

o.spec('lowercaseFirstCompare', () => {
	o('sorts alphabetically first, then by case', () => {
		o(['C', 'A', '_B'].sort(lowercaseFirstCompare)).deepEquals(['_B', 'A', 'C']);
		o(['aa', 'ab', 'Ab'].sort(lowercaseFirstCompare)).deepEquals(['aa', 'Ab', 'ab']);
		o(['B', 'a', 'c', 'D'].sort(lowercaseFirstCompare)).deepEquals(['a', 'B', 'c', 'D']);
	});
});
