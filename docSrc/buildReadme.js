const fs = require('fs');
const hbs = require('handlebars');
const argv = require('minimist')(process.argv.slice(2));
const packageJson = require('../package.json');

// Load assets from disk
const readme = fs.readFileSync(__dirname + '/readme.hbs', 'utf8');
let badges = fs.readFileSync(__dirname + '/badges.hbs', 'utf8');
hbs.registerPartial('badges', badges);

// define the github link
let githubLink = '[Source](https://github.com/skarfacegc/Gue/)';
hbs.registerPartial('githubLink', githubLink);

// define the docs link
let docLink = '[API Documentation for ' + packageJson.version + ']'+
  '(https://skarfacegc.github.io/Gue/' + packageJson.version + ')';
hbs.registerPartial('docLink', docLink);

const docsContext = argv.docsContext;

hbs.registerHelper('raw-helper', (options) => {
  return options.fn();
});

console.log(hbs.compile(readme)({'docsContext': docsContext}));
