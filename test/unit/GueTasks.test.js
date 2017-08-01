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

    it('should run a nested task tree correctly', () => {
      const gueTasks = new GueTasks();

      // Setup the sample task
      const sampleFn = sinon.stub();
      sampleFn.resolves();

      gueTasks.addTask('a', ['1','2'], ()=> {
        return sampleFn('a');
      });

      // Make this one take some time
      // to make sure we don't get accidently correct
      // ordered task execution
      gueTasks.addTask('1', ()=> {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            sampleFn('1');
            resolve();
          }, 20);
        });
      });

      gueTasks.addTask('2', ()=> {
        return sampleFn('2');
      });
      gueTasks.addTask('b', ()=> {
        return sampleFn('b');
      });
      gueTasks.addTask('wrapper', ['a','b'], () => {
        return sampleFn('wrapper');
      });

      return gueTasks.runTask('wrapper').then(()=> {
        expect(sampleFn.getCall(0)).to.be.calledWith('1');
        expect(sampleFn.getCall(1)).to.be.calledWith('2');
        expect(sampleFn.getCall(2)).to.be.calledWith('a');
        expect(sampleFn.getCall(3)).to.be.calledWith('b');
        expect(sampleFn.getCall(4)).to.be.calledWith('wrapper');
      });
    });

    it('should fail nested tasks correctly', () => {
      const gueTasks = new GueTasks();
      const sampleFn = sinon.stub().rejects();
      const failedFn = sinon.stub().resolves();

      // Nesting this 3 layers
      gueTasks.addTask('wrapper', ['a'], () => {
        return Promise.resolve();
      });
      gueTasks.addTask('a', ['1'], () => {
        return Promise.resolve();
      });
      gueTasks.addTask('1', () => {
        return Promise.reject();
      });

      return expect(gueTasks.runTask('wrapper')).to.eventually.be.rejected;
    });
  });
});
