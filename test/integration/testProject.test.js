'use strict;';

const execa = require('execa');
const snapshot = require('snap-shot');
const tmp = require('tmp-promise');

/**
 * Checks out the Gue-test repo
 * links the local copy of Gue (this repo)
 * runs gue default and returns stdout/stderr
 *
 * @return {promise} A promise to finish installing the test repo
 */
function runGueTest() {
  return tmp.dir()
    .then((dir) => {
      let command =
      'yarn link > ' + dir.path + '/foo.linkAdd 2>&1;' +
      'cd ' + dir.path + ' && ' +
      'git clone -q ' +
        'https://github.com/skarfacegc/Gue-test.git' + ' && ' +
      'cd Gue-test && ' +
      '(export NODE_ENV=snapshot ;' +
      'yarn > ./foo.yarn 2>&1 ; ' +
      'yarn link gue > ./foo.link 2>&1 ; ' +
      'gue snapshotTest || exit 0 && exit 1 )';
      return execa.shell(command);
    });
}

describe('Gue-test repo tests', function() {
  this.timeout(0);
  it('should run gue snapshotTest successfully', () => {
    return runGueTest().then((result) => {
      result.cmd = '';
      return snapshot(result.stdout);
    });
  });
});
