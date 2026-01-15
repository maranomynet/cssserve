# Change Log for `cssserve`

## Upcoming...

- ... <!-- Add new lines here. -->

## 2.5.0

_2026-01-15_

- feat: Support parsing multiple `@deps` blocks in one file
- fix: Avoid setting `max-age=undefined` on redirects without `ttl` value

## 2.4.0

_2023-05-04_

- feat: Treat trailing slashes on redirect paths as optional

## 2.3.0

_2023-04-14_

- feat: Accept `config.redirectsFile` paths as array

## 2.2.2

_2023-02-16_

- fix: Tweak wording of bundler messages for "empty" and "invalid" tokens

## 2.2.1

_2022-09-22_

- fix: Setting `config.cache` to `false` throwing errors on startup

## 2.2.0

_2022-09-21_

- feat: Support `allowBadTokens` query parameter on bundle urls

## 2.1.0

_2022-09-20_

- feat: Add `config.host` (default: `"localhost"`)
- fix: Re-introduce support for address/host `0.0.0.0`

## 2.0.0

_2022-09-19_

- **BREAKING** chore: Update min node version to 16
- **BREAKING** chore: Update fastify and other deps to most recent versions
- feat: Make "empty"/meta tokens visible in bundle output
- feat: Report invalid tokens as "invalid", instead of "ignored" (in prod)

## 1.5.0

_2022-06-15_

- feat: Add static redirects via `config.redirects` and `config.redirectsFile`

## 1.4.0 — 1.4.1

_2022-02-05_

- feat: Add `config.preload` (default: `true`)

## 1.3.1

_2021-06-16_

- fix: `NODE_ENV` was wiped/ingored by a bad build configuration

## 1.3.0

_2021-06-15_

- feat: Add `config.loudBadTokenErrors` (default: `false` in "production")

## 1.2.0 – 1.2.1

_2021-05-05_

- feat: Allow `//` comments inside `@deps` blocks
- docs: Improved README and AppConfig docs

## 1.1.3 – 1.1.4

_2020-09-16_

- fix: Prevent linking to CSS files containing only CSS comments

## 1.1.2

_2020-05-08_

- fix: Return 404/403 for "not found" and "forbidden" bundling tokens

## 1.1.1

_2020-04-27_

- fix: Skip internal caches when `config.cache === false`
- fix: Set `max-age=0` for non-cached bundles

## 1.1.0

_2020-03-18_

- feat: Bundler suppresses empty/meta module file tokens

## 1.0.1

_2020-03-18_

- fix: Allow cross origin requests for fonts

## 1.0.0

_2020-03-14_

- **BREAKING** Rename + un-scope package as `cssserve`, prep for open
  publication
- **BREAKING** feat: Change the `index.html` and `_NotFound_.html` server
  settings

## 0.1.6 – 0.1.8

_2020-03-12_

- fix: Listen on all available interfaces
- fix: Allow HTTP/1.1 in proxied mode

## 0.1.0 – 0.1.5

_2020-03-10_

- docs: Document the CLI interface and bundling behaviour
- feat: Bundle CSS correctly and efficiently
- feat: Serve static CSS efficiently
- chore: Initial scaffolding
