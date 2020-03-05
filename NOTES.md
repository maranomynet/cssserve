# Notes

## Git Repo:

### `rvk-components` – React componets

- Inniheldur StoryBook server og þannig skjölun
- Publish scriptur fyrir **npm pakka** með react components (npm:
  `@reykjavik/react`)

### `rvk-cssserver` – HTTP2 CSS server með `Link: rel=preload` og látum.

- SASS drifin templating
- Building a complete archive of static CSS files
  - Push all tags: `git push origin --tags`
  - List of CSS version tags `git tag --list css*`
  - Export dist files from tag
    `git archive --format=tar --prefix=$TAG/ --remote=<repo-if-not-local> $TAG dist | tar -xf - -C css/ && mv $TAG/dist/* $TAG/ && rmdir $TAG/dist`

---

This import URL

```css
@import 'https://css.reykjavik.is/bundle/v1?base;A;B;C';
```

should return

```css
@import '/css/1.16/base.css'; /* bundle-entry */
@import '/css/1.16/V.css';
@import '/css/1.16/M.css';
@import '/css/1.16/W.css';
@import '/css/1.16/A.css'; /* bundle-entry */
@import '/css/1.16/N.css';
@import '/css/1.16/X.css';
@import '/css/1.16/O.css';
@import '/css/1.16/Y.css';
@import '/css/1.16/B.css'; /* bundle-entry */
@import '/css/1.16/Z.css';
@import '/css/1.16/C.css'; /* bundle-entry */
```

---

Öll CSS sem eru included á síðu þurfa að vera í sömu major útgáfu. Ef vefur í
`v1` vill inclúda react widget í `v2` þarf vefurinn annað hvort að uppfæra sig
í `v2` eða nota `<iframe/>`
