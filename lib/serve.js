/* eslint global-require:off */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

/* eslint no-param-reassign:off */

const path = require('path');

const Koa = require('koa');
const logger = require('@stackstorm/koa-logger');
const serve = require('koa-static');
const send = require('koa-send');
const mime = require('mime-types');

module.exports = (files) => {
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

  app.use(serve('./public'));

  app.use(async (ctx, next) => {
    if (!path.extname(ctx.path)) {
      await send(ctx, './public/index.html');
    }
    await next();
  });

  app.listen(3000);
};
