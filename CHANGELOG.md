# Change Log

## Upcoming...

- ... <!-- Add new lines here. Version number will be decided later -->
- feat: Allow `//` comments inside `@deps` blocks

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
