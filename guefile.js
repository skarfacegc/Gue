const gue = require('./index.js');
const FileSet = require('./lib/fileSet');

fileSet = new FileSet();

fileSet.add('allSrc', ['**/*.js'], 'lint');
fileSet.add('src', ['*.js','lib/*.js','bin/*.js'], 'test');
fileSet.add('spellCheck', ['docSrc/*', 'index.js','lib/*.js','.spelling'],
  'spell');
fileSet.add('unitTests', ['test/unit/**/*.js'], 'test');
fileSet.add('integrationTests', ['test/integration/**/*.js'], 'integration');
fileSet.add('packageJson', 'package.json', 'rebuild');
fileSet.add('clean', ['coverage','.nyc_output']);
fileSet.add('distclean', ['node_modules']);

// gue.debug = true;

gue.task('watch', () => {
  gue.autoWatch(fileSet);
});

gue.task('test', ['clean'], () => {
  return gue.shell('nyc --reporter lcov --reporter text ' +
  'mocha ' + fileSet.getFiles('unitTests'));
});

gue.task('lint', () => {
  return gue.shell('jscs ' + fileSet.getFiles('allSrc'));
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
  command += '&& jsdoc2md --example-lang js --template docSrc/readme.hbs ';
  command += '--partial docSrc/scope.hbs --separators ';
  command += '--files index.js lib/fileSet.js';
  command += '> README.md';

  return gue.shell(command);
});

gue.task('spell', ['buildDocs'], () => {
  return gue.shell('mdspell docSrc/readme.hbs README.md -n -a --en-us -r');
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
