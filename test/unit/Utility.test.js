'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const sandbox = sinon.sandbox.create();

chai.use(sinonChai);

const util = require('../../lib/Util');

describe('lib/Util', () => {
  describe('maxLen', () => {
    it('should return the length of the longest string', () => {
      expect(util.maxLen(['a','bb'])).to.equal(2);
      expect(util.maxLen(['aa','b'])).to.equal(2);
    });

    it('should return 0 if the arg is not an array', () => {
      expect(util.maxLen('foo')).to.equal(0);
    });
  });

  describe('leftPad', () => {
    it('should correctly pad a string', () => {
      expect(util.leftPad('foo', 4)).to.equal(' foo');
    });

    it('should not pad if string is longer than pad', () => {
      expect(util.leftPad('foo', 2)).to.equal('foo');
    });
  });

  describe('toArray', () => {
    it('should correctly turn a scalar into an array', () => {
      expect(util.toArray('1')).to.deep.equal(['1']);
    });

    it('should correctly handle an existing array', () => {
      expect(util.toArray(['1','2'])).to.deep.equal(['1','2']);
    });
  });
});
