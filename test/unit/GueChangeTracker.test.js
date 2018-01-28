'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const sandbox = sinon.sandbox.create();
const ChaiAsPromised = require('chai-as-promised');
const chalk = require('chalk');
const chokidar = require('chokidar');

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
  });
});
