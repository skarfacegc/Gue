const gue = require('./index.js');
const fileSet = gue.fileSet;
const packageJson = require('./package.json');

// Tests and source files
fileSet.add('allSrc', ['**/*.js'], 'lint');
fileSet.add('src', ['*.js', 'lib/*.js', 'bin/*.js'], 'test');
fileSet.add('unitTests', ['test/unit/**/*.js'], 'test');
fileSet.add('integrationTests', ['test/integration/**/*.test.js'],
  'integration');

// Rebuild trigger
fileSet.add('packageJson', 'package.json', 'rebuild');

// Cleaners
fileSet.add('clean', ['coverage', '.nyc_output']);
fileSet.add('distclean', ['node_modules']);

// Documentation
fileSet.add('docs', ['docs/' + packageJson.version]);
fileSet.add('jsdocSrc', ['lib/', 'index.js']);
fileSet.add('spellCheck', ['index.js', 'lib/**/*.js', 'bin/gue.js',
  'test/**/*.js', 'docSrc/readme.hbs']);

// gue.debug = true;

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
  let command = 'mocha {{globs "integrationTests"}}';
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

gue.task('docClean', () => {
  return gue.shell('rm -rf {{globs "docs"}}');
});

//
// Build
//
gue.task('rebuild', ['distclean', 'yarn', 'lint', 'test', 'integration',
  'buildDocs']);

gue.task('yarn', () => {
  return gue.shell('yarn');
});

//
// Docs
//

gue.task('spell', () => {
  return gue.shell('cspell -c cspell.json {{globs "spellCheck"}}');
});

gue.task('buildReadme', () => {
  return gue.shell('rm -f README.md && '
    + 'node docSrc/buildReadme.js > README.md');
});

gue.task('buildApiDocs', ['docClean'], () => {
  return gue.shell('mkdir -p docs/{{version}} && '
    + 'node docSrc/buildReadme.js --docsContext >docs/{{version}}/readme.md && '
    + 'jsdoc -R docs/{{version}}/readme.md -c jsdoc.json -r '
    + '-t node_modules/jsdoc-oblivion/template -d docs/{{version}} '
    +' {{globs "jsdocSrc"}}',
  {version: packageJson.version}
  );
});

gue.task('buildApiDocsTOC', () => {
  return gue.shell('rm docs/index.html && '
    +'node docSrc/buildDocToc.js > docs/index.html');
});

gue.task('buildDocs', ['spell', 'buildReadme', 'buildApiDocs',
  'buildApiDocsTOC']);
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
