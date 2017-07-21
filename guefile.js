const gue = require('./index.js');
const fileSet = gue.fileSet;

fileSet.add('allSrc', ['**/*.js'], 'lint');
fileSet.add('src', ['*.js','lib/*.js','bin/*.js'], 'test');
fileSet.add('spellCheck', ['docs/*', 'index.js','lib/*.js','.spelling'],
  'spell');
fileSet.add('unitTests', ['test/unit/**/*.js'], 'test');
fileSet.add('integrationTests', ['test/integration/**/*.js'], 'integration');
fileSet.add('packageJson', 'package.json', 'rebuild');
fileSet.add('clean', ['coverage','.nyc_output']);
fileSet.add('distclean', ['node_modules']);

gue.debug = true;

gue.task('watch', () => {
  gue.autoWatch(fileSet);
});

gue.task('test', ['clean'], () => {
  return gue.shell('nyc --reporter lcov --reporter text ' +
  'mocha ' + fileSet.getFiles('unitTests'));
});

gue.task('lint', () => {
  return gue.shell('jscs {{files "allSrc"}}');
});

gue.task('rebuild', ['distclean'], () => {
  return gue.shell('yarn')
    .then(() => {
      return gue.start(['test','lint', 'integration']);
    });
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
  command += '--files index.js lib/fileSet.js lib/GueTask.js';
  command += '> README.md';

  return gue.shell(command);
});

gue.task('spell', ['buildDocs'], () => {
  return gue.shell('mdspell docs/readme.hbs README.md -n -a --en-us -r');
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
