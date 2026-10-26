import {
  args,
  errorCheckSources,
  formatSources,
  lintSources,
  logError,
  typeCheckSources,
} from '@maranomynet/libtools';

if (args.format) {
  await formatSources();
} else if (args.lint) {
  await typeCheckSources({ continueOnError: true }).catch(logError);
  await lintSources();
} else if (args.errors) {
  await errorCheckSources();
} else {
  console.info('No action specified. Use one of: --format, --lint, --errors');
  process.exit(0);
}
