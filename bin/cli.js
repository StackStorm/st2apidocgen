#!/usr/bin/env node
const { name } = require('../package.json');

const {
  _: [ spec ],
  render,
  serve,
  watch,
  output,
  help,
} = require('minimist')(process.argv.slice(2));

if (help) {
  console.log(`Usage: ${name} [spec] [--watch] [--render [base_url]] [--serve [port]] [--output [directory]]`);
  return;
}

require('../index')(spec, render, serve, watch, output);
