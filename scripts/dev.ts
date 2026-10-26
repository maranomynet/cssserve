import { shell$, typeCheckSources } from '@maranomynet/libtools';

await shell$(`bun install`);
shell$(`TEST=true  bun test --dots --watch`);
typeCheckSources({ watch: true });
