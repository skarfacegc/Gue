const gue = require('./index.js');

gue.task('default', ['lint','test']);

gue.task('test', () => {
  return gue.shell('nyc mocha test/**/*.test.js');
});

gue.task('lint', () => {
  return gue.shell('jscs index.js bin/gue.js lib/Util.js');
});

gue.task('docs', () => {
  var command = '/bin/rm -f README.md';
  command += '&& jsdoc2md --example-lang js --template docs/readme.hbs ';
  command += '--partial docs/scope.hbs --separators --files index.js';
  command += '> README.md';

  return gue.shell(command);
});

gue.task('clean', () => {
  return gue.shell('rm -rf node_modules');
});
