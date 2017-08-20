'use strict;';

const chai = require('chai');
const expect = chai.expect;
const execa = require('execa');
const snapshot = require('snap-shot');

let runList = [];

// Buld the list of integration tests to snapshot
runList.push({
    name: 'simple fail test',
    fn: 'gue --config test/integration/sampleTests/fail.guefile.js fail',
});

runList.push({
    name: 'simple succeed test',
    fn: 'gue --config test/integration/sampleTests/succeed.guefile.js succeed',
});

runList.push({
    name: 'nested succeed test',
    fn: 'gue --config test/integration/sampleTests/nestedSucceed.guefile.js'
       + ' succeed',
});

runList.push({
    name: 'nested fail test',
    fn: 'gue --config test/integration/sampleTests/nestedFail.guefile.js fail',
});

// Check the snapshots for each of the guefiles above
describe('Integration Tests', () => {
  it('should set the exit code to 0 on success', () => {
    return execa.shell('gue --config '
      + 'test/integration/sampleTests/succeed.guefile.js succeed')
    .then((result) => {
      return expect(result.code).to.equal(0);
    });
  });

  it('should set the exit code to 1 on failure', () => {
    return execa.shell('gue --config '
      + 'test/integration/sampleTests/nestedFail.guefile.js fail')
    .catch((result) => {
      return expect(result.code).to.equal(1);
    });
  });

  describe('Snapshot Tests', () => {
    runList.forEach((element) => {
      it(element.name + ' should match snapshot', () => {
        return execa.shell('NODE_ENV=snapshot && ' + element.fn)
        .then(
          (result) => {
            return snapshot(result.stdout, false);
          },
          (result) => {
            return snapshot(result.stdout, false);
          }
        );
      });
    });
  });
});
