const yaml = require('js-yaml');
const $RefParser = require('json-schema-ref-parser');

module.exports = async (files, { filename = 'openapi.yaml' } = {}) => {
  const yamlString = await files[`/${filename}`];
  const spec = yaml.safeLoad(yamlString);
  const fullSpec = await $RefParser.dereference(spec);

  const locations = Object.keys(fullSpec.paths).map((url) => {
    const [, service, version, entity] = url.split('/');
    return ['', service, version, entity].join('/');
  });

  return ['/', ...new Set(locations)];
};
