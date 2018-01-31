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
        .to.eventually.be.rejected;
    });
  });

  describe('checkFileSum', () => {
    it('should correctly sum a file', () => {
      const gueChangeTracker = new GueChangeTracker();
      return expect(
        gueChangeTracker.checkFileSum(
          'test/testFiles/sumTest.txt',
          '351a55969d14ab49dd0175d5b0621cf2908d0818'
        )
      ).to.eventually.be.true;
    });

    it('should correctly handle a missing file', () => {
      const gueChangeTracker = new GueChangeTracker();
      return expect(
        gueChangeTracker.checkFileSum('test/testFiles/MISSINGFILE.txt', '')
      ).to.eventually.be.false;
    });
  });

  describe('sumFileset', () => {
    it('should sum the files correctly', () => {
      const fileSet = new FileSet();
      const testSet = {
        'test/testFiles/file1.txt': '3390a7671bb760a86e2bcc0bc6f4224d6f96ec86',
        '3390a7671bb760a86e2bcc0bc6f4224d6f96ec86': 'test/testFiles/file1.txt',
        'test/testFiles/sumTest.txt':
          '351a55969d14ab49dd0175d5b0621cf2908d0818',
        '351a55969d14ab49dd0175d5b0621cf2908d0818':
          'test/testFiles/sumTest.txt',
        'test/testFiles/testSubDir/testfile2.txt':
          'cb594b3ca57cc91cb5b22410b8be97a463f8954b',
        cb594b3ca57cc91cb5b22410b8be97a463f8954b:
          'test/testFiles/testSubDir/testfile2.txt'
      };

      fileSet.add('testSet', 'test/testFiles/**/*', 'bar');

      const gueChangeTracker = new GueChangeTracker(fileSet);
      return expect(gueChangeTracker.sumFileset()).to.eventually.deep.equal(
        testSet
      );
    });
  });
});
