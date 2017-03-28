/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
/* eslint no-param-reassign:off */
/* eslint no-console:off */

const fs = require('fs');
const vm = require('vm');

const chalk = require('chalk');
const jsdom = require('jsdom');
const ReactDOMServer = require('react-dom/server');

const time = require('./time.js');

const GUARDHOST = 'some-long-hostname-that-should-never-appear-in-code';

const LOCATIONS = [
  '/',
  '/api/v1/actions/',
];

const markup = fs.readFileSync('./src/index.html');
const spec = fs.readFileSync('./public/openapi.yaml');

function fetch(input) {
  return new Promise((resolve, reject) => {
    if (input === '/openapi.yaml') {
      const text = () => new Promise(res => res(spec.toString()));
      resolve({ text });
    } else {
      reject(`File ${input} haven't been mocked`);
    }
  });
}


module.exports = async function render(files) {
  LOCATIONS.forEach((location) => {
    console.log(`     ${time()} Initializing ${chalk.green(location)}`);

    const doc = jsdom.jsdom(markup.toString(), {
      url: `https://${GUARDHOST}${location}`,
      virtualConsole: jsdom.createVirtualConsole().sendTo(console),
      features: {
        FetchExternalResources: false,
        ProcessExternalResources: false,
      },
    });

    // The method haven't been implemented in the current version of the jsdom. It doesn't make
    // sense in virtual environment.
    doc.defaultView.HTMLElement.prototype.scrollIntoView = () => {};

    const sandbox = {};
    Object.keys(doc.defaultView).forEach((key) => {
      sandbox[key] = doc.defaultView[key];
    });
    sandbox.window = sandbox;
    sandbox.global = sandbox;
    sandbox.self = sandbox;
    sandbox.fetch = fetch;

    console.log(`     ${time()} Done initializing ${chalk.green(location)}`);

    files[location] = files['/app.js'].then((code) => {
      console.log(`  ${chalk.dim('<<<')}${time()} Rendering ${chalk.green(location)}`);

      const script = new vm.Script(code, {
        filename: 'app.js'
      });

      const context = vm.createContext(sandbox);
      const promise = new Promise((resolve) => {
        context.serverRender = (component, element) => {
          element.innerHTML = ReactDOMServer.renderToString(component);
          resolve(context);
        };
      });
      script.runInContext(context);

      return promise;
    }).then((context) => {
      console.log(`  ${chalk.dim('>>>')}${time()} Done rendering ${chalk.green(location)}`);

      return context.document.documentElement.outerHTML;
    }).catch((err) => {
      console.error(err);
    });
  });
};
