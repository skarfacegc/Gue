const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const GueTasks = require('../../lib/GueTasks');
const GueTask = require('../../lib/GueTask');

describe('GueTasks', () => {
  describe('constructor', () => {
    it('should create a new GueTasks object', function() {
      const gueTasks = new GueTasks();
      expect(gueTasks).to.be.instanceOf(GueTasks);
    });
  });

  describe('addTask', () => {
    it('should successfully add a task', ()=> {
      const gueTasks = new GueTasks();
      gueTasks.addTask('foo', () => {});
      expect(gueTasks.tasks.foo).to.be.instanceOf(GueTask);
    });

    it('should error if a duplicate name is added', () => {
      const gueTasks = new GueTasks();
      gueTasks.addTask('foo', () => {});
      expect(()=> {
        gueTasks.addTask('foo', () => {});
      }).to.throw();
    });
  });

});
