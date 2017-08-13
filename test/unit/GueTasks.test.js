const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sandbox = sinon.sandbox.create();
const expect = chai.expect;
const ChaiAsPromised = require('chai-as-promised');

const GueTasks = require('../../lib/GueTasks');
const GueTask = require('../../lib/GueTask');
const gueEvents = require('../../lib/GueEvents');

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

    it('should emit taskStarted/taskFinished events', () => {
      const gueTasks = new GueTasks();
      const eventStartStub = sinon.stub().named('started');
      const eventFinishedStub = sinon.stub().named('finished');
      gueTasks.addTask('a', () => {
        return Promise.resolve();
      });

      gueEvents.on('GueTask.taskStarted', () => {
        eventStartStub();
      });

      gueEvents.on('GueTask.taskFinished', () => {
        eventFinishedStub();
      });

      return gueTasks.runTask('a').then(()=> {
        expect(eventStartStub).to.be.calledOnce;
        expect(eventFinishedStub).to.be.calledOnce;
        sinon.assert.callOrder(eventStartStub, eventFinishedStub);
      });
    });

    it('should run a task with no dependencies correctly', () => {
      const gueTasks = new GueTasks();
      const taskStub = sinon.stub().resolves();
      gueTasks.addTask('a', () => {
        return taskStub();
      });

      return gueTasks.runTask('a').then(()=> {
        expect(taskStub).to.be.calledOnce;
      });
    });

    it('should run a task with dependencies correctly', () => {
      // this one is large as we're testing both action order and
      // event order
      const gueTasks = new GueTasks();

      const wrapperStub = sinon.stub().resolves().named('wrapper');
      const aStub = sinon.stub().resolves().named('a');
      const bStub = sinon.stub().resolves().named('b');
      const cStub = sinon.stub().resolves().named('c');
      const dStub = sinon.stub().resolves().named('d');

      gueTasks.addTask('wrapper', ['c','d'], () => {
        // console.log('run wrapper');
        return wrapperStub();
      });

      gueTasks.addTask('a', () => {
        // console.log('run a');
        return aStub();
      });

      gueTasks.addTask('b', () => {
        // console.log('run b');
        return bStub();
      });

      gueTasks.addTask('c', ['a','b'], () => {
        // console.log('run c');
        return cStub();
      });

      gueTasks.addTask('d', () => {
        // console.log('run d');
        return dStub();
      });

      return gueTasks.runTask('wrapper').then(()=> {
        expect(wrapperStub).to.be.calledOnce;
        expect(aStub).to.be.calledOnce;
        expect(bStub).to.be.calledOnce;
        expect(cStub).to.be.calledOnce;
        expect(dStub).to.be.calledOnce;
        sinon.assert.callOrder(aStub, bStub, cStub, dStub, wrapperStub);
      });

    });
  });
});
