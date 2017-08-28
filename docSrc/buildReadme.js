const fs = require('fs');
const hbs = require('handlebars');
const argv = require('minimist')(process.argv.slice(2));
const packageJson = require('../package.json');

// Load assets from disk
const readme = fs.readFileSync(__dirname + '/readme.hbs', 'utf8');
let badges = '';
if (argv.badges) {
  badges = fs.readFileSync(__dirname + '/badges.hbs', 'utf8');
} else {
  badges = '';
}

// Add the github link if requested
let githubLink = '';
if (argv.githubLink) {
  githubLink = '[Source](https://github.com/skarfacegc/Gue/)';
} else {
  githubLink = '';
}

// Setup helpers and partials
hbs.registerPartial('badges', badges);
hbs.registerPartial('githubLink', githubLink);
hbs.registerHelper('raw-helper', (options) => {
  return options.fn();
});

console.log(hbs.compile(readme)({'version': packageJson.version}));
