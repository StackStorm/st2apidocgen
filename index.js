/* eslint global-require:off */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

/* eslint no-param-reassign:off */

const preload = require('./lib/preload');
const process = require('./lib/process');
const render = require('./lib/render');
const serve = require('./lib/serve');

const files = {};

preload(files);
process(files);
render(files);
serve(files);
