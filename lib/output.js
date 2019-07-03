/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
/* eslint no-param-reassign:off */
/* eslint no-console:off */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const time = require('./time.js');


function mkdirp(directory) {
  try {
    fs.mkdirSync(directory);
  }
  catch (e) {
    if (e.code === 'ENOENT') {
      mkdirp(path.dirname(directory));
      mkdirp(directory);
    }
    else {
      try {
        const stat = fs.statSync(directory);
        if (!stat.isDirectory()) {
          throw e;
        }
      }
      catch (e1) {
        throw e;
      }
    }
  }
}

module.exports = (files, { output } = {}) => {
  if (typeof output !== 'string') {
    output = './build';
  }

  Object.entries(files).forEach(([ filename, filePromise ]) => {
    if (!path.extname(filename)) {
      filename = path.join(filename, 'index.html');
    }

    filePromise.then((code) => {
      const filePath = path.join(output, filename);
      console.log(`  ${chalk.dim('<<<')}${time()} Writing ${chalk.green(filePath)}`);

      const directory = path.dirname(filePath);
      try {
        mkdirp(directory);
        fs.writeFileSync(filePath, code);
      }
      catch (e) {
        console.error(`  ${chalk.red('xxx')}${time()} ${e}`);
      }
    });
  });
};
