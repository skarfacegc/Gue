const fs = require('fs');
const hbs = require('handlebars');
const argv = require('minimist')(process.argv.slice(2));

// Load assets from disk
const readme = fs.readFileSync(__dirname + '/readme.hbs', 'utf8');
let badges = '';
if (argv.badges) {
  badges = fs.readFileSync(__dirname + '/badges.hbs', 'utf8');
} else {
  badges = '';
}

// Setup helpers and partials
hbs.registerPartial('badges', badges);
hbs.registerHelper('raw-helper', (options) => {
  return options.fn();
});

console.log(hbs.compile(readme)());
