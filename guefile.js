const gue = require('./index.js');
const fileSet = gue.fileSet;
const packageJson = require('./package.json');

// Tests and source files
fileSet.add(
  'allSrc',
  ['lib/**/*.js', 'index.js', 'test/**/*.js', 'bin/gue.js', 'guefile.js'],
  'lint'
);
fileSet.add('src', ['*.js', 'lib/*.js', 'bin/*.js'], 'test');
fileSet.add('unitTests', ['test/unit/**/*.js'], 'test');
fileSet.add(
  'integrationTests',
  ['test/integration/**/*.test.js'],
  'integration'
);

// Rebuild trigger
fileSet.add('packageJson', 'package.json', 'rebuild');

// Cleaners
fileSet.add('clean', ['coverage', '.nyc_output', '.coverage_tmp']);
fileSet.add('distclean', ['node_modules']);

// Documentation
fileSet.add('docs', ['docs/' + packageJson.version]);
fileSet.add('jsdocSrc', ['lib/', 'index.js']);
fileSet.add('spellCheck', [
  'index.js',
  'lib/**/*.js',
  'bin/gue.js',
  'test/**/*.js',
  'docSrc/readme.hbs'
]);

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

gue.task('test', () => {
  return gue.shell(
    'nyc --reporter lcov --no-clean --silent --temp-directory=./.coverage_tmp ' +
      'mocha {{files "unitTests"}}'
  );
});

gue.task('integration', () => {
  return gue.shell(
    'nyc --reporter lcov --no-clean --silent --temp-directory=./.coverage_tmp ' +
      'mocha {{globs "integrationTests"}}'
  );
});

// Run all the tests and print the coverage report
gue.task('coverage', ['clean', 'test', 'integration', 'cov_report']);

// Print coverage information
// It's up to the tests to record their coverage data in .coverage_tmp
gue.task('cov_report', () => {
  return gue.shell(
    'nyc  --temp-directory=./.coverage_tmp --reporter text --reporter lcov report'
  );
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
gue.task('rebuild', ['distclean', 'yarn', 'lint', 'spell', 'coverage']);

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
  return gue.shell(
    'rm -f README.md && ' + 'node docSrc/buildReadme.js > README.md'
  );
});

gue.task('buildApiDocs', ['docClean'], () => {
  return gue.shell(
    'mkdir -p docs/{{version}} && ' +
      'node docSrc/buildReadme.js --docsContext >docs/{{version}}/readme.md && ' +
      'jsdoc -R docs/{{version}}/readme.md -c jsdoc.json -r ' +
      '-t node_modules/jsdoc-oblivion/template -d docs/{{version}} ' +
      ' {{globs "jsdocSrc"}}',
    { version: packageJson.version }
  );
});

gue.task('buildApiDocsTOC', () => {
  return gue.shell(
    'rm docs/index.html && ' + 'node docSrc/buildDocToc.js > docs/index.html'
  );
});

gue.task('buildDocs', [
  'spell',
  'buildReadme',
  'buildApiDocs',
  'buildApiDocsTOC'
]);
//
// Utility tasks
//

// Update the snapshots for the snapshot tests
gue.task('snapshot', () => {
  const command = 'export UPDATE=1 && mocha {{files "integrationTests"}}';
  return gue.shell(command);
});

// run estlint with --fix
gue.task('lintFix', () => {
  return gue.shell('eslint --fix {{files "allSrc"}}');
});
