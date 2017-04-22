'use strict;'

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const sandbox = sinon.sandbox.create();

const execa = require('execa');
const snapshot = require('snap-shot');
const tmp = require('tmp-promise');

const testCwd = process.cwd();

// Checks out the Gue-test repo
// links the local copy of Gue (this repo)
// runs gue default and returns stdout/stderr
//
// This return value will be snapshotted in the test
function runGueTest() {
  return tmp.dir()
    .then((dir) => {
      let command =
      'cd ' + dir.path + ' && ' +
      'git clone -q ' +
        'https://github.com/skarfacegc/Gue-test.git' + ' && ' +
      'cd Gue-test && ' +
      '(export NODE_ENV=snapshot ;' +
      'yarn > ./foo.yarn 2>&1 ; ' +
      'npm link ' + testCwd + ' > ./foo.link 2>&1 ; ' +
      'gue snapshotTest || exit 0 && exit 1 )' ;
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
