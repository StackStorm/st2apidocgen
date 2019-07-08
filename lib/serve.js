/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
/* eslint no-param-reassign:off */
/* eslint no-console:off */
/* eslint require-atomic-updates:off */

const path = require('path');

const chalk = require('chalk');
const Koa = require('koa');
const logger = require('@stackstorm/koa-logger');
const send = require('koa-send');
const mime = require('mime-types');

const time = require('./time.js');

module.exports = (files, { port } = {}) => {
  if (!Number.isInteger(port)) {
    port = 3000;
  }

  const app = new Koa();

  app.use(logger());

  // Dynamic files
  app.use(async (ctx, next) => {
    const match = files[ctx.path];
    if (match) {
      ctx.type = mime.contentType(path.extname(ctx.path));
      ctx.body = await match;

      return;
    }

    await next();
  });

  app.use(async (ctx, next) => {
    if (!path.extname(ctx.path)) {
      await send(ctx, './src/index.html');
    }
    await next();
  });

  console.log(`     ${time()} Serving files on port ${chalk.green(port)}`);
  app.listen(port);
};
