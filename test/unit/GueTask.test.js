const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const GueTask = require('../../lib/GueTask');

describe('GueTask', () => {

  describe('constructor', () => {

    it('should require a name', () => {
      expect(()=> {
        new GueTask('', ['task','list'], () => {});
      }).to.throw();
    });

    it('should require an action', () => {
      expect(() => {
        new GueTask('foo');
      }).to.throw();
    });

    it('should make sure that action is a function', () => {
      expect(() => {
        new GueTask('foo','NotAFunction');
      }).to.throw();
    });

    it('should successfully create a task', ()=> {
      const sampleFn = () => {console.log('woot');};
      const testTask = {
        name: 'foo',
        dependencies: ['task','list'],
        action: sampleFn,
        startTime: 0,
        endTime: 0
      };

      const newTask = new GueTask('foo',['task','list'], sampleFn);
      expect(newTask).to.deep.equal(testTask);
    });

    it('should correctly handle a task without dependencies', () => {
      const sampleFn = ()=> {console.log('woot');};

      const testTask = {
        name: 'foo',
        dependencies: undefined,
        action: sampleFn,
        startTime: 0,
        endTime: 0
      };

      const newTask = new GueTask('foo',sampleFn);
      expect(newTask).to.deep.equal(testTask);
    });
  });
});
