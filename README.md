# cssserve – CSS Server

`cssserve` is a small dedicated HTTP/2 server that serves lots of small CSS
files.

---

**Chapters:**

- [How to run it](#how-to-run-it)
- [Configuration](#configuration)
- [Log-levels](#log-levels)
- [What it serves](#what-it-serves)
	- [Example request:](#example-request)
  [Example request:](#example-request)

---

## How to run it

```sh
npm install --save cssserve
cssserve
```

## Configuration

`cssserve` is highly opinionated but accepts
[configuration options](src/AppConfig.ts), using the
[`rc`](https://www.npmjs.com/package/rc) package.

See the TypeScript [type definition for AppConfig](src/AppConfig.ts) for the
available config values and defaults.

The server looks for `.cssservec` in your package root (or its containing
folders) and also accepts `CSSSERVE_*`-prefixed environment variables, direct
CLI arguments and a `--config file` option as well.
([See more details](https://www.npmjs.com/package/rc#standards))

Additionally the `port` option can be overridden via the environment variables
`NODE_PORT` and/or `PORT`.

## Log-levels

Logging is controlled by the `NODE_ENV` variable.

- `NODE_ENV=production` logs nothing much
- `NODE_ENV=development` logs server `500` errors and info about _all invalid
  token names_ found while parsing CSS files.
- `NODE_ENV=debug` same as `development`, but adds detailed stacktrace for all
  thrown errors

## What it serves

The server's only purpose is to accept a list of CSS module names build a
correctly ordered, deduplicated list of `@include` links to the corresponding
CSS files and their dependencies recursively.

For this, it exposes the endpoint `/bundle/:version?m={module1,module2,...}`

The `:version` path token can be any value ascii alpha-numerical value with
(single) periods, slashes and underscores. (`/^[a-z0-9._-]+$/i`). Note,
however, that multiple adjacent `.` characters are forbidden. (See
[iSafeToken.tests](src/iSafeToken.tests.ts).)

The `:version` token is matched against direct subfolders of
`options.staticFolder + 'css/'` and supports simple semantic versioning - so
that if your folder tree looks like this:

```
public/
	css/
		v1.1/
		v1.2/
		v1.10/
```

...then the `:version` token `v1` will match the folder `css/v1.10/`. (See
[getAllValidCssVersions.tests](src/getAllValidCssVersions.tests.ts) and
[resolveCssVersionFolder.tests](src/resolveCssVersionFolder.tests.ts) for more
details.)

### Example request:

```html
<link
	rel="stylesheet"
	href="https://css.server/bundle/v1?m=_base,ModuleB,ModuleA"
/>
```

Example response (with comments):

```css
/* "_base" from query-string */
@import '/css/v1.10/_base.css';
/* Dependencies of ModuleA.css */
@import '/css/v1.10/Button.css';
@import '/css/v1.10/Carousel.css';
@import '/css/v1.10/Herobanner.css';
@import '/css/v1.10/Tabs.css';
/* "ModuleA" from query-string */
@import '/css/v1.10/ModuleA.css';
/* Unique dependencies of ModuleB.css */
@import '/css/v1.10/FormInput.css';
@import '/css/v1.10/Selectbox.css';
@import '/css/v1.10/BasicTable.css';
/* "ModuleB" from query-string */
@import '/css/v1.10/ModuleB.css';
```

Example of how `ModuleA.css` declares its dependencies:

```css
/*!@deps
	Button
	Carousel  // NOTE: comments are allowed
	Herobanner 
	Tabs
*/
@media screen {
	.ModuleA {
		/* ...styles for ModuleA */
	}
}
```

(See [parseDepsFromCSS.tests](src/parseDepsFromCSS.tests.ts) and
[parseModules.tests](src/parseModules.tests.ts) for details.)
