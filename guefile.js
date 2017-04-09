const gue = require('./index.js');

gue.task('default', ['lint','test','spell']);

gue.task('test', ['clean', 'spell'], () => {
  return gue.shell('nyc --reporter lcov --reporter text ' +
  'mocha test/unit/**/*.test.js');
});

gue.task('lint', () => {
  return gue.shell('jscs index.js bin/gue.js lib/Util.js');
});

gue.task('docs', () => {
  let command = '/bin/rm -f README.md';
  command += '&& jsdoc2md --example-lang js --template docs/readme.hbs ';
  command += '--partial docs/scope.hbs --separators --files index.js';
  command += '> README.md';

  return gue.shell(command)
    .then(() => {
      return gue.start('spell');
    });
});

gue.task('integration', () => {
  let command = 'mocha test/integration/**/*.test.js';
  return gue.shell(command);
});

gue.task('snapshot', () => {
  let command = 'export UPDATE=1 && mocha test/integration/**/*.test.js';
  return gue.shell(command);
});

gue.task('rebuild', ()=> {
  return gue.shell('rm -rf node_modules && yarn')
    .then(()=> {
      return gue.start(['test','docs', 'spell', 'integration']);
    });
});

gue.task('spell', () => {
  return gue.shell('mdspell docs/readme.hbs README.md -n -a --en-us -r');
});

gue.task('clean', () => {
  return gue.shell('rm -rf coverage .nyc_output');
});

gue.task('watch', () => {
  gue.watch(['lib/**/*.js', 'test/**/*.test.js', 'bin/gue.js',
    'index.js','guefile.js'], ['lint', 'test']);
});
