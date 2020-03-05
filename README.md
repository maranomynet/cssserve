# CSS Server

`cssserver` is a small dedicated HTTP/2 server that serves lots of small CSS
files.

The server's only purpose is to accept a list of CSS module names build a
correctly ordered, deduplicated list of the corresponding CSS files and their
dependencies recursively.

Example request:

```html
<link
	rel="stylesheet"
	href="https://css.server/bundle/v1?_base,Module-B,Module-A"
/>
```

Example response (with comments):

```css
/* "_base" from query-string */
@import '/css/1.7/_base.css';
/* Dependencies of Module-A.css and Module-B.css */
@import '/css/1.7/Button.css';
@import '/css/1.7/Carousel.css';
@import '/css/1.7/Herobanner.css';
@import '/css/1.7/Tabs.css';
/* "Module-A" from query-string */
@import '/css/1.7/Module-A.css';
/* Unique dependencies of Module-B.css */
@import '/css/1.7/FormInput.css';
@import '/css/1.7/Selectbox.css';
@import '/css/1.7/BasicTable.css';
/* "Module-B" from query-string */
@import '/css/1.7/Module-B.css';
```

Example of how `Module-A.css` might declare its dependencies:

```css
/*!@deps Button Carousel Herobanner Tabs */
@media screen {
	.Module-A {
		/* ...styles for Module-A */
	}
}
```

The `@deps` declaration is split on spaces and/or newlines:

```css
/*!@deps
	Button
	Carousel
	Herobanner 
	Tabs
*/
@media screen {
	.Module-A {
		/* ...styles for Module-A */
	}
}
```
