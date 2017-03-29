/* eslint global-require:off */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
/* eslint import/newline-after-import:off */

/* eslint no-param-reassign:off */

const files = {};

module.exports = async (spec, render, serve, watch, output) => {
  require('./lib/preload')(files, { spec });
  require('./lib/process')(files, { watch });
  if (render) {
    const locations = await require('./lib/survey')(files);
    require('./lib/render')(files, { render, locations });
  }
  if (serve) {
    require('./lib/serve')(files, { port: serve });
  }
  if (output) {
    require('./lib/output')(files, { output });
  }
};
