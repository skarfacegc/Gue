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
      'git clone ' +
           'https://github.com/skarfacegc/Gue-test.git &> /dev/null' + ' && ' +
      'cd Gue-test && ' +
      '(export NODE_ENV=snapshot && yarn &> /dev/null ; ' +
      'npm link ' + testCwd + '&> /dev/null; gue snapshotTest||exit 0 && exit 1)';

      return execa.shell(command);
    });
}

describe('Checkout gue-test', function() {
  this.timeout(0);
  it('should checkout gue-test', () => {
    return runGueTest().then((result) => {
      result.cmd = '';
      return snapshot(result.stdout);
    });
  });
});
