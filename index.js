/* eslint global-require:off */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
/* eslint import/newline-after-import:off */

/* eslint no-param-reassign:off */

const {
  render,
  serve,
  watch,
  output
} = require('minimist')(process.argv.slice(2));

const files = {};

require('./lib/preload')(files);
require('./lib/process')(files, { watch });
if (render) {
  require('./lib/render')(files);
}
if (serve) {
  require('./lib/serve')(files, { port: serve });
}
if (output) {
  require('./lib/output')(files, { output })
}
