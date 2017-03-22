const fs = require('fs');
const path = require('path');

const axios = require('axios');
const validator = require('sourcemap-validator');

(async () => {
  const { data: min } = await axios.get('http://localhost:3000/app.js');
  const { data: map } = await axios.get('http://localhost:3000/app.js.map');

  const srcs = {};

  map.sources.forEach((filename, index) => {
    const file = fs.readFileSync(path.join(__dirname, '..', filename)).toString();
    const source = map.sourcesContent[index].split('\\n').join('\n')

    if (source === file) {
      console.log(`ok ${filename}`);
    } else {
      console.log(`not ok ${filename}`);
      console.log(file);
      console.log(source);
      throw 'some';
    }
  })
})().catch(err => {
  console.error(err);
});
