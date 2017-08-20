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

  describe('runTaskParallel', () => {
    it('should run a single task correctly', () => {
      const gueTasks = new GueTasks();
      const aStub = sinon.stub().resolves();

      gueTasks.addTask('a', () => {
        return aStub();
      });

      return gueTasks.runTaskParallel('a')
      .then(()=> {
        expect(aStub).to.be.called;
      });

    });

    it('should run all of the passed tasks', () => {
      const gueTasks = new GueTasks();
      const aStub = sinon.stub().resolves();
      const bStub = sinon.stub().resolves();

      gueTasks.addTask('a', () => {
        return aStub();
      });

      gueTasks.addTask('b', () => {
        return bStub();
      });

      return gueTasks.runTaskParallel(['a','b'])
      .then(()=> {
        expect(aStub).to.be.called;
        expect(bStub).to.be.called;
      });
    });

    it('should ignore errors when swallowError is true', () => {
      const gueTasks = new GueTasks();
      const rejectStub = sinon.stub().rejects();

      gueTasks.addTask('a', () => {
        return rejectStub();
      });

      gueTasks.addTask('b', () => {
        return rejectStub();
      });

      return expect(gueTasks.runTaskParallel(['a','b'], true)).to.eventually
        .be.fulfilled;
    });

    it('should propogate errors when swallowError is false', () => {
      const gueTasks = new GueTasks();
      const rejectStub = sinon.stub().rejects();

      gueTasks.addTask('a', () => {
        return rejectStub();
      });

      return expect(gueTasks.runTaskParallel('a')).to.eventually.be.rejected;
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

    it('should fail the task if an action fails', () => {
      const gueTasks = new GueTasks();

      gueTasks.addTask('failedTask', () => {
        return Promise.reject();
      });

      return expect(gueTasks.runTask('failedTask')).to.eventually.be.rejected;
    });

    it('should emit GueTask.taskFinished.error on task failure', () => {
      const gueTasks = new GueTasks();
      const eventStub = sinon.stub();

      gueEvents.on('GueTask.taskFinished.error', (obj, val)=> {
        eventStub(val);
      });

      gueTasks.addTask('failed', () => {
        return Promise.reject('Message');
      });

      return gueTasks.runTask('failed')
      .catch(()=> {
        expect(eventStub).to.be.calledWith('Message');
        gueEvents.removeAllListeners();
      });
    });

    it('should run a task with dependencies correctly', () => {
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
        // Pause here to ensure that we're still getting
        // good task order
        return new Promise((resolve,reject) => {
          setTimeout(() => {
            // console.log('run a');
            aStub();
            resolve();
          }, 50);
        });
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

    it('should emit the correct events with nested tasks', () => {
      const gueTasks = new GueTasks();

      const aStartStub = sinon.stub().named('eventStartA');
      const bStartStub = sinon.stub().named('eventStartB');
      const aFinishStub = sinon.stub().named('eventFinishA');
      const bFinishStub = sinon.stub().named('eventFinishB');

      gueTasks.addTask('a', ['b'], () => {
        return Promise.resolve();
      });

      gueTasks.addTask('b', () => {
        // pause here to help ensure good task order
        return new Promise((resolve,reject) => {
          setTimeout(() => {
            resolve();
          }, 50);
        });
      });

      gueEvents.on('GueTask.taskStarted', (val) => {
        if (val.name === 'a') {
          aStartStub();
        } else {
          bStartStub();
        }
      });

      gueEvents.on('GueTask.taskFinished', (val) => {
        if (val.name === 'a') {
          aFinishStub();
        } else {
          bFinishStub();
        }
      });

      return gueTasks.runTask('a').then(()=> {
        expect(aStartStub).to.be.calledOnce;
        expect(bStartStub).to.be.calledOnce;
        expect(aFinishStub).to.be.calledOnce;
        expect(bFinishStub).to.be.calledOnce;
        sinon.assert.callOrder(aStartStub,
          bStartStub, bFinishStub, aFinishStub);
      });
    });

    it('should fail the action if a nested task fails', () => {
      const gueTasks = new GueTasks();

      gueTasks.addTask('wrapper', ['fail'], () => {
        return Promise.resolve();
      });

      gueTasks.addTask('fail', () => {
        return Promise.reject();
      });

      return expect(gueTasks.runTask('wrapper')).to.eventually.be.rejected;
    });

    it('should emit GueTask.taskFinished.error on dependency failure', () => {
      const gueTasks = new GueTasks();
      const eventStub = sinon.stub();

      gueTasks.addTask('wrapper', ['fail'], () => {
        return Promise.resolve();
      });

      gueTasks.addTask('fail', () => {
        return Promise.reject('Message');
      });

      gueEvents.on('GueTask.taskFinished.error', (obj, val)=> {
        eventStub(val);
      });

      return gueTasks.runTask('wrapper').catch(()=> {
        expect(eventStub).to.be.calledWith('Message');
        gueEvents.removeAllListeners();
      });
    });

    it('should handle failed dependencies', () => {
      const gueTasks = new GueTasks();
      const actionStub = sinon.stub().resolves();
      gueTasks.addTask('wrapper', ['fail'], () => {
        return actionStub();
      });

      gueTasks.addTask('fail', () => {
        return Promise.reject();
      });

      return gueTasks.runTask('wrapper')
      .then(()=> {
        throw Error('Should not have gotten here');
      })
      .catch(()=> {
        expect(actionStub).to.not.be.called;
      });
    });
  });
});
