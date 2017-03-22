/* eslint global-require:off */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

/* eslint no-param-reassign:off */

const process = require('./lib/process');
const serve = require('./lib/serve');

const files = {};

process(files);
serve(files);
