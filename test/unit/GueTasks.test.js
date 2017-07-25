const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sandbox = sinon.sandbox.create();
const expect = chai.expect;
const GueTasks = require('../../lib/GueTasks');
const GueTask = require('../../lib/GueTask');
const ChaiAsPromised = require('chai-as-promised');

chai.use(sinonChai);
chai.use(ChaiAsPromised);

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

  describe('startTasks', function() {

    afterEach(function() {
      sandbox.restore();
    });

    it('should call runTask correctly with a single Task', () => {
      const gueTasks = new GueTasks();
      const runTaskStub = sandbox.stub(gueTasks, 'runTask');
      gueTasks.addTask('testTask', () => {
        return Promise.resolve('testTask Resolved');
      });

      gueTasks.startTasks('testTask');
      expect(runTaskStub).to.be.calledWith('testTask');
    });

    it('should call runTask correctly with array', () => {
      const gueTasks = new GueTasks();
      const runTaskStub = sandbox.stub(gueTasks, 'runTask');

      gueTasks.addTask('testTask1', () => {
        return Promise.resolve();
      });

      gueTasks.addTask('testTask2', () => {
        return Promise.resolve();
      });

      gueTasks.startTasks(['testTask1','testTask2']);

      expect(runTaskStub.args[0][0]).to.equal('testTask1');
      expect(runTaskStub.args[1][0]).to.equal('testTask2');
    });
  });

  describe('runTask', () => {
    it('should throw on missing taskNames', () => {
      const gueTasks = new GueTasks();
      expect(()=> {gueTasks.runTask('badTask');}).to.throw();
    });

    it('should run a task with no dependencies correctly', () => {
      const gueTasks = new GueTasks();
      gueTasks.addTask('testTask', ()=> {
        return Promise.resolve('testTaskDone');
      });

      return expect(gueTasks.runTask('testTask')).to
        .eventually.equal('testTaskDone');
    });

    it('should handle a failed task correctly', () => {
      const gueTasks = new GueTasks();
      gueTasks.addTask('testTask', ()=> {
        return Promise.reject('testTaskDone');
      });

      return expect(gueTasks.runTask('testTask')).to
        .eventually.be.rejectedWith('testTaskDone');
    });
  });
});
