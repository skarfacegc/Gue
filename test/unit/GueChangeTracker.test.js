'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const sandbox = sinon.sandbox.create();
const ChaiAsPromised = require('chai-as-promised');

const FileSet = require('../../lib/fileSet');
const GueChangeTracker = require('../../lib/GueChangeTracker');

chai.use(sinonChai);
chai.use(ChaiAsPromised);

describe('GueChangeTracker', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should create an GueChangeTracker object', () => {
      const gueChangeTracker = new GueChangeTracker();
      expect(gueChangeTracker).to.be.instanceOf(GueChangeTracker);
    });

    it('should set fileSet correctly', () => {
      const gueChangeTracker = new GueChangeTracker(new FileSet());
      expect(gueChangeTracker.fileSet).to.be.instanceOf(FileSet);
    });

    it('should set dbFile correctly', () => {
      const gueChangeTracker = new GueChangeTracker(new FileSet(), '.cache');
      expect(gueChangeTracker.dbFile).to.equal('.cache');
    });
  });

  describe('sumFile', () => {
    it('should correctly sum a file', () => {
      const gueChangeTracker = new GueChangeTracker();
      return expect(
        gueChangeTracker.sumFile('test/testFiles/sumTest.txt')
      ).to.eventually.equal('351a55969d14ab49dd0175d5b0621cf2908d0818');
    });

    it('should correctly handle a missing file', () => {
      const gueChangeTracker = new GueChangeTracker();
      return expect(gueChangeTracker.sumFile('test/testFiles/MISSINGFILE.txt'))
        .to.be.rejected;
    });
  });
});
