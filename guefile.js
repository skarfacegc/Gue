const gue = require('./index.js');
const fileSet = gue.fileSet;

fileSet.add('allSrc', ['**/*.js'], 'lint');
fileSet.add('src', ['*.js', 'lib/*.js', 'bin/*.js'], 'test');
fileSet.add('spellCheck', ['docs/*', 'index.js', 'lib/*.js', '.spelling'],
  'spell');
fileSet.add('unitTests', ['test/unit/**/*.js'], 'test');
fileSet.add('integrationTests', ['test/integration/**/*.js'], 'integration');
fileSet.add('packageJson', 'package.json', 'rebuild');
fileSet.add('clean', ['coverage', '.nyc_output']);
fileSet.add('distclean', ['node_modules']);

// gue.debug = true;

gue.task('rebuild', ['distclean', 'yarn', 'lint', 'test', 'integration']);

gue.task('watch', () => {
  return gue.autoWatch(fileSet);
});

gue.task('test', ['clean'], () => {
  return gue.shell('nyc --reporter lcov --reporter text ' +
  'mocha {{files "unitTests"}}');
});

gue.task('lint', () => {
  return gue.shell('eslint {{files "allSrc"}}');
});

gue.task('lintFix', () => {
  return gue.shell('eslint --fix {{files "allSrc"}}');
});

gue.task('yarn', () => {
  return gue.shell('yarn');
});

gue.task('clean', () => {
  return gue.shell('rm -rf ' + fileSet.getGlob('clean'));
});

gue.task('distclean', ['clean'], () => {
  return gue.shell('rm -rf ' + fileSet.getGlob('distclean'));
});

gue.task('buildDocs', () => {
  let command = '/bin/rm -f README.md';
  command += '&& jsdoc2md --example-lang js --template docs/readme.hbs ';
  command += '--partial docs/scope.hbs --separators ';
  command += '--files index.js lib/fileSet.js lib/GueTasks.js lib/GueTask.js';
  command += '> README.md';

  return gue.shell(command);
});

gue.task('spell', ['buildDocs'], () => {
  return gue.shell('mdspell README.md -n -a --en-us -r');
});

gue.task('integration', () => {
  let command = 'mocha ' + fileSet.getGlob('integrationTests');
  return gue.shell(command);
});

gue.task('snapshot', () => {
  let command = 'export UPDATE=1 && mocha ' +
    fileSet.getGlob('integrationTests');
  return gue.shell(command);
});
