import { shell$, typeCheckSources } from '@maranomynet/libtools';

await shell$(`bun install`);
shell$(`TEST=true  bun test --watch`);
typeCheckSources({ watch: true });
