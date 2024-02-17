import {
  buildNpmLib,
  distFolder,
  errorCheckSources,
  shell$,
} from '@maranomynet/libtools';

await shell$(`TEST=true  bun test`);
await errorCheckSources();
await buildNpmLib({ type: 'commonjs' });
await shell$(`cp -R default-keys ${distFolder}/`);
