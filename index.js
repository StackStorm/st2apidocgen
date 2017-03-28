/* eslint global-require:off */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

/* eslint no-param-reassign:off */

const process = require('./lib/process');
const render = require('./lib/render');
const serve = require('./lib/serve');

const files = {};

process(files);
render(files);
serve(files);
