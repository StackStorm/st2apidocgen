/* eslint global-require:off */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

/* eslint no-param-reassign:off */
/* eslint no-underscore-dangle:off */
/* eslint no-console:off */

const crypto = require('crypto');
const path = require('path');
const stream = require('stream');

const _ = require('lodash');
const browserify = require('browserify');
const chalk = require('chalk');
const watchify = require('watchify');
const postcss = require('postcss');
const sourceMap = require('source-map');

class ExternalSourceMapPromise {
  static from(cls) {
    return new this(cls._name, cls.buffer);
  }

  constructor(name, buffer = []) {
    this._name = name;

    console.log(`  ${chalk.dim('<<<')} Bundling ${chalk.green(name)}`);

    this._promise = new Promise((resolve, reject) => {
      this._next = resolve;
      this._die = reject;
    })
      .catch((err) => {
        console.error(`Error during bundling ${name}: ${err}`);
        throw err;
      })
      .then((res) => {
        const hash = crypto.createHash('sha256');
        hash.update(res.code);
        console.log(`  ${chalk.dim`>>>`} Done bundling ${chalk.green(name)} [${chalk.dim(hash.digest('hex'))}]`);
        return res;
      })
      ;

    this.buffer = buffer;
  }

  isTouched() {
    return !!this.buffer.length;
  }

  push(chunk, map, relPath) {
    if (relPath) {
      const existing = _.findIndex(this.buffer, { relPath });
      if (~existing) {
        this.buffer[existing] = { relPath, map, chunk };
      } else {
        this.buffer.push({ relPath, map, chunk });
      }
    } else {
      this.buffer.push({ relPath, map, chunk });
    }
  }

  resolve() {
    let _map = new sourceMap.SourceNode();

    _.forEach(this.buffer, ({ relPath, map, chunk: file }) => {
      const separator = '//# sourceMappingURL=data:application/json;charset=utf-8;base64,';
      const [chunk, match] = file.split(separator);

      if (match) {
        const embedMap = JSON.parse(new Buffer(match, 'base64').toString());

        _map = sourceMap.SourceNode.fromStringWithSourceMap(
          _map.toStringWithSourceMap().code,
          new sourceMap.SourceMapConsumer(embedMap),
          relPath
        );
      }

      if (map) {
        const node = sourceMap.SourceNode.fromStringWithSourceMap(
          chunk,
          new sourceMap.SourceMapConsumer(map.toJSON()),
          relPath
        );
        _map.add(node);
      } else {
        const node = new sourceMap.SourceNode(null, null, null, chunk);
        _map.add(node);
      }
    });

    const annotation = `# sourceMappingURL=${this._name}.map`;
    if (path.extname(this._name) === '.css') {
      _map.add(`/*${annotation}*/\n`);
    } else {
      _map.add(`//${annotation}\n`);
    }
    return this._next(_map.toStringWithSourceMap({ file: this._name }));
  }

  reject(...args) {
    return this._die(...args);
  }

  then(...args) {
    return this._promise.then(...args);
  }

  resolveWith(instance) {
    this.buffer = instance.buffer;
    return this.resolve();
  }
}

function postcssify(file, opts) {
  opts = opts || {};
  const extensions = ['.css', '.scss', '.sass'].concat(opts.extensions).filter(Boolean);
  if (extensions.indexOf(path.extname(file)) === -1) {
    return stream.PassThrough();
  }

  const output = new stream.Transform({
    transform(chunk, encoding, callback) {
      const processor = postcss([
        require('postcss-nesting')(),
        require('postcss-color-function')(),
        require('postcss-modules')({
          generateScopedName: '[local]___[hash:base64:5]',
          getJSON: (filename, styles) => {
            const result = {};

            Object.entries(styles).forEach(([name, value]) => {
              const [rest = '', modifier] = name.split('--');
              const [block, ...elements] = rest.split('__');

              const composite = [block];

              if (elements) {
                composite.push(...elements);
              }

              if (modifier) {
                composite.push(modifier);
              }

              _.setWith(result, composite, { toString: () => value }, (curr) => {
                if (curr.toString()) {
                  return curr;
                }

                return { toString: () => '' };
              });
            });

            const json = JSON.stringify(result, (name, value) => {
              if (name === 'toString' && _.isFunction(value)) {
                return value();
              }

              return value;
            });

            callback(null, `module.exports = JSON.parse('${json}', function (name, value) {
              return name !== 'toString' ? value : function () { return value };
            })`);
          }
        }),
      ]);

      const relPath = path.relative(path.join(__dirname, '..'), file);

      processor
        .process(chunk, {
          from: relPath,
          to: relPath,
          map: {
            inline: false,
            annotation: false,
          },
        })
        .then(opts.callback)
        ;
    }
  });

  return output;
}

module.exports = (files) => {
  const entrypoint = './src/index.js';

  const b = browserify({
    debug: true,
    entries: [entrypoint],
    cache: {},
    packageCache: {},
    plugin: [watchify]
  });

  b.transform('babelify', {
    presets: [
      'es2015',
      'react',
    ],
    plugins: [
      'transform-class-properties'
    ],
  });

  const opts = {};

  b.transform(postcssify, opts);

  let prevStylePromise;

  function bundle() {
    const scriptPromise = new ExternalSourceMapPromise('app.js');
    files['/app.js'] = scriptPromise.then(({ code }) => code);
    files['/app.js.map'] = scriptPromise.then(({ map }) => map.toString());

    const stylePromise = ExternalSourceMapPromise.from(prevStylePromise || { _name: 'style.css' });
    files['/style.css'] = stylePromise.then(({ code }) => code);
    files['/style.css.map'] = stylePromise.then(({ map }) => map.toString());

    prevStylePromise = stylePromise;

    opts.callback = (result) => {
      stylePromise.push(result.css, result.map, path.dirname(result.opts.from));
    };

    return b
      .bundle()
      .on('error', err => console.error(`  ${chalk.red('xxx')} ${err}`))
      .on('data', (data) => {
        scriptPromise.push(data.toString());
      })
      .on('end', async () => {
        scriptPromise.resolve();
        stylePromise.resolve();
      });
  }

  b.on('update', bundle);

  bundle();
};
