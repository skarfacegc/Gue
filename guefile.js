const gue = require('./index.js');
const fileSet = gue.fileSet;

fileSet.add('allSrc', ['**/*.js'], 'lint');
fileSet.add('src', ['*.js', 'lib/*.js', 'bin/*.js'], 'test');
fileSet.add('spellCheck', ['docs/*', 'index.js', 'lib/*.js', '.spelling'],
  'spell');
fileSet.add('unitTests', ['test/unit/**/*.js'], 'test');
fileSet.add('integrationTests', ['test/integration/**/*.js'], 'integration');
fileSet.add('integrationRun', ['test/integration/**/*.test.js'], 'integration');
fileSet.add('packageJson', 'package.json', 'rebuild');
fileSet.add('clean', ['coverage', '.nyc_output']);
fileSet.add('distclean', ['node_modules']);
fileSet.add('spellCheck', ['index.js', 'lib/**/*.js', "bin/gue.js",
  "test/**/*.js", "docSrc/readme.hbs"]);

gue.debug = true;

gue.task('watch', () => {
  return gue.smartWatch(fileSet);
});

//
// Tests
//

gue.task('lint', () => {
  return gue.shell('eslint {{globs "allSrc"}}');
});

gue.task('test', ['clean'], () => {
  return gue.shell('nyc --reporter lcov --reporter text ' +
  'mocha {{files "unitTests"}}');
});

gue.task('integration', () => {
  let command = 'mocha {{globs "integrationRun"}}';
  return gue.shell(command);
});

//
// Cleaners
//

gue.task('clean', () => {
  return gue.shell('rm -rf {{globs "clean"}}');
});

gue.task('distclean', ['clean'], () => {
  return gue.shell('rm -rf {{globs "distclean"}}');
});

//
// Build
//
gue.task('rebuild', ['distclean', 'yarn', 'lint', 'test', 'integration',
  'spell']);

gue.task('yarn', () => {
  return gue.shell('yarn');
});

//
// Docs
//

gue.task('spell', () => {
  return gue.shell('cspell -c cspell.json {{globs "spellCheck"}}');
});

gue.task('buildDocs', () => {
  let command = '/bin/rm -f README.md';
  command += '&& jsdoc2md --example-lang js --template docSrc/readme.hbs ';
  command += '--partial docSrc/scope.hbs --separators ';
  command += '--files index.js lib/fileSet.js lib/GueTasks.js lib/GueTask.js';
  command += '> README.md';

  return gue.shell(command);
});

//
// Utility tasks
//

// Update the snapshots for the snapshot tests
gue.task('snapshot', () => {
  let command = 'export UPDATE=1 && mocha {{files "integrationRun"}}';
  return gue.shell(command);
});

// run estlint with --fix
gue.task('lintFix', () => {
  return gue.shell('eslint --fix {{files "allSrc"}}');
});
