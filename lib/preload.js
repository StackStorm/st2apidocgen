/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
/* eslint no-param-reassign:off */
const fs = require('fs');
const path = require('path');

const glob = require('glob');

module.exports = (files, { spec = 'openapi.yaml' } = {}) => {
  glob.sync('./public/**/*').forEach((filepath) => {
    const relPath = path.relative('./public', filepath);
    const file = fs.readFileSync(filepath);
    files[`/${relPath}`] = new Promise(res => res(file));
  });

  if (spec) {
    const file = fs.readFileSync(spec);
    files['/openapi.yaml'] = new Promise(res => res(file));
  }
};
