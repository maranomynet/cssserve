const parseDepsFromCSS = (cssSource: string): Array<string> => {
	// if (/\/\*!\s*@deps\s/.test(cssSource.slice(0, 1000))) {
	const match = cssSource.match(/\/\*!\s*@deps\s([^*]+)\*\//);
	if (match) {
		return match[1]
			.replace(/\n|,|;/g, ' ')
			.trim()
			.split(/\s+/);
	}
	// }
	return [];
};

export default parseDepsFromCSS;
